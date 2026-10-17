import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Camera,
  Check,
  Mic,
  Move3d,
  Sun,
  UserX,
  Users,
} from 'lucide-react'
import { useCameraStore } from '@/lib/stores/camera'
import { useSettingsStore } from '@/lib/stores/settings'
import { analytics } from '@/lib/services/analytics'
import { getStorageEstimate, type StorageEstimate } from '@/lib/services/storage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatBytes } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

const CHECKLIST = [
  { id: 'body', icon: Move3d, label: 'Entire body in frame' },
  { id: 'light', icon: Sun, label: 'Adequate lighting' },
  { id: 'stable', icon: Camera, label: 'Camera stable' },
  { id: 'space', icon: Move3d, label: 'Room to move' },
  { id: 'alone', icon: Users, label: 'No one else visible' },
] as const

export function CameraSetupPage() {
  const navigate = useNavigate()
  const { stream, status, error, start } = useCameraStore()
  const voiceEnabled = useSettingsStore((s) => s.voiceEnabled)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    void getStorageEstimate().then(setEstimate)
  }, [])

  const storageOk = useMemo(() => {
    if (!estimate || !estimate.supported || estimate.quota === 0) return true
    return estimate.quota - estimate.usage > 300 * 1024 * 1024
  }, [estimate])

  const enable = async () => {
    const media = await start({ audio: voiceEnabled, facingMode: 'environment' })
    if (media) analytics.track('camera_permission_granted')
    else analytics.track('camera_permission_denied')
  }

  const doneCount = CHECKLIST.filter((c) => checks[c.id]).length

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Camera setup" subtitle="Position your phone, then check the frame." back />

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-ink/10 bg-black">
        {stream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <FramingGuide />
            <div className="absolute left-3 top-3">
              <Badge tone="sage">Live preview</Badge>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-paper-deep p-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-ink/5">
              {status === 'denied' ? (
                <UserX className="text-seal-deep" size={28} />
              ) : (
                <Camera className="text-ink/70" size={28} />
              )}
            </div>
            <div>
              <p className="font-display text-lg font-bold">
                {status === 'denied' ? 'Camera access blocked' : 'Enable your camera'}
              </p>
              <p className="mt-1 text-sm text-muted">
                {status === 'denied'
                  ? 'Open your browser settings, allow camera and microphone for this site, then try again.'
                  : 'Tap below and allow camera access. Nothing is recorded until you start the session.'}
              </p>
            </div>
            {error && status !== 'denied' && (
              <p className="flex items-center gap-1.5 text-xs text-seal-deep">
                <AlertTriangle size={13} /> {error}
              </p>
            )}
            <Button onClick={() => void enable()} disabled={status === 'requesting'}>
              {status === 'requesting' ? 'Requesting…' : 'Enable camera'}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink/80">Setup checklist</h2>
          <span className="text-xs text-muted">
            {doneCount}/{CHECKLIST.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CHECKLIST.map(({ id, icon: Icon, label }) => {
            const active = !!checks[id]
            return (
              <button
                key={id}
                onClick={() => setChecks((c) => ({ ...c, [id]: !c[id] }))}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition-colors focus-ring',
                  active
                    ? 'border-sage/40 bg-sage/10 text-ink'
                    : 'border-ink/10 bg-ink/5 text-ink/70',
                )}
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-ink/5">
                  {active ? <Check size={14} className="text-sage-deep" /> : <Icon size={14} />}
                </span>
                {label}
              </button>
            )
          })}
          <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2.5 text-left text-xs text-ink/70">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-ink/5">
              <Mic size={14} />
            </span>
            {voiceEnabled && stream?.getAudioTracks().length
              ? 'Microphone ready'
              : voiceEnabled
                ? 'Microphone on enable'
                : 'Voice coaching off'}
          </div>
        </div>
      </div>

      {estimate?.supported && (
        <Card className="mt-4 flex items-center justify-between text-xs">
          <span className="text-muted">Local storage available</span>
          <span className={storageOk ? 'text-sage-deep' : 'text-seal-deep'}>
            {formatBytes(Math.max(0, estimate.quota - estimate.usage))}
            {!storageOk && ' · low'}
          </span>
        </Card>
      )}

      <div className="sticky bottom-24 mt-6">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/workout')}
          disabled={!stream || !storageOk}
        >
          Start session
        </Button>
        {!storageOk && (
          <p className="mt-2 text-center text-xs text-seal-deep">
            Not enough local storage for a 15-minute recording.
          </p>
        )}
      </div>
    </div>
  )
}

function FramingGuide() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 300 400"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M150 70c-24 0-40 18-40 44 0 14 6 26 6 34 0 10-14 18-14 40 0 40 20 70 48 70s48-30 48-70c0-22-14-30-14-40 0-8 6-20 6-34 0-26-16-44-40-44z"
        fill="none"
        stroke="#F4F0E7"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeDasharray="6 8"
      />
      <line x1="0" y1="140" x2="300" y2="140" stroke="#F4F0E7" strokeOpacity="0.12" />
      <line x1="0" y1="280" x2="300" y2="280" stroke="#F4F0E7" strokeOpacity="0.12" />
      <line x1="100" y1="0" x2="100" y2="400" stroke="#F4F0E7" strokeOpacity="0.08" />
      <line x1="200" y1="0" x2="200" y2="400" stroke="#F4F0E7" strokeOpacity="0.08" />
    </svg>
  )
}
