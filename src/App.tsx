import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/lib/stores/auth'
import { useSessionStore } from '@/lib/stores/session'
import { useSettingsStore } from '@/lib/stores/settings'
import { AppLayout } from '@/components/layout/AppLayout'

import { LandingPage } from '@/features/landing/LandingPage'
import { IntakePage } from '@/features/intake/IntakePage'
import { AuthPage } from '@/features/auth/AuthPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ConfigurePage } from '@/features/configure/ConfigurePage'
import { CameraSetupPage } from '@/features/camera/CameraSetupPage'
import { WorkoutPage } from '@/features/workout/WorkoutPage'
import { CompletionPage } from '@/features/completion/CompletionPage'
import { ProcessingPage } from '@/features/processing/ProcessingPage'
import { ReportPage } from '@/features/report/ReportPage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { ProgressPage } from '@/features/progress/ProgressPage'
import { BillingPage } from '@/features/billing/BillingPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper">
      <div className="flex flex-col items-center gap-3">
        <span className="font-brush text-4xl text-seal animate-pulse-rec">影</span>
        <span className="text-sm text-muted">Loading KAGE…</span>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()
  if (status === 'loading') return <FullScreenLoader />
  if (status === 'unauthenticated') {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const completed = useSettingsStore((s) => s.onboardingCompleted)
  if (!completed) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

const IMMERSIVE_ROUTES = ['/camera', '/workout']
const BARE_ROUTES = ['/', '/start', '/auth', '/onboarding']

export function App() {
  const init = useAuthStore((s) => s.init)
  const userId = useAuthStore((s) => s.user?.id)
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const location = useLocation()
  const immersive = IMMERSIVE_ROUTES.some((r) => location.pathname.startsWith(r))
  const bare = BARE_ROUTES.includes(location.pathname)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    if (userId) void hydrateSessions(userId)
  }, [userId, hydrateSessions])

  return (
    <AppLayout immersive={immersive} noPadding={immersive} bare={bare}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/start" element={<IntakePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <RequireOnboarding>
                <DashboardPage />
              </RequireOnboarding>
            </RequireAuth>
          }
        />
        <Route
          path="/configure"
          element={
            <RequireAuth>
              <ConfigurePage />
            </RequireAuth>
          }
        />
        <Route
          path="/camera"
          element={
            <RequireAuth>
              <CameraSetupPage />
            </RequireAuth>
          }
        />
        <Route
          path="/workout"
          element={
            <RequireAuth>
              <WorkoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/complete"
          element={
            <RequireAuth>
              <CompletionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/processing/:sessionId"
          element={
            <RequireAuth>
              <ProcessingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/report/:sessionId"
          element={
            <RequireAuth>
              <ReportPage />
            </RequireAuth>
          }
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <RequireOnboarding>
                <HistoryPage />
              </RequireOnboarding>
            </RequireAuth>
          }
        />
        <Route
          path="/progress"
          element={
            <RequireAuth>
              <RequireOnboarding>
                <ProgressPage />
              </RequireOnboarding>
            </RequireAuth>
          }
        />
        <Route
          path="/billing"
          element={
            <RequireAuth>
              <BillingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <SettingsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}
