import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, RotateCcw, Sparkles, Trash2, Video } from 'lucide-react'
import { useSessionStore } from '@/lib/stores/session'
import { useSettingsStore } from '@/lib/stores/settings'
import { useAuthStore } from '@/lib/stores/auth'
import { useCameraStore } from '@/lib/stores/camera'
import { deleteRecording, getRecording } from '@/lib/services/storage'
import { saveRecordingMeta, uploadRecording } from '@/lib/services/repository'
import { analytics } from '@/lib/services/analytics'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatBytes, formatDuration } from '@/lib/utils/format'

export function CompletionPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const sessions = useSessionStore((s) => s.sessions)
  const setRecordingStatus = useSessionStore((s) => s.setRecordingStatus)
  const user = useAuthStore((s) => s.user)
  const { recordConsent, setRecordConsent } = useSettingsStore()
  const stopCamera = useCameraStore((s) => s.stop)

  const sessionId = params.get('session') ?? sessions[0]?.id ?? null
  const session = sessions.find((s) => s.id === sessionId)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sizeBytes, setSizeBytes] = useState<number | null>(null)
  const [consent, setConsent] = useState(recordConsent)
  const [discarded, setDiscarded] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    stopCamera()
  }, [stopCamera])

  useEffect(() => {
    let url: string | null = null
    let active = true
    if (sessionId) {
      void getRecording(sessionId).then((rec) => {
        if (!active || !rec) return
        url = URL.createObjectURL(rec.blob)
        setPreviewUrl(url)
        setSizeBytes(rec.size_bytes)
      })
    }
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [sessionId])

  if (!session) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Session complete" back />
        <Card>
          <p className="text-sm text-muted">This session could not be found.</p>
          <Link to="/dashboard">
            <Button className="mt-3" fullWidth>
              Back to dashboard
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const saved = session.recording_status === 'saved' && previewUrl && !discarded

  const analyse = async () => {
    setRecordConsent(consent)
    setBusy(true)
    try {
      const rec = await getRecording(session.id)
      if (rec && user) {
        const uploaded = await uploadRecording(
          user.id,
          session.id,
          rec.blob,
          rec.mime_type || 'video/webm',
        )
        if (uploaded) {
          await saveRecordingMeta(session.id, {
            storage_key: uploaded.storage_key,
            mime_type: rec.mime_type || 'video/webm',
            size_bytes: rec.size_bytes,
            duration_seconds: session.duration_seconds,
          })
        }
      }
      setRecordingStatus(session.id, 'saved')
      analytics.track('recording_upload_completed')
      navigate(`/processing/${session.id}`)
    } finally {
      setBusy(false)
    }
  }

  const discard = async () => {
    await deleteRecording(session.id)
    setRecordingStatus(session.id, 'discarded')
    setDiscarded(true)
    setPreviewUrl(null)
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Session complete"
        subtitle={formatDuration(session.duration_seconds)}
        back
      />

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-ink/10 bg-black">
        {previewUrl ? (
          <video src={previewUrl} controls playsInline className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-paper-deep text-muted">
            <Video size={28} />
            <p className="text-sm">
              {discarded ? 'Recording discarded' : 'Recording could not be saved'}
            </p>
          </div>
        )}
      </div>

      <Card className="mt-4 flex items-center gap-3">
        {saved ? (
          <>
            <CheckCircle2 className="text-sage-deep" size={22} />
            <div className="flex-1">
              <p className="text-sm font-semibold">Recording saved locally</p>
              <p className="text-xs text-muted">
                {formatDuration(session.duration_seconds)}
                {sizeBytes ? ` · ${formatBytes(sizeBytes)}` : ''}
                {session.recording_mime_type ? ` · ${session.recording_mime_type}` : ''}
              </p>
            </div>
            <Badge tone="sage">Saved</Badge>
          </>
        ) : (
          <>
            <Video className="text-seal-deep" size={22} />
            <div className="flex-1">
              <p className="text-sm font-semibold">No usable recording</p>
              <p className="text-xs text-muted">
                Your live session was not lost — you can still start another.
              </p>
            </div>
            <Badge tone="muted">
              {discarded ? 'Discarded' : session.recording_status}
            </Badge>
          </>
        )}
      </Card>

      {saved && (
        <>
          <Card className="mt-4">
            <p className="text-sm font-semibold">Send for AI analysis</p>
            <p className="mt-1 text-xs text-muted">
              The recording is uploaded privately to produce a report with timestamped evidence.
              Only you can access it, and you can delete it anytime.
            </p>
            <label className="mt-3 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-seal"
              />
              <span className="text-xs text-ink/80">
                I consent to uploading this recording for AI analysis. External AI services
                process it.
              </span>
            </label>
            <Button
              size="lg"
              fullWidth
              className="mt-4"
              disabled={!consent || busy}
              onClick={() => void analyse()}
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Analyse recording
                </>
              )}
            </Button>
          </Card>

          <div className="mt-4 flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => navigate('/configure')}>
              <RotateCcw size={16} /> Train again
            </Button>
            <Button variant="danger" fullWidth onClick={() => void discard()}>
              <Trash2 size={16} /> Delete video
            </Button>
          </div>
        </>
      )}

      {!saved && (
        <div className="mt-4 flex gap-2">
          <Link to="/configure" className="flex-1">
            <Button fullWidth>
              <RotateCcw size={16} /> Start another session
            </Button>
          </Link>
          <Link to="/dashboard" className="flex-1">
            <Button variant="secondary" fullWidth>
              Dashboard
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
