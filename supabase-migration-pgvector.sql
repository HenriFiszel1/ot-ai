-- ============================================================
-- Optimize Teacher AI — pgvector Migration
-- ============================================================
-- Run this AFTER supabase-schema.sql to add vector similarity
-- search for training essays using Voyage AI embeddings.
-- ============================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to training_essays (Voyage AI voyage-3 outputs 1024 dims)
ALTER TABLE training_essays
  ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS training_essays_embedding_idx
  ON training_essays
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── RPC: match_training_essays ───────────────────────────
-- Returns training essays ranked by cosine similarity to a query embedding.
-- Falls back gracefully: if no rows have embeddings, returns nothing
-- (caller should fall back to recency-based retrieval).
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
    1 - (te.embedding <=> query_embedding) AS similarity
  FROM training_essays te
  WHERE
    te.teacher_id = p_teacher_id
    AND te.embedding IS NOT NULL
  ORDER BY te.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant execute to authenticated users (matches existing RLS setup)
GRANT EXECUTE ON FUNCTION match_training_essays(vector(1024), UUID, INT)
  TO authenticated;
GRANT EXECUTE ON FUNCTION match_training_essays(vector(1024), UUID, INT)
  TO anon;
