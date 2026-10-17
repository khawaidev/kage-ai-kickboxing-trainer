import { Router } from 'express'
import { env } from '../env.js'
import { generateText } from '../gemini.js'
import { requireAuth } from '../middleware.js'

export const chatRouter = Router()

const SYSTEM = [
  'You are KAGE, a supportive boxing and kickboxing fundamentals assistant.',
  'Be concise and practical. Never claim to have seen a user\u2019s movement unless they described it.',
  'You are not a substitute for a qualified coach and never give medical or injury advice.',
].join(' ')

interface ChatBody {
  message?: string
}

/** POST /api/chat — general (non-live) Q&A, e.g. explaining a technique. */
chatRouter.post('/chat', requireAuth, async (req, res) => {
  const { message } = (req.body ?? {}) as ChatBody
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message_required' })
    return
  }
  try {
    const reply = await generateText(env.chatModel, `${SYSTEM}\n\nUser: ${message}`)
    res.json({ reply, model: env.chatModel })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'chat_failed'
    res.status(502).json({ error: 'chat_failed', message: detail })
  }
})
