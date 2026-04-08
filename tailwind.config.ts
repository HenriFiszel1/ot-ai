import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Colors ──────────────────────────────────────────────────────────
      colors: {
        // Brand
        'optimize-blue': '#316FF0',
        'sky':           '#6398FF',
        'pale-blue':     '#B4CDFF',

        // Backgrounds
        'night':         '#0B0A14',
        'deep-navy':     '#12162C',
        'surface':       '#181C35',
        'surface-raised':'#1E2340',

        // Text
        'warm-white':    '#F2F2FF',
        'muted-blue':    'rgba(180, 205, 255, 0.5)',

        // Borders
        'border-subtle': 'rgba(99, 152, 255, 0.12)',
        'border-strong': 'rgba(99, 152, 255, 0.24)',

        // Semantic aliases (used by shadcn components)
        background:  '#0B0A14',
        foreground:  '#F2F2FF',
        primary: {
          DEFAULT:    '#316FF0',
          foreground: '#F2F2FF',
        },
        secondary: {
          DEFAULT:    '#181C35',
          foreground: '#F2F2FF',
        },
        accent: {
          DEFAULT:    '#6398FF',
          foreground: '#F2F2FF',
        },
        muted: {
          DEFAULT:    '#12162C',
          foreground: 'rgba(180, 205, 255, 0.5)',
        },
        card: {
          DEFAULT:    '#12162C',
          foreground: '#F2F2FF',
        },
        border:      'rgba(99, 152, 255, 0.12)',
        input:       'rgba(99, 152, 255, 0.12)',
        ring:        '#316FF0',
        destructive: {
          DEFAULT:    '#ef4444',
          foreground: '#F2F2FF',
        },
      },

      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans:  ['var(--font-geist-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono:  ['var(--font-geist-mono)', 'monospace'],
      },

      fontSize: {
        'display-xl': ['clamp(3rem, 7vw, 5.5rem)', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.5rem, 5.5vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.875rem, 3.5vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'display-sm': ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'label':      ['0.75rem', { lineHeight: '1', letterSpacing: '0.08em' }],
      },

      // ── Border Radius ────────────────────────────────────────────────────
      borderRadius: {
        'sm':   '6px',
        'md':   '10px',
        'DEFAULT': '10px',
        'lg':   '16px',
        'xl':   '24px',
        '2xl':  '32px',
        'full': '9999px',
      },

      // ── Box Shadows ──────────────────────────────────────────────────────
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,152,255,0.12)',
        'elevated':  '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,152,255,0.24)',
        'glow':      '0 0 40px rgba(49,111,240,0.2)',
        'glow-sm':   '0 0 16px rgba(49,111,240,0.15)',
        'inner-glow':'inset 0 0 24px rgba(49,111,240,0.06)',
      },

      // ── Background Images ────────────────────────────────────────────────
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(99,152,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,152,255,0.04) 1px, transparent 1px)',
        'spotlight':
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(49,111,240,0.18), transparent)',
        'card-shine':
          'linear-gradient(135deg, rgba(99,152,255,0.08) 0%, transparent 50%)',
        'blue-gradient':
          'linear-gradient(135deg, #316FF0, #6398FF)',
        'text-gradient':
          'linear-gradient(135deg, #F2F2FF 0%, #B4CDFF 100%)',
      },

      // ── Background Size ──────────────────────────────────────────────────
      backgroundSize: {
        'grid': '48px 48px',
      },

      // ── Animations ───────────────────────────────────────────────────────
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(49,111,240,0)' },
          '50%':       { boxShadow: '0 0 0 6px rgba(49,111,240,0.15)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fade-in 0.4s ease both',
        'shimmer':    'shimmer 1.5s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },

      // ── Spacing extras ───────────────────────────────────────────────────
      maxWidth: {
        'content': '1120px',
      },
    },
  },
  plugins: [],
}

export default config
