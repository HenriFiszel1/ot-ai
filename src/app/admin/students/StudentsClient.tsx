"use client";

import AdminTable, { type Column } from "@/components/admin/AdminTable";

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

export default function StudentsClient({
  data,
  fetchError,
}: {
  data: Record<string, unknown>[];
  fetchError: boolean;
}) {
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
        {data.length} total students
      </p>
      {fetchError && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#f87171", fontSize: 14 }}>
          Failed to load data. Check the console for details.
        </div>
      )}
      <AdminTable
        columns={columns}
        data={data}
        entityName="students"
        apiEndpoint="/api/admin/students"
        canEdit={false}
        canDelete
      />
    </div>
  );
}
