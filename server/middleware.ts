import type { NextFunction, Request, Response } from 'express'
import { verifyUser, type AuthedUser } from './supabase.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser
    }
  }
}

/** Reject requests without a valid Supabase access token. */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined
  const user = await verifyUser(token)
  if (!user) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }
  req.user = user
  next()
}
