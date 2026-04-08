-- ============================================================
-- Migration: Grade Calibration
-- Adds the calibrations table and harshness_index to teacher_profiles.
-- Run in Supabase SQL Editor.
-- ============================================================

-- ─── CALIBRATIONS TABLE ────────────────────────────────────
-- Records when a user reports the actual grade they received
-- so we can measure prediction accuracy and adjust teacher bias.
CREATE TABLE IF NOT EXISTS calibrations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prediction_id UUID NOT NULL REFERENCES grade_predictions(id) ON DELETE CASCADE,
  teacher_id    UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  predicted_grade NUMERIC(5,2) NOT NULL,
  actual_grade    NUMERIC(5,2) NOT NULL,
  -- positive = predicted too high (too lenient), negative = predicted too low (too harsh)
  grade_delta     NUMERIC(6,2) GENERATED ALWAYS AS (predicted_grade - actual_grade) STORED,
  reported_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calibrations_teacher    ON calibrations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_prediction ON calibrations(prediction_id);

-- ─── HARSHNESS INDEX ON TEACHER PROFILES ──────────────────
-- Positive = model historically predicts too high (lenient), needs downward nudge.
-- Negative = model historically predicts too low (harsh), needs upward nudge.
-- Range: [-0.50, +0.50], adjusted ±0.05 per calibration report.
ALTER TABLE teacher_profiles
  ADD COLUMN IF NOT EXISTS harshness_index NUMERIC(4,3) DEFAULT 0.000;

-- ─── RLS FOR CALIBRATIONS ─────────────────────────────────
ALTER TABLE calibrations ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert a calibration (report their actual grade)
CREATE POLICY "authenticated_insert_calibrations"
  ON calibrations FOR INSERT
  TO authenticated
  WITH CHECK (reported_by = auth.uid());

-- Users can read their own calibrations
CREATE POLICY "own_calibrations_select"
  ON calibrations FOR SELECT
  TO authenticated
  USING (reported_by = auth.uid());
