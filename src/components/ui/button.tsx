import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-sans font-semibold text-sm',
    'rounded-full border',
    'transition-all duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-optimize-blue focus-visible:ring-offset-2 focus-visible:ring-offset-night',
    'disabled:pointer-events-none disabled:opacity-40',
    'select-none whitespace-nowrap',
  ].join(' '),
  {
    variants: {
      variant: {
        // Primary — solid blue
        default: [
          'bg-optimize-blue border-optimize-blue text-warm-white',
          'hover:bg-blue-500 hover:border-blue-500',
          'shadow-glow-sm',
        ].join(' '),

        // Secondary — surface with border
        secondary: [
          'bg-surface border-border-subtle text-warm-white',
          'hover:bg-surface-raised hover:border-border-strong',
        ].join(' '),

        // Outline — transparent with border
        outline: [
          'bg-transparent border-border-strong text-warm-white',
          'hover:bg-surface hover:border-sky',
        ].join(' '),

        // Ghost — no border
        ghost: [
          'bg-transparent border-transparent text-muted-blue',
          'hover:bg-surface hover:text-warm-white',
        ].join(' '),

        // Blue ghost
        'ghost-blue': [
          'bg-transparent border-transparent text-sky',
          'hover:bg-surface hover:text-optimize-blue',
        ].join(' '),

        // Danger
        destructive: [
          'bg-red-600 border-red-600 text-white',
          'hover:bg-red-700',
        ].join(' '),
      },
      size: {
        sm:   'h-8  px-3.5 text-xs',
        default: 'h-10 px-5 text-sm',
        lg:   'h-12 px-7 text-base',
        xl:   'h-14 px-9 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
