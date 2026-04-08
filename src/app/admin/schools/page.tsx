import { createAdminClient } from "@/lib/admin";
import AdminTable, { type Column } from "@/components/admin/AdminTable";

const columns: Column[] = [
  { key: "name", label: "Name", editable: true },
  { key: "location", label: "Location", editable: true },
  {
    key: "type",
    label: "Type",
    editable: true,
    type: "select",
    options: [
      { value: "public", label: "Public" },
      { value: "private", label: "Private" },
      { value: "charter", label: "Charter" },
      { value: "international", label: "International" },
    ],
  },
  { key: "description", label: "Description", editable: true },
  { key: "teacher_count", label: "Teachers" },
  {
    key: "created_at",
    label: "Created",
    render: (val) => (val ? new Date(val as string).toLocaleDateString() : "—"),
  },
];

export default async function AdminSchoolsPage() {
  const supabase = createAdminClient();
  const { data: schools } = await supabase
    .from("schools")
    .select("*")
    .order("created_at", { ascending: false });

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
        Schools
      </h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
        {schools?.length ?? 0} total schools
      </p>
      <AdminTable
        columns={columns}
        data={(schools as Record<string, unknown>[]) ?? []}
        entityName="schools"
        apiEndpoint="/api/admin/schools"
        canEdit
        canDelete
      />
    </div>
  );
}
