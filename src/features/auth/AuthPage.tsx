import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, MailCheck, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useIntakeStore } from '@/lib/stores/intake'
import { analytics } from '@/lib/services/analytics'
import { Button } from '@/components/ui/Button'
import { Seal } from '@/components/ui/Seal'
import { InkBackdrop } from '@/components/ui/InkBackdrop'

type Mode = 'signin' | 'signup'

export function AuthPage() {
  const {
    status,
    signIn,
    signUp,
    signInAsGuest,
    error,
    pendingConfirmationEmail,
    resendConfirmation,
    clearPendingConfirmation,
  } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const intake = useIntakeStore()
  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/dashboard'} replace />
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signUp({ email, password, displayName })
        analytics.track('signup_completed')
        if (!useAuthStore.getState().pendingConfirmationEmail) {
          navigate('/onboarding', { replace: true })
        }
      } else {
        await signIn(email, password)
        navigate('/dashboard', { replace: true })
      }
    } catch {
      /* error surfaced from store */
    } finally {
      setBusy(false)
    }
  }

  const guest = async () => {
    await signInAsGuest()
    navigate('/onboarding', { replace: true })
  }

  const resend = async () => {
    if (!pendingConfirmationEmail) return
    try {
      await resendConfirmation(pendingConfirmationEmail)
    } catch {
      /* ignore — the notice stays visible */
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-paper">
      <InkBackdrop className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80" origin="left" opacity={0.18} />
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 py-6">
        <Link
          to="/"
          className="flex w-fit items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-muted hover:text-ink focus-ring"
        >
          <ArrowLeft size={16} /> Home
        </Link>

        <div className="mt-8 flex flex-col items-center text-center">
          <Seal size="lg" glyph="影" label="KAGE" />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {mode === 'signup'
              ? 'Save sessions, reports and progress to your profile.'
              : 'Sign in to pick up where you left off.'}
          </p>
        </div>

        {intake.completed && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-sage/30 bg-sage/10 px-3 py-2.5 text-xs font-medium text-sage-deep">
            <Sparkles size={14} /> Your intake is saved — starting a session will be pre-configured.
          </div>
        )}

        {pendingConfirmationEmail ? (
          <ConfirmationNotice email={pendingConfirmationEmail} onResend={resend} onBack={clearPendingConfirmation} />
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-ink/10 bg-paper-white p-1">
          {(['signup', 'signin'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-colors focus-ring ${
                mode === m ? 'bg-seal text-paper-white shadow-seal' : 'text-muted hover:text-ink'
              }`}
            >
              {m === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === 'signup' && (
            <Field
              label="Display name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Your name"
              autoComplete="name"
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
          />

          {error && <p className="text-sm text-seal">{error}</p>}

          <Button type="submit" size="lg" fullWidth disabled={busy} className="mt-1">
            {busy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mode === 'signin' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <div className="brush-divider flex-1" />
          or
          <div className="brush-divider flex-1" />
        </div>

        <Button variant="secondary" fullWidth onClick={() => void guest()}>
          Continue as guest
        </Button>
          </>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          By continuing you agree that AI coaching may be inaccurate and is not a substitute for a
          qualified coach.
        </p>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
}

function Field({ label, value, onChange, type = 'text', ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-ink/10 bg-paper-white px-4 text-ink placeholder:text-ink/30 focus-ring"
        {...rest}
      />
    </label>
  )
}

interface ConfirmationNoticeProps {
  email: string
  onResend: () => void
  onBack: () => void
}

function ConfirmationNotice({ email, onResend, onBack }: ConfirmationNoticeProps) {
  const [sent, setSent] = useState(false)
  return (
    <div className="mt-6 rounded-2xl border border-sage/30 bg-sage/10 p-5 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage/20 text-sage-deep">
        <MailCheck size={22} />
      </div>
      <h2 className="mt-3 font-display text-lg font-bold text-ink">Confirm your email</h2>
      <p className="mt-1.5 text-sm text-muted">
        We sent a confirmation link to <span className="font-medium text-ink">{email}</span>. Open it to
        activate your account, then sign in.
      </p>
      <Button
        className="mt-4"
        fullWidth
        disabled={sent}
        onClick={() => {
          onResend()
          setSent(true)
        }}
      >
        {sent ? 'Confirmation email sent' : 'Resend confirmation email'}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 text-xs font-medium text-muted hover:text-ink focus-ring"
      >
        Back to sign in
      </button>
    </div>
  )
}
