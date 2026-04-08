"use client";

import { useState, useMemo } from "react";
import { Search, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";

export interface Column {
  key: string;
  label: string;
  editable?: boolean;
  type?: "text" | "select" | "boolean" | "array";
  options?: { value: string; label: string }[];
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface AdminTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  entityName: string;
  apiEndpoint: string;
  canEdit?: boolean;
  canDelete?: boolean;
  idField?: string;
}

const PAGE_SIZE = 20;

export default function AdminTable({
  columns,
  data: initialData,
  entityName,
  apiEndpoint,
  canEdit = false,
  canDelete = true,
  idField = "id",
}: AdminTableProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function startEdit(row: Record<string, unknown>) {
    setEditingId(row[idField] as string);
    const vals: Record<string, unknown> = {};
    columns.forEach((col) => {
      if (col.editable) vals[col.key] = row[col.key];
    });
    setEditValues(vals);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  async function saveEdit(id: string) {
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, data: editValues }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || "Update failed"}`);
        return;
      }
      setData((prev) =>
        prev.map((row) =>
          row[idField] === id ? { ...row, ...editValues } : row
        )
      );
      setEditingId(null);
      setEditValues({});
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: deleteId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error: ${err.error || "Delete failed"}`);
        return;
      }
      setData((prev) => prev.filter((row) => row[idField] !== deleteId));
      setDeleteId(null);
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  function renderCell(row: Record<string, unknown>, col: Column) {
    const isEditing = editingId === row[idField];

    if (isEditing && col.editable) {
      const val = editValues[col.key];

      if (col.type === "select" && col.options) {
        return (
          <select
            value={String(val ?? "")}
            onChange={(e) => setEditValues((v) => ({ ...v, [col.key]: e.target.value }))}
            style={{
              background: "#2a2a2a",
              color: "#F2F2FF",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 13,
              width: "100%",
            }}
          >
            {col.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      }

      if (col.type === "boolean") {
        return (
          <button
            onClick={() => setEditValues((v) => ({ ...v, [col.key]: !v[col.key] }))}
            style={{
              background: val ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
              color: val ? "#34d399" : "#f87171",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {val ? "Yes" : "No"}
          </button>
        );
      }

      if (col.type === "array") {
        return (
          <input
            type="text"
            value={Array.isArray(val) ? (val as string[]).join(", ") : String(val ?? "")}
            onChange={(e) =>
              setEditValues((v) => ({
                ...v,
                [col.key]: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
            style={{
              background: "#2a2a2a",
              color: "#F2F2FF",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 13,
              width: "100%",
            }}
          />
        );
      }

      return (
        <input
          type="text"
          value={String(val ?? "")}
          onChange={(e) => setEditValues((v) => ({ ...v, [col.key]: e.target.value }))}
          style={{
            background: "#2a2a2a",
            color: "#F2F2FF",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 6,
            padding: "4px 8px",
            fontSize: 13,
            width: "100%",
          }}
        />
      );
    }

    if (col.render) return col.render(row[col.key], row);

    const val = row[col.key];
    if (val == null) return <span style={{ color: "rgba(255,255,255,0.3)" }}>—</span>;
    if (typeof val === "boolean")
      return (
        <span
          style={{
            color: val ? "#34d399" : "#f87171",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {val ? "Yes" : "No"}
        </span>
      );
    if (Array.isArray(val)) return String((val as string[]).join(", ") || "—");
    return String(val);
  }

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(255,255,255,0.4)",
            width: 16,
            height: 16,
          }}
        />
        <input
          type="text"
          placeholder={`Search ${entityName}...`}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          style={{
            width: "100%",
            background: "#1e1e1e",
            color: "#F2F2FF",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "10px 12px 10px 36px",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: "#1e1e1e",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
                {(canEdit || canDelete) && (
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "right",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (canEdit || canDelete ? 1 : 0)}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 14,
                    }}
                  >
                    No {entityName} found.
                  </td>
                </tr>
              ) : (
                paged.map((row) => {
                  const id = row[idField] as string;
                  const isEditing = editingId === id;
                  return (
                    <tr
                      key={id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        background: isEditing ? "rgba(255,255,255,0.03)" : "transparent",
                      }}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            padding: "10px 16px",
                            fontSize: 13,
                            color: "#F2F2FF",
                            maxWidth: 250,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {renderCell(row, col)}
                        </td>
                      ))}
                      {(canEdit || canDelete) && (
                        <td
                          style={{
                            padding: "10px 16px",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {isEditing ? (
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button
                                onClick={() => saveEdit(id)}
                                disabled={loading}
                                style={{
                                  background: "rgba(16,185,129,0.15)",
                                  color: "#34d399",
                                  border: "1px solid rgba(16,185,129,0.3)",
                                  borderRadius: 6,
                                  padding: "5px 10px",
                                  fontSize: 12,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Check style={{ width: 14, height: 14 }} /> Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  color: "rgba(255,255,255,0.6)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  borderRadius: 6,
                                  padding: "5px 10px",
                                  fontSize: 12,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <X style={{ width: 14, height: 14 }} /> Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              {canEdit && (
                                <button
                                  onClick={() => startEdit(row)}
                                  style={{
                                    background: "rgba(255,255,255,0.05)",
                                    color: "rgba(255,255,255,0.6)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 6,
                                    padding: "5px 10px",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <Pencil style={{ width: 13, height: 13 }} /> Edit
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => setDeleteId(id)}
                                  style={{
                                    background: "rgba(239,68,68,0.1)",
                                    color: "#f87171",
                                    border: "1px solid rgba(239,68,68,0.2)",
                                    borderRadius: 6,
                                    padding: "5px 10px",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  <Trash2 style={{ width: 13, height: 13 }} /> Delete
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{
                background: "rgba(255,255,255,0.05)",
                color: page === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                padding: "5px 10px",
                cursor: page === 0 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
              }}
            >
              <ChevronLeft style={{ width: 14, height: 14 }} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{
                background: "rgba(255,255,255,0.05)",
                color: page >= totalPages - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                padding: "5px 10px",
                cursor: page >= totalPages - 1 ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
              }}
            >
              Next <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setDeleteId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e1e1e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: 24,
              maxWidth: 400,
              width: "90%",
            }}
          >
            <h3
              style={{
                color: "#F2F2FF",
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Delete {entityName.slice(0, -1)}?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 20 }}>
              This action cannot be undone. All associated data will be permanently deleted.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                style={{
                  background: "rgba(239,68,68,0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
