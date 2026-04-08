"use client";

import AdminTable, { type Column } from "@/components/admin/AdminTable";

const columns: Column[] = [
  {
    key: "prompt",
    label: "Prompt",
    render: (val) => {
      const s = String(val ?? "");
      return s.length > 60 ? s.slice(0, 60) + "..." : s;
    },
  },
  { key: "student_email", label: "Student" },
  { key: "teacher_name", label: "Teacher" },
  { key: "school_name", label: "School" },
  {
    key: "status",
    label: "Status",
    render: (val) => {
      const status = val as string;
      const colors: Record<string, { bg: string; color: string; border: string }> = {
        completed: { bg: "rgba(16,185,129,0.1)", color: "#34d399", border: "rgba(16,185,129,0.2)" },
        analyzing: { bg: "rgba(245,158,11,0.1)", color: "#fbbf24", border: "rgba(245,158,11,0.2)" },
        failed: { bg: "rgba(239,68,68,0.1)", color: "#f87171", border: "rgba(239,68,68,0.2)" },
        submitted: { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.08)" },
      };
      const c = colors[status] ?? colors.submitted;
      return (
        <span
          style={{
            background: c.bg,
            color: c.color,
            border: `1px solid ${c.border}`,
            borderRadius: 999,
            padding: "2px 10px",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {status}
        </span>
      );
    },
  },
  { key: "word_count", label: "Words" },
  {
    key: "created_at",
    label: "Created",
    render: (val) => (val ? new Date(val as string).toLocaleDateString() : "—"),
  },
  {
    key: "id",
    label: "View",
    render: (val, row) =>
      (row.status as string) === "completed" ? (
        <a
          href={`/results/${val}`}
          target="_blank"
          rel="noopener"
          style={{ color: "#6398FF", fontSize: 12, fontWeight: 500 }}
        >
          View
        </a>
      ) : null,
  },
];

export default function EssaysClient({
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
        Essays
      </h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
        {data.length} total essays
      </p>
      {fetchError && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#f87171", fontSize: 14 }}>
          Failed to load data. Check the console for details.
        </div>
      )}
      <AdminTable
        columns={columns}
        data={data}
        entityName="essays"
        apiEndpoint="/api/admin/essays"
        canEdit={false}
        canDelete
      />
    </div>
  );
}
