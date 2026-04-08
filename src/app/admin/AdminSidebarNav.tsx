"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, School, Users, FileText, BookOpen, GraduationCap } from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/schools", label: "Schools", icon: School },
  { href: "/admin/teachers", label: "Teachers", icon: Users },
  { href: "/admin/essays", label: "Essays", icon: FileText },
  { href: "/admin/training", label: "Training Data", icon: BookOpen },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: isActive ? "#F2F2FF" : "rgba(255,255,255,0.5)",
              background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
