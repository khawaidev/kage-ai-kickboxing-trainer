import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowRight, Info, Play, Repeat, Target, TrendingUp } from 'lucide-react'
import { useSessionStore } from '@/lib/stores/session'
import { getRecording } from '@/lib/services/storage'
import { analytics } from '@/lib/services/analytics'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { FindingCard } from '@/components/report/FindingCard'
import { formatDuration, formatTimestamp } from '@/lib/utils/format'
import { labelize } from '@/lib/types'

export function ReportPage() {
  const { sessionId = '' } = useParams()
  const session = useSessionStore((s) => s.sessions.find((x) => x.id === sessionId))
  const report = useSessionStore((s) => s.reports[sessionId])
  const sessions = useSessionStore((s) => s.sessions)
  const reports = useSessionStore((s) => s.reports)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    analytics.track('report_opened')
  }, [])

  useEffect(() => {
    let url: string | null = null
    let active = true
    if (sessionId) {
      void getRecording(sessionId).then((rec) => {
        if (!active || !rec) return
        url = URL.createObjectURL(rec.blob)
        setVideoUrl(url)
      })
    }
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [sessionId])

  const previous = useMemo(() => {
    if (!session) return null
    const earlier = sessions.find(
      (s) =>
        s.id !== session.id &&
        s.config.sport === session.config.sport &&
        reports[s.id] &&
        new Date(s.started_at) < new Date(session.started_at),
    )
    return earlier ? reports[earlier.id] : null
  }, [session, sessions, reports])

  if (!session || !report) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Report" back />
        <Card>
          <p className="text-sm text-muted">
            No report is available for this session yet.
          </p>
          <Link to={`/processing/${sessionId}`}>
            <Button className="mt-3" fullWidth>
              Run analysis
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const seek = (seconds: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = seconds
    void v.play()
  }

  const recurring = previous
    ? report.corrections.filter((c) =>
        previous.corrections.some((p) => p.category === c.category),
      )
    : []

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Analysis report"
        subtitle={`${labelize(session.config.sport)} · ${formatDuration(session.duration_seconds)} · ${format(new Date(session.started_at), 'd MMM')}`}
        back
      />

      {/* Player */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-ink/10 bg-black">
        {videoUrl ? (
          <video ref={videoRef} src={videoUrl} controls playsInline className="h-full w-full object-contain" />
        ) : (
          <div className="grid h-full place-items-center bg-paper-deep p-4 text-center text-xs text-muted">
            Recording is no longer stored locally. Findings still reference the original timeline.
          </div>
        )}
      </div>

      {/* Timeline markers */}
      <div className="mt-3">
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-3 h-1.5 rounded-full bg-ink/10" />
          {report.corrections.map((c) => {
            const pct = Math.min(100, (c.evidence_start_seconds / Math.max(1, session.duration_seconds)) * 100)
            return (
              <button
                key={c.finding_id}
                onClick={() => seek(c.evidence_start_seconds)}
                title={`${labelize(c.category)} · ${formatTimestamp(c.evidence_start_seconds)}`}
                className="absolute top-1.5 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-ink bg-seal hover:scale-110 focus-ring"
                style={{ left: `${pct}%` }}
                aria-label={`Jump to ${labelize(c.category)} at ${formatTimestamp(c.evidence_start_seconds)}`}
              />
            )
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted">
          <span>0:00</span>
          <span>{formatTimestamp(session.duration_seconds)}</span>
        </div>
      </div>

      {/* Summary */}
      <Card className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge tone="seal">Summary</Badge>
          <Badge tone="muted">{report.model_version}</Badge>
        </div>
        <p className="text-sm text-ink/85">{report.summary}</p>
      </Card>

      {/* Priority corrections */}
      <section className="mt-6">
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
          <Target size={18} className="text-seal-deep" /> Priority corrections
        </h2>
        <div className="space-y-3">
          {report.corrections.map((f, i) => (
            <FindingCard key={f.finding_id} finding={f} index={i} onSeek={seek} />
          ))}
        </div>
      </section>

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 font-display text-lg font-bold">What worked</h2>
          <div className="space-y-3">
            {report.strengths.map((f, i) => (
              <FindingCard
                key={f.finding_id}
                finding={f}
                index={i}
                onSeek={seek}
                tone="strength"
              />
            ))}
          </div>
        </section>
      )}

      {/* Recurring */}
      {previous && (
        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
            <TrendingUp size={18} className="text-sage-deep" /> Compared to last session
          </h2>
          <Card className="space-y-2">
            {recurring.length > 0 ? (
              <>
                <p className="text-sm text-ink/80">
                  These areas came up in both sessions — still worth focused work:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recurring.map((c) => (
                    <Badge key={c.finding_id} tone="amber">
                      {labelize(c.category)}
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-ink/80">
                No repeated correction categories were flagged this time. Comparisons are shown
                only where the evidence supports them.
              </p>
            )}
          </Card>
        </section>
      )}

      {/* Drills */}
      <section className="mt-6">
        <h2 className="mb-2 font-display text-lg font-bold">Recommended drills</h2>
        <div className="space-y-3">
          {report.drills.map((d) => (
            <Card key={d.id} className="flex gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-seal/15 text-seal-deep">
                <Repeat size={18} />
              </div>
              <div>
                <p className="font-semibold">
                  {d.name}{' '}
                  <span className="text-xs font-normal text-muted">
                    {d.duration_minutes} min
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-muted">{d.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Next focus */}
      <Card className="mt-6 border-seal/30 bg-gradient-to-br from-seal/20 to-paper-deep">
        <p className="flex items-center gap-2 text-sm font-semibold text-seal-deep">
          <Play size={15} /> Next session focus
        </p>
        <p className="mt-1 font-display text-lg font-bold leading-snug">{report.next_focus}</p>
      </Card>

      {/* Limitations */}
      <Card className="mt-4 space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <Info size={13} /> Analysis limitations
        </p>
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
          {report.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p className="text-[11px] text-muted/70">
          Analysis {report.analysis_version} · generated {format(new Date(report.created_at), 'd MMM HH:mm')}
        </p>
      </Card>

      <div className="sticky bottom-24 mt-6 flex gap-2">
        <Link to="/configure" className="flex-1">
          <Button size="lg" fullWidth>
            Train again <ArrowRight size={18} />
          </Button>
        </Link>
      </div>
    </div>
  )
}
