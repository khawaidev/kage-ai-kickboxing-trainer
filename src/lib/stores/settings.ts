import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Subscription, UsageLimits } from '@/lib/types'

interface SettingsState {
  voiceEnabled: boolean
  captionsEnabled: boolean
  safetyAcknowledged: boolean
  recordConsent: boolean
  onboardingCompleted: boolean
  installPromptDismissed: boolean
  subscription: Subscription
  usage: UsageLimits

  setVoiceEnabled: (v: boolean) => void
  setCaptionsEnabled: (v: boolean) => void
  acknowledgeSafety: () => void
  setRecordConsent: (v: boolean) => void
  completeOnboarding: () => void
  dismissInstallPrompt: () => void
  setPlan: (plan: Subscription['plan']) => void
  incrementAnalyses: () => void
  incrementLiveSessions: () => void
  reset: () => void
}

const PLAN_LIMITS: Record<
  Subscription['plan'],
  { analyses: number; live: number }
> = {
  free: { analyses: 2, live: 5 },
  pro_monthly: { analyses: 30, live: 100 },
  pro_annual: { analyses: 30, live: 100 },
}

const initialSubscription: Subscription = {
  plan: 'free',
  status: 'active',
  current_period_end: null,
}

const initialUsage: UsageLimits = {
  plan: 'free',
  analyses_used: 0,
  analyses_limit: PLAN_LIMITS.free.analyses,
  live_sessions_used: 0,
  live_sessions_limit: PLAN_LIMITS.free.live,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      voiceEnabled: true,
      captionsEnabled: true,
      safetyAcknowledged: false,
      recordConsent: false,
      onboardingCompleted: false,
      installPromptDismissed: false,
      subscription: initialSubscription,
      usage: initialUsage,

      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setCaptionsEnabled: (v) => set({ captionsEnabled: v }),
      acknowledgeSafety: () => set({ safetyAcknowledged: true }),
      setRecordConsent: (v) => set({ recordConsent: v }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      dismissInstallPrompt: () => set({ installPromptDismissed: true }),

      setPlan: (plan) =>
        set((s) => ({
          subscription: {
            ...s.subscription,
            plan,
            current_period_end:
              plan === 'free'
                ? null
                : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          },
          usage: {
            ...s.usage,
            plan,
            analyses_limit: PLAN_LIMITS[plan].analyses,
            live_sessions_limit: PLAN_LIMITS[plan].live,
          },
        })),

      incrementAnalyses: () =>
        set((s) => ({
          usage: { ...s.usage, analyses_used: s.usage.analyses_used + 1 },
        })),
      incrementLiveSessions: () =>
        set((s) => ({
          usage: { ...s.usage, live_sessions_used: s.usage.live_sessions_used + 1 },
        })),

      reset: () =>
        set({
          voiceEnabled: true,
          captionsEnabled: true,
          safetyAcknowledged: false,
          recordConsent: false,
          onboardingCompleted: false,
          installPromptDismissed: false,
          subscription: initialSubscription,
          usage: initialUsage,
        }),
    }),
    { name: 'kage.settings', version: 1 },
  ),
)

export function hasAnalysisQuota(usage: UsageLimits): boolean {
  return usage.analyses_used < usage.analyses_limit
}
