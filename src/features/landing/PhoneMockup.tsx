import { Play, Sparkles, Target, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type MockScreen = 'dashboard' | 'workout' | 'report'

interface PhoneMockupProps {
  screen: MockScreen
  className?: string
}

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative w-[248px] shrink-0 rounded-[2.4rem] border border-ink/15 bg-ink p-2 shadow-soft',
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-paper">
        <div className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-ink/20" />
        <div className="h-[500px] overflow-hidden px-4 pb-4 pt-7">{children}</div>
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted">Saturday, 17 Oct</p>
          <p className="font-display text-base font-bold text-ink">Ready, Fighter.</p>
        </div>
        <img src="/icon.png" alt="KAGE" className="h-8 w-8 rounded-lg object-cover" />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-seal to-seal-deep p-3 text-paper-white shadow-seal">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold opacity-90">
          <Play size={11} /> START TRAINING
        </p>
        <p className="mt-1 font-display text-base font-bold">Boxing · Guard</p>
        <p className="text-[10px] opacity-80">15 min · 3 rounds · Balanced</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-ink/10 bg-paper-white p-2.5">
          <p className="text-[9px] text-muted">This week</p>
          <p className="font-display text-lg font-bold text-ink">4</p>
          <p className="text-[9px] text-muted">sessions</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-paper-white p-2.5">
          <p className="text-[9px] text-muted">Focus</p>
          <p className="font-display text-sm font-bold text-ink">Guard</p>
          <p className="text-[9px] text-muted">2/5 live used</p>
        </div>
      </div>

      <div className="rounded-xl border border-ink/10 bg-paper-white p-3">
        <p className="flex items-center gap-1 text-[10px] font-semibold text-seal-deep">
          <Sparkles size={11} /> Recent analysis
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-ink/70">
          Guard held well early; rear hand drifts after the cross.
        </p>
        <div className="mt-2 flex gap-1">
          <span className="rounded-full bg-seal/10 px-2 py-0.5 text-[8px] font-medium text-seal-deep">
            Guard
          </span>
          <span className="rounded-full bg-seal/10 px-2 py-0.5 text-[8px] font-medium text-seal-deep">
            Balance
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-around border-t border-ink/10 pt-2 text-[8px] text-muted">
        <span className="font-semibold text-seal">Home</span>
        <span>Sessions</span>
        <span>Progress</span>
        <span>Account</span>
      </div>
    </div>
  )
}

function Workout() {
  return (
    <div className="relative -mx-4 -mt-7 h-[500px]">
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/30 to-ink/80" />
      <div className="absolute inset-0 flex flex-col p-4 pt-8">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 rounded-full bg-seal/90 px-2 py-0.5 text-[9px] font-semibold text-paper-white">
            ● REC 04:12
          </span>
          <span className="rounded-full bg-paper-white/85 px-2 py-0.5 text-[9px] font-semibold text-ink">
            Round 2/3
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <span className="rounded-2xl bg-paper-white/85 px-4 py-1 font-display text-4xl font-black tabular-nums text-ink">
            01:47
          </span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-paper-white/90">
            Fight
          </span>
        </div>

        <div className="flex-1" />

        <div className="rounded-2xl border border-ink/10 bg-paper-white/95 p-3 shadow-soft">
          <p className="text-[9px] uppercase tracking-wider text-seal-deep">Coach</p>
          <p className="font-display text-sm font-bold leading-snug text-ink">
            Bring the rear hand back to your cheek after the cross.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {['Mute', 'Ask', 'Pause', 'Finish'].map((label, i) => (
            <span
              key={label}
              className={cn(
                'rounded-xl border py-2 text-center text-[8px] font-medium',
                i === 3
                  ? 'border-seal/50 bg-seal text-paper-white'
                  : 'border-ink/15 bg-paper-white/90 text-ink/80',
              )}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Report() {
  const findings = [
    { cat: 'Guard', text: 'Rear hand drops after the cross.', tone: 'seal' as const },
    { cat: 'Balance', text: 'Weight shifts forward on the jab.', tone: 'seal' as const },
    { cat: 'Rhythm', text: 'Consistent timing across rounds.', tone: 'sage' as const },
  ]
  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <p className="text-[10px] text-muted">Session report</p>
        <p className="font-display text-lg font-bold text-ink">Analysis ready</p>
      </div>

      <div className="aspect-video w-full rounded-xl border border-ink/10 bg-ink" />

      <div className="rounded-xl border border-ink/10 bg-paper-white p-3">
        <p className="flex items-center gap-1 text-[10px] font-semibold text-ink">
          <Target size={11} className="text-seal-deep" /> Priority corrections
        </p>
        <div className="mt-2 space-y-2">
          {findings.map((f) => (
            <div key={f.cat} className="flex items-start gap-2">
              <span
                className={cn(
                  'mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full',
                  f.tone === 'seal' ? 'bg-seal' : 'bg-sage',
                )}
              />
              <div>
                <p className="text-[9px] font-semibold text-ink/80">{f.cat}</p>
                <p className="text-[9px] text-muted">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-seal/20 bg-seal/[0.06] p-3">
        <p className="flex items-center gap-1 text-[10px] font-semibold text-seal-deep">
          <TrendingUp size={11} /> Next session
        </p>
        <p className="mt-1 text-[9px] text-ink/70">
          3-minute round on guard resets, then add to combinations.
        </p>
      </div>
    </div>
  )
}

export function PhoneMockup({ screen, className }: PhoneMockupProps) {
  return (
    <Frame className={className}>
      {screen === 'dashboard' ? <Dashboard /> : screen === 'workout' ? <Workout /> : <Report />}
    </Frame>
  )
}
