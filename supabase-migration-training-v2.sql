-- ============================================================
-- Optimize Teacher AI — Training Data Schema v2
-- ============================================================
-- Run this AFTER supabase-schema.sql and supabase-migration-pgvector.sql.
-- Adds: rubric, rubric_scores, assignment_type to training_essays;
--       is_stale flag to teacher_profiles;
--       updates match_training_essays RPC to return new columns.
-- ============================================================

-- ─── training_essays: new columns ────────────────────────────
ALTER TABLE training_essays
  ADD COLUMN IF NOT EXISTS rubric TEXT,
  ADD COLUMN IF NOT EXISTS rubric_scores JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS assignment_type TEXT;

-- ─── teacher_profiles: stale flag ────────────────────────────
-- Set to true whenever new training data is uploaded for this teacher.
-- The persona builder resets it to false after recomputing the profile.
ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS is_stale BOOLEAN DEFAULT false;

-- ─── RPC: match_training_essays (updated) ────────────────────
-- Now returns rubric and rubric_scores so the grading pipeline can
-- include rubric context from similar past essays.
CREATE OR REPLACE FUNCTION match_training_essays(
  query_embedding vector(1024),
  p_teacher_id    UUID,
  match_count     INT DEFAULT 10
)
RETURNS TABLE (
  id                   UUID,
  essay_text           TEXT,
  prompt               TEXT,
  letter_grade         TEXT,
  numeric_grade        NUMERIC(5,2),
  teacher_end_comment  TEXT,
  inline_comments      JSONB,
  rubric               TEXT,
  rubric_scores        JSONB,
  similarity           FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    te.id,
    te.essay_text,
    te.prompt,
    te.letter_grade,
    te.numeric_grade,
    te.teacher_end_comment,
    te.inline_comments,
    te.rubric,
    te.rubric_scores,
    1 - (te.embedding <=> query_embedding) AS similarity
  FROM training_essays te
  WHERE
    te.teacher_id = p_teacher_id
    AND te.embedding IS NOT NULL
  ORDER BY te.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION match_training_essays(vector(1024), UUID, INT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION match_training_essays(vector(1024), UUID, INT)
  TO anon;
