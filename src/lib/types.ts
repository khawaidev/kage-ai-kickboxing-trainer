import { z } from 'zod'

export const SPORTS = ['boxing', 'kickboxing'] as const
export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export const SESSION_TYPES = ['shadowboxing', 'heavy_bag'] as const
export const TRAINING_FOCUSES = [
  'guard',
  'balance',
  'punch_technique',
  'combinations',
  'fundamentals',
] as const
export const COACHING_FREQUENCIES = ['minimal', 'balanced', 'frequent'] as const

export const sportSchema = z.enum(SPORTS)
export const experienceLevelSchema = z.enum(EXPERIENCE_LEVELS)
export const sessionTypeSchema = z.enum(SESSION_TYPES)
export const trainingFocusSchema = z.enum(TRAINING_FOCUSES)
export const coachingFrequencySchema = z.enum(COACHING_FREQUENCIES)

export type Sport = z.infer<typeof sportSchema>
export type ExperienceLevel = z.infer<typeof experienceLevelSchema>
export type SessionType = z.infer<typeof sessionTypeSchema>
export type TrainingFocus = z.infer<typeof trainingFocusSchema>
export type CoachingFrequency = z.infer<typeof coachingFrequencySchema>

export const recordingStatusSchema = z.enum([
  'idle',
  'recording',
  'saved',
  'failed',
  'discarded',
])
export const analysisStatusSchema = z.enum([
  'none',
  'pending',
  'processing',
  'completed',
  'failed',
])
export type RecordingStatus = z.infer<typeof recordingStatusSchema>
export type AnalysisStatus = z.infer<typeof analysisStatusSchema>

export const confidenceSchema = z.enum(['high', 'medium', 'low'])
export type Confidence = z.infer<typeof confidenceSchema>

export const validationStatusSchema = z.enum([
  'supported',
  'preliminary',
  'inconclusive',
])
export type ValidationStatus = z.infer<typeof validationStatusSchema>

/** PRD §7.5 — analysis evidence schema. */
export const findingSchema = z.object({
  finding_id: z.string(),
  category: z.string(),
  observation: z.string(),
  evidence_start_seconds: z.number().nonnegative(),
  evidence_end_seconds: z.number().nonnegative(),
  confidence: confidenceSchema,
  limitations: z.string(),
  correction: z.string(),
  recommended_drill: z.string(),
  validation_status: validationStatusSchema,
})
export type Finding = z.infer<typeof findingSchema>

export const drillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  duration_minutes: z.number().positive(),
})
export type Drill = z.infer<typeof drillSchema>

export const reportSchema = z.object({
  id: z.string(),
  session_id: z.string(),
  summary: z.string(),
  strengths: z.array(findingSchema),
  corrections: z.array(findingSchema),
  drills: z.array(drillSchema),
  next_focus: z.string(),
  limitations: z.array(z.string()),
  model_version: z.string(),
  analysis_version: z.string(),
  created_at: z.string(),
})
export type Report = z.infer<typeof reportSchema>

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  display_name: z.string(),
  experience_level: experienceLevelSchema,
  preferred_sport: sportSchema,
  preferred_language: z.string(),
  created_at: z.string(),
})
export type User = z.infer<typeof userSchema>

export const sessionConfigSchema = z.object({
  sport: sportSchema,
  experience_level: experienceLevelSchema,
  session_type: sessionTypeSchema,
  training_focus: trainingFocusSchema,
  coaching_frequency: coachingFrequencySchema,
  duration_seconds: z.number().int().positive(),
  rounds: z.number().int().positive(),
  round_seconds: z.number().int().positive(),
  rest_seconds: z.number().int().nonnegative(),
})
export type SessionConfig = z.infer<typeof sessionConfigSchema>

export const trainingSessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  config: sessionConfigSchema,
  started_at: z.string(),
  ended_at: z.string().nullable(),
  duration_seconds: z.number().nonnegative(),
  recording_status: recordingStatusSchema,
  analysis_status: analysisStatusSchema,
  recording_mime_type: z.string().nullable().optional(),
  recording_size_bytes: z.number().nonnegative().nullable().optional(),
  created_at: z.string(),
})
export type TrainingSession = z.infer<typeof trainingSessionSchema>

export const subscriptionPlanSchema = z.enum(['free', 'pro_monthly', 'pro_annual'])
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>

export const subscriptionSchema = z.object({
  plan: subscriptionPlanSchema,
  status: z.enum(['active', 'cancelled', 'past_due']),
  current_period_end: z.string().nullable(),
})
export type Subscription = z.infer<typeof subscriptionSchema>

export interface UsageLimits {
  plan: SubscriptionPlan
  analyses_used: number
  analyses_limit: number
  live_sessions_used: number
  live_sessions_limit: number
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  sport: 'boxing',
  experience_level: 'beginner',
  session_type: 'shadowboxing',
  training_focus: 'fundamentals',
  coaching_frequency: 'balanced',
  duration_seconds: 15 * 60,
  rounds: 3,
  round_seconds: 180,
  rest_seconds: 60,
}

export const METRIC_LABELS: Record<Sport, string> = {
  boxing: 'Boxing',
  kickboxing: 'Kickboxing',
}

export function labelize(value: string): string {
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
