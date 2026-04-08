import { createAdminClient } from "@/lib/admin";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

export default async function AdminStudentsPage() {
  const supabase = createAdminClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, email, display_name, grade_level, created_at, schools(name)")
    .order("created_at", { ascending: false });

  const rows = (students ?? []).map((s: Record<string, unknown>) => ({
    ...s,
    school_name: (s.schools as { name: string } | null)?.name ?? "—",
  }));

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
      <AdminTable
        columns={columns}
        data={rows as Record<string, unknown>[]}
        entityName="students"
        apiEndpoint="/api/admin/students"
        canEdit={false}
        canDelete
      />
    </div>
  );
}
