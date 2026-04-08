import { createServiceClient } from "@/lib/supabase/service";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3-lite";

/**
 * Calls Voyage AI to generate a 1024-dim embedding for the given text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is not set");
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: [text],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage AI error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.data[0].embedding as number[];
}

/**
 * Combines assignment prompt + essay text into a single string for embedding.
 * Including the prompt gives better semantic matching across similar assignments.
 */
export function buildEssayEmbedText(prompt: string, essayText: string): string {
  return `Assignment: ${prompt}\n\nEssay: ${essayText}`;
}

export interface TrainingEssayMatch {
  id: string;
  essay_text: string;
  prompt: string;
  letter_grade: string | null;
  numeric_grade: number | null;
  teacher_end_comment: string | null;
  inline_comments: unknown[];
  rubric: string | null;
  rubric_scores: Record<string, unknown> | null;
  similarity?: number;
}

/**
 * Finds training essays most similar to the given essay using vector search.
 * Falls back to most-recent 10 if no embeddings exist for this teacher yet.
 */
export async function findSimilarTrainingEssays(
  essayText: string,
  prompt: string,
  teacherId: string,
  limit = 10
): Promise<TrainingEssayMatch[]> {
  // Service client bypasses RLS so we see all training essays for this teacher,
  // not just those submitted by the requesting user.
  const supabase = createServiceClient();

  // Generate embedding for the query essay
  const embedText = buildEssayEmbedText(prompt, essayText);
  const embedding = await generateEmbedding(embedText);

  // Call the RPC function
  const { data, error } = await supabase.rpc("match_training_essays", {
    query_embedding: embedding,
    p_teacher_id: teacherId,
    match_count: limit,
  });

  if (error) {
    console.error("match_training_essays RPC error:", error);
    // Fall through to recency fallback
  }

  if (data && data.length > 0) {
    return data as TrainingEssayMatch[];
  }

  // Fallback: no embeddings exist yet — return most recent essays
  console.warn(
    `No embeddings found for teacher ${teacherId}, falling back to recency`
  );
  const { data: fallback } = await supabase
    .from("training_essays")
    .select(
      "id, essay_text, prompt, letter_grade, numeric_grade, teacher_end_comment, inline_comments, rubric, rubric_scores"
    )
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (fallback as TrainingEssayMatch[]) || [];
}
