import { cn } from '@/lib/utils/cn'

interface InkBackdropProps {
  className?: string
  /** 'dark' sits on ink surfaces, 'paper' on light surfaces. */
  tone?: 'dark' | 'paper'
  /** Which corner the mist mass gathers in. */
  origin?: 'top' | 'bottom' | 'left' | 'right'
  opacity?: number
}

const ORIGIN_TRANSFORM: Record<NonNullable<InkBackdropProps['origin']>, string> = {
  top: 'translate(0, -18%)',
  bottom: 'translate(0, 18%)',
  left: 'translate(-14%, 0)',
  right: 'translate(14%, 0)',
}

/**
 * Atmospheric ink-wash mountains and mist. Purely decorative: it must never
 * sit over important text or controls (design.md §2.1).
 */
export function InkBackdrop({
  className,
  tone = 'paper',
  origin = 'bottom',
  opacity = 0.5,
}: InkBackdropProps) {
  const stroke = tone === 'dark' ? '#F4F0E7' : '#171717'
  const wash = tone === 'dark' ? '#F4F0E7' : '#171717'

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none select-none', className)}
      style={{ opacity }}
    >
      <defs>
        <linearGradient id={`mist-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wash} stopOpacity="0.28" />
          <stop offset="100%" stopColor={wash} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`ridge-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wash} stopOpacity="0.34" />
          <stop offset="100%" stopColor={wash} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <g transform={ORIGIN_TRANSFORM[origin]}>
        <path
          d="M-20 330 C 60 250, 110 210, 160 260 C 196 296, 210 300, 250 250 C 300 186, 350 220, 420 300 L 420 420 L -20 420 Z"
          fill={`url(#ridge-${tone})`}
        />
        <path
          d="M-20 360 C 50 320, 120 300, 180 330 C 240 360, 300 320, 420 350 L 420 420 L -20 420 Z"
          fill={`url(#mist-${tone})`}
        />
        <path
          d="M40 300 C 90 250, 140 256, 180 292"
          fill="none"
          stroke={stroke}
          strokeOpacity="0.25"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M230 250 C 280 214, 320 226, 360 266"
          fill="none"
          stroke={stroke}
          strokeOpacity="0.2"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
