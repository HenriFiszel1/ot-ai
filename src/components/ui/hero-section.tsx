import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background: grid + spotlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-spotlight"
      />
      {/* Faint side columns */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-border-subtle to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-border-subtle to-transparent" />

      <div className="relative mx-auto max-w-content px-6 pt-24 pb-32 flex flex-col items-center text-center">

        {/* Pill badge */}
        <div className="animate-fade-up mb-8">
          <span className="badge">
            <Sparkles size={11} />
            AI-powered grade prediction
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100 font-display font-extrabold text-display-xl text-warm-white text-glow max-w-4xl mb-6">
          Know your grade{' '}
          <span className="text-optimize-blue">before</span> you submit
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up delay-200 font-sans text-lg text-muted-blue max-w-xl mb-10 leading-relaxed">
          Optimize AI learns exactly how your teacher grades — then gives you
          line-by-line feedback in their voice, so you can improve before it counts.
        </p>

        {/* CTA row */}
        <div className="animate-fade-up delay-300 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">
              Get started free
              <ArrowRight size={16} />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>

        {/* Social proof */}
        <p className="animate-fade-up delay-400 mt-10 text-sm text-muted-blue">
          Used by students at <span className="text-warm-white font-medium">200+</span> schools
        </p>

        {/* Mock UI preview */}
        <div className="animate-fade-up delay-500 mt-20 w-full max-w-3xl">
          <GradePreviewCard />
        </div>
      </div>
    </section>
  )
}

function GradePreviewCard() {
  return (
    <div className="card shadow-elevated overflow-hidden text-left">
      {/* Card header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
        <div>
          <p className="label mb-1">Your predicted grade</p>
          <div className="flex items-end gap-3">
            <span className="grade-display">A−</span>
            <span className="text-sm text-sky font-medium mb-1">91% confident</span>
          </div>
          <p className="text-xs text-muted-blue mt-1">Mr. Harrison · AP English Language</p>
        </div>
        <div className="hidden sm:block">
          <div className="card-raised px-4 py-3 min-w-[160px]">
            <p className="label mb-3">Rubric breakdown</p>
            {[
              { label: 'Argument strength', score: 88 },
              { label: 'Use of evidence',   score: 91 },
              { label: 'Writing clarity',   score: 79 },
            ].map(({ label, score }) => (
              <div key={label} className="mb-2.5 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-blue">{label}</span>
                  <span className="text-warm-white font-semibold">{score}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teacher voice callout */}
      <div>
        <p className="label mb-3">From your teacher</p>
        <blockquote className="editorial text-lg text-warm-white leading-relaxed mb-3">
          "Your thesis is strong, but needs a clearer scope statement."
        </blockquote>
        <span className="annotation">
          ← Paragraph 1, Line 3
        </span>
      </div>
    </div>
  )
}
