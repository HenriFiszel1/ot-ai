import { createAdminClient } from "@/lib/admin";
import TeachersClient from "./TeachersClient";

export default async function AdminTeachersPage() {
  const supabase = createAdminClient();

  let rows: Record<string, unknown>[] = [];
  let schoolOptions: { value: string; label: string }[] = [];
  let fetchError = false;
  try {
    const [teachersRes, schoolsRes] = await Promise.all([
      supabase.from("teachers").select("*").order("created_at", { ascending: false }),
      supabase.from("schools").select("id, name").order("name"),
    ]);

    if (teachersRes.error) throw teachersRes.error;
    if (schoolsRes.error) throw schoolsRes.error;

    const schoolMap = new Map(
      (schoolsRes.data ?? []).map((s: Record<string, unknown>) => [s.id, s.name])
    );

    schoolOptions = (schoolsRes.data ?? []).map((s: { id: string; name: string }) => ({
      value: s.id,
      label: s.name,
    }));

    rows = (teachersRes.data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      school_name: (schoolMap.get(t.school_id) as string) ?? "—",
    }));
  } catch (e) {
    console.error("Failed to load teachers:", e);
    fetchError = true;
  }

  return (
    <TeachersClient data={rows} schoolOptions={schoolOptions} fetchError={fetchError} />
  );
}
