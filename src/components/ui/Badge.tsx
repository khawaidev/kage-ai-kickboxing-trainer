import { cn } from '@/lib/utils/cn'

type Tone = 'neutral' | 'seal' | 'sage' | 'amber' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  tone?: Tone
  className?: string
  icon?: React.ReactNode
}

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink/5 text-ink/70 border-ink/10',
  seal: 'bg-seal/10 text-seal-deep border-seal/25',
  sage: 'bg-sage/15 text-sage-deep border-sage/30',
  amber: 'bg-amber-400/20 text-amber-700 border-amber-500/30',
  muted: 'bg-ink/5 text-muted border-ink/10',
}

export function Badge({ children, tone = 'neutral', className, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
