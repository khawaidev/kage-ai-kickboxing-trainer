import { cn } from '@/lib/utils/cn'

interface Option<T extends string> {
  value: T
  label: string
  hint?: string
  disabled?: boolean
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  columns?: number
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      role="radiogroup"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-3 text-center transition-colors focus-ring',
              active
                ? 'border-seal bg-seal/10 text-seal-deep'
                : 'border-ink/10 bg-paper-white text-ink/70 hover:border-ink/25',
              opt.disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            <span className="text-sm font-semibold">{opt.label}</span>
            {opt.hint && <span className="text-[11px] text-muted">{opt.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}
