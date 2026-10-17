import { useNavigate } from 'react-router-dom'
import {
  COACHING_FREQUENCIES,
  EXPERIENCE_LEVELS,
  SESSION_TYPES,
  TRAINING_FOCUSES,
  labelize,
  type CoachingFrequency,
  type ExperienceLevel,
  type SessionType,
  type Sport,
  type TrainingFocus,
} from '@/lib/types'
import { useSessionStore } from '@/lib/stores/session'
import { analytics } from '@/lib/services/analytics'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatClock } from '@/lib/utils/format'

const DURATION_OPTIONS = [5, 10, 15, 20]

export function ConfigurePage() {
  const navigate = useNavigate()
  const { activeConfig, setActiveConfig } = useSessionStore()

  const set = <K extends keyof typeof activeConfig>(
    key: K,
    value: (typeof activeConfig)[K],
  ) => setActiveConfig({ [key]: value } as Partial<typeof activeConfig>)

  const start = () => {
    analytics.track('workout_configured', {
      sport: activeConfig.sport,
      experience_level: activeConfig.experience_level,
      focus: activeConfig.training_focus,
    })
    navigate('/camera')
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Configure workout"
        subtitle="Everything can be changed before you press start."
        back
      />

      <div className="space-y-6">
        <Section title="Sport">
          <SegmentedControl<Sport>
            value={activeConfig.sport}
            onChange={(v) => set('sport', v)}
            options={[
              { value: 'boxing', label: 'Boxing' },
              { value: 'kickboxing', label: 'Kickboxing', hint: 'Experimental' },
            ]}
          />
          {activeConfig.sport === 'kickboxing' && (
            <Hint>
              Kickboxing analysis is experimental — kick-specific findings are marked preliminary.
            </Hint>
          )}
        </Section>

        <Section title="Experience level">
          <SegmentedControl<ExperienceLevel>
            value={activeConfig.experience_level}
            onChange={(v) => set('experience_level', v)}
            options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: labelize(l) }))}
          />
        </Section>

        <Section title="Session type">
          <SegmentedControl<SessionType>
            value={activeConfig.session_type}
            onChange={(v) => set('session_type', v)}
            options={SESSION_TYPES.map((s) => ({ value: s, label: labelize(s) }))}
          />
        </Section>

        <Section title="Training focus">
          <SegmentedControl<TrainingFocus>
            value={activeConfig.training_focus}
            onChange={(v) => set('training_focus', v)}
            columns={2}
            options={TRAINING_FOCUSES.map((f) => ({ value: f, label: labelize(f) }))}
          />
        </Section>

        <Section title="Coaching frequency">
          <SegmentedControl<CoachingFrequency>
            value={activeConfig.coaching_frequency}
            onChange={(v) => set('coaching_frequency', v)}
            options={COACHING_FREQUENCIES.map((f) => ({ value: f, label: labelize(f) }))}
          />
        </Section>

        <Section title="Duration">
          <SegmentedControl<string>
            value={String(activeConfig.duration_seconds / 60)}
            onChange={(v) =>
              setActiveConfig({
                duration_seconds: Number(v) * 60,
              })
            }
            options={DURATION_OPTIONS.map((m) => ({
              value: String(m),
              label: `${m} min`,
            }))}
          />
          <Hint>15 minutes is the tested maximum for reliable local recording.</Hint>
        </Section>

        <Section title="Rounds">
          <SegmentedControl<string>
            value={String(activeConfig.rounds)}
            onChange={(v) => set('rounds', Number(v))}
            options={['3', '4', '6', '8'].map((r) => ({ value: r, label: `${r}` }))}
          />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stepper
              label="Round length"
              value={activeConfig.round_seconds}
              step={30}
              min={30}
              max={300}
              onChange={(v) => set('round_seconds', v)}
            />
            <Stepper
              label="Rest"
              value={activeConfig.rest_seconds}
              step={15}
              min={0}
              max={120}
              onChange={(v) => set('rest_seconds', v)}
            />
          </div>
          <Hint>
            Total run: {formatClock(activeConfig.duration_seconds)} planned · round{' '}
            {formatClock(activeConfig.round_seconds)} / rest {formatClock(activeConfig.rest_seconds)}
          </Hint>
        </Section>
      </div>

      <div className="sticky bottom-24 mt-8">
        <Button size="lg" fullWidth onClick={start}>
          Continue to camera setup
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-ink/80">{title}</h2>
      {children}
    </section>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-xs text-muted">{children}</p>
}

function Stepper({
  label,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  step: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <Card className="flex items-center justify-between gap-2 p-3">
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-semibold">{formatClock(value)}</p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-lg hover:bg-ink/10 focus-ring"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-lg hover:bg-ink/10 focus-ring"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </Card>
  )
}
