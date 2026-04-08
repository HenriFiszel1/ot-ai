import { createAdminClient } from "@/lib/admin";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

export default async function AdminStudentsPage() {
  const supabase = createAdminClient();

  let rows: Record<string, unknown>[] = [];
  let fetchError = false;
  try {
    const { data: students } = await supabase
      .from("students")
      .select("id, email, display_name, grade_level, created_at, schools(name)")
      .order("created_at", { ascending: false });

    rows = (students ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      school_name: (s.schools as { name: string } | null)?.name ?? "—",
    }));
  } catch (e) {
    console.error("Failed to load students:", e);
    fetchError = true;
  }

  const columns: Column[] = [
    { key: "email", label: "Email" },
    { key: "display_name", label: "Name" },
    { key: "school_name", label: "School" },
    { key: "grade_level", label: "Grade Level" },
    {
      key: "created_at",
      label: "Joined",
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
        Students
      </h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
        {rows.length} total students
      </p>
      {fetchError && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#f87171", fontSize: 14 }}>
          Failed to load data. Check the console for details.
        </div>
      )}
      <AdminTable
        columns={columns}
        data={rows}
        entityName="students"
        apiEndpoint="/api/admin/students"
        canEdit={false}
        canDelete
      />
    </div>
  );
}
