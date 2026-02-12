import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  GraduationCap,
  ArrowRight,
  FileText,
  Clock,
  LogOut,
  School,
} from "lucide-react";

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
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Optimize Teacher
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-300 flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Submit essays and view your feedback history.
            </p>
          </div>
          <Link
            href="/contribute"
            className="h-10 px-5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors"
          >
            <School className="w-4 h-4" /> Add School or Teacher
          </Link>
        </div>

        {recentEssays.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="w-14 h-14 bg-teal-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">No essays yet</h2>
            <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
              Submit your first essay to get teacher-specific feedback and a predicted grade.
            </p>
            <Link
              href="/analyze"
              className="mt-6 h-10 px-6 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              Analyze Essay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEssays.map((essay) => (
              <Link
                key={essay.id}
                href={essay.status === "completed" ? `/results/${essay.id}` : "#"}
                className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-teal-700 hover:bg-teal-900/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {essay.prompt}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {essay.teachers && (
                        <span>{(essay.teachers as { name: string }).name}</span>
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
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      essay.status === "completed"
                        ? "bg-emerald-950 text-emerald-400"
                        : essay.status === "analyzing"
                          ? "bg-amber-950 text-amber-400"
                          : essay.status === "failed"
                            ? "bg-red-950 text-red-400"
                            : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {essay.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
