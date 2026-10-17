import type { CoachingFrequency, ExperienceLevel, TrainingFocus } from '@/lib/types'

export type LiveConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error'
  | 'closed'

export interface CoachMessage {
  id: string
  text: string
  kind: 'observation' | 'correction' | 'encouragement' | 'answer' | 'rest'
  at_seconds: number
  created_at: string
}

export interface LiveCoachOptions {
  focus: TrainingFocus
  level: ExperienceLevel
  frequency: CoachingFrequency
  sport: 'boxing' | 'kickboxing'
  /** Live media stream (mic + camera) for a real Gemini Live session. */
  stream?: MediaStream
  /** Called with each sampled frame in a real Gemini Live implementation. */
  onFrame?: (frame: Blob) => void
}

export interface LiveCoachClient {
  /** True when the model returns its own spoken audio (skip local TTS). */
  readonly nativeAudio: boolean
  connect(options: LiveCoachOptions): Promise<void>
  sendFrame(frame: Blob, atSeconds: number): void
  askQuestion(question: string, atSeconds: number): void
  setMuted(muted: boolean): void
  pause(): void
  resume(): void
  disconnect(): Promise<void>
  onStateChange(cb: (state: LiveConnectionState) => void): () => void
  onMessage(cb: (message: CoachMessage) => void): () => void
  getState(): LiveConnectionState
  simulateInterruption(): void
}

type Unsubscribe = () => void

function makeId(): string {
  return Math.random().toString(36).slice(2, 12)
}

const FREQUENCY_INTERVAL_MS: Record<CoachingFrequency, number> = {
  minimal: 45_000,
  balanced: 24_000,
  frequent: 12_000,
}

const FOCUS_CUES: Record<TrainingFocus, string[]> = {
  guard: [
    'Keep your hands high — chin behind the gloves.',
    'Bring your right hand back to guard after the cross.',
    'Elbows in, tight guard, small gaps.',
    'Reset your guard every time you finish a combination.',
  ],
  balance: [
    'Stay balanced over your base — feet under your hips.',
    'Don’t lean past your front foot on the jab.',
    'Recover your stance after every punch.',
    'Keep your weight centred when you move.',
  ],
  punch_technique: [
    'Rotate your hip through the cross, not just your arm.',
    'Turn the jab over — knuckles up at full extension.',
    'Drive the hook from the hips and shoulder.',
    'Snap the punch back to guard faster than you throw it.',
  ],
  combinations: [
    'Finish every combination with a defensive move.',
    'Keep the same rhythm — don’t rush the third punch.',
    'Mix levels: a body shot then back upstairs.',
    'Breathe out on each punch.',
  ],
  fundamentals: [
    'Relax your shoulders — keep the chin tucked.',
    'Small steps, don’t cross your feet.',
    'Exhale on the punch, inhale on the reset.',
    'Move your head off the centre line after you throw.',
  ],
}

const REST_CUES = [
  'Rest. Shake out your arms and breathe.',
  'Take the rest — slow your breathing down.',
  'Recover. Sip water if you need it.',
]

const SAFETY_NOTE =
  'I’m an AI coach and can be wrong. Stop if you feel pain or dizziness.'

/**
 * MockLiveCoach — simulates Gemini Live's bidirectional voice loop.
 *
 * Swap-in point: replace the timer-driven `tick()` with a real
 * `ai.live.connect(...)` WebSocket session fed by short-lived credentials
 * provisioned by the backend (`POST /api/live-sessions/token`). The UI only
 * consumes state changes and `CoachMessage`s.
 */
export class MockLiveCoach implements LiveCoachClient {
  readonly nativeAudio = false

  private state: LiveConnectionState = 'idle'
  private options: LiveCoachOptions | null = null
  private stateListeners = new Set<(s: LiveConnectionState) => void>()
  private messageListeners = new Set<(m: CoachMessage) => void>()
  private timer: ReturnType<typeof setInterval> | null = null
  private muted = false
  private paused = false
  private startedAt = 0
  private cueIndex = 0

  getState(): LiveConnectionState {
    return this.state
  }

  onStateChange(cb: (s: LiveConnectionState) => void): Unsubscribe {
    this.stateListeners.add(cb)
    return () => this.stateListeners.delete(cb)
  }

  onMessage(cb: (m: CoachMessage) => void): Unsubscribe {
    this.messageListeners.add(cb)
    return () => this.messageListeners.delete(cb)
  }

  private setState(state: LiveConnectionState) {
    this.state = state
    this.stateListeners.forEach((cb) => cb(state))
  }

  private emit(message: CoachMessage) {
    this.messageListeners.forEach((cb) => cb(message))
  }

  private elapsed(): number {
    if (!this.startedAt) return 0
    return Math.round((Date.now() - this.startedAt) / 1000)
  }

  async connect(options: LiveCoachOptions): Promise<void> {
    this.options = options
    this.setState('connecting')
    await new Promise((r) => setTimeout(r, 900))
    this.startedAt = Date.now()
    this.setState('connected')

    this.emit({
      id: makeId(),
      text: `Let’s begin. Focus on ${options.focus.replace('_', ' ')}. ${SAFETY_NOTE}`,
      kind: 'encouragement',
      at_seconds: 0,
      created_at: new Date().toISOString(),
    })

    const interval = FREQUENCY_INTERVAL_MS[options.frequency]
    this.timer = setInterval(() => this.tick(), interval)
  }

  private tick() {
    if (!this.options || this.muted || this.paused) return
    const cues = FOCUS_CUES[this.options.focus]
    const useRest = this.cueIndex > 0 && this.cueIndex % 5 === 0
    const pool = useRest ? REST_CUES : cues
    const text = pool[this.cueIndex % pool.length]
    this.cueIndex += 1
    this.emit({
      id: makeId(),
      text,
      kind: useRest ? 'rest' : 'correction',
      at_seconds: this.elapsed(),
      created_at: new Date().toISOString(),
    })
  }

  sendFrame(frame: Blob, atSeconds: number): void {
    this.options?.onFrame?.(frame)
    void atSeconds
    void frame
  }

  askQuestion(question: string, atSeconds: number): void {
    if (!this.options) return
    const answer = this.answerFor(question)
    this.emit({
      id: makeId(),
      text: answer,
      kind: 'answer',
      at_seconds: atSeconds,
      created_at: new Date().toISOString(),
    })
  }

  private answerFor(question: string): string {
    const q = question.toLowerCase()
    if (q.includes('guard') || q.includes('hand')) {
      return 'Keep your hands at cheek height. The lead hand floats a little forward, the rear hand stays glued to the chin.'
    }
    if (q.includes('foot') || q.includes('stance')) {
      return 'Feet shoulder-width, lead foot turned slightly in, rear heel up a touch. Never cross your feet when you move.'
    }
    if (q.includes('jab')) {
      return 'From guard, push from the rear foot, turn the lead hand over, and bring it straight back to your face.'
    }
    if (q.includes('tired') || q.includes('rest')) {
      return 'Take the rest. Shake the arms out, breathe through the nose, and reset your guard before the next round.'
    }
    return `Good question. For ${this.options?.focus.replace('_', ' ')}, keep it simple: one clean correction at a time, relaxed shoulders, hands back to guard.`
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }

  simulateInterruption(): void {
    if (this.timer) clearInterval(this.timer)
    this.setState('reconnecting')
    setTimeout(() => {
      if (this.state === 'reconnecting') {
        this.setState('connected')
        this.emit({
          id: makeId(),
          text: 'I’m back. Your recording was not affected — keep going.',
          kind: 'encouragement',
          at_seconds: this.elapsed(),
          created_at: new Date().toISOString(),
        })
        if (this.options) {
          const interval = FREQUENCY_INTERVAL_MS[this.options.frequency]
          this.timer = setInterval(() => this.tick(), interval)
        }
      }
    }, 2500)
  }

  async disconnect(): Promise<void> {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.setState('closed')
  }
}

export function createLiveCoach(): LiveCoachClient {
  return new MockLiveCoach()
}
