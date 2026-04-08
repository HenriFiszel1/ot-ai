"use client";

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

export default function SchoolsClient({
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
        Schools
      </h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
        {data.length} total schools
      </p>
      {fetchError && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#f87171", fontSize: 14 }}>
          Failed to load data. Check the console for details.
        </div>
      )}
      <AdminTable
        columns={columns}
        data={data}
        entityName="schools"
        apiEndpoint="/api/admin/schools"
        canEdit
        canDelete
      />
    </div>
  );
}
