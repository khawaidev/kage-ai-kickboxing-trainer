import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Clock,
  Dumbbell,
  Flame,
  Sparkles,
  Target,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { analytics } from '@/lib/services/analytics'
import {
  CADENCE_LABELS,
  GOAL_LABELS,
  useIntakeStore,
  type IntakeCadence,
  type IntakeGoal,
} from '@/lib/stores/intake'
import { Button } from '@/components/ui/Button'
import { Seal } from '@/components/ui/Seal'
import { Progress } from '@/components/ui/Progress'
import { InkBackdrop } from '@/components/ui/InkBackdrop'
import { cn } from '@/lib/utils/cn'

interface Option {
  value: string
  label: string
  hint?: string
  icon?: LucideIcon
}

interface Step {
  key: string
  question: string
  helper: string
  options: Option[]
  columns?: number
}

const STEPS: Step[] = [
  {
    key: 'goal',
    question: 'What brings you to KAGE?',
    helper: 'We use this to shape the coaching tone and drills.',
    columns: 2,
    options: (Object.keys(GOAL_LABELS) as IntakeGoal[]).map((g) => ({
      value: g,
      label: GOAL_LABELS[g],
      icon:
        g === 'get_fit'
          ? Flame
          : g === 'learn_technique'
            ? Target
            : g === 'improve_fitness'
              ? Dumbbell
              : g === 'competition'
                ? Award
                : Wind,
    })),
  },
  {
    key: 'sport',
    question: 'Which discipline?',
    helper: 'You can switch anytime in workout setup.',
    columns: 2,
    options: [
      { value: 'boxing', label: 'Boxing', hint: 'Punches, footwork, defence' },
      { value: 'kickboxing', label: 'Kickboxing', hint: 'Adds kicks (experimental)' },
    ],
  },
  {
    key: 'experience',
    question: 'How much have you trained?',
    helper: 'We set sensible round lengths for your first session.',
    columns: 1,
    options: [
      { value: 'beginner', label: 'Beginner', hint: 'Little or no experience' },
      { value: 'intermediate', label: 'Intermediate', hint: 'Comfortable with the basics' },
      { value: 'advanced', label: 'Advanced', hint: 'Regular, technical training' },
    ],
  },
  {
    key: 'cadence',
    question: 'How often do you train?',
    helper: 'This helps us pace progression and encouragement.',
    columns: 2,
    options: (Object.keys(CADENCE_LABELS) as IntakeCadence[]).map((c) => ({
      value: c,
      label: CADENCE_LABELS[c],
    })),
  },
  {
    key: 'focus',
    question: 'What should we focus on?',
    helper: 'The AI prioritises findings in this area.',
    columns: 1,
    options: [
      { value: 'guard', label: 'Guard' },
      { value: 'balance', label: 'Balance' },
      { value: 'punch_technique', label: 'Punch technique' },
      { value: 'combinations', label: 'Combinations' },
      { value: 'fundamentals', label: 'General fundamentals' },
    ],
  },
  {
    key: 'coaching',
    question: 'How much should the coach talk?',
    helper: 'You can mute or change this during a session.',
    columns: 1,
    options: [
      { value: 'minimal', label: 'Minimal', hint: 'A cue every so often' },
      { value: 'balanced', label: 'Balanced', hint: 'Regular, brief corrections' },
      { value: 'frequent', label: 'Frequent', hint: 'Lots of quick feedback' },
    ],
  },
]

export function IntakePage() {
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)
  const intake = useIntakeStore()
  const [index, setIndex] = useState(0)

  const step = STEPS[index]
  const isLast = index === STEPS.length - 1
  const selected = intake[step.key as 'goal' | 'sport' | 'experience' | 'cadence' | 'focus' | 'coaching']
  const progress = (index + 1) / STEPS.length

  const Icon = useMemo(
    () => step.options.find((o) => o.value === selected)?.icon ?? Sparkles,
    [step, selected],
  )

  const choose = (value: string) => {
    intake.set({ [step.key]: value } as never)
    if (!isLast) setTimeout(() => setIndex((i) => i + 1), 160)
  }

  const next = () => {
    if (!selected) return
    if (isLast) {
      intake.applyToConfig()
      intake.set({ completed: true })
      analytics.track('intake_completed', { goal: intake.goal, sport: intake.sport })
      navigate(status === 'authenticated' ? '/onboarding' : '/auth', { replace: true })
    } else {
      setIndex((i) => i + 1)
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-paper">
      <InkBackdrop className="pointer-events-none absolute -right-24 -top-10 h-80 w-80" origin="top" opacity={0.22} />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-5 py-6 md:py-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => (index === 0 ? navigate('/') : setIndex((i) => i - 1))}
            className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-muted hover:text-ink focus-ring"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <Seal size="sm" glyph="問" label="Intake" />
        </div>

        <div className="mt-6">
          <Progress value={progress} />
          <p className="mt-2 text-xs font-medium text-muted">
            Step {index + 1} of {STEPS.length}
          </p>
        </div>

        <div key={step.key} className="mt-8 animate-ink-in">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-seal/10 text-seal">
            <Icon size={26} />
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-ink text-balance">
            {step.question}
          </h1>
          <p className="mt-2 text-sm text-muted">{step.helper}</p>

          <div
            className={cn('mt-6 grid gap-2.5', step.columns === 2 ? 'grid-cols-2' : 'grid-cols-1')}
          >
            {step.options.map((opt) => {
              const active = opt.value === selected
              const OptIcon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => choose(opt.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors focus-ring',
                    active
                      ? 'border-seal bg-seal/10'
                      : 'border-ink/10 bg-paper-white hover:border-ink/25',
                  )}
                >
                  {OptIcon && (
                    <span
                      className={cn(
                        'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                        active ? 'bg-seal text-paper-white' : 'bg-ink/5 text-ink/70',
                      )}
                    >
                      <OptIcon size={18} />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span
                      className={cn(
                        'block text-sm font-semibold',
                        active ? 'text-seal-deep' : 'text-ink',
                      )}
                    >
                      {opt.label}
                    </span>
                    {opt.hint && <span className="block text-xs text-muted">{opt.hint}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-auto pt-8">
          <Button size="lg" fullWidth disabled={!selected} onClick={next}>
            {isLast ? (
              <>
                <Sparkles size={18} /> Create my coach
              </>
            ) : (
              <>
                Continue <ArrowRight size={18} />
              </>
            )}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
            <Clock size={12} /> Takes under a minute · no account needed yet
          </p>
        </div>
      </div>
    </div>
  )
}
