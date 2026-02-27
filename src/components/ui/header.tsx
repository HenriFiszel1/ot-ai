'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features',     href: '#features' },
  { label: 'Pricing',      href: '#pricing' },
]

export function Header() {
  const [open, setOpen] = React.useState(false)
  const scrolled = useScroll(12)

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-night/90 border-b border-border-subtle backdrop-blur-xl shadow-card'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* O-ring logomark (inline SVG) */}
          <div className="relative flex h-8 w-8 items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" className="h-8 w-8">
              {/* Blue rounded square background */}
              <rect width="32" height="32" rx="8" fill="#316FF0"/>
              {/* O-ring with arrow */}
              <path
                d="M16 7.5a8.5 8.5 0 1 0 6.01 2.49"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M19.5 7l3.5 3-3.5 3"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-display font-bold text-lg text-warm-white tracking-tight">
            Optimize <span className="text-sky">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-muted-blue hover:text-warm-white rounded-full transition-colors hover:bg-surface"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden flex items-center justify-center h-10 w-10 rounded-full border border-border-subtle text-muted-blue hover:text-warm-white hover:bg-surface transition-all"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-night/95 backdrop-blur-xl border-t border-border-subtle flex flex-col p-6 gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-base font-medium text-muted-blue hover:text-warm-white hover:bg-surface rounded-lg transition-all"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-border-subtle">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button className="w-full" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
