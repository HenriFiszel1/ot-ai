import { createAdminClient } from "@/lib/admin";
import EssaysClient from "./EssaysClient";

export default async function AdminEssaysPage() {
  const supabase = createAdminClient();

  let rows: Record<string, unknown>[] = [];
  let fetchError = false;
  try {
    const [essaysRes, teachersRes, schoolsRes, studentsRes] = await Promise.all([
      supabase
        .from("essays")
        .select("id, prompt, status, word_count, created_at, teacher_id, school_id, student_id")
        .order("created_at", { ascending: false }),
      supabase.from("teachers").select("id, name"),
      supabase.from("schools").select("id, name"),
      supabase.from("students").select("id, email"),
    ]);

    if (essaysRes.error) throw essaysRes.error;

    const teacherMap = new Map(
      (teachersRes.data ?? []).map((t: Record<string, unknown>) => [t.id, t.name])
    );
    const schoolMap = new Map(
      (schoolsRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.name])
    );
    const studentMap = new Map(
      (studentsRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.email])
    );

    rows = (essaysRes.data ?? []).map((e: Record<string, unknown>) => ({
      ...e,
      teacher_name: (teacherMap.get(e.teacher_id) as string) ?? "—",
      school_name: (schoolMap.get(e.school_id) as string) ?? "—",
      student_email: (studentMap.get(e.student_id) as string) ?? "—",
    }));
  } catch (e) {
    console.error("Failed to load essays:", e);
    fetchError = true;
  }

  return <EssaysClient data={rows} fetchError={fetchError} />;
}
