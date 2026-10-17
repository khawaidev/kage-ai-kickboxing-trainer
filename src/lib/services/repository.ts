import { supabase } from '@/lib/supabase/client'
import {
  analysisStatusSchema,
  findingSchema,
  recordingStatusSchema,
  sessionConfigSchema,
  type Report,
  type TrainingSession,
} from '@/lib/types'

/**
 * Best-effort Postgres mirror of the local zustand store. All calls are
 * no-ops when Supabase is not configured (offline/dev/tests) and never throw
 * into the UI — remote sync must not block training.
 */

function disabled(): boolean {
  return supabase === null || import.meta.env.MODE === 'test'
}

export function remoteEnabled(): boolean {
  return supabase !== null && import.meta.env.MODE !== 'test'
}

interface SessionRow {
  id: string
  user_id: string
  sport: string
  session_type: string
  experience_level: string
  training_focus: string
  coaching_frequency: string
  duration_seconds: number
  rounds: number
  round_seconds: number
  rest_seconds: number
  started_at: string
  ended_at: string | null
  recording_status: string
  analysis_status: string
  created_at: string
}

function sessionToRow(s: TrainingSession) {
  return {
    id: s.id,
    user_id: s.user_id,
    sport: s.config.sport,
    session_type: s.config.session_type,
    experience_level: s.config.experience_level,
    training_focus: s.config.training_focus,
    coaching_frequency: s.config.coaching_frequency,
    duration_seconds: s.duration_seconds,
    rounds: s.config.rounds,
    round_seconds: s.config.round_seconds,
    rest_seconds: s.config.rest_seconds,
    started_at: s.started_at,
    ended_at: s.ended_at,
    recording_status: s.recording_status,
    analysis_status: s.analysis_status,
    created_at: s.created_at,
  }
}

function rowToSession(row: SessionRow): TrainingSession | null {
  const config = sessionConfigSchema.safeParse({
    sport: row.sport,
    session_type: row.session_type,
    experience_level: row.experience_level,
    training_focus: row.training_focus,
    coaching_frequency: row.coaching_frequency,
    duration_seconds: Math.max(1, row.round_seconds * row.rounds),
    rounds: row.rounds,
    round_seconds: row.round_seconds,
    rest_seconds: row.rest_seconds,
  })
  if (!config.success) return null
  return {
    id: row.id,
    user_id: row.user_id,
    config: config.data,
    started_at: row.started_at,
    ended_at: row.ended_at,
    duration_seconds: row.duration_seconds,
    recording_status: recordingStatusSchema.catch('idle').parse(row.recording_status),
    analysis_status: analysisStatusSchema.catch('none').parse(row.analysis_status),
    created_at: row.created_at,
  }
}

interface ReportRow {
  session_id: string
  summary: string | null
  strengths_json: unknown
  corrections_json: unknown
  training_plan_json: unknown
  model_version: string | null
  analysis_version: string | null
  created_at: string
}

function rowToReport(row: ReportRow): Report | null {
  const strengths = Array.isArray(row.strengths_json)
    ? row.strengths_json.map((f) => findingSchema.safeParse(f)).filter((r) => r.success)
    : []
  const corrections = Array.isArray(row.corrections_json)
    ? row.corrections_json.map((f) => findingSchema.safeParse(f)).filter((r) => r.success)
    : []
  if (strengths.length !== (row.strengths_json as unknown[])?.length) return null
  const plan = (row.training_plan_json ?? {}) as {
    drills?: Report['drills']
    next_focus?: string
    limitations?: string[]
  }
  return {
    id: `report_${row.session_id}`,
    session_id: row.session_id,
    summary: row.summary ?? '',
    strengths: strengths.map((r) => r.data),
    corrections: corrections.map((r) => r.data),
    drills: plan.drills ?? [],
    next_focus: plan.next_focus ?? '',
    limitations: plan.limitations ?? [],
    model_version: row.model_version ?? 'unknown',
    analysis_version: row.analysis_version ?? '1.0.0',
    created_at: row.created_at,
  }
}

export async function pushSession(session: TrainingSession): Promise<void> {
  if (disabled()) return
  try {
    const { error } = await supabase!
      .from('training_sessions')
      .upsert(sessionToRow(session), { onConflict: 'id' })
    if (error) console.warn('[kage] pushSession failed', error.message)
  } catch (e) {
    console.warn('[kage] pushSession threw', e)
  }
}

export async function pushReport(report: Report): Promise<void> {
  if (disabled()) return
  try {
    const { error } = await supabase!
      .from('session_reports')
      .upsert(
        {
          session_id: report.session_id,
          summary: report.summary,
          strengths_json: report.strengths,
          corrections_json: report.corrections,
          training_plan_json: {
            drills: report.drills,
            next_focus: report.next_focus,
            limitations: report.limitations,
          },
          model_version: report.model_version,
          analysis_version: report.analysis_version,
        },
        { onConflict: 'session_id' },
      )
    if (error) console.warn('[kage] pushReport failed', error.message)
  } catch (e) {
    console.warn('[kage] pushReport threw', e)
  }
}

export async function saveRecordingMeta(
  sessionId: string,
  meta: { storage_key: string; mime_type: string; size_bytes: number; duration_seconds: number },
): Promise<void> {
  if (disabled()) return
  try {
    const { error } = await supabase!
      .from('session_recordings')
      .upsert({ session_id: sessionId, ...meta }, { onConflict: 'session_id' })
    if (error) console.warn('[kage] saveRecordingMeta failed', error.message)
  } catch (e) {
    console.warn('[kage] saveRecordingMeta threw', e)
  }
}

/** Uploads a finished recording to the private bucket at `<uid>/<sessionId>.<ext>`. */
export async function uploadRecording(
  userId: string,
  sessionId: string,
  blob: Blob,
  mimeType: string,
): Promise<{ storage_key: string } | null> {
  if (disabled()) return null
  try {
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const storageKey = `${userId}/${sessionId}.${ext}`
    const { error } = await supabase!.storage
      .from('recordings')
      .upload(storageKey, blob, { contentType: mimeType, upsert: true })
    if (error) {
      console.warn('[kage] uploadRecording failed', error.message)
      return null
    }
    return { storage_key: storageKey }
  } catch (e) {
    console.warn('[kage] uploadRecording threw', e)
    return null
  }
}

export async function fetchRemoteSessions(
  userId: string,
): Promise<{ sessions: TrainingSession[]; reports: Record<string, Report> }> {
  if (disabled()) return { sessions: [], reports: {} }
  const { data, error } = await supabase!
    .from('training_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
  if (error || !data) {
    if (error) console.warn('[kage] fetchRemoteSessions failed', error.message)
    return { sessions: [], reports: {} }
  }
  const sessions = data
    .map((row) => rowToSession(row as SessionRow))
    .filter((s): s is TrainingSession => s !== null)

  const ids = sessions.map((s) => s.id)
  const reports: Record<string, Report> = {}
  if (ids.length > 0) {
    const { data: reportRows } = await supabase!
      .from('session_reports')
      .select('*')
      .in('session_id', ids)
    for (const row of reportRows ?? []) {
      const report = rowToReport(row as ReportRow)
      if (report) reports[row.session_id] = report
    }
  }
  return { sessions, reports }
}
