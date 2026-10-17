import { ThumbsDown, ThumbsUp, Play } from 'lucide-react'
import type { Finding } from '@/lib/types'
import { labelize } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConfidenceBadge, ValidationBadge } from '@/components/ui/Indicators'
import { useSessionStore } from '@/lib/stores/session'
import { analytics } from '@/lib/services/analytics'
import { formatTimestamp } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

interface FindingCardProps {
  finding: Finding
  index: number
  onSeek: (seconds: number) => void
  tone?: 'correction' | 'strength'
}

export function FindingCard({ finding, index, onSeek, tone = 'correction' }: FindingCardProps) {
  const feedback = useSessionStore((s) => s.feedback[finding.finding_id])
  const setFeedback = useSessionStore((s) => s.setFeedback)

  return (
    <Card className={cn('space-y-3', tone === 'strength' && 'border-sage/25')}>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-sm font-bold',
            tone === 'strength' ? 'bg-sage/20 text-sage-soft' : 'bg-seal/20 text-seal-soft',
          )}
        >
          {tone === 'strength' ? '✓' : index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{labelize(finding.category)}</Badge>
            <ConfidenceBadge confidence={finding.confidence} />
            <ValidationBadge status={finding.validation_status} />
          </div>
          <p className="text-sm font-medium text-ink">{finding.observation}</p>
        </div>
      </div>

      <p className="rounded-xl bg-ink/5 p-3 text-sm text-ink/80">
        <span className="font-semibold text-ink">Correction: </span>
        {finding.correction}
      </p>

      <p className="text-xs text-muted">
        <span className="font-semibold">Limitation: </span>
        {finding.limitations}
      </p>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => onSeek(finding.evidence_start_seconds)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-seal/40 bg-seal/10 px-2.5 py-1.5 text-xs font-semibold text-seal-soft hover:bg-seal/20 focus-ring"
        >
          <Play size={12} /> Replay {formatTimestamp(finding.evidence_start_seconds)}–
          {formatTimestamp(finding.evidence_end_seconds)}
        </button>
        <div className="flex gap-1">
          <FeedbackButton
            active={feedback === 'useful'}
            onClick={() => {
              setFeedback(finding.finding_id, 'useful')
              analytics.track('report_feedback_submitted', { value: 'useful' })
            }}
            label="Useful"
          >
            <ThumbsUp size={14} />
          </FeedbackButton>
          <FeedbackButton
            active={feedback === 'incorrect'}
            onClick={() => {
              setFeedback(finding.finding_id, 'incorrect')
              analytics.track('report_feedback_submitted', { value: 'incorrect' })
            }}
            label="Incorrect"
          >
            <ThumbsDown size={14} />
          </FeedbackButton>
        </div>
      </div>
    </Card>
  )
}

function FeedbackButton({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg border transition-colors focus-ring',
        active
          ? 'border-sage/50 bg-sage/20 text-sage-soft'
          : 'border-ink/10 bg-ink/5 text-ink/50 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
