import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Loader2,
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useCameraStore } from '@/lib/stores/camera'
import { useAuthStore } from '@/lib/stores/auth'
import { useSessionStore } from '@/lib/stores/session'
import { useSettingsStore } from '@/lib/stores/settings'
import { useMediaRecorder } from '@/lib/hooks/useMediaRecorder'
import { useLiveCoach } from '@/lib/hooks/useLiveCoach'
import { useSessionTimer } from '@/lib/hooks/useSessionTimer'
import { useSpeechRecognition, useSpeechSynthesis } from '@/lib/hooks/useSpeech'
import { saveRecording } from '@/lib/services/storage'
import { analytics } from '@/lib/services/analytics'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/Indicators'
import { formatClock, formatDuration } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { LiveConnectionState } from '@/lib/services/liveCoach'

const CONNECTION_LABEL: Record<LiveConnectionState, string> = {
  idle: 'Offline',
  connecting: 'Connecting',
  connected: 'AI live',
  reconnecting: 'Reconnecting',
  error: 'Connection lost',
  closed: 'Ended',
}

export function WorkoutPage() {
  const navigate = useNavigate()
  const { stream } = useCameraStore()
  const user = useAuthStore((s) => s.user)
  const { activeConfig, startSession, finishSession } = useSessionStore()
  const { voiceEnabled, captionsEnabled, incrementLiveSessions } = useSettingsStore()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'ready' | 'active' | 'paused'>('ready')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const finishingRef = useRef(false)

  const recorder = useMediaRecorder()
  const coach = useLiveCoach()
  const timer = useSessionTimer({
    rounds: activeConfig.rounds,
    roundSeconds: activeConfig.round_seconds,
    restSeconds: activeConfig.rest_seconds,
  })
  const { speak } = useSpeechSynthesis(voiceEnabled && !coach.muted && !coach.nativeAudio)
  const recognition = useSpeechRecognition()

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream
  }, [stream])

  // Speak new coaching lines as they arrive.
  const lastSpokenRef = useRef<string | null>(null)
  useEffect(() => {
    if (!coach.latest) return
    if (coach.latest.id === lastSpokenRef.current) return
    lastSpokenRef.current = coach.latest.id
    if (coach.nativeAudio) return
    speak(coach.latest.text)
  }, [coach.latest, coach.nativeAudio, speak])

  // Rest announcements.
  const lastAnnouncedRef = useRef<string>('')
  useEffect(() => {
    if (phase !== 'active' || timer.phase !== 'rest') return
    const key = `${timer.phase}-${timer.currentRound}`
    if (lastAnnouncedRef.current === key) return
    lastAnnouncedRef.current = key
    speak(`Rest. ${formatClock(timer.phaseRemaining)} remaining.`)
  }, [timer.phase, timer.currentRound, timer.phaseRemaining, phase, speak])

  const finish = useCallback(async () => {
    if (finishingRef.current) return
    finishingRef.current = true
    setFinishing(true)
    const elapsed = timer.elapsed
    timer.pause()
    await coach.disconnect()
    const clip = await recorder.stop()
    const id = sessionId
    if (id) {
      if (clip) {
        try {
          await saveRecording(id, clip.blob, elapsed)
        } catch {
          /* storage may be full; surfaced on completion screen */
        }
      }
      finishSession(id, {
        duration_seconds: elapsed || recorder.elapsed,
        recording_status: clip ? 'saved' : 'failed',
        recording_mime_type: clip?.mimeType ?? null,
        recording_size_bytes: clip?.sizeBytes ?? null,
      })
      analytics.track('recording_completed', { duration_seconds: elapsed })
    }
    setFinishing(false)
    navigate(`/complete?session=${id ?? ''}`, { replace: true })
  }, [timer, coach, recorder, sessionId, finishSession, navigate])

  // Auto-finish when the planned rounds complete.
  useEffect(() => {
    if (timer.phase === 'complete' && phase === 'active') {
      void finish()
    }
  }, [timer.phase, phase, finish])

  // Send recognized questions to the coach.
  useEffect(() => {
    if (recognition.transcript) {
      coach.askQuestion(recognition.transcript, timer.elapsed)
      analytics.track('coaching_response_received')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognition.transcript])

  if (!stream) return <Navigate to="/camera" replace />

  const begin = async () => {
    if (!user) return
    const session = startSession(user.id)
    setSessionId(session.id)
    setPhase('active')
    timer.start()
    recorder.start(stream)
    analytics.track('recording_started', { sport: activeConfig.sport })
    try {
      await coach.connect({
        focus: activeConfig.training_focus,
        level: activeConfig.experience_level,
        frequency: activeConfig.coaching_frequency,
        sport: activeConfig.sport,
        stream,
      })
      analytics.track('live_session_connected')
      incrementLiveSessions()
    } catch {
      /* recording continues without live coaching */
    }
  }

  const pause = () => {
    timer.pause()
    setPhase('paused')
  }
  const resume = () => {
    timer.resume()
    setPhase('active')
  }

  const connected = coach.state === 'connected'
  const connectionTone: 'sage' | 'amber' | 'seal' =
    connected ? 'sage' : coach.state === 'reconnecting' ? 'amber' : 'seal'

  const ask = () => {
    if (recognition.listening) recognition.stop()
    else recognition.start()
  }

  return (
    <div className="relative flex h-[100dvh] flex-col bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-transparent to-paper/85" />

      <div className="pt-safe relative flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {phase !== 'ready' && (
              <Badge tone="seal" icon={<StatusDot tone="seal" pulse />}>
                REC {formatClock(timer.elapsed)}
              </Badge>
            )}
            <Badge tone={connectionTone}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {CONNECTION_LABEL[coach.state]}
            </Badge>
          </div>
          <span className="rounded-full border border-ink/10 bg-paper-white/85 px-3 py-1 text-xs font-semibold text-ink backdrop-blur">
            {activeConfig.rounds > 1
              ? `Round ${timer.currentRound}/${timer.totalRounds}`
              : 'Free round'}
          </span>
        </div>

        {phase !== 'ready' && (
          <div className="mt-4 flex flex-col items-center">
            <span
              className={cn(
                'rounded-2xl bg-paper-white/80 px-5 py-1 font-display text-5xl font-black tabular-nums backdrop-blur',
                timer.phase === 'rest' ? 'text-sage-deep' : 'text-ink',
              )}
            >
              {formatClock(timer.phaseRemaining)}
            </span>
            <span className="mt-2 rounded-full bg-paper-white/70 px-3 py-0.5 text-xs font-semibold uppercase tracking-[0.3em] text-ink/70 backdrop-blur">
              {timer.phase === 'rest' ? 'Rest' : 'Fight'}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {captionsEnabled && coach.latest && (
          <div className="mb-4 animate-fade-up rounded-2xl border border-ink/10 bg-paper-white/95 p-4 shadow-soft backdrop-blur">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-seal-deep">
              <Volume2 size={12} /> Coach
            </p>
            <p className="font-display text-xl font-bold leading-snug text-ink">
              {coach.latest.text}
            </p>
          </div>
        )}

        {phase === 'ready' && (
          <div className="mb-4 flex flex-col items-center gap-3 rounded-3xl border border-ink/10 bg-paper-white/95 p-6 text-center shadow-soft backdrop-blur">
            <p className="font-display text-lg font-bold text-ink">Ready when you are</p>
            <p className="text-sm text-ink/70">
              {formatDuration(activeConfig.duration_seconds)} · {activeConfig.rounds} rounds ·
              coaching {activeConfig.coaching_frequency}
            </p>
            <Button size="xl" onClick={() => void begin()} className="mt-1 w-full">
              <Play size={26} /> START
            </Button>
            <p className="text-xs text-muted">
              Recording starts on the device and is saved locally first.
            </p>
          </div>
        )}

        {phase !== 'ready' && (
          <div className="pb-safe grid grid-cols-4 gap-2">
            <ControlButton
              label={coach.muted ? 'Unmute' : 'Mute'}
              icon={coach.muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              onClick={() => coach.setMuted(!coach.muted)}
            />
            <ControlButton
              label={recognition.listening ? 'Listening' : 'Ask'}
              icon={recognition.listening ? <Mic size={22} /> : <MicOff size={22} />}
              onClick={ask}
              active={recognition.listening}
            />
            {phase === 'active' ? (
              <ControlButton label="Pause" icon={<Pause size={22} />} onClick={pause} />
            ) : (
              <ControlButton label="Resume" icon={<Play size={22} />} onClick={resume} />
            )}
            <ControlButton
              label="Finish"
              icon={
                finishing ? <Loader2 size={22} className="animate-spin" /> : <Square size={22} />
              }
              onClick={() => void finish()}
              tone="seal"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ControlButton({
  label,
  icon,
  onClick,
  active,
  tone = 'default',
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
  tone?: 'default' | 'seal'
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-2xl border py-3 text-[11px] font-medium shadow-soft backdrop-blur transition-colors focus-ring',
        tone === 'seal'
          ? 'border-seal/50 bg-seal text-paper-white'
          : active
            ? 'border-sage/50 bg-sage text-paper-white'
            : 'border-ink/15 bg-paper-white/90 text-ink/80',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
