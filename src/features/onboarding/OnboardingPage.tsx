import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CloudUpload, Eye, ShieldAlert, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useSettingsStore } from '@/lib/stores/settings'
import { analytics } from '@/lib/services/analytics'
import { Button } from '@/components/ui/Button'
import { InkBackdrop } from '@/components/ui/InkBackdrop'
import { Progress } from '@/components/ui/Progress'
import { cn } from '@/lib/utils/cn'

const STEPS = [
  {
    icon: Eye,
    title: 'Keep your whole body in frame',
    body: 'Prop your phone up so your head, hands and feet stay visible. The coach can only comment on what the camera can see.',
  },
  {
    icon: Camera,
    title: 'Live coaching, kept short',
    body: 'While you train, sampled frames and your microphone feed the AI instructor. It speaks brief corrections and answers questions — it won’t narrate constantly.',
  },
  {
    icon: CloudUpload,
    title: 'Your recording stays yours',
    body: 'The full recording is saved locally first. Uploading it for analysis is optional and only happens with your consent. Recordings are stored privately and can be deleted anytime.',
  },
  {
    icon: ShieldAlert,
    title: 'Safety first',
    body: 'AI coaching can be wrong, misses fast movements, and is not medical advice. Stop if you feel pain or dizziness. Never spar unsupervised.',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { acknowledgeSafety, completeOnboarding, setRecordConsent } = useSettingsStore()
  const [index, setIndex] = useState(0)
  const [agreed, setAgreed] = useState(false)
  const [uploadConsent, setUploadConsent] = useState(false)

  const step = STEPS[index]
  const Icon = step.icon
  const isLast = index === STEPS.length - 1

  const next = () => {
    if (isLast) {
      if (!agreed) return
      acknowledgeSafety()
      setRecordConsent(uploadConsent)
      completeOnboarding()
      analytics.track('onboarding_completed', {
        experience_level: user?.experience_level,
      })
      navigate('/dashboard', { replace: true })
    } else {
      setIndex((i) => i + 1)
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col overflow-hidden px-5 py-8">
      <InkBackdrop className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72" origin="right" opacity={0.22} />

      <div className="mb-8 mt-2">
        <Progress value={(index + 1) / STEPS.length} />
        <p className="mt-2 text-xs text-muted">
          Step {index + 1} of {STEPS.length}
        </p>
      </div>

      <div className="relative flex flex-1 flex-col">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-seal/15 text-seal-deep">
          <Icon size={28} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold leading-tight text-balance">
          {step.title}
        </h1>
        <p className="mt-4 text-ink/70">{step.body}</p>

        {isLast && (
          <div className="mt-6 space-y-3">
            <Consent
              checked={agreed}
              onChange={setAgreed}
              label="I understand AI feedback may be inaccurate and is not a substitute for a qualified coach."
            />
            <Consent
              checked={uploadConsent}
              onChange={setUploadConsent}
              label="Allow me to upload recordings for AI analysis (you can change this later)."
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {index > 0 && (
          <Button variant="ghost" onClick={() => setIndex((i) => i - 1)}>
            Back
          </Button>
        )}
        <Button
          size="lg"
          fullWidth
          onClick={next}
          disabled={isLast && !agreed}
          className={cn(!isLast && 'ml-auto')}
        >
          {isLast ? (
            <>
              <Sparkles size={18} /> Begin
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  )
}

function Consent({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/10 bg-ink/5 p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-seal"
      />
      <span className="text-sm text-ink/80">{label}</span>
    </label>
  )
}
