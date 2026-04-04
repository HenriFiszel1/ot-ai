import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/lib/types";
import type { TrainingEssayMatch } from "@/lib/embeddings";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface TeacherProfileContext {
  strictness_score: number;
  thesis_weight: number;
  evidence_weight: number;
  analysis_weight: number;
  mechanics_weight: number;
  style_weight: number;
  tone_keywords: string[];
  common_phrases: string[];
  avg_grade: number | null;
  most_common_grade: string | null;
}

export interface GradingPipelineInput {
  essayText: string;
  prompt: string;
  rubric?: string | null;
  className?: string | null;
  teacherName: string;
  schoolName: string;
  department: string;
  subjects: string[];
  gradingStyle: string | null;
  profile: TeacherProfileContext | null;
  trainingEssays: TrainingEssayMatch[];
}

/**
 * Builds the system prompt that instructs Claude to behave as this specific teacher.
 * Incorporates the teacher profile stats and all retrieved training essay examples.
 */
export function buildSystemPrompt(input: GradingPipelineInput): string {
  const {
    teacherName,
    schoolName,
    department,
    subjects,
    gradingStyle,
    profile,
    trainingEssays,
  } = input;

  const teacherContext = profile
    ? `
Teacher Profile Data:
- Strictness: ${profile.strictness_score}/1.0
- Rubric weights: Thesis ${profile.thesis_weight}, Evidence ${profile.evidence_weight}, Analysis ${profile.analysis_weight}, Mechanics ${profile.mechanics_weight}, Style ${profile.style_weight}
- Tone: ${profile.tone_keywords?.join(", ") || "professional"}
- Common phrases: ${profile.common_phrases?.join("; ") || "none recorded yet"}
- Average grade given: ${profile.avg_grade ?? "unknown"}
- Most common grade: ${profile.most_common_grade ?? "unknown"}
`
    : "";

  let trainingContext = "";
  if (trainingEssays.length > 0) {
    trainingContext = `\n\n=== REAL GRADED ESSAY EXAMPLES FROM THIS TEACHER ===
Use these past examples to understand exactly how ${teacherName} grades, comments, and what scores they give. Mimic their tone, severity, and grading standards closely.\n\n`;

    for (let i = 0; i < trainingEssays.length; i++) {
      const te = trainingEssays[i];
      const comments = Array.isArray(te.inline_comments) ? te.inline_comments : [];
      const similarityNote =
        te.similarity != null
          ? ` [similarity: ${(te.similarity * 100).toFixed(1)}%]`
          : "";

      trainingContext += `--- Example ${i + 1}${similarityNote} ---
Prompt: ${te.prompt}
Grade Given: ${te.letter_grade || "N/A"}${te.numeric_grade ? ` (${te.numeric_grade})` : ""}
Essay (first 500 chars): ${te.essay_text.slice(0, 500)}...
${te.teacher_end_comment ? `Teacher's End Comment: ${te.teacher_end_comment}` : ""}
${
  comments.length > 0
    ? `Teacher's Inline Comments:\n${(
        comments as Array<{ excerpt: string; comment: string }>
      )
        .map((c) => `  - On "${c.excerpt}": "${c.comment}"`)
        .join("\n")}`
    : ""
}
${te.rubric ? `Rubric Used: ${te.rubric.slice(0, 300)}` : ""}
${
  te.rubric_scores && Object.keys(te.rubric_scores).length > 0
    ? `Rubric Scores: ${JSON.stringify(te.rubric_scores)}`
    : ""
}
\n`;
    }
  }

  return `You are an AI that models a specific teacher's grading behavior to provide essay feedback. You must respond ONLY with valid JSON matching the exact schema specified — no markdown, no explanation, no code fences.

TEACHER: ${teacherName}
SCHOOL: ${schoolName}
DEPARTMENT: ${department}
SUBJECTS: ${subjects?.join(", ") || "General"}
GRADING STYLE: ${gradingStyle || "Standard academic grading"}
${teacherContext}
Your job is to:
1. Predict the grade this specific teacher would give, based on their patterns
2. Generate line-by-line comments in this teacher's voice and style
3. Provide an end comment summary and actionable next steps

The comments should sound like this specific teacher — use their tone, emphasis areas, and level of detail.
${trainingContext}`;
}

/**
 * Builds the user-turn prompt containing the essay to grade.
 */
export function buildUserPrompt(
  input: Pick<GradingPipelineInput, "essayText" | "prompt" | "rubric" | "className">
): string {
  const { essayText, prompt, rubric, className } = input;
  return `Analyze this student essay and return your response as a single JSON object.

ASSIGNMENT PROMPT: ${prompt}
${rubric ? `RUBRIC: ${rubric}` : ""}
${className ? `CLASS: ${className}` : ""}

ESSAY:
${essayText}

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
}

/**
 * Runs the full grading pipeline: builds prompts, calls Claude, parses result.
 * Throws on Claude API errors or unparseable responses.
 */
export async function runGradingPipeline(
  input: GradingPipelineInput
): Promise<AnalysisResult> {
  const systemPrompt = buildSystemPrompt(input);
  const userPrompt = buildUserPrompt(input);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let raw = textBlock.text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const result: AnalysisResult = JSON.parse(raw);
  return result;
}
