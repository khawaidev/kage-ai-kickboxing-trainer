import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  MessageSquare,
  MonitorSmartphone,
  Share,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt'
import { Button } from '@/components/ui/Button'
import { Seal } from '@/components/ui/Seal'
import { InkBackdrop } from '@/components/ui/InkBackdrop'
import { PhoneMockup } from './PhoneMockup'

const FEATURES = [
  {
    icon: Camera,
    title: 'Live voice coaching',
    body: 'Your phone watches the session and speaks short, timely corrections — not a wall of narration.',
  },
  {
    icon: Video,
    title: 'Keep the whole recording',
    body: 'A complete local recording is saved even if the AI connection drops. Your workout is never lost.',
  },
  {
    icon: MessageSquare,
    title: 'Evidence-linked reports',
    body: 'Afterwards, review prioritised corrections with timestamped video evidence and drills.',
  },
]

const STEPS = [
  { n: '01', title: 'Answer a few questions', body: 'Tell us your goal, sport and level. Takes under a minute.' },
  { n: '02', title: 'Prop up your phone', body: 'Keep your whole body in frame and press start. Coaching begins.' },
  { n: '03', title: 'Review your report', body: 'Get timestamped corrections, drills and a focus for next time.' },
]

function useIsIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

export function LandingPage() {
  const status = useAuthStore((s) => s.status)
  const { canInstall, installed, promptInstall } = useInstallPrompt()
  const isIOS = useIsIOS()
  const [busy, setBusy] = useState(false)

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />

  const installWithPrompt = async () => {
    setBusy(true)
    try {
      await promptInstall()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-paper">
      <InkBackdrop
        className="pointer-events-none absolute -right-40 -top-24 h-[38rem] w-[38rem]"
        origin="top"
        opacity={0.2}
      />

      {/* Marketing nav */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <Seal size="md" glyph="影" label="KAGE" />
          <div className="leading-none">
            <p className="font-display text-lg font-bold text-ink">KAGE</p>
            <p className="text-[11px] text-muted">AI Combat Coach</p>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/auth" className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:text-ink focus-ring">
            Sign in
          </Link>
          <Link to="/start">
            <Button size="md">
              Start training <ArrowRight size={16} />
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-8 pt-6 md:grid-cols-2 md:px-8 md:pb-16 md:pt-10">
        <div className="animate-ink-in">
          <p className="font-brush text-3xl text-seal">立身、守中、出拳</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] text-ink text-balance md:text-6xl">
            Train boxing with an AI coach that actually watches.
          </h1>
          <p className="mt-5 max-w-md text-base text-muted md:text-lg">
            Ancient discipline, modern feedback. Record a round, hear concise guidance while you
            move, then review timestamped analysis of your own footage.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/start">
              <Button size="lg">
                Start training <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#install">
              <Button size="lg" variant="secondary">
                <Download size={18} /> Install app
              </Button>
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            {['No equipment needed', 'Works on your phone', 'Free to start'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check size={14} className="text-sage-deep" /> {t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="relative animate-fade-up">
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-seal/[0.06] blur-2xl" />
            <PhoneMockup screen="workout" className="rotate-[-3deg]" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="paper-panel p-5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-seal/10 text-seal">
                <Icon size={20} />
              </div>
              <p className="mt-4 font-display text-lg font-bold text-ink">{title}</p>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screens */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-seal">Inside the app</p>
          <h2 className="mt-3 font-display text-3xl font-black text-ink md:text-4xl">
            Built for the way you actually train.
          </h2>
          <p className="mt-3 text-muted">
            From the first question to the final report, every screen is tuned for a phone propped
            across the room.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-start justify-center gap-8 md:gap-12">
          {(
            [
              { screen: 'dashboard', label: 'Your dashboard' },
              { screen: 'workout', label: 'Live coaching' },
              { screen: 'report', label: 'Evidence-linked report' },
            ] as const
          ).map(({ screen, label }) => (
            <div key={screen} className="flex flex-col items-center gap-4">
              <PhoneMockup screen={screen} />
              <p className="text-sm font-semibold text-ink">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-12 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ n, title, body }) => (
            <div key={n} className="paper-panel p-5">
              <span className="font-display text-2xl font-black text-seal/40">{n}</span>
              <p className="mt-2 font-display text-lg font-bold text-ink">{title}</p>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Install */}
      <section id="install" className="relative z-10 mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-12 md:px-8">
        <div className="paper-panel overflow-hidden p-6 md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink">
                <MonitorSmartphone size={14} /> Progressive Web App
              </p>
              <h2 className="mt-4 font-display text-3xl font-black text-ink">
                Install KAGE to your home screen.
              </h2>
              <p className="mt-3 max-w-lg text-muted">
                Runs full-screen like a native app, keeps working offline for recordings, and updates
                automatically. No app store needed.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {installed ? (
                  <span className="inline-flex items-center gap-2 rounded-xl bg-sage/15 px-4 py-3 text-sm font-semibold text-sage-deep">
                    <Check size={16} /> Installed
                  </span>
                ) : canInstall ? (
                  <Button size="lg" onClick={() => void installWithPrompt()} disabled={busy}>
                    <Download size={18} /> Install KAGE
                  </Button>
                ) : (
                  <Link to="/start">
                    <Button size="lg" variant="secondary">
                      <Sparkles size={18} /> Try it in the browser
                    </Button>
                  </Link>
                )}
              </div>

              {!canInstall && !installed && (
                <div className="mt-5 max-w-lg rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-sm text-muted">
                  {isIOS ? (
                    <p className="flex items-start gap-2">
                      <Share size={16} className="mt-0.5 shrink-0 text-ink" />
                      On iPhone or iPad: tap <strong className="text-ink">Share</strong> in Safari, then{' '}
                      <strong className="text-ink">Add to Home Screen</strong>.
                    </p>
                  ) : (
                    <p>
                      On desktop, look for the install icon in your browser’s address bar. On
                      Android, open the browser menu and choose{' '}
                      <strong className="text-ink">Install app</strong>.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-center md:justify-end">
              <PhoneMockup screen="dashboard" className="rotate-[3deg]" />
            </div>
          </div>
        </div>
      </section>

      {/* Safety + footer */}
      <footer className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 md:px-8">
        <div className="flex flex-col gap-4 border-t border-ink/10 pt-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p className="flex max-w-xl items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-sage-deep" />
            AI feedback can be wrong and is not a substitute for a qualified coach. Stop if you feel
            pain or dizziness.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="hover:text-ink">
              Sign in
            </Link>
            <span className="text-ink/20">·</span>
            <Link to="/start" className="hover:text-ink">
              Get started
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted/80">© {new Date().getFullYear()} KAGE · AI Combat Coach</p>
      </footer>
    </div>
  )
}
