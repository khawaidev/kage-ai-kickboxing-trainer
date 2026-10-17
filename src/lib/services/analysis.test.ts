import { describe, expect, it } from 'vitest'
import { analysisService } from '@/lib/services/analysis'
import { reportSchema, type TrainingSession } from '@/lib/types'

const session: TrainingSession = {
  id: 'session_test_1',
  user_id: 'u1',
  config: {
    sport: 'boxing',
    experience_level: 'beginner',
    session_type: 'shadowboxing',
    training_focus: 'guard',
    coaching_frequency: 'balanced',
    duration_seconds: 600,
    rounds: 3,
    round_seconds: 180,
    rest_seconds: 60,
  },
  started_at: new Date().toISOString(),
  ended_at: new Date().toISOString(),
  duration_seconds: 600,
  recording_status: 'saved',
  analysis_status: 'processing',
  created_at: new Date().toISOString(),
}

describe('mock analysis service', () => {
  it(
    'produces a schema-valid report with evidence inside the timeline',
    async () => {
      const report = await analysisService.runAnalysis(session, () => {})
      expect(reportSchema.safeParse(report).success).toBe(true)
      for (const finding of report.corrections) {
        expect(finding.evidence_start_seconds).toBeLessThanOrEqual(600)
        expect(finding.evidence_end_seconds).toBeGreaterThanOrEqual(
          finding.evidence_start_seconds,
        )
      }
      expect(report.corrections.length).toBeGreaterThan(0)
      expect(report.limitations.length).toBeGreaterThan(0)
    },
    30_000,
  )

  it(
    'stores the report for later retrieval',
    async () => {
      await analysisService.runAnalysis({ ...session, id: 'session_test_2' }, () => {})
      expect(analysisService.getReport('session_test_2')).not.toBeNull()
    },
    30_000,
  )
})
