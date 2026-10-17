import type { User as SupaUser } from '@supabase/supabase-js'
import { apiUrl } from '@/lib/api'
import { supabase } from '@/lib/supabase/client'
import { userSchema, type ExperienceLevel, type Sport, type User } from '@/lib/types'

export interface AuthService {
  getCurrentUser(): Promise<User | null>
  /** Starts the Google OAuth redirect. Returns a user only in offline/mock mode. */
  signInWithGoogle(): Promise<User | null>
  signInAsGuest(): Promise<User>
  signOut(): Promise<void>
  updateProfile(patch: Partial<User>): Promise<User>
  deleteAccount(): Promise<void>
  /** Subscribe to auth state changes; returns an unsubscribe function. */
  onAuthChange(listener: () => void): () => void
}

const STORAGE_KEY = 'kage.auth.user'

interface ProfileRow {
  id: string
  display_name: string | null
  experience_level: string
  preferred_sport: string
  preferred_language: string
  created_at: string
}

function metaName(supaUser: SupaUser): string | undefined {
  const meta = (supaUser.user_metadata ?? {}) as Record<string, unknown>
  return (meta.display_name || meta.full_name || meta.name) as string | undefined
}

function mapUser(supaUser: SupaUser, profile?: ProfileRow | null): User {
  return userSchema.parse({
    id: supaUser.id,
    email: supaUser.email ?? `${supaUser.id}@kage.local`,
    display_name:
      profile?.display_name ??
      metaName(supaUser) ??
      supaUser.email?.split('@')[0] ??
      'Fighter',
    experience_level: (profile?.experience_level as ExperienceLevel) ?? 'beginner',
    preferred_sport: (profile?.preferred_sport as Sport) ?? 'boxing',
    preferred_language: profile?.preferred_language ?? 'en',
    created_at: profile?.created_at ?? supaUser.created_at ?? new Date().toISOString(),
  })
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

/** Where Supabase should return the user after the OAuth round-trip. */
function redirectTo(): string | undefined {
  return typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined
}

/** Production auth backed by Supabase (Google OAuth). */
class SupabaseAuth implements AuthService {
  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase!.auth.getSession()
    const supaUser = data.session?.user
    if (!supaUser) return null
    const { data: profile } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', supaUser.id)
      .maybeSingle<ProfileRow>()
    return mapUser(supaUser, profile)
  }

  async signInWithGoogle(): Promise<User | null> {
    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo(),
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw new Error(error.message)
    // The browser is now navigating to Google; a user arrives after the redirect.
    return null
  }

  async signInAsGuest(): Promise<User> {
    const { data, error } = await supabase!.auth.signInAnonymously()
    if (error || !data.user) {
      throw new Error('Guest sign-in is unavailable. Please continue with Google.')
    }
    return mapUser(data.user)
  }

  async signOut(): Promise<void> {
    await supabase!.auth.signOut()
  }

  async updateProfile(patch: Partial<User>): Promise<User> {
    const current = await this.getCurrentUser()
    if (!current) throw new Error('Not authenticated')
    const merged: User = { ...current, ...patch }
    const { error } = await supabase!
      .from('profiles')
      .update({
        display_name: merged.display_name,
        experience_level: merged.experience_level,
        preferred_sport: merged.preferred_sport,
        preferred_language: merged.preferred_language,
      })
      .eq('id', merged.id)
    if (error) throw new Error(error.message)
    return merged
  }

  async deleteAccount(): Promise<void> {
    const { data } = await supabase!.auth.getSession()
    const token = data.session?.access_token
    if (token) {
      await fetch(apiUrl('/api/account'), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined)
    }
    await supabase!.auth.signOut()
  }

  onAuthChange(listener: () => void): () => void {
    const { data } = supabase!.auth.onAuthStateChange(() => listener())
    return () => data.subscription.unsubscribe()
  }
}

/** Offline/dev fallback when Supabase env vars are absent. */
class MockAuth implements AuthService {
  async getCurrentUser(): Promise<User | null> {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = userSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  }

  async signInWithGoogle(): Promise<User> {
    const user: User = {
      id: makeId('google'),
      email: 'google.user@kage.local',
      display_name: 'Google User',
      experience_level: 'beginner',
      preferred_sport: 'boxing',
      preferred_language: 'en',
      created_at: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }

  async signInAsGuest(): Promise<User> {
    const existing = await this.getCurrentUser()
    const user: User = {
      id: existing?.id ?? makeId('guest'),
      email: 'guest@kage.local',
      display_name: existing?.display_name ?? 'Guest Fighter',
      experience_level: existing?.experience_level ?? 'beginner',
      preferred_sport: existing?.preferred_sport ?? 'boxing',
      preferred_language: existing?.preferred_language ?? 'en',
      created_at: existing?.created_at ?? new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }

  async updateProfile(patch: Partial<User>): Promise<User> {
    const current = await this.getCurrentUser()
    if (!current) throw new Error('Not authenticated')
    const updated: User = { ...current, ...patch }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  }

  async deleteAccount(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }

  onAuthChange(): () => void {
    return () => undefined
  }
}

export const authService: AuthService = supabase ? new SupabaseAuth() : new MockAuth()
