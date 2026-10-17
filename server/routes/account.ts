import { Router } from 'express'
import { requireAuth } from '../middleware.js'
import { admin } from '../supabase.js'

export const accountRouter = Router()

/**
 * DELETE /api/account
 * Hard-deletes the authenticated user. All owned rows cascade, and a
 * best-effort sweep removes any stored recordings for the user.
 */
accountRouter.delete('/account', requireAuth, async (req, res) => {
  const userId = req.user!.id
  try {
    const { data: files } = await admin.storage.from('recordings').list(userId, { limit: 1000 })
    if (files && files.length > 0) {
      await admin.storage
        .from('recordings')
        .remove(files.map((f) => `${userId}/${f.name}`))
    }

    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) throw error

    res.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'delete_failed'
    res.status(502).json({ error: 'delete_failed', message })
  }
})
