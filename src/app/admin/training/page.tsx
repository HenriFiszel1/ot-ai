import { createAdminClient } from "@/lib/admin";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

export default async function AdminTrainingPage() {
  const supabase = createAdminClient();

  let rows: Record<string, unknown>[] = [];
  let fetchError = false;
  try {
    const { data: training } = await supabase
      .from("training_essays")
      .select(
        "id, prompt, letter_grade, numeric_grade, created_at, teachers(name), schools(name), submitted_by(email)"
      )
      .order("created_at", { ascending: false });

    rows = (training ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      teacher_name: (t.teachers as { name: string } | null)?.name ?? "—",
      school_name: (t.schools as { name: string } | null)?.name ?? "—",
      submitted_by_email: (t.submitted_by as { email: string } | null)?.email ?? "—",
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
