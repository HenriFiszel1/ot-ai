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
    const { prediction_id, actual_grade, actual_numeric_grade } = body as {
      prediction_id?: string;
      actual_grade?: string;       // letter grade e.g. "B+"
      actual_numeric_grade?: number; // numeric grade e.g. 85
    };

    // Support both legacy (actual_grade as number) and new (actual_numeric_grade) callers
    const numericGrade =
      actual_numeric_grade != null ? actual_numeric_grade : Number(actual_grade);

    if (!prediction_id || numericGrade == null || isNaN(numericGrade)) {
      return NextResponse.json(
        { error: "prediction_id and actual_numeric_grade are required" },
        { status: 400 }
      );
    }

    if (numericGrade < 0 || numericGrade > 100) {
      return NextResponse.json(
        { error: "actual_numeric_grade must be between 0 and 100" },
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
      actual_grade: numericGrade,
      reported_by: user.id,
    });

    // Adjust harshness_index: +1 direction = overpredicted, -1 = underpredicted
    // Formula: new_harshness = old_harshness + (0.05 * direction)
    const predictedNumeric = prediction.numeric_grade;
    const direction = predictedNumeric > numericGrade ? 1 : predictedNumeric < numericGrade ? -1 : 0;

    if (direction !== 0) {
      const { data: profile } = await serviceSupabase
        .from("teacher_profiles")
        .select("harshness_index")
        .eq("teacher_id", prediction.teacher_id)
        .single();

      const current = typeof profile?.harshness_index === "number"
        ? profile.harshness_index
        : 0;

      const next = Math.max(-0.5, Math.min(0.5, current + 0.05 * direction));

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
