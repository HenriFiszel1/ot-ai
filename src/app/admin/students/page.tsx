import { createAdminClient } from "@/lib/admin";
import StudentsClient from "./StudentsClient";

export default async function AdminStudentsPage() {
  const supabase = createAdminClient();

  let rows: Record<string, unknown>[] = [];
  let fetchError = false;
  try {
    const [studentsRes, schoolsRes] = await Promise.all([
      supabase
        .from("students")
        .select("id, email, display_name, grade_level, created_at, school_id")
        .order("created_at", { ascending: false }),
      supabase.from("schools").select("id, name"),
    ]);

    if (studentsRes.error) throw studentsRes.error;

    const schoolMap = new Map(
      (schoolsRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.name])
    );

    rows = (studentsRes.data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      school_name: (schoolMap.get(s.school_id) as string) ?? "—",
    }));
  } catch (e) {
    console.error("Failed to load students:", e);
    fetchError = true;
  }

  return <StudentsClient data={rows} fetchError={fetchError} />;
}
