import { describe, expect, it } from 'vitest'
import { DEFAULT_SESSION_CONFIG, reportSchema, sessionConfigSchema } from '@/lib/types'

describe('session config schema', () => {
  it('accepts the default config', () => {
    expect(sessionConfigSchema.safeParse(DEFAULT_SESSION_CONFIG).success).toBe(true)
  })

  it('rejects an unknown sport', () => {
    const result = sessionConfigSchema.safeParse({
      ...DEFAULT_SESSION_CONFIG,
      sport: 'karate',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-positive duration', () => {
    const result = sessionConfigSchema.safeParse({
      ...DEFAULT_SESSION_CONFIG,
      duration_seconds: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('report schema', () => {
  const base = {
    id: 'r1',
    session_id: 's1',
    summary: 'ok',
    strengths: [],
    corrections: [],
    drills: [],
    next_focus: 'guard',
    limitations: ['sampled frames'],
    model_version: 'mock',
    analysis_version: '1.0.0',
    created_at: new Date().toISOString(),
  }

  it('accepts a valid report', () => {
    expect(reportSchema.safeParse(base).success).toBe(true)
  })

  it('rejects an invalid confidence value', () => {
    const result = reportSchema.safeParse({
      ...base,
      corrections: [
        {
          finding_id: 'f1',
          category: 'guard',
          observation: 'x',
          evidence_start_seconds: 1,
          evidence_end_seconds: 3,
          confidence: 'certain',
          limitations: '',
          correction: '',
          recommended_drill: '',
          validation_status: 'supported',
        },
      ],
    })
    expect(result.success).toBe(false)
  })
})
