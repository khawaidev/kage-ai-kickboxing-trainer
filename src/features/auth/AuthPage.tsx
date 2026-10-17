import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useIntakeStore } from '@/lib/stores/intake'
import { Button } from '@/components/ui/Button'
import { Seal } from '@/components/ui/Seal'
import { InkBackdrop } from '@/components/ui/InkBackdrop'

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

export function AuthPage() {
  const { status, signInWithGoogle, signInAsGuest, error } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const intake = useIntakeStore()
  const [busy, setBusy] = useState(false)

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? '/dashboard'} replace />
  }

  const google = async () => {
    setBusy(true)
    try {
      await signInWithGoogle()
      // On real Supabase the browser redirects; mock mode authenticates here.
      if (useAuthStore.getState().status === 'authenticated') {
        navigate('/onboarding', { replace: true })
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
          <h1 className="mt-4 font-display text-2xl font-bold text-ink">Sign in to KAGE</h1>
          <p className="mt-1.5 text-sm text-muted">
            Save sessions, reports and progress to your profile.
          </p>
        </div>

        {intake.completed && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-sage/30 bg-sage/10 px-3 py-2.5 text-xs font-medium text-sage-deep">
            <Sparkles size={14} /> Your intake is saved — starting a session will be pre-configured.
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => void google()}
            disabled={busy}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-ink/12 bg-paper-white text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-paper-deep disabled:opacity-60 focus-ring"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {error && <p className="text-sm text-seal">{error}</p>}
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <div className="brush-divider flex-1" />
          or
          <div className="brush-divider flex-1" />
        </div>

        <Button variant="secondary" fullWidth onClick={() => void guest()}>
          Continue as guest
        </Button>

        <p className="mt-6 text-center text-xs text-muted">
          By continuing you agree that AI coaching may be inaccurate and is not a substitute for a
          qualified coach.
        </p>
      </div>
    </div>
  )
}
