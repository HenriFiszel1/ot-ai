import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  Shield,
  Clock,
  School,
  Brain,
  Target,
  MessageSquare,
  TrendingUp,
  Zap,
  Users,
  PenLine,
  Award,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Optimize Teacher
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-teal-700 hover:bg-teal-600 text-white rounded-lg flex items-center gap-1.5 transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-teal-950 text-teal-400 border border-teal-800 rounded-full px-3 py-1 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Now in Beta
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight leading-[1.1] max-w-3xl">
            Know your grade
            <br />
            <span className="text-teal-400">before you turn it in.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-400 max-w-2xl leading-relaxed">
            Get teacher-specific, school-specific essay feedback with a predicted
            grade. Trained on your teacher&apos;s actual grading patterns,
            comment style, and rubric emphasis.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/signup"
              className="h-12 px-8 text-base font-medium bg-teal-700 hover:bg-teal-600 text-white rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              Try it free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-8 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Privacy-first
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Results in ~30s
            </span>
            <span className="flex items-center gap-1.5">
              <School className="w-4 h-4" /> 50+ schools
            </span>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-gray-400 font-mono">
                optimizeteacher.ai/analyze
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Your Essay
                </div>
                <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 leading-relaxed font-mono relative">
                  <span className="text-gray-400">
                    The Great Gatsby, written by F. Scott Fitzgerald, is often
                    celebrated as{" "}
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 px-0.5">
                    a quintessential American novel
                  </span>
                  <span className="text-gray-400">
                    , one that captures the spirit of the Jazz Age...
                  </span>
                  <div className="absolute -right-2 top-4 w-1 h-8 bg-amber-500 rounded-full" />
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 border-l-2 border-amber-500 text-xs text-gray-400">
                  <div className="text-amber-400 font-medium mb-1">
                    Dr. Chen&apos;s comment:
                  </div>
                  Solid opening, but this reads a bit like a book report intro.
                  Lead with your argument.
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Predicted Grade
                </div>
                <div className="bg-gray-900 rounded-lg p-5">
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-5xl font-bold text-white">B+</span>
                    <span className="text-2xl text-gray-400 mb-1">88/100</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs px-2 py-0.5 bg-teal-9500/20 text-teal-400 rounded-full">
                      High Confidence
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full">
                      Dr. Sarah Chen
                    </span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Thesis clarity", pct: 72 },
                      { label: "Evidence use", pct: 85 },
                      { label: "Analysis depth", pct: 78 },
                      { label: "Writing style", pct: 91 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-24">
                          {item.label}
                        </span>
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-9500 rounded-full"
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8">
                          {item.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 bg-gray-900 border-y border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Not just another essay checker.
          </h2>
          <p className="mt-3 text-lg text-gray-400 max-w-xl">
            Generic tools give generic advice. We model your specific
            teacher&apos;s grading behavior.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Teacher-Modeled Feedback",
                desc: "We learn from your teacher's past comments, rubric emphasis, and grading patterns to generate feedback in their voice.",
              },
              {
                icon: Target,
                title: "Grade Prediction",
                desc: "Get a predicted letter grade and numeric score with confidence levels, based on how this teacher has historically graded similar essays.",
              },
              {
                icon: MessageSquare,
                title: "Doc-Style Comments",
                desc: "Line-by-line feedback anchored to specific excerpts — just like getting your essay back from your teacher in Google Docs.",
              },
              {
                icon: School,
                title: "School-Aware",
                desc: "Different schools have different standards. Our system understands your school's expectations, rubrics, and culture.",
              },
              {
                icon: TrendingUp,
                title: "Improves Over Time",
                desc: "Every essay, grade, and comment makes the model more accurate. The more students use it, the better it gets.",
              },
              {
                icon: Zap,
                title: "Instant Turnaround",
                desc: "Get detailed, teacher-specific feedback in about 30 seconds — not 2 weeks.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-teal-950 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="text-base font-semibold text-white">
                  {title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Three steps. Real feedback.
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                num: "01",
                title: "Pick your school & teacher",
                desc: "Select from our growing database. Each teacher profile is built from real grading data.",
                icon: Users,
              },
              {
                num: "02",
                title: "Paste your essay",
                desc: "Drop in your essay text along with the prompt, rubric, or assignment details.",
                icon: PenLine,
              },
              {
                num: "03",
                title: "Get your results",
                desc: "Predicted grade + Doc-style comments, tailored to how your teacher actually grades.",
                icon: Award,
              },
            ].map(({ num, title, desc, icon: Icon }) => (
              <div key={num} className="relative">
                <span className="text-6xl font-bold text-gray-800 absolute -top-6 -left-2">
                  {num}
                </span>
                <div className="relative pt-8 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-700 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 bg-teal-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Ready to optimize your next essay?
          </h2>
          <p className="mt-4 text-lg text-teal-100">
            Join thousands of students getting smarter, teacher-specific
            feedback.
          </p>
          <Link
            href="/signup"
            className="mt-8 h-12 px-8 text-base font-semibold bg-gray-900 text-teal-400 hover:bg-teal-950 rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            Start for free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-950">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-teal-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-400">
              Optimize Teacher AI
            </span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; 2026 Optimize Teacher AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
