import { cn } from '@/lib/utils/cn'

interface ProgressProps {
  value: number // 0..1
  className?: string
  tone?: 'seal' | 'sage' | 'paper'
}

export function Progress({ value, className, tone = 'seal' }: ProgressProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  const bar =
    tone === 'seal' ? 'bg-seal' : tone === 'sage' ? 'bg-sage' : 'bg-ink'
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink/10', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
