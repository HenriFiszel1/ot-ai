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
  comment_patterns?: Record<string, unknown>;
  harshness_index?: number | null;
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

  const clusters = profile?.comment_patterns &&
    typeof profile.comment_patterns === "object" &&
    (profile.comment_patterns as Record<string, unknown>).clusters
      ? (profile.comment_patterns as { clusters: Record<string, { frequency: number; severity_avg: number }> }).clusters
      : null;

  const clusterContext = clusters && Object.keys(clusters).length > 0
    ? `\nComment Focus Areas (derived from ${Object.values(clusters).reduce((s, c) => s + c.frequency, 0)} past comments):\n` +
      Object.entries(clusters)
        .sort((a, b) => b[1].frequency - a[1].frequency)
        .map(([cat, d]) => `  - ${cat}: ${d.frequency} comments, avg severity ${d.severity_avg <= 1.5 ? "mostly praise" : d.severity_avg >= 2.5 ? "mostly critical" : "mixed — weight this area in your feedback"}`)
        .join("\n")
    : "";

  const harshnessContext = profile?.harshness_index && profile.harshness_index !== 0
    ? `\nCalibration note: Harshness index ${profile.harshness_index > 0 ? "+" : ""}${(profile.harshness_index as number).toFixed(3)} — past predictions have run ${profile.harshness_index > 0 ? "high; shade grades slightly lower than your first instinct" : "low; shade grades slightly higher than your first instinct"}.`
    : "";

  const teacherContext = profile
    ? `
Teacher Profile Data:
- Strictness: ${profile.strictness_score}/1.0
- Rubric weights: Thesis ${profile.thesis_weight}, Evidence ${profile.evidence_weight}, Analysis ${profile.analysis_weight}, Mechanics ${profile.mechanics_weight}, Style ${profile.style_weight}
- Tone: ${profile.tone_keywords?.join(", ") || "professional"}
- Common phrases: ${profile.common_phrases?.join("; ") || "none recorded yet"}
- Average grade given: ${profile.avg_grade ?? "unknown"}
- Most common grade: ${profile.most_common_grade ?? "unknown"}${clusterContext}${harshnessContext}
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
 * Analyzes the spread between highest- and lowest-graded training essays to
 * identify what concretely separates them. Returns a 2-3 sentence insight
 * string, or "" if there is not enough data.
 *
 * Called between pass 1 (context retrieval) and pass 3 (full grading) so its
 * findings can be woven into the system prompt before Claude grades.
 */
export interface GapAnalysisResult {
  whatWouldImproveGrade: string[];
  keyDifferences: string[];
}

export async function gapAnalysis(
  trainingEssays: TrainingEssayMatch[]
): Promise<GapAnalysisResult | null> {
  const graded = trainingEssays
    .filter((e) => e.numeric_grade != null)
    .sort((a, b) => (b.numeric_grade ?? 0) - (a.numeric_grade ?? 0));

  if (graded.length < 2) return null;

  const highest = graded[0];
  const lowest = graded[graded.length - 1];
  const gap = (highest.numeric_grade ?? 0) - (lowest.numeric_grade ?? 0);
  if (gap < 5) return null;

  const prompt = `Compare a high-grade and low-grade essay from the same teacher. Identify what separates them.

HIGH-GRADE ESSAY (${highest.letter_grade ?? highest.numeric_grade}/100):
Prompt: ${highest.prompt}
Excerpt: ${highest.essay_text.slice(0, 400)}
${highest.teacher_end_comment ? `Teacher comment: ${highest.teacher_end_comment.slice(0, 200)}` : ""}

LOW-GRADE ESSAY (${lowest.letter_grade ?? lowest.numeric_grade}/100):
Prompt: ${lowest.prompt}
Excerpt: ${lowest.essay_text.slice(0, 400)}
${lowest.teacher_end_comment ? `Teacher comment: ${lowest.teacher_end_comment.slice(0, 200)}` : ""}

Return ONLY valid JSON (no markdown, no code fences):
{
  "whatWouldImproveGrade": ["specific actionable improvement 1", "improvement 2", "improvement 3"],
  "keyDifferences": ["what makes the high essay stronger 1", "key difference 2"]
}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;

  let raw = block.text.trim();
  if (raw.startsWith("```")) raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  try {
    return JSON.parse(raw) as GapAnalysisResult;
  } catch {
    return null;
  }
}

export interface FactualError {
  quoted_text: string;
  issue: string;
  correction: string;
}

/**
 * Runs a fact-checking pass on the essay.
 * Returns an array of factual errors found (empty if none).
 */
export async function factCheck(
  essayText: string,
  assignmentPrompt: string
): Promise<{ factualErrors: FactualError[] }> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system:
      "You are a fact-checker. Read this essay carefully. Identify any factual errors, incorrect claims, wrong dates, misattributed quotes, incorrect scientific information, wrong formulas, or factual inaccuracies. For each error found, provide: the exact quoted text that is wrong, what is incorrect about it, and what the correct information is. If everything is factually accurate, return an empty array. Only flag things that are genuinely factually wrong — do not flag opinions, arguments, or stylistic choices. Respond ONLY with valid JSON, no markdown, no code fences.",
    messages: [
      {
        role: "user",
        content: `ASSIGNMENT PROMPT: ${assignmentPrompt}\n\nESSAY:\n${essayText}\n\nReturn ONLY this JSON structure:\n{\n  "factualErrors": [\n    {\n      "quoted_text": "exact text from essay that is wrong",\n      "issue": "what is incorrect about it",\n      "correction": "the correct information"\n    }\n  ]\n}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { factualErrors: [] };
  }

  let raw = textBlock.text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const parsed = JSON.parse(raw);
    return { factualErrors: Array.isArray(parsed.factualErrors) ? parsed.factualErrors : [] };
  } catch {
    return { factualErrors: [] };
  }
}

/**
 * Runs the full grading pipeline: builds prompts, calls Claude, parses result.
 * Throws on Claude API errors or unparseable responses.
 */
export async function runGradingPipeline(
  input: GradingPipelineInput
): Promise<AnalysisResult> {
  // Pass 1: retrieve training essay context (done by caller via findSimilarTrainingEssays)
  // Pass 2: gap analysis — what separates high vs low grades for this teacher
  let gapResult: GapAnalysisResult | null = null;
  if (input.trainingEssays.length >= 2) {
    try {
      gapResult = await gapAnalysis(input.trainingEssays);
    } catch {
      // non-fatal — proceed without gap insight
    }
  }

  // Pass 3: full grading — build prompts enriched with gap analysis, then grade
  const systemPrompt = buildSystemPrompt(input);
  const gapInsight =
    gapResult && (gapResult.whatWouldImproveGrade.length > 0 || gapResult.keyDifferences.length > 0)
      ? `Key differences from higher-scored essays: ${gapResult.keyDifferences.join("; ")}. To push this essay's grade up: ${gapResult.whatWouldImproveGrade.join("; ")}.`
      : "";
  const enrichedSystemPrompt = gapInsight
    ? `${systemPrompt}\n\n=== GAP ANALYSIS: WHAT SEPARATES HIGH vs LOW GRADES ===\n${gapInsight}\nWeave these improvement suggestions naturally into next_steps and end_comment as "to improve your grade, focus on..." guidance.`
    : systemPrompt;
  const userPrompt = buildUserPrompt(input);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: enrichedSystemPrompt,
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
  if (gapResult) result.gap_analysis = gapResult;
  return result;
}
