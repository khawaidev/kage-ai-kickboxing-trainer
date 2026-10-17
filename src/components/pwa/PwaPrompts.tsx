import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download, RefreshCw, X } from 'lucide-react'
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt'
import { useSettingsStore } from '@/lib/stores/settings'
import { Button } from '@/components/ui/Button'

export function PwaPrompts() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const { canInstall, promptInstall } = useInstallPrompt()
  const { installPromptDismissed, dismissInstallPrompt } = useSettingsStore()
  const [updateCountdown, setUpdateCountdown] = useState(4)

  useEffect(() => {
    if (!needRefresh) return
    const interval = setInterval(() => {
      setUpdateCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          void updateServiceWorker(true)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [needRefresh, updateServiceWorker])

  return (
    <>
      {needRefresh && (
        <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-lg p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-seal/40 bg-paper-white p-3 shadow-seal">
            <RefreshCw size={18} className="text-seal" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-ink">New version available</p>
              <p className="text-muted">Updating in {updateCountdown}s…</p>
            </div>
            <Button size="sm" onClick={() => void updateServiceWorker(true)}>
              Update
            </Button>
          </div>
        </div>
      )}

      {canInstall && !installPromptDismissed && !needRefresh && (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-lg px-3">
          <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper-white p-3 shadow-soft">
            <Download size={18} className="text-sage-deep" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-ink">Install KAGE</p>
              <p className="text-muted">Add to your home screen for full-screen training.</p>
            </div>
            <Button size="sm" variant="ink" onClick={() => void promptInstall()}>
              Install
            </Button>
            <button
              onClick={dismissInstallPrompt}
              aria-label="Dismiss"
              className="rounded-full p-1.5 text-muted hover:bg-ink/5 focus-ring"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
