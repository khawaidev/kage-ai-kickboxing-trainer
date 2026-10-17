import { useMemo } from 'react'
import { format } from 'date-fns'
import { Activity, Clock, Repeat, TrendingUp } from 'lucide-react'
import { useSessionStore } from '@/lib/stores/session'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { Progress } from '@/components/ui/Progress'
import { formatDuration } from '@/lib/utils/format'
import { labelize } from '@/lib/types'

export function ProgressPage() {
  const sessions = useSessionStore((s) => s.sessions)
  const reports = useSessionStore((s) => s.reports)

  const stats = useMemo(() => {
    const totalSeconds = sessions.reduce((a, s) => a + s.duration_seconds, 0)
    const last = sessions.slice(0, 7).reverse()
    const max = Math.max(1, ...last.map((s) => s.duration_seconds))
    return { totalSeconds, last, max }
  }, [sessions])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of Object.values(reports)) {
      for (const c of r.corrections) {
        counts[c.category] = (counts[c.category] ?? 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [reports])

  const reportCount = Object.keys(reports).length
  const maxCount = Math.max(1, ...categoryCounts.map(([, n]) => n))

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Progress" subtitle="Measured only where the evidence supports it." />

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Activity size={14} />} label="Sessions" value={String(sessions.length)} />
        <Stat icon={<Clock size={14} />} label="Total time" value={formatDuration(stats.totalSeconds)} />
        <Stat icon={<Repeat size={14} />} label="Reports" value={String(reportCount)} />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink/80">Recent session length</h2>
        <Card>
          {stats.last.length === 0 ? (
            <p className="text-sm text-muted">No sessions to show yet.</p>
          ) : (
            <div className="flex h-32 items-end gap-2">
              {stats.last.map((s) => {
                const h = Math.max(6, (s.duration_seconds / stats.max) * 100)
                return (
                  <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-seal/40 to-seal"
                      style={{ height: `${h}%` }}
                      title={`${formatDuration(s.duration_seconds)} · ${format(new Date(s.started_at), 'd MMM')}`}
                    />
                    <span className="text-[10px] text-muted">
                      {format(new Date(s.started_at), 'd')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink/80">
          <TrendingUp size={14} className="text-sage-deep" /> Recurring observations
        </h2>
        <Card className="space-y-3">
          {categoryCounts.length === 0 ? (
            <p className="text-sm text-muted">
              Complete an analysis to start tracking recurring technique observations.
            </p>
          ) : (
            categoryCounts.map(([cat, count]) => (
              <div key={cat}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink/85">{labelize(cat)}</span>
                  <span className="text-muted">
                    {count} report{count > 1 ? 's' : ''}
                  </span>
                </div>
                <Progress value={count / maxCount} tone={count > 1 ? 'seal' : 'sage'} />
              </div>
            ))
          )}
        </Card>
        <p className="mt-2 text-xs text-muted">
          Improvement is shown through repeated real observations across comparable recordings —
          never through changing model scores.
        </p>
      </section>

      {categoryCounts.some(([, n]) => n > 1) && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {categoryCounts
            .filter(([, n]) => n > 1)
            .map(([cat]) => (
              <Badge key={cat} tone="amber">
                Focus: {labelize(cat)}
              </Badge>
            ))}
        </div>
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Card className="flex flex-col gap-1 p-3">
      <span className="flex items-center gap-1.5 text-[11px] text-muted">
        {icon} {label}
      </span>
      <span className="font-display text-lg font-bold">{value}</span>
    </Card>
  )
}
