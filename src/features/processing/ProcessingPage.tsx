import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, CircleDashed, Loader2, Lock } from 'lucide-react'
import { useSessionStore } from '@/lib/stores/session'
import { useSettingsStore } from '@/lib/stores/settings'
import { analysisService, ANALYSIS_STAGE_LABELS } from '@/lib/services/analysis'
import { analytics } from '@/lib/services/analytics'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Seal } from '@/components/ui/Seal'
import { InkBackdrop } from '@/components/ui/InkBackdrop'
import { cn } from '@/lib/utils/cn'

export function ProcessingPage() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.sessions.find((x) => x.id === sessionId))
  const report = useSessionStore((s) => s.reports[sessionId])
  const { saveReport, setAnalysisStatus } = useSessionStore()
  const usage = useSettingsStore((s) => s.usage)
  const incrementAnalyses = useSettingsStore((s) => s.incrementAnalyses)

  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<string>('validating')
  const [done, setDone] = useState(false)
  const startedRef = useRef(false)

  const hasQuota = usage.analyses_used < usage.analyses_limit

  useEffect(() => {
    if (!session || report || startedRef.current || !hasQuota) return
    startedRef.current = true
    setAnalysisStatus(session.id, 'processing')
    analytics.track('analysis_started')

    let cancelled = false
    void analysisService
      .runAnalysis(session, (p) => {
        if (cancelled) return
        setStage(p.stage)
        setProgress(p.progress)
      })
      .then((r) => {
        if (cancelled) return
        setProgress(1)
        setDone(true)
        saveReport(r)
        incrementAnalyses()
        analytics.track('analysis_completed')
        setTimeout(() => navigate(`/report/${session.id}`, { replace: true }), 900)
      })
      .catch(() => {
        if (cancelled) return
        setAnalysisStatus(session.id, 'failed')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id])

  if (!session) {
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <p className="text-sm text-muted">Session not found.</p>
          <Link to="/dashboard">
            <Button className="mt-3" fullWidth>
              Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (!hasQuota) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="grid place-items-center py-10">
          <Seal size="lg" glyph="限" label="Limit reached" />
        </div>
        <h1 className="font-display text-2xl font-bold">Analysis limit reached</h1>
        <p className="mt-2 text-sm text-muted">
          You have used {usage.analyses_used} of {usage.analyses_limit} analyses on the{' '}
          {usage.plan.replace('_', ' ')} plan. Upgrade for more detailed reports and progress
          history.
        </p>
        <div className="mt-5 flex gap-2">
          <Link to="/billing" className="flex-1">
            <Button fullWidth>
              <Lock size={16} /> Upgrade
            </Button>
          </Link>
          <Link to="/dashboard" className="flex-1">
            <Button variant="secondary" fullWidth>
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const stages = Object.entries(ANALYSIS_STAGE_LABELS) as [string, string][]

  return (
    <div className="relative mx-auto max-w-lg overflow-hidden">
      <InkBackdrop className="absolute -right-24 top-10 h-72 w-72" origin="right" opacity={0.3} />

      <div className="relative flex flex-col items-center py-8 text-center">
        <Seal size="lg" glyph={done ? '成' : '析'} label="Analysing" />
        <h1 className="mt-5 font-display text-2xl font-bold">
          {done ? 'Report ready' : 'Analysing your session'}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-muted">
          {done
            ? 'Opening your report…'
            : 'You can leave this screen and come back — analysis continues in the background.'}
        </p>
        <div className="mt-5 w-full max-w-xs">
          <Progress value={done ? 1 : progress} />
        </div>
      </div>

      <Card className="mt-2 space-y-3">
        {stages.map(([key, label]) => {
          const currentIndex = stages.findIndex(([k]) => k === stage)
          const thisIndex = stages.findIndex(([k]) => k === key)
          const complete = done || thisIndex < currentIndex
          const active = !done && key === stage
          return (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="grid h-6 w-6 place-items-center">
                {complete ? (
                  <Check size={16} className="text-sage-deep" />
                ) : active ? (
                  <Loader2 size={16} className="animate-spin text-seal-deep" />
                ) : (
                  <CircleDashed size={16} className="text-muted/50" />
                )}
              </span>
              <span
                className={cn(
                  complete ? 'text-ink/80' : active ? 'font-semibold text-ink' : 'text-muted/60',
                )}
              >
                {label}
              </span>
            </div>
          )
        })}
      </Card>

      <div className="mt-6 flex gap-2">
        <Link to="/dashboard" className="flex-1">
          <Button variant="secondary" fullWidth>
            Leave &amp; return later
          </Button>
        </Link>
        {report && (
          <Link to={`/report/${session.id}`} className="flex-1">
            <Button fullWidth>View report</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
