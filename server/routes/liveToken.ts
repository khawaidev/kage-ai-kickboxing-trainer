import { Router } from 'express'
import { createEphemeralToken } from '../gemini.js'
import { requireAuth } from '../middleware.js'
import { admin } from '../supabase.js'

export const liveTokenRouter = Router()

/**
 * POST /api/live-token
 * Mints a short-lived Gemini ephemeral token so the browser can open a Live
 * API WebSocket without ever seeing the permanent API key (PRD §FR-04).
 */
liveTokenRouter.post('/live-token', requireAuth, async (req, res) => {
  try {
    const db = await admin
      .from('profiles')
      .select('id')
      .eq('id', req.user!.id)
      .maybeSingle()
    if (db.error) throw db.error

    const result = await createEphemeralToken()
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'token_error'
    res.status(502).json({ error: 'live_token_failed', message })
  }
})
