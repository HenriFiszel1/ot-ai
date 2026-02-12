import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import type { AnalyzeRequest, AnalysisResult } from "@/lib/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

    // ─── Get student ID ──────────────────────────────
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    // ─── Insert essay record (status: analyzing) ─────
    const wordCount = essay_text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

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

    // ─── Build the Claude prompt ─────────────────────
    const teacherContext = profile
      ? `
Teacher Profile Data:
- Strictness: ${profile.strictness_score}/1.0
- Rubric weights: Thesis ${profile.thesis_weight}, Evidence ${profile.evidence_weight}, Analysis ${profile.analysis_weight}, Mechanics ${profile.mechanics_weight}, Style ${profile.style_weight}
- Tone: ${profile.tone_keywords?.join(", ") || "professional"}
- Common phrases: ${profile.common_phrases?.join("; ") || "none recorded yet"}
- Average grade given: ${profile.avg_grade || "unknown"}
- Most common grade: ${profile.most_common_grade || "unknown"}
`
      : "";

    const systemPrompt = `You are an AI that models a specific teacher's grading behavior to provide essay feedback. You must respond ONLY with valid JSON matching the exact schema specified — no markdown, no explanation, no code fences.

TEACHER: ${teacher.name}
SCHOOL: ${school.name}
DEPARTMENT: ${teacher.department || "English"}
SUBJECTS: ${teacher.subjects?.join(", ") || "General"}
GRADING STYLE: ${teacher.grading_style || "Standard academic grading"}
${teacherContext}

Your job is to:
1. Predict the grade this specific teacher would give, based on their patterns
2. Generate line-by-line comments in this teacher's voice and style
3. Provide an end comment summary and actionable next steps

The comments should sound like this specific teacher — use their tone, emphasis areas, and level of detail.`;

    const userPrompt = `Analyze this student essay and return your response as a single JSON object.

ASSIGNMENT PROMPT: ${prompt}
${rubric ? `RUBRIC: ${rubric}` : ""}
${class_name ? `CLASS: ${class_name}` : ""}

ESSAY:
${essay_text}

Return ONLY this exact JSON structure (no markdown, no code fences):
{
  "grade_prediction": {
    "letter_grade": "B+",
    "numeric_grade": 88,
    "confidence": "high",
    "reasoning": ["reason 1", "reason 2", "reason 3"],
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"]
  },
  "inline_comments": [
    {
      "excerpt": "exact quote from the essay (10-30 words)",
      "comment": "the teacher's feedback on this excerpt",
      "category": "thesis|evidence|analysis|structure|style|mechanics|strength",
      "severity": "praise|suggestion|concern",
      "start_index": 0,
      "end_index": 50
    }
  ],
  "end_comment": "A 2-3 paragraph summary comment in the teacher's voice",
  "next_steps": ["step 1", "step 2", "step 3"]
}

Generate 8-12 inline comments covering different parts of the essay. Mix praise, suggestions, and concerns. confidence must be "high", "medium", or "low". category must be one of: thesis, evidence, analysis, structure, style, mechanics, strength.`;

    // ─── Call Claude API ─────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    // Extract the text response
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse the JSON response
    let result: AnalysisResult;
    try {
      // Strip any accidental markdown fences
      let raw = textBlock.text.trim();
      if (raw.startsWith("```")) {
        raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      result = JSON.parse(raw);
    } catch {
      console.error("Failed to parse Claude response:", textBlock.text);
      throw new Error("Failed to parse AI response");
    }

    // ─── Store results in Supabase ───────────────────
    const gp = result.grade_prediction;

    // Insert grade prediction
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

    // Insert inline comments
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

    // Insert end comment
    await supabase.from("end_comments").insert({
      essay_id: essay.id,
      comment_text: result.end_comment,
      next_steps: result.next_steps,
    });

    // Update essay status to completed
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
        error:
          err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
