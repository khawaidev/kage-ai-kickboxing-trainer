import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'ink' | 'paper' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-seal text-paper-white hover:bg-seal-deep active:bg-seal-deep shadow-seal',
  secondary:
    'bg-paper-white text-ink border border-ink/15 hover:border-ink/30 active:bg-ink/[0.03]',
  ghost: 'bg-transparent text-ink/70 hover:text-ink hover:bg-ink/5',
  ink: 'bg-ink text-paper hover:bg-ink-charcoal border border-ink',
  paper: 'bg-paper-white text-ink border border-ink/10 hover:bg-paper-deep',
  danger: 'bg-transparent text-seal border border-seal/40 hover:bg-seal/10',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
  xl: 'h-20 px-8 text-2xl rounded-3xl gap-3 font-bold tracking-wide',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', fullWidth, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors focus-ring',
        'disabled:cursor-not-allowed disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  )
})
