import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding, buildEssayEmbedText } from "@/lib/embeddings";
import { buildTeacherPersona } from "@/lib/teacher-persona";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      school_id,
      teacher_id,
      essay_text,
      prompt,
      letter_grade,
      numeric_grade,
      teacher_end_comment,
      inline_comments,
      rubric,
      rubric_scores,
      assignment_type,
    } = body;

    if (!school_id || !teacher_id || !essay_text) {
      return NextResponse.json(
        { error: "Missing required fields: school_id, teacher_id, essay_text" },
        { status: 400 }
      );
    }

    // Verify the teacher belongs to the specified school before accepting training data
    const { data: teacher } = await supabase
      .from("teachers")
      .select("school_id")
      .eq("id", teacher_id)
      .single();

    if (!teacher || teacher.school_id !== school_id) {
      return NextResponse.json(
        { error: "Teacher does not belong to the specified school" },
        { status: 403 }
      );
    }

    // Get the student record
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    // Insert the training essay
    const { data: trainingEssay, error: insertError } = await supabase
      .from("training_essays")
      .insert({
        teacher_id,
        school_id,
        submitted_by: student?.id || null,
        essay_text,
        prompt,
        letter_grade: letter_grade || null,
        numeric_grade: numeric_grade || null,
        teacher_end_comment: teacher_end_comment || null,
        inline_comments: inline_comments || [],
        rubric: rubric || null,
        rubric_scores: rubric_scores || null,
        assignment_type: assignment_type || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Training essay insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Also insert individual comments into teacher_comment_training for the AI model
    if (inline_comments && inline_comments.length > 0) {
      const commentRows = inline_comments
        .filter((c: { excerpt: string; comment: string }) => c.excerpt.trim() && c.comment.trim())
        .map((c: { excerpt: string; comment: string }) => ({
          teacher_id,
          school_id,
          essay_excerpt: c.excerpt,
          comment_text: c.comment,
          comment_type: "inline",
          associated_grade: letter_grade || null,
          submitted_by: student?.id || null,
        }));

      if (commentRows.length > 0) {
        await supabase.from("teacher_comment_training").insert(commentRows);
      }
    }

    // Insert end comment into training data too
    if (teacher_end_comment?.trim()) {
      await supabase.from("teacher_comment_training").insert({
        teacher_id,
        school_id,
        comment_text: teacher_end_comment,
        comment_type: "end",
        associated_grade: letter_grade || null,
        submitted_by: student?.id || null,
      });
    }

    // Mark the teacher's persona as stale — new data means the profile needs recomputing
    await supabase
      .from("teacher_profiles")
      .update({ is_stale: true })
      .eq("teacher_id", teacher_id);

    // Generate and store embedding (non-fatal — essay is saved regardless)
    try {
      const embedText = buildEssayEmbedText(prompt || "", essay_text);
      const embedding = await generateEmbedding(embedText);
      await supabase
        .from("training_essays")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", trainingEssay.id);
    } catch (embedErr) {
      console.error("Embedding generation failed (non-fatal):", embedErr);
    }

    // Rebuild the teacher persona in the background (non-fatal)
    buildTeacherPersona(teacher_id).catch((err) =>
      console.error("Persona rebuild failed (non-fatal):", err)
    );

    return NextResponse.json({ id: trainingEssay.id, success: true });
  } catch (err) {
    console.error("Training API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
