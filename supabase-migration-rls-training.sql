-- ============================================================
-- Fix: Training Essay RLS — allow all authenticated users to read
-- ============================================================
-- Run this AFTER supabase-migration-training-v2.sql.
--
-- BUG: The original SELECT policy for training_essays only
-- allowed users to read essays they personally submitted:
--   USING (submitted_by IN (SELECT id FROM students WHERE auth_user_id = auth.uid()))
--
-- This breaks the AI analysis pipeline: findSimilarTrainingEssays
-- and its fallback run via createClient() (anon key + user JWT),
-- so RLS applies. A student submitting an essay for analysis would
-- only see their own training contributions — not the full pool —
-- making the teacher model effectively untrained.
--
-- Fix 1: Replace the restrictive policy with one that allows ALL
--         authenticated users to read training essays.
-- Fix 2: Mark match_training_essays SECURITY DEFINER so the RPC
--         bypasses RLS regardless of caller role (belt-and-suspenders).
-- ============================================================

-- ─── Fix 1: Permissive read policy ───────────────────────────
DROP POLICY IF EXISTS "Users can view own training essays" ON training_essays;

CREATE POLICY "Authenticated users can read training essays"
  ON training_essays FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── Fix 2: Rebuild match_training_essays with SECURITY DEFINER ──
-- (Also preserves rubric + rubric_scores from migration v2)
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
LANGUAGE sql STABLE SECURITY DEFINER
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
