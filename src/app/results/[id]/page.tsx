import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
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
import { AnimateIn } from "@/components/ui/motion";
import { ReportActualGrade } from "./ReportActualGrade";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: essayId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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

  const severityCounts = { praise: 0, suggestion: 0, concern: 0 };
  comments.forEach((c) => {
    if (c.severity in severityCounts)
      severityCounts[c.severity as keyof typeof severityCounts]++;
  });

  const confidenceColors: Record<string, string> = {
    high: "bg-emerald-500/10 text-emerald-400",
    medium: "bg-amber-500/10 text-amber-400",
    low: "bg-red-500/10 text-red-400",
  };

  const severityStyles: Record<
    string,
    { bg: string; border: string; text: string; label: string }
  > = {
    praise: {
      bg: "bg-emerald-500/[0.07]",
      border: "border-emerald-500/15",
      text: "text-emerald-400",
      label: "Strength",
    },
    suggestion: {
      bg: "bg-amber-500/[0.07]",
      border: "border-amber-500/15",
      text: "text-amber-400",
      label: "Suggestion",
    },
    concern: {
      bg: "bg-red-500/[0.07]",
      border: "border-red-500/15",
      text: "text-red-400",
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

  const paragraphs: string[] = essay.essay_text.split("\n\n").filter(Boolean);

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <header className="bg-navy-800/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/optimize-ai-logo.png" alt="Optimize AI" width={130} height={32} className="h-8 w-auto" />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-300 hover:text-gray-300 flex items-center gap-1.5 transition-colors duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Grade Header */}
        {grade && (
          <AnimateIn><div className="bg-navy-800 border border-white/[0.06] rounded-2xl p-7 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-white font-display tracking-tight">
                    {grade.letter_grade}
                  </div>
                  <div className="text-lg text-gray-300 mt-1 font-display">
                    {grade.numeric_grade}/100
                  </div>
                </div>
                <div className="w-px h-16 bg-white/[0.06] hidden lg:block" />
                <div>
                  <div className="text-sm text-gray-300">
                    Predicted grade from{" "}
                    <span className="font-medium text-gray-300">
                      {teacherName}
                    </span>{" "}
                    at {schoolName}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
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
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Star className="w-4 h-4" /> {severityCounts.praise} strengths
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Lightbulb className="w-4 h-4" /> {severityCounts.suggestion} suggestions
                </div>
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="w-4 h-4" /> {severityCounts.concern} concerns
                </div>
              </div>
            </div>
          </div></AnimateIn>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Essay Panel */}
          <AnimateIn delay={0.1} className="lg:col-span-3">
            <div className="bg-navy-800 border border-white/[0.06] rounded-2xl">
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2 font-display">
                  <FileText className="w-4 h-4 text-gray-400" /> Your Essay
                </h2>
                <span className="text-xs text-gray-400">
                  {essay.word_count || "—"} words
                </span>
              </div>
              <div className="p-6">
                {paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className="mb-4 text-sm leading-[1.8] text-gray-300 font-serif"
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* Sidebar */}
          <AnimateIn delay={0.2} className="lg:col-span-2 space-y-4">
            {/* Comments */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5 mb-3 font-display">
                <MessageSquare className="w-4 h-4 text-gray-400" /> Inline Comments
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {comments.map((comment) => {
                  const style = severityStyles[comment.severity] || severityStyles.suggestion;
                  return (
                    <div
                      key={comment.id}
                      className={`rounded-xl p-3.5 border ${style.bg} ${style.border}`}
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
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {comment.comment_text}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-1.5 italic font-serif truncate">
                            &ldquo;{comment.excerpt?.slice(0, 60)}...&rdquo;
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
              <div className="bg-navy-800 border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5 mb-3 font-display">
                  <Eye className="w-4 h-4 text-gray-400" /> End Comment
                </h3>
                {endComment.comment_text.split("\n\n").map((p: string, i: number) => (
                  <p key={i} className="text-xs text-gray-300 leading-relaxed mb-2 font-serif">
                    {p}
                  </p>
                ))}
              </div>
            )}

            {/* Grade Reasoning */}
            {grade && (
              <>
                <div className="bg-navy-800 border border-white/[0.06] rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 font-display">
                    Grade Reasoning
                  </h3>
                  <div className="space-y-2">
                    {grade.reasoning?.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="w-4 h-4 rounded-full bg-white/[0.04] text-gray-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths */}
                <div className="bg-emerald-500/[0.05] border border-emerald-500/15 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mb-3 font-display">
                    <Star className="w-4 h-4" /> Strengths
                  </h3>
                  {grade.strengths?.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-emerald-300/80 mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{s}</span>
                    </div>
                  ))}
                </div>

                {/* Weaknesses */}
                <div className="bg-amber-500/[0.05] border border-amber-500/15 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5 mb-3 font-display">
                    <AlertTriangle className="w-4 h-4" /> Areas for Improvement
                  </h3>
                  {grade.weaknesses?.map((w: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-300/80 mb-1.5">
                      <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{w}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Next Steps */}
            {endComment?.next_steps?.length > 0 && (
              <div className="bg-navy-800 border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5 mb-3 font-display">
                  <Target className="w-4 h-4 text-brand-400" /> Revision Priorities
                </h3>
                <div className="space-y-2">
                  {endComment.next_steps.map((step: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-navy-900/40 rounded-xl">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i === 0
                            ? "bg-brand-500/15 text-brand-400"
                            : "bg-white/[0.04] text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <p className="text-xs text-gray-300 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href="/analyze"
                className="w-full h-11 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 shadow-[0_0_20px_rgba(74,127,255,0.2)]"
              >
                <PenLine className="w-4 h-4" /> Submit a Revised Essay
              </Link>
              <Link
                href="/dashboard"
                className="w-full h-11 border border-white/[0.08] hover:bg-navy-800 text-gray-300 rounded-xl text-sm font-medium flex items-center justify-center transition-colors duration-200"
              >
                Back to Dashboard
              </Link>
              {grade && <ReportActualGrade predictionId={grade.id} />}
            </div>
          </AnimateIn>
        </div>
      </div>
    </div>
  );
}
