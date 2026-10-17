import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { AlertTriangle, LogOut, ShieldCheck, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useSettingsStore } from '@/lib/stores/settings'
import { useSessionStore } from '@/lib/stores/session'
import { deleteRecording, listRecordingIds } from '@/lib/services/storage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Sheet } from '@/components/ui/Sheet'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  EXPERIENCE_LEVELS,
  SPORTS,
  labelize,
  type ExperienceLevel,
  type Sport,
} from '@/lib/types'

const APP_VERSION = '0.1.0'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, updateProfile, signOut, deleteAccount } = useAuthStore()
  const settings = useSettingsStore()
  const { sessions, clearAll } = useSessionStore()

  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [showDelete, setShowDelete] = useState(false)
  const [recordingCount, setRecordingCount] = useState(0)

  useEffect(() => {
    void listRecordingIds().then((ids) => setRecordingCount(ids.length))
  }, [])

  const saveName = async () => {
    if (displayName.trim()) await updateProfile({ display_name: displayName.trim() })
  }

  const signOutNow = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const wipeRecordings = async () => {
    const ids = await listRecordingIds()
    await Promise.all(ids.map((id) => deleteRecording(id)))
    setRecordingCount(0)
  }

  const destroyAccount = async () => {
    const ids = await listRecordingIds()
    await Promise.all(ids.map((id) => deleteRecording(id)))
    clearAll()
    settings.reset()
    await deleteAccount()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Account" subtitle={user?.email} />

      <section className="space-y-4">
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-ink/80">Profile</h2>
          <Field label="Display name">
            <div className="flex gap-2">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onBlur={() => void saveName()}
                className="h-11 flex-1 rounded-xl border border-ink/10 bg-ink/5 px-3 text-ink focus-ring"
              />
              <Button variant="secondary" onClick={() => void saveName()}>
                Save
              </Button>
            </div>
          </Field>

          <Field label="Preferred sport">
            <Toggle
              options={SPORTS.map((s) => ({ value: s, label: labelize(s) }))}
              value={user?.preferred_sport ?? 'boxing'}
              onChange={(v) => void updateProfile({ preferred_sport: v as Sport })}
            />
          </Field>

          <Field label="Experience level">
            <Toggle
              options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: labelize(l) }))}
              value={user?.experience_level ?? 'beginner'}
              onChange={(v) => void updateProfile({ experience_level: v as ExperienceLevel })}
            />
          </Field>

          <Field label="Language">
            <select
              value={user?.preferred_language ?? 'en'}
              onChange={(e) => void updateProfile({ preferred_language: e.target.value })}
              className="h-11 w-full rounded-xl border border-ink/10 bg-ink/5 px-3 text-ink focus-ring"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="es">Español</option>
            </select>
          </Field>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-ink/80">Coaching</h2>
          <Switch
            label="Voice coaching"
            description="Speak coaching lines aloud during sessions"
            checked={settings.voiceEnabled}
            onChange={settings.setVoiceEnabled}
          />
          <Switch
            label="On-screen captions"
            description="Show the latest coaching line on screen"
            checked={settings.captionsEnabled}
            onChange={settings.setCaptionsEnabled}
          />
        </Card>

        <Card className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink/80">
            <ShieldCheck size={15} className="text-sage-deep" /> Privacy &amp; data
          </h2>
          <Switch
            label="Analysis upload consent"
            description="Allow uploading recordings for AI analysis"
            checked={settings.recordConsent}
            onChange={settings.setRecordConsent}
          />
          <div className="flex items-center justify-between rounded-xl bg-ink/5 p-3">
            <div>
              <p className="text-sm font-medium">Stored recordings</p>
              <p className="text-xs text-muted">{recordingCount} on this device</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              disabled={recordingCount === 0}
              onClick={() => void wipeRecordings()}
            >
              <Trash2 size={14} /> Delete
            </Button>
          </div>
          <p className="text-xs text-muted">
            Recordings are kept private and are never published through public links. Sessions on
            this device: {sessions.length}.
          </p>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-ink/80">About</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">App version</span>
            <Badge tone="muted">{APP_VERSION}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Build date</span>
            <span className="text-ink/70">{format(new Date(), 'd MMM yyyy')}</span>
          </div>
          <p className="pt-1 text-xs text-muted">
            AI feedback can be wrong, misses fast movement, and is not a substitute for a qualified
            coach. Stop if you feel pain or dizziness.
          </p>
        </Card>

        <Card className="space-y-2">
          <Button variant="secondary" fullWidth onClick={() => void signOutNow()}>
            <LogOut size={16} /> Sign out
          </Button>
          <Button variant="danger" fullWidth onClick={() => setShowDelete(true)}>
            <AlertTriangle size={16} /> Delete account &amp; data
          </Button>
        </Card>
      </section>

      <Sheet open={showDelete} onClose={() => setShowDelete(false)} title="Delete account">
        <p className="text-sm text-ink/80">
          This removes your profile, session history, reports and all locally stored recordings.
          This cannot be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={() => void destroyAccount()}>
            Delete everything
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}

function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="flex w-full items-center justify-between gap-3 rounded-xl p-1 text-left focus-ring"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-seal' : 'bg-ink/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper-white transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

function Toggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-ink/5 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors focus-ring ${
            value === o.value ? 'bg-seal text-paper-white' : 'text-ink/60'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
