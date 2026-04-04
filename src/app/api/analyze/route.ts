import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AnalyzeRequest } from "@/lib/types";
import { findSimilarTrainingEssays } from "@/lib/embeddings";
import { runGradingPipeline } from "@/lib/grading-pipeline";

export async function POST(request: Request) {
  try {
    // ─── Auth check ──────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ─── Parse request ───────────────────────────────
    const body: AnalyzeRequest = await request.json();
    const { essay_text, prompt, rubric, class_name, school_id, teacher_id } =
      body;

    if (!essay_text || !prompt || !school_id || !teacher_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ─── Get teacher + school info ───────────────────
    const [teacherRes, schoolRes, profileRes] = await Promise.all([
      supabase.from("teachers").select("*").eq("id", teacher_id).single(),
      supabase.from("schools").select("*").eq("id", school_id).single(),
      supabase
        .from("teacher_profiles")
        .select("*")
        .eq("teacher_id", teacher_id)
        .single(),
    ]);

    const teacher = teacherRes.data;
    const school = schoolRes.data;
    const profile = profileRes.data;

    if (!teacher || !school) {
      return NextResponse.json(
        { error: "Teacher or school not found" },
        { status: 404 }
      );
    }

    // ─── Vector similarity search for training essays ─
    // Returns essays with essay_text, comments, grades, rubric, rubric_scores.
    // Falls back to recency if no embeddings exist yet.
    let trainingEssays: Awaited<ReturnType<typeof findSimilarTrainingEssays>> =
      [];
    try {
      trainingEssays = await findSimilarTrainingEssays(
        essay_text,
        prompt,
        teacher_id,
        10
      );
    } catch (embedErr) {
      console.error("Vector search failed, falling back to recency:", embedErr);
      const { data: fallback } = await supabase
        .from("training_essays")
        .select(
          "id, essay_text, prompt, letter_grade, numeric_grade, teacher_end_comment, inline_comments, rubric, rubric_scores"
        )
        .eq("teacher_id", teacher_id)
        .order("created_at", { ascending: false })
        .limit(10);
      trainingEssays =
        (fallback as Awaited<ReturnType<typeof findSimilarTrainingEssays>>) ||
        [];
    }

    // ─── Get student ID ──────────────────────────────
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    // ─── Insert essay record (status: analyzing) ─────
    const wordCount = essay_text.trim().split(/\s+/).filter(Boolean).length;

    const { data: essay, error: essayError } = await supabase
      .from("essays")
      .insert({
        student_id: student?.id || null,
        school_id,
        teacher_id,
        essay_text,
        prompt,
        rubric: rubric || null,
        class_name: class_name || null,
        word_count: wordCount,
        status: "analyzing",
      })
      .select("id")
      .single();

    if (essayError || !essay) {
      console.error("Essay insert error:", essayError);
      return NextResponse.json(
        { error: "Failed to save essay" },
        { status: 500 }
      );
    }

    // ─── Run grading pipeline ────────────────────────
    const result = await runGradingPipeline({
      essayText: essay_text,
      prompt,
      rubric: rubric || null,
      className: class_name || null,
      teacherName: teacher.name,
      schoolName: school.name,
      department: teacher.department || "English",
      subjects: teacher.subjects || [],
      gradingStyle: teacher.grading_style || null,
      profile,
      trainingEssays,
    });

    // ─── Store results in Supabase ───────────────────
    const gp = result.grade_prediction;

    await supabase.from("grade_predictions").insert({
      essay_id: essay.id,
      teacher_id,
      letter_grade: gp.letter_grade,
      numeric_grade: gp.numeric_grade,
      confidence: gp.confidence,
      reasoning: gp.reasoning,
      strengths: gp.strengths,
      weaknesses: gp.weaknesses,
    });

    if (result.inline_comments?.length) {
      await supabase.from("inline_comments").insert(
        result.inline_comments.map((c, i) => ({
          essay_id: essay.id,
          teacher_id,
          start_index: c.start_index || 0,
          end_index: c.end_index || 0,
          excerpt: c.excerpt,
          comment_text: c.comment,
          category: c.category,
          severity: c.severity,
          display_order: i,
        }))
      );
    }

    await supabase.from("end_comments").insert({
      essay_id: essay.id,
      comment_text: result.end_comment,
      next_steps: result.next_steps,
    });

    await supabase
      .from("essays")
      .update({ status: "completed" })
      .eq("id", essay.id);

    // ─── Return response ─────────────────────────────
    return NextResponse.json({
      essay_id: essay.id,
      result,
      teacher_name: teacher.name,
      school_name: school.name,
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
