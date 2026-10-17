import { beforeEach, describe, expect, it } from 'vitest'
import { useSessionStore } from '@/lib/stores/session'
import { DEFAULT_SESSION_CONFIG, type Report } from '@/lib/types'

function resetStore() {
  useSessionStore.setState({
    sessions: [],
    reports: {},
    feedback: {},
    activeConfig: { ...DEFAULT_SESSION_CONFIG },
    activeSessionId: null,
  })
}

const report: Report = {
  id: 'report_s1',
  session_id: 's1',
  summary: 'ok',
  strengths: [],
  corrections: [],
  drills: [],
  next_focus: 'guard',
  limitations: [],
  model_version: 'mock',
  analysis_version: '1.0.0',
  created_at: new Date().toISOString(),
}

describe('session store transitions', () => {
  beforeEach(resetStore)

  it('starts a session with recording status and sets it active', () => {
    const session = useSessionStore.getState().startSession('u1')
    expect(session.recording_status).toBe('recording')
    expect(session.analysis_status).toBe('none')
    expect(useSessionStore.getState().activeSessionId).toBe(session.id)
    expect(useSessionStore.getState().sessions).toHaveLength(1)
  })

  it('finishes a session and clears the active id', () => {
    const session = useSessionStore.getState().startSession('u1')
    useSessionStore.getState().finishSession(session.id, {
      duration_seconds: 120,
      recording_status: 'saved',
    })
    const saved = useSessionStore.getState().getSession(session.id)
    expect(saved?.duration_seconds).toBe(120)
    expect(saved?.recording_status).toBe('saved')
    expect(saved?.ended_at).not.toBeNull()
    expect(useSessionStore.getState().activeSessionId).toBeNull()
  })

  it('saving a report marks analysis completed', () => {
    const session = useSessionStore.getState().startSession('u1')
    useSessionStore.getState().saveReport({ ...report, session_id: session.id })
    expect(useSessionStore.getState().getSession(session.id)?.analysis_status).toBe(
      'completed',
    )
    expect(useSessionStore.getState().getReport(session.id)?.summary).toBe('ok')
  })

  it('records feedback per finding', () => {
    useSessionStore.getState().setFeedback('f1', 'useful')
    expect(useSessionStore.getState().feedback['f1']).toBe('useful')
  })
})
