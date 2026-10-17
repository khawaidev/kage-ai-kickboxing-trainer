import { cn } from '@/lib/utils/cn'

interface SealProps {
  /** Character or short glyph rendered inside the seal. */
  glyph?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const SIZES: Record<NonNullable<SealProps['size']>, string> = {
  sm: 'h-8 w-8 text-base rounded-md',
  md: 'h-12 w-12 text-2xl rounded-lg',
  lg: 'h-16 w-16 text-3xl rounded-xl',
}

/**
 * Traditional seal-red stamp motif (design.md §2.1). Used sparingly as an
 * accent — roughly 10% of the visual balance.
 */
export function Seal({ glyph = '影', size = 'md', className, label }: SealProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      className={cn(
        'inline-grid place-items-center bg-seal text-paper-white font-brush leading-none shadow-seal',
        'ring-2 ring-seal-deep/60 ring-inset',
        SIZES[size],
        className,
      )}
    >
      {glyph}
    </span>
  )
}
