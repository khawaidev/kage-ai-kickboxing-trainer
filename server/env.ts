import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback
}

/**
 * Server-only configuration. Secrets here (service role, Gemini keys,
 * management token) must never be referenced by client code.
 */
export const env = {
  port: Number(optional('PORT', '8787')),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5173'),

  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_PUBLIC_API_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_API_KEY'),

  geminiKeys: [
    optional('GEMINI_API_KEY1', optional('VITE_GEMINI_API_KEY1', '')),
    optional('GEMINI_API_KEY2', optional('VITE_GEMINI_API_KEY2', '')),
  ].filter(Boolean),

  liveModel: optional('GEMINI_LIVE_MODEL', 'gemini-3.8-live'),
  analysisModel: optional('GEMINI_ANALYSIS_MODEL', 'gemini-3.5-flash-lite'),
  chatModel: optional('GEMINI_CHAT_MODEL', 'gemini-3.5-flash-lite'),
}

if (env.geminiKeys.length === 0) {
  throw new Error('No Gemini API keys configured (GEMINI_API_KEY1 / GEMINI_API_KEY2).')
}

export const isProd = process.env.NODE_ENV === 'production'
