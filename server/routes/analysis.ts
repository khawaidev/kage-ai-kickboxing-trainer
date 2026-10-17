import { Router } from 'express'
import { env } from '../env.js'
import { generateJson, uploadFile, waitForFileActive } from '../gemini.js'
import { requireAuth } from '../middleware.js'
import { admin, downloadRecording } from '../supabase.js'
import {
  buildAnalysisPrompt,
  geminiReportModelSchema,
  geminiReportSchema,
  type GeminiReportPayload,
} from '../reportSchema.js'

export const analysisRouter = Router()

interface SessionRow {
  id: string
  user_id: string
  sport: string
  session_type: string
  experience_level: string
  training_focus: string
  duration_seconds: number
}

function makeFinding(
  prefix: string,
  index: number,
  f: GeminiReportPayload['corrections'][number],
) {
  return {
    finding_id: `${prefix}_${index + 1}`,
    category: f.category,
    observation: f.observation,
    evidence_start_seconds: f.evidence_start_seconds,
    evidence_end_seconds: f.evidence_end_seconds,
    confidence: f.confidence,
    limitations: f.limitations,
    correction: f.correction,
    recommended_drill: f.recommended_drill,
    validation_status: f.validation_status,
  }
}

/**
 * POST /api/analyze  (Server-Sent Events)
 * Streams pipeline progress, then a final `complete` event carrying the
 * structured, schema-validated report. Body: { sessionId }.
 */
analysisRouter.post('/analyze', requireAuth, async (req, res) => {
  const { sessionId } = (req.body ?? {}) as { sessionId?: string }
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  const send = (stage: string, progress: number) => {
    res.write(`event: progress\ndata: ${JSON.stringify({ stage, progress })}\n\n`)
  }
  const fail = (message: string) => {
    res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`)
    res.end()
  }

  try {
    if (!sessionId) return fail('sessionId is required')

    const { data: session, error } = await admin
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single<SessionRow>()
    if (error || !session) return fail('Session not found')
    if (session.user_id !== req.user!.id) return fail('Not authorised for this session')

    await admin.from('analysis_jobs').upsert(
      {
        session_id: sessionId,
        status: 'processing',
        started_at: new Date().toISOString(),
        error_code: null,
      },
      { onConflict: 'session_id' },
    )
    await admin
      .from('training_sessions')
      .update({ analysis_status: 'processing' })
      .eq('id', sessionId)

    send('validating', 0.05)

    const { data: recording } = await admin
      .from('session_recordings')
      .select('storage_key, mime_type')
      .eq('session_id', sessionId)
      .maybeSingle<{ storage_key: string; mime_type: string }>()
    if (!recording) return fail('No recording stored for this session')

    send('extracting_timeline', 0.1)
    const bytes = await downloadRecording(recording.storage_key)
    if (!bytes) return fail('Could not read the stored recording')

    send('sampling_frames', 0.2)
    await admin
      .from('analysis_jobs')
      .update({ attempt_count: 1 })
      .eq('session_id', sessionId)

    const file = await uploadFile(
      bytes,
      recording.mime_type || 'video/webm',
      `session-${sessionId}`,
      (p) => send('detecting_segments', p),
    )
    await waitForFileActive(file.name, (p) => send('analyzing_clips', p))

    send('consolidating', 0.7)
    const prompt = buildAnalysisPrompt({
      sport: session.sport,
      sessionType: session.session_type,
      experienceLevel: session.experience_level,
      focus: session.training_focus,
      durationSeconds: session.duration_seconds,
    })
    const raw = await generateJson<unknown>(
      env.analysisModel,
      prompt,
      { uri: file.uri, mimeType: file.mimeType || recording.mime_type },
      geminiReportSchema,
    )
    const payload = geminiReportModelSchema.parse(raw)

    send('generating_report', 0.9)
    const strengths = payload.strengths.map((f, i) => makeFinding('strength', i, f))
    const corrections = payload.corrections.map((f, i) => makeFinding('finding', i, f))

    const report = {
      id: `report_${sessionId}`,
      session_id: sessionId,
      summary: payload.summary,
      strengths,
      corrections,
      drills: payload.drills.map((d, i) => ({
        id: `drill_${i + 1}`,
        name: d.name,
        description: d.description,
        duration_minutes: d.duration_minutes,
      })),
      next_focus: payload.next_focus,
      limitations: payload.limitations,
      model_version: env.analysisModel,
      analysis_version: 'gemini-live-analysis-1.0.0',
      created_at: new Date().toISOString(),
    }

    await admin.from('session_reports').upsert(
      {
        session_id: sessionId,
        summary: payload.summary,
        strengths_json: strengths,
        corrections_json: corrections,
        training_plan_json: {
          drills: report.drills,
          next_focus: payload.next_focus,
          limitations: payload.limitations,
        },
        model_version: env.analysisModel,
        analysis_version: report.analysis_version,
      },
      { onConflict: 'session_id' },
    )
    await admin
      .from('training_sessions')
      .update({ analysis_status: 'completed' })
      .eq('id', sessionId)
    await admin
      .from('analysis_jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('session_id', sessionId)

    res.write(`event: complete\ndata: ${JSON.stringify({ report })}\n\n`)
    res.end()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'analysis_failed'
    if (sessionId) {
      await admin
        .from('training_sessions')
        .update({ analysis_status: 'failed' })
        .eq('id', sessionId)
      await admin
        .from('analysis_jobs')
        .update({ status: 'failed', error_code: 'analysis_failed' })
        .eq('session_id', sessionId)
    }
    fail(message)
  }
})
