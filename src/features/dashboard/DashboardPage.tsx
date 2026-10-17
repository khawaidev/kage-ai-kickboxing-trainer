import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, isSameWeek, startOfWeek } from 'date-fns'
import { ArrowRight, Flame, Play, Sparkles, Target } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useSessionStore } from '@/lib/stores/session'
import { useSettingsStore } from '@/lib/stores/settings'
import { analytics } from '@/lib/services/analytics'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Seal } from '@/components/ui/Seal'
import { Badge } from '@/components/ui/Badge'
import { InkBackdrop } from '@/components/ui/InkBackdrop'
import { formatDuration } from '@/lib/utils/format'
import { labelize } from '@/lib/types'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const sessions = useSessionStore((s) => s.sessions)
  const reports = useSessionStore((s) => s.reports)
  const activeConfig = useSessionStore((s) => s.activeConfig)
  const usage = useSettingsStore((s) => s.usage)
  const subscription = useSettingsStore((s) => s.subscription)

  const latest = sessions[0]
  const latestReport = latest ? reports[latest.id] : undefined

  const { weekCount, weekSeconds } = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const inWeek = sessions.filter((s) =>
      isSameWeek(new Date(s.started_at), weekStart, { weekStartsOn: 1 }),
    )
    return {
      weekCount: inWeek.length,
      weekSeconds: inWeek.reduce((acc, s) => acc + s.duration_seconds, 0),
    }
  }, [sessions])

  return (
    <div className="relative">
      <InkBackdrop className="absolute -right-20 -top-10 h-64 w-64" origin="top" opacity={0.3} />

      <header className="relative mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">
            {format(new Date(), 'EEEE, d MMM')}
          </p>
          <h1 className="font-display text-2xl font-bold">
            Ready, {user?.display_name?.split(' ')[0] ?? 'fighter'}.
          </h1>
        </div>
        <Seal size="md" glyph="拳" label="KAGE" />
      </header>

      <Link to="/configure" onClick={() => analytics.track('workout_configured')}>
        <Card className="relative overflow-hidden border-seal/30 bg-gradient-to-br from-seal/25 to-paper-deep">
          <InkBackdrop className="absolute -bottom-6 -right-6 h-40 w-40" origin="right" opacity={0.5} />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-seal-deep">
                <Play size={15} /> Start Training
              </p>
              <p className="mt-1 font-display text-xl font-bold">
                {labelize(activeConfig.sport)} · {labelize(activeConfig.training_focus)}
              </p>
              <p className="mt-1 text-xs text-ink/60">
                {Math.round(activeConfig.duration_seconds / 60)} min ·{' '}
                {activeConfig.rounds} rounds · {labelize(activeConfig.coaching_frequency)} coaching
              </p>
            </div>
            <ArrowRight className="text-ink/60" />
          </div>
        </Card>
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Flame size={13} /> This week
          </span>
          <span className="font-display text-2xl font-bold">{weekCount}</span>
          <span className="text-xs text-muted">sessions · {formatDuration(weekSeconds)}</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Target size={13} /> Focus
          </span>
          <span className="font-display text-lg font-bold leading-tight">
            {labelize(activeConfig.training_focus)}
          </span>
          <span className="text-xs text-muted">
            {usage.live_sessions_used}/{usage.live_sessions_limit} live used
          </span>
        </Card>
      </div>

      {latest && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-ink/80">Latest session</h2>
          <Card className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink/5">
              <Play size={18} className="text-sage-deep" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {labelize(latest.config.sport)} · {formatDuration(latest.duration_seconds)}
              </p>
              <p className="text-xs text-muted">
                {format(new Date(latest.started_at), 'd MMM, HH:mm')}
              </p>
            </div>
            {latest.analysis_status === 'completed' ? (
              <Link to={`/report/${latest.id}`}>
                <Badge tone="sage">View report</Badge>
              </Link>
            ) : latest.recording_status === 'saved' ? (
              <Link to={`/complete?session=${latest.id}`}>
                <Badge tone="amber">Finish</Badge>
              </Link>
            ) : (
              <Badge tone="muted">{labelize(latest.recording_status)}</Badge>
            )}
          </Card>
        </section>
      )}

      {latestReport && (
        <section className="mt-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink/80">
            <Sparkles size={14} className="text-seal-deep" /> Recent analysis
          </h2>
          <Card className="space-y-2">
            <p className="text-sm text-ink/80">{latestReport.summary}</p>
            <div className="flex flex-wrap gap-1.5">
              {latestReport.corrections.slice(0, 3).map((c) => (
                <Badge key={c.finding_id} tone="seal">
                  {labelize(c.category)}
                </Badge>
              ))}
            </div>
          </Card>
        </section>
      )}

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink/80">Plan</h2>
          <Link to="/billing" className="text-xs text-seal-deep">
            {labelize(subscription.plan)} plan
          </Link>
        </div>
        <Card className="flex items-center justify-between text-sm">
          <div>
            <p className="text-muted">Analyses this period</p>
            <p className="font-semibold">
              {usage.analyses_used} / {usage.analyses_limit}
            </p>
          </div>
          <Link to="/billing">
            <Button size="sm" variant="secondary">
              Manage
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  )
}
