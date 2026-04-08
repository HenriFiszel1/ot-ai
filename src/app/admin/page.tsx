import { createAdminClient } from "@/lib/admin";
import { School, Users, FileText, BookOpen, GraduationCap } from "lucide-react";

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();

  const [schools, teachers, essays, training, students] = await Promise.all([
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase.from("teachers").select("id", { count: "exact", head: true }),
    supabase.from("essays").select("id", { count: "exact", head: true }),
    supabase.from("training_essays").select("id", { count: "exact", head: true }),
    supabase.from("students").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Schools", count: schools.count ?? 0, icon: School, href: "/admin/schools", color: "#6398FF" },
    { label: "Teachers", count: teachers.count ?? 0, icon: Users, href: "/admin/teachers", color: "#a78bfa" },
    { label: "Essays", count: essays.count ?? 0, icon: FileText, href: "/admin/essays", color: "#34d399" },
    { label: "Training Essays", count: training.count ?? 0, icon: BookOpen, href: "/admin/training", color: "#fbbf24" },
    { label: "Students", count: students.count ?? 0, icon: GraduationCap, href: "/admin/students", color: "#f87171" },
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
        Admin Overview
      </h1>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>
        Manage all data in the Optimize AI platform.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <a
              key={stat.label}
              href={stat.href}
              style={{
                background: "#1e1e1e",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 20,
                textDecoration: "none",
                transition: "border-color 0.15s",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                  background: `${stat.color}15`,
                }}
              >
                <Icon style={{ width: 18, height: 18, color: stat.color }} />
              </div>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#F2F2FF",
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {stat.count}
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
