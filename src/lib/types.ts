// ─── Database row types (match supabase-schema.sql) ────────

export interface DbSchool {
  id: string;
  name: string;
  location: string | null;
  type: "public" | "private" | "charter" | "international";
  description: string | null;
  teacher_count: number;
  created_at: string;
}

export interface DbTeacher {
  id: string;
  school_id: string;
  name: string;
  email: string | null;
  department: string | null;
  subjects: string[];
  grading_style: string | null;
  essays_graded: number;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbTeacherProfile {
  id: string;
  teacher_id: string;
  strictness_score: number;
  thesis_weight: number;
  evidence_weight: number;
  analysis_weight: number;
  mechanics_weight: number;
  style_weight: number;
  tone_keywords: string[];
  common_phrases: string[];
  feedback_length_avg: number;
  avg_grade: number | null;
  grade_std_dev: number | null;
  most_common_grade: string | null;
  rubric_emphasis: Record<string, unknown>;
  comment_patterns: Record<string, unknown>;
  penalty_patterns: Record<string, unknown>;
  training_essay_count: number;
  model_version: string;
  confidence_score: number;
}

export interface DbEssay {
  id: string;
  student_id: string | null;
  school_id: string;
  teacher_id: string;
  essay_text: string;
  prompt: string;
  rubric: string | null;
  assignment_type: string | null;
  class_name: string | null;
  word_count: number | null;
  status: "submitted" | "analyzing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export interface DbGradePrediction {
  id: string;
  essay_id: string;
  teacher_id: string;
  letter_grade: string;
  numeric_grade: number;
  confidence: "high" | "medium" | "low";
  reasoning: string[];
  strengths: string[];
  weaknesses: string[];
  thesis_score: number | null;
  evidence_score: number | null;
  analysis_score: number | null;
  structure_score: number | null;
  style_score: number | null;
  mechanics_score: number | null;
  created_at: string;
}

export interface DbInlineComment {
  id: string;
  essay_id: string;
  teacher_id: string;
  start_index: number;
  end_index: number;
  excerpt: string;
  comment_text: string;
  category:
    | "thesis"
    | "evidence"
    | "analysis"
    | "structure"
    | "style"
    | "mechanics"
    | "strength";
  severity: "praise" | "suggestion" | "concern";
  display_order: number;
  created_at: string;
}

export interface DbEndComment {
  id: string;
  essay_id: string;
  comment_text: string;
  next_steps: string[];
  created_at: string;
}

// ─── API request / response types ──────────────────────

export interface AnalyzeRequest {
  essay_text: string;
  prompt: string;
  rubric?: string;
  assignment_type?: string;
  class_name?: string;
  school_id: string;
  teacher_id: string;
}

export interface InlineComment {
  excerpt: string;
  comment: string;
  category: string;
  severity: "praise" | "suggestion" | "concern";
  start_index: number;
  end_index: number;
}

export interface GradePrediction {
  letter_grade: string;
  numeric_grade: number;
  confidence: "high" | "medium" | "low";
  reasoning: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface AnalysisResult {
  grade_prediction: GradePrediction;
  inline_comments: InlineComment[];
  end_comment: string;
  next_steps: string[];
}

export interface AnalyzeResponse {
  essay_id: string;
  result: AnalysisResult;
  teacher_name: string;
  school_name: string;
}
