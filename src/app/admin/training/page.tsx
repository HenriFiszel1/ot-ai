import { createAdminClient } from "@/lib/admin";
import TrainingClient from "./TrainingClient";

export default async function AdminTrainingPage() {
  const supabase = createAdminClient();

  let rows: Record<string, unknown>[] = [];
  let fetchError = false;
  try {
    const [trainingRes, teachersRes, schoolsRes, studentsRes] = await Promise.all([
      supabase
        .from("training_essays")
        .select("id, prompt, letter_grade, numeric_grade, created_at, teacher_id, school_id, submitted_by")
        .order("created_at", { ascending: false }),
      supabase.from("teachers").select("id, name"),
      supabase.from("schools").select("id, name"),
      supabase.from("students").select("id, email"),
    ]);

    if (trainingRes.error) throw trainingRes.error;

    const teacherMap = new Map(
      (teachersRes.data ?? []).map((t: Record<string, unknown>) => [t.id, t.name])
    );
    const schoolMap = new Map(
      (schoolsRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.name])
    );
    const studentMap = new Map(
      (studentsRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.email])
    );

    rows = (trainingRes.data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      teacher_name: (teacherMap.get(t.teacher_id) as string) ?? "—",
      school_name: (schoolMap.get(t.school_id) as string) ?? "—",
      submitted_by_email: (studentMap.get(t.submitted_by) as string) ?? "—",
    }));
  } catch (e) {
    console.error("Failed to load training essays:", e);
    fetchError = true;
  }

  return <TrainingClient data={rows} fetchError={fetchError} />;
}
