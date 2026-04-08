import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { LogOut, LayoutDashboard, GraduationCap, Users, FileText, BookOpen, School } from "lucide-react";
import AdminSidebarNav from "./AdminSidebarNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user)) redirect("/dashboard");

  return (
    <div className="min-h-screen flex" style={{ background: "#141414" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          background: "#1a1a1a",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/optimize-ai-logo.png"
              alt="Optimize AI"
              width={110}
              height={28}
              className="h-6 w-auto"
            />
          </Link>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.4)",
              marginTop: 6,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Admin Panel
          </p>
        </div>

        <AdminSidebarNav />

        <div
          style={{
            marginTop: "auto",
            padding: "16px 20px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              marginBottom: 8,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </p>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <LogOut style={{ width: 14, height: 14 }} /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
