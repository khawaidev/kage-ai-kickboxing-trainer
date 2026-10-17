import { cn } from '@/lib/utils/cn'
import type { Confidence, ValidationStatus } from '@/lib/types'
import { Badge } from './Badge'

const CONFIDENCE_TONE: Record<Confidence, 'sage' | 'amber' | 'muted'> = {
  high: 'sage',
  medium: 'amber',
  low: 'muted',
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <Badge tone={CONFIDENCE_TONE[confidence]}>
      {confidence === 'high'
        ? 'High confidence'
        : confidence === 'medium'
          ? 'Medium confidence'
          : 'Low confidence'}
    </Badge>
  )
}

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  const tone = status === 'supported' ? 'sage' : status === 'preliminary' ? 'amber' : 'muted'
  const label =
    status === 'supported'
      ? 'Supported'
      : status === 'preliminary'
        ? 'Preliminary'
        : 'Inconclusive'
  return <Badge tone={tone}>{label}</Badge>
}

interface LiveDotProps {
  className?: string
  tone?: 'seal' | 'sage' | 'amber' | 'muted'
  pulse?: boolean
}

const DOT_TONE = {
  seal: 'bg-seal',
  sage: 'bg-sage',
  amber: 'bg-amber-400',
  muted: 'bg-faint',
}

export function StatusDot({ tone = 'muted', pulse, className }: LiveDotProps) {
  return (
    <span className={cn('relative inline-flex h-2.5 w-2.5', className)}>
      {pulse && (
        <span
          className={cn('absolute inline-flex h-full w-full rounded-full opacity-60', DOT_TONE[tone], 'animate-ping')}
        />
      )}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', DOT_TONE[tone])} />
    </span>
  )
}
