import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useSessionStore } from '@/lib/stores/session'
import type { ExperienceLevel, SessionConfig, Sport, TrainingFocus } from '@/lib/types'

export const INTAKE_GOALS = [
  'get_fit',
  'learn_technique',
  'improve_fitness',
  'competition',
  'stress_relief',
] as const
export type IntakeGoal = (typeof INTAKE_GOALS)[number]

export const INTAKE_CADENCE = ['never', 'sometimes', 'weekly', 'most_days'] as const
export type IntakeCadence = (typeof INTAKE_CADENCE)[number]

export const GOAL_LABELS: Record<IntakeGoal, string> = {
  get_fit: 'Get fit',
  learn_technique: 'Learn technique',
  improve_fitness: 'Improve fitness',
  competition: 'Compete',
  stress_relief: 'Stress relief',
}

export const CADENCE_LABELS: Record<IntakeCadence, string> = {
  never: 'New to this',
  sometimes: 'Now and then',
  weekly: 'Weekly',
  most_days: 'Most days',
}

interface IntakeState {
  goal: IntakeGoal | null
  sport: Sport
  experience: ExperienceLevel
  cadence: IntakeCadence | null
  focus: TrainingFocus
  coaching: SessionConfig['coaching_frequency']
  completed: boolean

  set: (patch: Partial<Omit<IntakeState, 'set' | 'reset' | 'applyToConfig'>>) => void
  applyToConfig: () => void
  reset: () => void
}

const ROUNDS_BY_LEVEL: Record<ExperienceLevel, { rounds: number; round: number }> = {
  beginner: { rounds: 3, round: 180 },
  intermediate: { rounds: 4, round: 180 },
  advanced: { rounds: 5, round: 180 },
}

export const useIntakeStore = create<IntakeState>()(
  persist(
    (set, get) => ({
      goal: null,
      sport: 'boxing',
      experience: 'beginner',
      cadence: null,
      focus: 'fundamentals',
      coaching: 'balanced',
      completed: false,

      set: (patch) => set(patch),

      applyToConfig: () => {
        const { sport, experience, focus, coaching } = get()
        const { rounds, round } = ROUNDS_BY_LEVEL[experience]
        const rest = 60
        const config: Partial<SessionConfig> = {
          sport,
          experience_level: experience,
          training_focus: focus,
          coaching_frequency: coaching,
          rounds,
          round_seconds: round,
          rest_seconds: rest,
          duration_seconds: rounds * round + (rounds - 1) * rest,
        }
        useSessionStore.getState().setActiveConfig(config)
      },

      reset: () =>
        set({
          goal: null,
          sport: 'boxing',
          experience: 'beginner',
          cadence: null,
          focus: 'fundamentals',
          coaching: 'balanced',
          completed: false,
        }),
    }),
    { name: 'kage.intake', version: 1 },
  ),
)
