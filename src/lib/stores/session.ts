import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_SESSION_CONFIG,
  type AnalysisStatus,
  type RecordingStatus,
  type Report,
  type SessionConfig,
  type TrainingSession,
} from '@/lib/types'
import {
  fetchRemoteSessions,
  pushReport,
  pushSession,
} from '@/lib/services/repository'

export type ReportFeedback = 'useful' | 'incorrect'

interface SessionState {
  sessions: TrainingSession[]
  reports: Record<string, Report>
  feedback: Record<string, ReportFeedback>
  activeConfig: SessionConfig
  activeSessionId: string | null

  setActiveConfig: (patch: Partial<SessionConfig>) => void
  startSession: (userId: string) => TrainingSession
  updateSession: (id: string, patch: Partial<TrainingSession>) => void
  setRecordingStatus: (id: string, status: RecordingStatus) => void
  setAnalysisStatus: (id: string, status: AnalysisStatus) => void
  finishSession: (id: string, patch: Partial<TrainingSession>) => void
  saveReport: (report: Report) => void
  getSession: (id: string) => TrainingSession | undefined
  getReport: (id: string) => Report | undefined
  setFeedback: (findingId: string, value: ReportFeedback) => void
  hydrate: (userId: string) => Promise<void>
  clearAll: () => void
}

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      reports: {},
      feedback: {},
      activeConfig: { ...DEFAULT_SESSION_CONFIG },
      activeSessionId: null,

      setActiveConfig: (patch) =>
        set((s) => ({ activeConfig: { ...s.activeConfig, ...patch } })),

      startSession: (userId) => {
        const config = get().activeConfig
        const now = new Date().toISOString()
        const session: TrainingSession = {
          id: newSessionId(),
          user_id: userId,
          config,
          started_at: now,
          ended_at: null,
          duration_seconds: 0,
          recording_status: 'recording',
          analysis_status: 'none',
          recording_mime_type: null,
          recording_size_bytes: null,
          created_at: now,
        }
        set((s) => ({ sessions: [session, ...s.sessions], activeSessionId: session.id }))
        void pushSession(session)
        return session
      },

      updateSession: (id, patch) => {
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }))
        const updated = get().sessions.find((x) => x.id === id)
        if (updated) void pushSession(updated)
      },

      setRecordingStatus: (id, status) => {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, recording_status: status } : x,
          ),
        }))
        const updated = get().sessions.find((x) => x.id === id)
        if (updated) void pushSession(updated)
      },

      setAnalysisStatus: (id, status) => {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id ? { ...x, analysis_status: status } : x,
          ),
        }))
        const updated = get().sessions.find((x) => x.id === id)
        if (updated) void pushSession(updated)
      },

      finishSession: (id, patch) => {
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === id
              ? { ...x, ...patch, ended_at: patch.ended_at ?? new Date().toISOString() }
              : x,
          ),
          activeSessionId: null,
        }))
        const updated = get().sessions.find((x) => x.id === id)
        if (updated) void pushSession(updated)
      },

      saveReport: (report) => {
        set((s) => ({
          reports: { ...s.reports, [report.session_id]: report },
          sessions: s.sessions.map((x) =>
            x.id === report.session_id ? { ...x, analysis_status: 'completed' } : x,
          ),
        }))
        void pushReport(report)
      },

      getSession: (id) => get().sessions.find((s) => s.id === id),
      getReport: (id) => get().reports[id],

      setFeedback: (findingId, value) =>
        set((s) => ({ feedback: { ...s.feedback, [findingId]: value } })),

      hydrate: async (userId) => {
        const remote = await fetchRemoteSessions(userId)
        if (remote.sessions.length === 0 && Object.keys(remote.reports).length === 0) {
          return
        }
        set((s) => {
          const byId = new Map(s.sessions.map((x) => [x.id, x]))
          for (const session of remote.sessions) byId.set(session.id, session)
          const merged = [...byId.values()].sort(
            (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
          )
          return { sessions: merged, reports: { ...s.reports, ...remote.reports } }
        })
      },

      clearAll: () =>
        set({ sessions: [], reports: {}, feedback: {}, activeSessionId: null }),
    }),
    {
      name: 'kage.sessions',
      version: 1,
    },
  ),
)
