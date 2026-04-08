"use client";

import AdminTable, { type Column } from "@/components/admin/AdminTable";

export default function TeachersClient({
  data,
  schoolOptions,
  fetchError,
}: {
  data: Record<string, unknown>[];
  schoolOptions: { value: string; label: string }[];
  fetchError: boolean;
}) {
  const columns: Column[] = [
    { key: "name", label: "Name", editable: true },
    {
      key: "school_id",
      label: "School",
      editable: true,
      type: "select",
      options: schoolOptions,
      render: (_val, row) => row.school_name as string,
    },
    { key: "department", label: "Department", editable: true },
    { key: "subjects", label: "Subjects", editable: true, type: "array" },
    { key: "grading_style", label: "Grading Style", editable: true },
    { key: "is_active", label: "Active", editable: true, type: "boolean" },
    { key: "essays_graded", label: "Essays" },
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
        Teachers
      </h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
        {data.length} total teachers
      </p>
      {fetchError && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#f87171", fontSize: 14 }}>
          Failed to load data. Check the console for details.
        </div>
      )}
      <AdminTable
        columns={columns}
        data={data}
        entityName="teachers"
        apiEndpoint="/api/admin/teachers"
        canEdit
        canDelete
      />
    </div>
  );
}
