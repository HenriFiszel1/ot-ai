import { createServiceClient } from "@/lib/supabase/service";

// ─── Comment clustering ────────────────────────────────────
// Maps each comment category to keyword signals so we can classify
// comments that lack an explicit `category` field.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  thesis:    ["thesis", "argument", "claim", "position", "main point", "central idea", "assert"],
  evidence:  ["evidence", "example", "quote", "source", "support", "cite", "data", "reference"],
  analysis:  ["analysis", "analyze", "explain", "elaborate", "develop", "insight", "connect", "interpret"],
  structure: ["structure", "organization", "paragraph", "transition", "flow", "introduction", "conclusion", "body", "outline"],
  style:     ["style", "word choice", "diction", "tone", "voice", "language", "sentence", "vary", "clarity", "concise"],
};

const VALID_CATEGORIES = new Set(Object.keys(CATEGORY_KEYWORDS));

const SEVERITY_SCORE: Record<string, number> = { praise: 1, suggestion: 2, concern: 3 };

function classifyComment(text: string, explicitCategory?: string): string | null {
  if (explicitCategory && VALID_CATEGORIES.has(explicitCategory)) return explicitCategory;
  const lower = (text || "").toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return null;
}

/**
 * Computes a teacher's grading profile from all their training essays
 * and upserts the result into teacher_profiles.
 *
 * Called automatically (non-blocking) whenever a new training essay is uploaded.
 * Sets is_stale = false after a successful rebuild.
 *
 * Uses the service-role client to bypass RLS — training essays are aggregated
 * across all submitters, not just the requesting user.
 */
export async function buildTeacherPersona(teacherId: string): Promise<void> {
  const supabase = createServiceClient();

  // Fetch all training essays for this teacher (cap at 200 for performance)
  const { data: essays, error } = await supabase
    .from("training_essays")
    .select(
      "letter_grade, numeric_grade, teacher_end_comment, inline_comments, rubric_scores, created_at"
    )
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("buildTeacherPersona fetch error:", error);
    return;
  }
  if (!essays || essays.length === 0) return;

  // ─── Grade statistics ──────────────────────────────────────
  const numericGrades = essays
    .map((e) => e.numeric_grade as number | null)
    .filter((g): g is number => g != null);

  const avgGrade =
    numericGrades.length > 0
      ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
      : null;

  const gradeStdDev =
    numericGrades.length > 1 && avgGrade != null
      ? Math.sqrt(
          numericGrades.reduce((s, g) => s + Math.pow(g - avgGrade, 2), 0) /
            numericGrades.length
        )
      : null;

  // Most common letter grade
  const letterGrades = essays
    .map((e) => e.letter_grade as string | null)
    .filter(Boolean) as string[];
  const gradeCounts: Record<string, number> = {};
  for (const g of letterGrades) gradeCounts[g] = (gradeCounts[g] || 0) + 1;
  const mostCommonGrade =
    Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // ─── Strictness: derived from average grade ────────────────
  // Below 75 = strict (0.80), 75–85 = moderate (0.50), 85+ = lenient (0.25)
  const strictnessScore =
    avgGrade != null ? (avgGrade < 75 ? 0.8 : avgGrade < 85 ? 0.5 : 0.25) : 0.5;

  // ─── Comment analysis ──────────────────────────────────────
  const allInlineComments = essays.flatMap((e) => {
    const ic = e.inline_comments;
    if (!Array.isArray(ic)) return [];
    return (ic as Array<{ comment?: string }>).map((c) => c.comment || "");
  });

  const feedbackLengthAvg =
    allInlineComments.length > 0
      ? Math.round(
          allInlineComments.reduce((s, c) => s + c.length, 0) /
            allInlineComments.length
        )
      : 150;

  // Aggregate end-comment metadata for comment_patterns
  const endComments = essays
    .map((e) => e.teacher_end_comment as string | null)
    .filter(Boolean) as string[];

  // ─── Comment clustering ────────────────────────────────────
  // Walk every inline comment across all training essays,
  // bucket by category, and track frequency + avg severity.
  const clusterTotals: Record<string, { count: number; severitySum: number }> = {};

  for (const essay of essays) {
    const ic = essay.inline_comments;
    if (!Array.isArray(ic)) continue;
    for (const c of ic as Array<{ comment?: string; category?: string; severity?: string }>) {
      const cat = classifyComment(c.comment || "", c.category);
      if (!cat) continue;
      if (!clusterTotals[cat]) clusterTotals[cat] = { count: 0, severitySum: 0 };
      clusterTotals[cat].count++;
      clusterTotals[cat].severitySum += SEVERITY_SCORE[c.severity ?? ""] ?? 2;
    }
  }

  const clusters: Record<string, { frequency: number; severity_avg: number }> = {};
  for (const [cat, totals] of Object.entries(clusterTotals)) {
    clusters[cat] = {
      frequency: totals.count,
      severity_avg: Math.round((totals.severitySum / totals.count) * 10) / 10,
    };
  }

  const commentPatterns = {
    ...(endComments.length > 0
      ? {
          sample_count: endComments.length,
          avg_length: Math.round(
            endComments.reduce((s, c) => s + c.length, 0) / endComments.length
          ),
        }
      : {}),
    ...(Object.keys(clusters).length > 0 ? { clusters } : {}),
  };

  // ─── Rubric score weights (if available) ──────────────────
  // Average per-criterion scores across essays that provided rubric_scores
  const rubricEntries = essays
    .map((e) => e.rubric_scores as Record<string, number> | null)
    .filter(Boolean) as Record<string, number>[];

  let rubricEmphasis: Record<string, unknown> = {};
  if (rubricEntries.length > 0) {
    const keys = new Set(rubricEntries.flatMap(Object.keys));
    for (const key of keys) {
      const vals = rubricEntries
        .map((r) => r[key])
        .filter((v): v is number => typeof v === "number");
      if (vals.length > 0) {
        rubricEmphasis[key] =
          Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
      }
    }
  }

  // ─── Upsert teacher_profiles ───────────────────────────────
  await supabase.from("teacher_profiles").upsert(
    {
      teacher_id: teacherId,
      avg_grade: avgGrade,
      grade_std_dev: gradeStdDev,
      most_common_grade: mostCommonGrade,
      strictness_score: strictnessScore,
      feedback_length_avg: feedbackLengthAvg,
      training_essay_count: essays.length,
      last_trained_at: new Date().toISOString(),
      is_stale: false,
      comment_patterns: commentPatterns,
      rubric_emphasis: rubricEmphasis,
    },
    { onConflict: "teacher_id" }
  );
}
