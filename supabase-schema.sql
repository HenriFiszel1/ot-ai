-- ============================================================
-- Optimize Teacher AI — Supabase Database Schema
-- ============================================================
-- Run this in your Supabase SQL Editor to set up all tables.
-- This schema supports: schools, teachers, students, essays,
-- grading data, teacher comments, and teacher profiles.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── SCHOOLS ───────────────────────────────────────────────
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  type TEXT CHECK (type IN ('public', 'private', 'charter', 'international')),
  description TEXT,
  teacher_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schools_name ON schools(name);

-- ─── TEACHERS ──────────────────────────────────────────────
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  department TEXT,
  subjects TEXT[] DEFAULT '{}',
  grading_style TEXT,           -- human-readable description of how they grade
  essays_graded INTEGER DEFAULT 0,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teachers_school ON teachers(school_id);
CREATE INDEX idx_teachers_name ON teachers(name);

-- ─── TEACHER PROFILES (AI-generated grading model) ────────
-- This stores the computed "Teacher Profile" that the AI uses
-- to generate teacher-specific feedback and grade predictions.
CREATE TABLE teacher_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL UNIQUE REFERENCES teachers(id) ON DELETE CASCADE,

  -- Grading behavior metrics (0.0 to 1.0 scale)
  strictness_score NUMERIC(3,2) DEFAULT 0.50,
  thesis_weight NUMERIC(3,2) DEFAULT 0.25,
  evidence_weight NUMERIC(3,2) DEFAULT 0.25,
  analysis_weight NUMERIC(3,2) DEFAULT 0.25,
  mechanics_weight NUMERIC(3,2) DEFAULT 0.15,
  style_weight NUMERIC(3,2) DEFAULT 0.10,

  -- Tone and voice patterns
  tone_keywords TEXT[] DEFAULT '{}',         -- e.g. {'encouraging', 'direct', 'detailed'}
  common_phrases TEXT[] DEFAULT '{}',        -- phrases they reuse often
  feedback_length_avg INTEGER DEFAULT 150,   -- avg chars per comment

  -- Grade distribution stats
  avg_grade NUMERIC(5,2),
  grade_std_dev NUMERIC(5,2),
  most_common_grade TEXT,

  -- Pattern data (JSON for flexibility)
  rubric_emphasis JSONB DEFAULT '{}',        -- which rubric areas they weight most
  comment_patterns JSONB DEFAULT '{}',       -- recurring comment themes
  penalty_patterns JSONB DEFAULT '{}',       -- what they penalize most

  -- Model metadata
  training_essay_count INTEGER DEFAULT 0,
  last_trained_at TIMESTAMPTZ,
  model_version TEXT DEFAULT 'v1',
  confidence_score NUMERIC(3,2) DEFAULT 0.00,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STUDENTS ──────────────────────────────────────────────
-- Students who use the platform (linked to Supabase Auth)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,     -- links to Supabase auth.users
  email TEXT,
  display_name TEXT,
  school_id UUID REFERENCES schools(id),
  grade_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_auth ON students(auth_user_id);

-- ─── ESSAYS ────────────────────────────────────────────────
-- Each essay submission
CREATE TABLE essays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  school_id UUID NOT NULL REFERENCES schools(id),
  teacher_id UUID NOT NULL REFERENCES teachers(id),

  -- Essay content
  essay_text TEXT NOT NULL,
  prompt TEXT NOT NULL,
  rubric TEXT,
  assignment_type TEXT,
  class_name TEXT,
  word_count INTEGER,

  -- Status
  status TEXT CHECK (status IN ('submitted', 'analyzing', 'completed', 'failed'))
    DEFAULT 'submitted',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_essays_student ON essays(student_id);
CREATE INDEX idx_essays_teacher ON essays(teacher_id);
CREATE INDEX idx_essays_school ON essays(school_id);
CREATE INDEX idx_essays_status ON essays(status);

-- ─── GRADE PREDICTIONS ────────────────────────────────────
-- The AI-predicted grade for each essay
CREATE TABLE grade_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_id UUID NOT NULL UNIQUE REFERENCES essays(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id),

  letter_grade TEXT NOT NULL,
  numeric_grade NUMERIC(5,2) NOT NULL,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),

  reasoning TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',

  -- Detailed scoring breakdown
  thesis_score NUMERIC(5,2),
  evidence_score NUMERIC(5,2),
  analysis_score NUMERIC(5,2),
  structure_score NUMERIC(5,2),
  style_score NUMERIC(5,2),
  mechanics_score NUMERIC(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grades_essay ON grade_predictions(essay_id);
CREATE INDEX idx_grades_teacher ON grade_predictions(teacher_id);

-- ─── INLINE COMMENTS ──────────────────────────────────────
-- Google Docs-style line-level comments on essays
CREATE TABLE inline_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id),

  -- Position in essay text
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  excerpt TEXT NOT NULL,

  -- Comment content
  comment_text TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'thesis', 'evidence', 'analysis', 'structure', 'style', 'mechanics', 'strength'
  )),
  severity TEXT CHECK (severity IN ('praise', 'suggestion', 'concern')),

  -- Ordering
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_essay ON inline_comments(essay_id);

-- ─── END COMMENTS ─────────────────────────────────────────
-- The summary comment at the end of the essay
CREATE TABLE end_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_id UUID NOT NULL UNIQUE REFERENCES essays(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  next_steps TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ACTUAL GRADES (teacher-provided) ─────────────────────
-- When a student later enters the actual grade they received,
-- this data trains and improves the teacher model.
CREATE TABLE actual_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  essay_id UUID NOT NULL UNIQUE REFERENCES essays(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id),

  letter_grade TEXT,
  numeric_grade NUMERIC(5,2),
  teacher_end_comment TEXT,

  -- Was the prediction accurate?
  prediction_delta NUMERIC(5,2),    -- actual - predicted
  was_accurate BOOLEAN,             -- within ±5 points

  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actual_grades_teacher ON actual_grades(teacher_id);

-- ─── TEACHER COMMENT TRAINING DATA ───────────────────────
-- Raw teacher comments uploaded for model training.
-- These come from students sharing past graded essays.
CREATE TABLE teacher_comment_training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),

  -- The original context
  essay_excerpt TEXT,
  comment_text TEXT NOT NULL,
  comment_type TEXT,               -- 'inline' or 'end'
  associated_grade TEXT,

  -- Classification (computed)
  category TEXT,
  sentiment TEXT,
  tone_tags TEXT[] DEFAULT '{}',

  submitted_by UUID REFERENCES students(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_teacher ON teacher_comment_training(teacher_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inline_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE end_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE actual_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_comment_training ENABLE ROW LEVEL SECURITY;

-- Public read access to schools and teachers
CREATE POLICY "Public can view schools"
  ON schools FOR SELECT USING (true);

CREATE POLICY "Public can view teachers"
  ON teachers FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view teacher profiles"
  ON teacher_profiles FOR SELECT USING (true);

-- Students can view/manage their own data
CREATE POLICY "Students can view own essays"
  ON essays FOR SELECT
  USING (student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Students can insert essays"
  ON essays FOR INSERT
  WITH CHECK (student_id IN (
    SELECT id FROM students WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Students can view own grades"
  ON grade_predictions FOR SELECT
  USING (essay_id IN (
    SELECT id FROM essays WHERE student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Students can view own comments"
  ON inline_comments FOR SELECT
  USING (essay_id IN (
    SELECT id FROM essays WHERE student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Students can view own end comments"
  ON end_comments FOR SELECT
  USING (essay_id IN (
    SELECT id FROM essays WHERE student_id IN (
      SELECT id FROM students WHERE auth_user_id = auth.uid()
    )
  ));

-- ─── HELPER FUNCTIONS ─────────────────────────────────────

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER teacher_profiles_updated_at
  BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER essays_updated_at
  BEFORE UPDATE ON essays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment teacher essay count
CREATE OR REPLACE FUNCTION increment_teacher_essay_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teachers SET essays_graded = essays_graded + 1 WHERE id = NEW.teacher_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_essay_insert
  AFTER INSERT ON essays
  FOR EACH ROW EXECUTE FUNCTION increment_teacher_essay_count();
