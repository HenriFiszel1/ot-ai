import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  FileText,
  Clock,
  LogOut,
  School,
  Sparkles,
} from "lucide-react";
import { AnimateIn, StaggerChildren, StaggerItem } from "@/components/ui/motion";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  let recentEssays: Array<{
    id: string;
    prompt: string;
    status: string;
    created_at: string;
    word_count: number | null;
    teachers: { name: string } | null;
    schools: { name: string } | null;
  }> = [];

  if (student) {
    const { data } = await supabase
      .from("essays")
      .select(
        "id, prompt, status, created_at, word_count, teachers(name), schools(name)"
      )
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) recentEssays = data as unknown as typeof recentEssays;
  }

  return (
    <div className="min-h-screen" style={{ background: '#141414' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/optimize-ai-logo.png"
              alt="Optimize AI"
              width={130}
              height={32}
              className="h-7 w-auto"
            />
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-xs font-medium flex items-center gap-1.5 transition-opacity hover:opacity-80"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Page header */}
        <AnimateIn className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#F2F2FF' }}>
              Dashboard
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Submit essays and view your feedback history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contribute"
              className="h-10 px-5 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{ background: 'transparent', color: '#F2F2FF', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <School className="w-4 h-4" /> Add School or Teacher
            </Link>
            <Link
              href="/analyze"
              className="h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: '#F2F2FF', color: '#141414' }}
            >
              <Sparkles className="w-4 h-4" /> Analyze Essay
            </Link>
          </div>
        </AnimateIn>

        {recentEssays.length === 0 ? (
          /* Empty state */
          <AnimateIn><div className="rounded-2xl p-14 text-center" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <FileText className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.6)' }} />
            </div>
            <h2 className="text-xl font-semibold tracking-tight" style={{ color: '#F2F2FF' }}>No essays yet</h2>
            <p className="mt-2.5 text-sm max-w-sm mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Submit your first essay to get teacher-specific feedback and a predicted grade.
            </p>
            <Link
              href="/analyze"
              className="mt-8 h-11 px-7 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: '#F2F2FF', color: '#141414' }}
            >
              Analyze Essay <ArrowRight className="w-4 h-4" />
            </Link>
          </div></AnimateIn>
        ) : (
          /* Essay list */
          <StaggerChildren className="space-y-2" staggerDelay={0.06}>
            {recentEssays.map((essay) => (
              <StaggerItem key={essay.id}>
              <Link
                href={essay.status === "completed" ? `/results/${essay.id}` : "#"}
                className="group block rounded-xl p-5 transition-all duration-200"
                style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: '#F2F2FF' }}>
                      {essay.prompt}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {essay.teachers && (
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>{(essay.teachers as { name: string }).name}</span>
                      )}
                      {essay.schools && (
                        <span>{(essay.schools as { name: string }).name}</span>
                      )}
                      {essay.word_count && <span>{essay.word_count} words</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(essay.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={
                      essay.status === "completed"
                        ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
                        : essay.status === "analyzing"
                          ? { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }
                          : essay.status === "failed"
                            ? { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }
                            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }
                    }
                  >
                    {essay.status}
                  </span>
                </div>
              </Link>
              </StaggerItem>
            ))}
          </StaggerChildren>
        )}
      </div>
    </div>
  );
}
