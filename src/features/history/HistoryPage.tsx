import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronRight, Video } from 'lucide-react'
import { useSessionStore } from '@/lib/stores/session'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDuration } from '@/lib/utils/format'
import { labelize } from '@/lib/types'

const STATUS_TONE = {
  completed: 'sage',
  processing: 'amber',
  pending: 'amber',
  failed: 'seal',
  none: 'muted',
} as const

export function HistoryPage() {
  const sessions = useSessionStore((s) => s.sessions)

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Sessions" subtitle={`${sessions.length} recorded workouts`} />

      {sessions.length === 0 ? (
        <Card className="mt-4 text-center">
          <Video className="mx-auto text-muted" size={28} />
          <p className="mt-2 text-sm text-muted">No sessions yet.</p>
          <Link to="/configure">
            <Button className="mt-3" fullWidth>
              Start your first session
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const tone = STATUS_TONE[s.analysis_status] ?? 'muted'
            const target =
              s.analysis_status === 'completed'
                ? `/report/${s.id}`
                : s.recording_status === 'saved'
                  ? `/complete?session=${s.id}`
                  : null
            const content = (
              <Card className="flex items-center gap-3 transition-colors hover:border-ink/15">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink/5 font-display font-bold text-ink/80">
                  {labelize(s.config.sport).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {labelize(s.config.sport)} · {labelize(s.config.training_focus)}
                  </p>
                  <p className="text-xs text-muted">
                    {format(new Date(s.started_at), 'd MMM yyyy, HH:mm')} ·{' '}
                    {formatDuration(s.duration_seconds)}
                  </p>
                </div>
                <Badge tone={tone}>{labelize(s.analysis_status)}</Badge>
                {target && <ChevronRight size={16} className="text-muted" />}
              </Card>
            )
            return target ? (
              <Link key={s.id} to={target} className="block">
                {content}
              </Link>
            ) : (
              <div key={s.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
