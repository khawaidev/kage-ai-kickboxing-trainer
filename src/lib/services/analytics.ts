export type AnalyticsEvent =
  | 'signup_completed'
  | 'intake_completed'
  | 'onboarding_completed'
  | 'workout_configured'
  | 'camera_permission_granted'
  | 'camera_permission_denied'
  | 'recording_started'
  | 'recording_completed'
  | 'live_session_connected'
  | 'live_session_interrupted'
  | 'coaching_response_received'
  | 'recording_upload_completed'
  | 'analysis_started'
  | 'analysis_completed'
  | 'report_opened'
  | 'report_feedback_submitted'
  | 'second_session_started'
  | 'subscription_started'
  | 'subscription_cancelled'

export interface Analytics {
  track(event: AnalyticsEvent, props?: Record<string, unknown>): void
}

const PRIVATE_KEY_PATTERN = /video|audio|transcript|blob|url|email/i

/**
 * ConsoleAnalytics — a privacy-conscious stand-in. Never forward raw video,
 * audio, transcripts or personal content to a third party (PRD §15).
 */
class ConsoleAnalytics implements Analytics {
  track(event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
    const safe: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(props)) {
      if (PRIVATE_KEY_PATTERN.test(key)) continue
      safe[key] = value
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`[analytics] ${event}`, safe)
    }
  }
}

export const analytics: Analytics = new ConsoleAnalytics()
