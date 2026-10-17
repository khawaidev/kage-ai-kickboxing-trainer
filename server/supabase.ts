import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env.js'

/** Service-role client — full DB/storage access. Server-side only. */
export const admin: SupabaseClient = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

export interface AuthedUser {
  id: string
  email?: string
}

/**
 * Validate a Supabase access token supplied by the client. Returns the user
 * or null. Never trust a user id sent in the body.
 */
export async function verifyUser(accessToken: string | undefined): Promise<AuthedUser | null> {
  if (!accessToken) return null
  const { data, error } = await admin.auth.getUser(accessToken)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? undefined }
}

/** Create a short-lived signed URL for a private recording. */
export async function signedRecordingUrl(
  storageKey: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await admin.storage
    .from('recordings')
    .createSignedUrl(storageKey, expiresInSeconds)
  if (error || !data) return null
  return data.signedUrl
}

/** Download a private recording into a Buffer for server-side processing. */
export async function downloadRecording(storageKey: string): Promise<Uint8Array | null> {
  const { data, error } = await admin.storage.from('recordings').download(storageKey)
  if (error || !data) return null
  return new Uint8Array(await data.arrayBuffer())
}
