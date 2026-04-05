import Link from "next/link";
import Image from "next/image";
import {
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
  CheckCircle,
  Star,
} from "lucide-react";
import { LogoCloud } from "@/components/ui/logo-cloud";
import { AuthRedirect } from "@/components/AuthRedirect";

const trustedLogos = [
  { src: "https://storage.efferd.com/logo/openai-wordmark.svg", alt: "OpenAI" },
  { src: "https://storage.efferd.com/logo/supabase-wordmark.svg", alt: "Supabase" },
  { src: "https://storage.efferd.com/logo/vercel-wordmark.svg", alt: "Vercel" },
  { src: "https://storage.efferd.com/logo/github-wordmark.svg", alt: "GitHub" },
  { src: "https://storage.efferd.com/logo/claude-wordmark.svg", alt: "Claude AI" },
  { src: "https://storage.efferd.com/logo/nvidia-wordmark.svg", alt: "Nvidia" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#141414' }}>
      <AuthRedirect />
      {/* Nav */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/optimize-ai-logo.png"
              alt="Optimize AI"
              width={140}
              height={36}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-semibold rounded-lg flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{ background: '#F2F2FF', color: '#141414' }}
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Now in Beta — Free for early users
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-[-0.03em] leading-[1.05]" style={{ color: '#F2F2FF' }}>
            Predict your grade
            <br />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
              before it matters.
            </span>
          </h1>

          <p className="mt-6 text-lg max-w-2xl mx-auto leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Get teacher-specific essay feedback with a predicted grade — trained
            on your teacher&apos;s actual grading patterns, comment style, and
            rubric emphasis.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="h-12 px-8 text-base font-semibold rounded-lg inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
              style={{ background: '#F2F2FF', color: '#141414' }}
            >
              Start analyzing free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="h-12 px-8 text-base font-medium rounded-lg inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              See how it works
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: '#34d399' }} /> Privacy-first
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: '#fbbf24' }} /> Results in ~30s
            </span>
            <span className="flex items-center gap-2">
              <School className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} /> 50+ schools
            </span>
          </div>
        </div>
      </section>

      {/* Trusted By — Animated Logo Cloud */}
      <section className="px-6 pb-12 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-center text-sm font-medium tracking-wide mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Powered by technology from
        </h2>
        <div className="max-w-4xl mx-auto">
          <LogoCloud logos={trustedLogos} />
        </div>
      </section>

      {/* Demo Preview */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
              <span className="ml-4 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                optimizeai.app/results
              </span>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left - Essay with comments */}
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Your Essay
                </div>
                <div className="rounded-xl p-5 text-sm leading-[1.7] font-serif relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                    The Great Gatsby, written by F. Scott Fitzgerald, is often
                    celebrated as{" "}
                  </span>
                  <span className="px-0.5 rounded" style={{ background: 'rgba(99,152,255,0.15)', color: '#6398FF' }}>
                    a quintessential American novel
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                    , one that captures the spirit of the Jazz Age and the
                    disillusionment of the American Dream...
                  </span>
                </div>

                <div className="rounded-xl p-4 text-sm" style={{ borderLeft: '3px solid #fbbf24', background: 'rgba(255,255,255,0.02)' }}>
                  <div className="font-semibold text-xs mb-1.5 tracking-wide" style={{ color: '#fbbf24' }}>
                    Dr. Chen&apos;s Feedback
                  </div>
                  <p className="leading-relaxed font-serif italic" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    &ldquo;Solid opening, but this reads a bit like a book report
                    intro. Lead with your argument — what are you actually
                    claiming about Gatsby?&rdquo;
                  </p>
                </div>
              </div>

              {/* Right - Grade prediction */}
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-[0.15em] font-semibold" style={{ color: '#34d399' }}>
                  Predicted Grade
                </div>
                <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-end gap-3 mb-5">
                    <span className="text-6xl font-extrabold tracking-tight" style={{ color: '#F2F2FF' }}>
                      A-
                    </span>
                    <span className="text-2xl mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      91/100
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                      87% Confidence
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Dr. Sarah Chen
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-32 font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Argument strength</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: '88%', background: '#F2F2FF' }} />
                      </div>
                      <span className="text-xs w-8 text-right font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>88</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-32 font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Use of evidence</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: '91%', background: '#F2F2FF' }} />
                      </div>
                      <span className="text-xs w-8 text-right font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>91</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs w-32 font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Writing clarity</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: '78%', background: 'rgba(255,255,255,0.5)' }} />
                      </div>
                      <span className="text-xs w-8 text-right font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>78</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em]" style={{ color: '#F2F2FF' }}>
              Not just another essay checker.
            </h2>
            <p className="mt-4 text-lg max-w-xl mx-auto leading-[1.7]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Generic tools give generic advice. We model your specific
              teacher&apos;s grading behavior.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl transition-all duration-200" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Brain className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <h3 className="text-base font-semibold mb-2 tracking-tight" style={{ color: '#F2F2FF' }}>Teacher-Modeled Feedback</h3>
              <p className="text-sm leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>We learn from your teacher&apos;s past comments, rubric emphasis, and grading patterns.</p>
            </div>

            <div className="p-6 rounded-2xl transition-all duration-200" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Target className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <h3 className="text-base font-semibold mb-2 tracking-tight" style={{ color: '#F2F2FF' }}>Grade Prediction</h3>
              <p className="text-sm leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>Predicted letter grade and numeric score with confidence levels.</p>
            </div>

            <div className="p-6 rounded-2xl transition-all duration-200" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <MessageSquare className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <h3 className="text-base font-semibold mb-2 tracking-tight" style={{ color: '#F2F2FF' }}>Doc-Style Comments</h3>
              <p className="text-sm leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>Line-by-line feedback anchored to specific excerpts in your essay.</p>
            </div>

            <div className="p-6 rounded-2xl transition-all duration-200" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <School className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <h3 className="text-base font-semibold mb-2 tracking-tight" style={{ color: '#F2F2FF' }}>School-Aware</h3>
              <p className="text-sm leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>Different schools have different standards. Our system understands yours.</p>
            </div>

            <div className="p-6 rounded-2xl transition-all duration-200" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <TrendingUp className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <h3 className="text-base font-semibold mb-2 tracking-tight" style={{ color: '#F2F2FF' }}>Improves Over Time</h3>
              <p className="text-sm leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>Every essay makes the model more accurate. The more students use it, the better.</p>
            </div>

            <div className="p-6 rounded-2xl transition-all duration-200" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <Zap className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </div>
              <h3 className="text-base font-semibold mb-2 tracking-tight" style={{ color: '#F2F2FF' }}>Instant Turnaround</h3>
              <p className="text-sm leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>Detailed, teacher-specific feedback in about 30 seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em]" style={{ color: '#F2F2FF' }}>
              Three steps. Real feedback.
            </h2>
            <p className="mt-4 text-lg max-w-lg mx-auto leading-[1.7]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              From essay to grade prediction in under a minute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: '#F2F2FF', color: '#141414' }}>
                  1
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Step</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 tracking-tight" style={{ color: '#F2F2FF' }}>Pick your school & teacher</h3>
              <p className="text-sm leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>Select from our growing database. Each teacher profile is built from real grading data.</p>
            </div>

            <div className="p-6 rounded-2xl" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: '#F2F2FF', color: '#141414' }}>
                  2
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Step</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 tracking-tight" style={{ color: '#F2F2FF' }}>Paste your essay</h3>
              <p className="text-sm leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>Drop in your essay text or import from Google Docs, along with the prompt.</p>
            </div>

            <div className="p-6 rounded-2xl" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: '#F2F2FF', color: '#141414' }}>
                  3
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Step</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 tracking-tight" style={{ color: '#F2F2FF' }}>Get your results</h3>
              <p className="text-sm leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>Predicted grade with doc-style comments, tailored to your specific teacher.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: '#F2F2FF' }}>50+</div>
              <div className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Schools</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: '#F2F2FF' }}>200+</div>
              <div className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Teacher Profiles</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: '#F2F2FF' }}>~30s</div>
              <div className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Avg. Turnaround</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center justify-center gap-1" style={{ color: '#F2F2FF' }}>
                4.8
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Student Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl p-12 sm:p-16 text-center" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.02em]" style={{ color: '#F2F2FF' }}>
              Ready to optimize your next essay?
            </h2>
            <p className="mt-4 text-lg max-w-md mx-auto leading-[1.7]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Join students getting smarter, teacher-specific feedback before
              they submit.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="h-12 px-8 text-base font-semibold rounded-lg inline-flex items-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: '#F2F2FF', color: '#141414' }}
              >
                Start for free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-5 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /> Free during beta
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/optimize-ai-logo.png"
              alt="Optimize AI"
              width={120}
              height={30}
              className="h-6 w-auto opacity-40"
            />
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <Link href="/login" className="transition-opacity hover:opacity-80">
              Log in
            </Link>
            <Link href="/signup" className="transition-opacity hover:opacity-80">
              Sign up
            </Link>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            &copy; 2026 Optimize AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
