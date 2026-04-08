import { createAdminClient } from "@/lib/admin";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

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

  const columns: Column[] = [
    {
      key: "prompt",
      label: "Prompt",
      render: (val) => {
        const s = String(val ?? "");
        return s.length > 60 ? s.slice(0, 60) + "..." : s;
      },
    },
    { key: "teacher_name", label: "Teacher" },
    { key: "school_name", label: "School" },
    { key: "letter_grade", label: "Grade" },
    { key: "numeric_grade", label: "Score" },
    { key: "submitted_by_email", label: "Submitted By" },
    {
      key: "created_at",
      label: "Created",
      render: (val) => (val ? new Date(val as string).toLocaleDateString() : "—"),
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "#F2F2FF",
          marginBottom: 4,
          letterSpacing: "-0.02em",
        }}
      >
        Training Essays
      </h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
        {rows.length} total training essays
      </p>
      {fetchError && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#f87171", fontSize: 14 }}>
          Failed to load data. Check the console for details.
        </div>
      )}
      <AdminTable
        columns={columns}
        data={rows}
        entityName="training essays"
        apiEndpoint="/api/admin/training"
        canEdit={false}
        canDelete
      />
    </div>
  );
}
