import { z } from 'zod'

/** JSON Schema handed to Gemini's structured-output mode. */
export const geminiReportSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    strengths: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          observation: { type: 'string' },
          evidence_start_seconds: { type: 'number' },
          evidence_end_seconds: { type: 'number' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          limitations: { type: 'string' },
        },
        required: [
          'category',
          'observation',
          'evidence_start_seconds',
          'evidence_end_seconds',
          'confidence',
          'limitations',
        ],
      },
    },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          observation: { type: 'string' },
          evidence_start_seconds: { type: 'number' },
          evidence_end_seconds: { type: 'number' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          limitations: { type: 'string' },
          correction: { type: 'string' },
          recommended_drill: { type: 'string' },
          validation_status: {
            type: 'string',
            enum: ['supported', 'preliminary', 'inconclusive'],
          },
        },
        required: [
          'category',
          'observation',
          'evidence_start_seconds',
          'evidence_end_seconds',
          'confidence',
          'limitations',
          'correction',
          'recommended_drill',
          'validation_status',
        ],
      },
    },
    drills: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          duration_minutes: { type: 'number' },
        },
        required: ['name', 'description', 'duration_minutes'],
      },
    },
    next_focus: { type: 'string' },
    limitations: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'strengths', 'corrections', 'drills', 'next_focus', 'limitations'],
} as const

const findingShape = {
  category: z.string(),
  observation: z.string(),
  evidence_start_seconds: z.number().nonnegative(),
  evidence_end_seconds: z.number().nonnegative(),
  confidence: z.enum(['high', 'medium', 'low']),
  limitations: z.string(),
}

/** Validates the raw Gemini JSON payload before we persist/derive findings. */
export const geminiReportModelSchema = z.object({
  summary: z.string(),
  strengths: z.array(
    z.object({
      ...findingShape,
      correction: z.string().optional().default(''),
      recommended_drill: z.string().optional().default(''),
      validation_status: z
        .enum(['supported', 'preliminary', 'inconclusive'])
        .optional()
        .default('supported'),
    }),
  ),
  corrections: z.array(
    z.object({
      ...findingShape,
      correction: z.string(),
      recommended_drill: z.string(),
      validation_status: z.enum(['supported', 'preliminary', 'inconclusive']),
    }),
  ),
  drills: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      duration_minutes: z.number().positive(),
    }),
  ),
  next_focus: z.string(),
  limitations: z.array(z.string()),
})

export type GeminiReportPayload = z.infer<typeof geminiReportModelSchema>

export interface AnalysisContext {
  sport: string
  sessionType: string
  experienceLevel: string
  focus: string
  durationSeconds: number
}

export function buildAnalysisPrompt(ctx: AnalysisContext): string {
  return [
    'You are a supportive combat-sports fundamentals instructor reviewing a recorded training session.',
    `Sport: ${ctx.sport}. Session type: ${ctx.sessionType}. Experience level: ${ctx.experienceLevel}.`,
    `The athlete was focusing on: ${ctx.focus}. Recording duration: ${Math.round(ctx.durationSeconds)} seconds.`,
    '',
    'Watch the video and produce evidence-based observations only.',
    'Rules:',
    '- Every observation MUST include the timestamp range (in seconds from the start of the recording) where it is visible.',
    '- Never claim to have measured biomechanics (force, angles, muscle activation) that video cannot establish.',
    '- If the footage is unclear for an area, lower the confidence and say so in `limitations` instead of inventing feedback.',
    '- Provide 2-3 prioritised corrections, at most 3 strengths, and 2-4 drills.',
    '- Corrections must be concise, actionable, and beginner-appropriate.',
    'Return JSON matching the provided schema.',
  ].join('\n')
}
