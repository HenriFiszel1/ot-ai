import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  GraduationCap,
  ArrowLeft,
  FileText,
  Star,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  MessageSquare,
  Target,
  Eye,
  PenLine,
} from "lucide-react";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: essayId } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all data in parallel
  const [essayRes, gradeRes, commentsRes, endCommentRes] = await Promise.all([
    supabase
      .from("essays")
      .select("*, teachers(name), schools(name)")
      .eq("id", essayId)
      .single(),
    supabase
      .from("grade_predictions")
      .select("*")
      .eq("essay_id", essayId)
      .single(),
    supabase
      .from("inline_comments")
      .select("*")
      .eq("essay_id", essayId)
      .order("display_order"),
    supabase
      .from("end_comments")
      .select("*")
      .eq("essay_id", essayId)
      .single(),
  ]);

  const essay = essayRes.data;
  const grade = gradeRes.data;
  const comments = commentsRes.data || [];
  const endComment = endCommentRes.data;

  if (!essay) notFound();

  const teacherName =
    (essay.teachers as { name: string } | null)?.name || "Unknown Teacher";
  const schoolName =
    (essay.schools as { name: string } | null)?.name || "Unknown School";

  // Count severities
  const severityCounts = { praise: 0, suggestion: 0, concern: 0 };
  comments.forEach((c) => {
    if (c.severity in severityCounts)
      severityCounts[c.severity as keyof typeof severityCounts]++;
  });

  const confidenceColors: Record<string, string> = {
    high: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-red-50 text-red-700",
  };

  const severityStyles: Record<
    string,
    { bg: string; border: string; text: string; label: string }
  > = {
    praise: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      text: "text-emerald-800",
      label: "Strength",
    },
    suggestion: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      text: "text-amber-800",
      label: "Suggestion",
    },
    concern: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-800",
      label: "Needs Work",
    },
  };

  const SeverityIcon = ({
    severity,
    className,
  }: {
    severity: string;
    className?: string;
  }) => {
    if (severity === "praise")
      return <Star className={className || "w-4 h-4"} />;
    if (severity === "suggestion")
      return <Lightbulb className={className || "w-4 h-4"} />;
    return <AlertTriangle className={className || "w-4 h-4"} />;
  };

  // Render essay paragraphs
  const paragraphs: string[] = essay.essay_text.split("\n\n").filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Optimize Teacher
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Grade Header */}
        {grade && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white">
                    {grade.letter_grade}
                  </div>
                  <div className="text-lg text-gray-400 mt-1">
                    {grade.numeric_grade}/100
                  </div>
                </div>
                <div className="w-px h-16 bg-gray-200 hidden lg:block" />
                <div>
                  <div className="text-sm text-gray-400">
                    Predicted grade from{" "}
                    <span className="font-medium text-gray-300">
                      {teacherName}
                    </span>{" "}
                    at {schoolName}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        confidenceColors[grade.confidence] || ""
                      }`}
                    >
                      {grade.confidence} confidence
                    </span>
                    <span className="text-xs text-gray-400">
                      {comments.length} comments
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <Star className="w-4 h-4" /> {severityCounts.praise}{" "}
                  strengths
                </div>
                <div className="flex items-center gap-1.5 text-amber-600">
                  <Lightbulb className="w-4 h-4" />{" "}
                  {severityCounts.suggestion} suggestions
                </div>
                <div className="flex items-center gap-1.5 text-red-600">
                  <AlertTriangle className="w-4 h-4" />{" "}
                  {severityCounts.concern} concerns
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Essay Panel */}
          <div className="lg:col-span-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> Your Essay
                </h2>
                <span className="text-xs text-gray-400">
                  {essay.word_count || "—"} words
                </span>
              </div>
              <div className="p-5">
                {paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className="mb-4 text-sm leading-[1.8] text-gray-300"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Comments */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5 mb-3">
                <MessageSquare className="w-4 h-4" /> Inline Comments
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {comments.map((comment) => {
                  const style = severityStyles[comment.severity] || severityStyles.suggestion;
                  return (
                    <div
                      key={comment.id}
                      className={`rounded-lg p-3 border ${style.bg} ${style.border}`}
                    >
                      <div className="flex items-start gap-2">
                        <SeverityIcon
                          severity={comment.severity}
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.text}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1">
                            <span
                              className={`text-[10px] px-1.5 py-0 font-medium ${style.text}`}
                            >
                              {style.label} — {comment.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {comment.comment_text}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1.5 italic truncate">
                            &ldquo;
                            {comment.excerpt?.slice(0, 60)}
                            ...&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* End Comment */}
            {endComment && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5 mb-2">
                  <Eye className="w-4 h-4 text-gray-400" /> End Comment
                </h3>
                {endComment.comment_text.split("\n\n").map((p: string, i: number) => (
                  <p
                    key={i}
                    className="text-xs text-gray-400 leading-relaxed mb-2"
                  >
                    {p}
                  </p>
                ))}
              </div>
            )}

            {/* Grade Reasoning */}
            {grade && (
              <>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Grade Reasoning
                  </h3>
                  <div className="space-y-2">
                    {grade.reasoning?.map((r: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-gray-400"
                      >
                        <span className="w-4 h-4 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5 mb-2">
                    <Star className="w-4 h-4" /> Strengths
                  </h3>
                  {grade.strengths?.map((s: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-emerald-700 mb-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{s}</span>
                    </div>
                  ))}
                </div>

                {/* Weaknesses */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Areas for Improvement
                  </h3>
                  {grade.weaknesses?.map((w: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-amber-700 mb-1.5"
                    >
                      <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{w}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Next Steps */}
            {endComment?.next_steps?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-3">
                  <Target className="w-4 h-4 text-teal-400" /> Revision
                  Priorities
                </h3>
                <div className="space-y-2">
                  {endComment.next_steps.map((step: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-2.5 bg-gray-900 rounded-lg"
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i === 0
                            ? "bg-teal-100 text-teal-400"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href="/analyze"
                className="w-full h-10 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <PenLine className="w-4 h-4" /> Submit a Revised Essay
              </Link>
              <Link
                href="/dashboard"
                className="w-full h-10 border border-gray-700 hover:bg-gray-900 text-gray-300 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
