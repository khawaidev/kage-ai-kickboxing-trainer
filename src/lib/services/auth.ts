import type { User as SupaUser } from '@supabase/supabase-js'
import { apiUrl } from '@/lib/api'
import { supabase } from '@/lib/supabase/client'
import {
  userSchema,
  type ExperienceLevel,
  type Sport,
  type User,
} from '@/lib/types'

export interface SignUpInput {
  email: string
  password: string
  displayName: string
}

export interface AuthService {
  getCurrentUser(): Promise<User | null>
  signUp(input: SignUpInput): Promise<User>
  signIn(email: string, password: string): Promise<User>
  signInAsGuest(): Promise<User>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  updateProfile(patch: Partial<User>): Promise<User>
  deleteAccount(): Promise<void>
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

function mapUser(supaUser: SupaUser, profile?: ProfileRow | null): User {
  return userSchema.parse({
    id: supaUser.id,
    email: supaUser.email ?? `${supaUser.id}@kage.local`,
    display_name:
      profile?.display_name ??
      (supaUser.user_metadata?.display_name as string | undefined) ??
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

/** Production auth backed by Supabase. */
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

  async signUp({ email, password, displayName }: SignUpInput): Promise<User> {
    const { data, error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Sign up did not return a user.')

    // If email confirmation is enabled there is no session yet — try to sign in.
    if (!data.session) {
      const { data: signInData, error: signInError } = await supabase!.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError || !signInData.user) {
        throw new Error('Check your email to confirm your account, then sign in.')
      }
      return mapUser(signInData.user)
    }
    return mapUser(data.user)
  }

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!data.user) throw new Error('Sign in did not return a user.')
    return mapUser(data.user)
  }

  async signInAsGuest(): Promise<User> {
    const { data, error } = await supabase!.auth.signInAnonymously()
    if (error || !data.user) {
      // Anonymous sign-ins may be disabled in the project.
      throw new Error('Guest sign-in is unavailable. Please create an account.')
    }
    return mapUser(data.user)
  }

  async signOut(): Promise<void> {
    await supabase!.auth.signOut()
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase!.auth.resetPasswordForEmail(email)
    if (error) throw new Error(error.message)
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
}

/** Offline/dev fallback when Supabase env vars are absent. */
class MockAuth implements AuthService {
  async getCurrentUser(): Promise<User | null> {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = userSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  }
  async signUp({ email, displayName }: SignUpInput): Promise<User> {
    const user: User = {
      id: makeId('user'),
      email,
      display_name: displayName || email.split('@')[0],
      experience_level: 'beginner',
      preferred_sport: 'boxing',
      preferred_language: 'en',
      created_at: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }
  async signIn(email: string): Promise<User> {
    const existing = await this.getCurrentUser()
    const user: User = {
      id: existing?.id ?? makeId('user'),
      email,
      display_name: existing?.display_name ?? email.split('@')[0],
      experience_level: existing?.experience_level ?? 'beginner',
      preferred_sport: existing?.preferred_sport ?? 'boxing',
      preferred_language: existing?.preferred_language ?? 'en',
      created_at: existing?.created_at ?? new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  }
  async signInAsGuest(): Promise<User> {
    return this.signIn('guest@kage.local')
  }
  async signOut(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }
  async resetPassword(): Promise<void> {}
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
}

export const authService: AuthService = supabase ? new SupabaseAuth() : new MockAuth()
