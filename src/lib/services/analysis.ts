import {
  reportSchema,
  type Drill,
  type Finding,
  type Report,
  type TrainingSession,
} from '@/lib/types'
import { apiUrl } from '@/lib/api'
import { getAccessToken, isSupabaseConfigured } from '@/lib/supabase/client'

export type AnalysisStage =
  | 'validating'
  | 'extracting_timeline'
  | 'sampling_frames'
  | 'detecting_segments'
  | 'analyzing_clips'
  | 'consolidating'
  | 'generating_report'

export const ANALYSIS_STAGE_LABELS: Record<AnalysisStage, string> = {
  validating: 'Validating recording',
  extracting_timeline: 'Extracting timeline and metadata',
  sampling_frames: 'Sampling representative frames',
  detecting_segments: 'Detecting candidate segments',
  analyzing_clips: 'Analysing high-frame-rate clips',
  consolidating: 'Consolidating observations',
  generating_report: 'Generating structured report',
}

export interface AnalysisProgress {
  stage: AnalysisStage
  progress: number // 0..1
}

export interface AnalysisService {
  runAnalysis(
    session: TrainingSession,
    onProgress: (p: AnalysisProgress) => void,
  ): Promise<Report>
  getReport(sessionId: string): Report | null
}

const STAGE_ORDER: AnalysisStage[] = [
  'validating',
  'extracting_timeline',
  'sampling_frames',
  'detecting_segments',
  'analyzing_clips',
  'consolidating',
  'generating_report',
]

function hashSeed(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Candidate {
  category: string
  observation: string
  correction: string
  drill: Drill
  positive?: boolean
}

const CANDIDATES: Candidate[] = [
  {
    category: 'guard',
    observation: 'The rear hand drifts away from the chin after the cross.',
    correction:
      'Return the rear hand directly to the cheek immediately after each cross. Practise returning faster than you throw.',
    drill: {
      id: 'drill_guard_return',
      name: 'Return-to-Guard Ladder',
      description:
        'Throw a 1-2, then pause and freeze in guard for one second. 10 reps per round, checking the rear hand is touching the chin.',
      duration_minutes: 4,
    },
  },
  {
    category: 'balance',
    observation: 'Weight shifts onto the front foot during the jab, leaving the stance recoverable slowly.',
    correction:
      'Keep about 60 percent of your weight on the rear foot and let the jab push from the rear leg rather than reaching with the shoulder.',
    drill: {
      id: 'drill_shadow_balance',
      name: 'Shadowbox Balance Hold',
      description:
        'Throw slow, technical jabs while keeping the rear heel light. Hold the finish position for two seconds each rep.',
      duration_minutes: 5,
    },
  },
  {
    category: 'punch_technique',
    observation: 'The cross is largely arm-driven; hip rotation is limited at full extension.',
    correction:
      'Initiate the cross by rotating the rear hip and pivot the rear foot. Let the arm follow the hips instead of leading them.',
    drill: {
      id: 'drill_hip_rotation',
      name: 'Hip-Led Cross Drill',
      description:
        'In front of a mirror, throw only crosses at 50 percent speed, exaggerating rear-foot pivot for 3 rounds of 60 seconds.',
      duration_minutes: 5,
    },
  },
  {
    category: 'combinations',
    observation: 'Combinations end without a defensive movement, leaving the guard open at the end of each sequence.',
    correction:
      'Finish every combination with a slip or a roll. Treat the defensive move as part of the combination, not an afterthought.',
    drill: {
      id: 'drill_combo_finish',
      name: 'Combination Plus Exit',
      description:
        'Complete 4-punch combinations and immediately exit with a slip. 3 rounds of 90 seconds, resting 30 seconds.',
      duration_minutes: 6,
    },
  },
  {
    category: 'footwork',
    observation: 'Steps get heavy when fatigued and the feet occasionally cross during lateral movement.',
    correction:
      'Move the lead foot first when going left and the rear foot first when going right. Keep the steps small and never cross the feet.',
    drill: {
      id: 'drill_ladder_footwork',
      name: 'Lateral Footwork Ladder',
      description:
        'Move left and right around a marker, never crossing the feet, for 4 rounds of 45 seconds with 20 seconds rest.',
      duration_minutes: 4,
    },
  },
]

const POSITIVES: Candidate[] = [
  {
    category: 'rhythm',
    observation: 'Rhythm stayed consistent through the opening rounds and the guard reset cleanly.',
    correction: '',
    positive: true,
    drill: {
      id: 'drill_maintain',
      name: 'Maintain Rhythm',
      description: 'Keep the same timing and use it as the baseline for harder combinations.',
      duration_minutes: 3,
    },
  },
  {
    category: 'breathing',
    observation: 'Breathing stayed controlled and exhales were synced with the punches.',
    correction: '',
    positive: true,
    drill: {
      id: 'drill_breathe',
      name: 'Breath Sync',
      description: 'Pair a sharp exhale with each punch for 3 rounds of 60 seconds.',
      duration_minutes: 3,
    },
  },
  {
    category: 'output',
    observation: 'Output was steady through the final round with no obvious drop in activity.',
    correction: '',
    positive: true,
    drill: {
      id: 'drill_output',
      name: 'Even-Pace Rounds',
      description: 'Hold the same pace across all rounds without sprinting early.',
      duration_minutes: 3,
    },
  },
]

function pick<T>(arr: T[], seed: () => number, count: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < count && copy.length > 0) {
    const i = Math.floor(seed() * copy.length)
    out.push(copy.splice(i, 1)[0])
  }
  return out
}

function toFinding(c: Candidate, i: number, duration: number, seed: () => number): Finding {
  const start = Math.max(6, Math.round(seed() * Math.max(10, duration - 20)))
  const end = Math.min(duration, start + 3 + Math.round(seed() * 5))
  const confidence = i === 0 ? 'high' : seed() > 0.55 ? 'medium' : 'low'
  return {
    finding_id: `finding_${i + 1}`,
    category: c.category,
    observation: c.observation,
    evidence_start_seconds: start,
    evidence_end_seconds: end,
    confidence,
    limitations:
      confidence === 'high'
        ? 'Movement was clearly visible in the sampled frames.'
        : 'Sampled frames may miss detail at high speed; treat as a likely, not certain, observation.',
    correction: c.correction || 'Keep doing what you are doing — this was a strength.',
    recommended_drill: c.drill.name,
    validation_status: c.positive ? 'supported' : confidence === 'low' ? 'preliminary' : 'supported',
  }
}

class MockAnalysis implements AnalysisService {
  private reports = new Map<string, Report>()

  async runAnalysis(
    session: TrainingSession,
    onProgress: (p: AnalysisProgress) => void,
  ): Promise<Report> {
    for (let i = 0; i < STAGE_ORDER.length; i++) {
      onProgress({ stage: STAGE_ORDER[i], progress: i / STAGE_ORDER.length })
      const delay =
        import.meta.env.MODE === 'test' ? 5 : 700 + Math.random() * 500
      await new Promise((r) => setTimeout(r, delay))
    }

    const duration = Math.max(30, session.duration_seconds)
    const seed = hashSeed(session.id)
    const chosen = pick(CANDIDATES, seed, 3)
    const positives = pick(POSITIVES, seed, 2)

    const corrections = chosen.map((c, i) => toFinding(c, i, duration, seed))
    const strengths = positives.map((c, i) => toFinding(c, i + 10, duration, seed))
    const drills = chosen.map((c) => c.drill)
    const uniqueDrills = drills.filter(
      (d, i) => drills.findIndex((x) => x.id === d.id) === i,
    )

    const topCategory = chosen[0]?.category ?? 'fundamentals'
    const summary = `You completed a ${Math.round(duration / 60)}-minute ${
      session.config.session_type === 'heavy_bag' ? 'heavy bag' : 'shadowboxing'
    } session focused on ${session.config.training_focus.replace('_', ' ')}. The recording was clear enough to evaluate ${
      corrections.filter((c) => c.confidence !== 'low').length
    } of ${corrections.length} priority areas with reasonable confidence. The clearest theme was ${topCategory}.`

    const report: Report = reportSchema.parse({
      id: `report_${session.id}`,
      session_id: session.id,
      summary,
      strengths,
      corrections,
      drills: uniqueDrills,
      next_focus: `Start the next session with a 3-minute round concentrating only on ${topCategory}, then add it to combinations.`,
      limitations: [
        'Frames were sampled at roughly 1 FPS; very fast movements may not be fully represented.',
        'Observations describe what was visible in the recording and are not biomechanical measurements.',
        `No pose-estimation model was applied to this ${session.config.sport} session for the mock pipeline.`,
        'AI feedback can be incorrect and is not a substitute for a qualified coach.',
      ],
      model_version: 'mock-gemini-2.5-flash',
      analysis_version: 'mock-analysis-1.0.0',
      created_at: new Date().toISOString(),
    })

    this.reports.set(session.id, report)
    return report
  }

  getReport(sessionId: string): Report | null {
    return this.reports.get(sessionId) ?? null
  }
}

/**
 * RemoteAnalysis — streams progress from the KAGE BFF (`POST /api/analyze`,
 * Server-Sent Events) which drives Gemini 3.5 Flash over the stored recording.
 */
class RemoteAnalysis implements AnalysisService {
  async runAnalysis(
    session: TrainingSession,
    onProgress: (p: AnalysisProgress) => void,
  ): Promise<Report> {
    const token = await getAccessToken()
    const res = await fetch(apiUrl('/api/analyze'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sessionId: session.id }),
    })
    if (!res.ok || !res.body) {
      throw new Error(`Analysis request failed (${res.status})`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let report: Report | null = null
    let errorMessage: string | null = null

    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() ?? ''
      for (const block of blocks) {
        let event = 'message'
        let data = ''
        for (const line of block.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim()
          else if (line.startsWith('data:')) data += line.slice(5).trim()
        }
        if (!data) continue
        const payload = JSON.parse(data) as Record<string, unknown>
        if (event === 'progress') {
          onProgress({
            stage: payload.stage as AnalysisStage,
            progress: Number(payload.progress) || 0,
          })
        } else if (event === 'complete') {
          report = reportSchema.parse(payload.report)
        } else if (event === 'error') {
          errorMessage = String(payload.message ?? 'Analysis failed')
        }
      }
    }

    if (errorMessage) throw new Error(errorMessage)
    if (!report) throw new Error('Analysis produced no report')
    return report
  }

  getReport(): Report | null {
    return null
  }
}

export const analysisService: AnalysisService =
  import.meta.env.MODE === 'test' || !isSupabaseConfigured
    ? new MockAnalysis()
    : new RemoteAnalysis()
