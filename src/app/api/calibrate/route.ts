import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/calibrate
 * Body: { prediction_id: string, actual_grade: number }
 *
 * Records the actual grade a student received against the AI prediction,
 * then adjusts the teacher's harshness_index by ±0.05 when the error
 * exceeds 5 points — so future predictions self-correct over time.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prediction_id, actual_grade } = body as {
      prediction_id?: string;
      actual_grade?: number;
    };

    if (!prediction_id || actual_grade == null || isNaN(actual_grade)) {
      return NextResponse.json(
        { error: "prediction_id and actual_grade are required" },
        { status: 400 }
      );
    }

    if (actual_grade < 0 || actual_grade > 100) {
      return NextResponse.json(
        { error: "actual_grade must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Fetch the prediction — use user-scoped client so we only see their essays
    const { data: prediction, error: predErr } = await supabase
      .from("grade_predictions")
      .select("id, teacher_id, numeric_grade, essay_id")
      .eq("id", prediction_id)
      .single();

    if (predErr || !prediction) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }

    const serviceSupabase = createServiceClient();

    // Record the calibration
    await serviceSupabase.from("calibrations").insert({
      prediction_id,
      teacher_id: prediction.teacher_id,
      predicted_grade: prediction.numeric_grade,
      actual_grade,
      reported_by: user.id,
    });

    // Adjust harshness_index only when error > 5 points
    const diff = prediction.numeric_grade - actual_grade; // + = predicted too high
    const delta = diff > 5 ? 0.05 : diff < -5 ? -0.05 : 0;

    if (delta !== 0) {
      const { data: profile } = await serviceSupabase
        .from("teacher_profiles")
        .select("harshness_index")
        .eq("teacher_id", prediction.teacher_id)
        .single();

      const current = typeof profile?.harshness_index === "number"
        ? profile.harshness_index
        : 0;

      const next = Math.max(-0.5, Math.min(0.5, current + delta));

      await serviceSupabase
        .from("teacher_profiles")
        .upsert(
          { teacher_id: prediction.teacher_id, harshness_index: next },
          { onConflict: "teacher_id" }
        );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Calibrate error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
