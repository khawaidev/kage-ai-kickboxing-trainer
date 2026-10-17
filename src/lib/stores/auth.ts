import { create } from 'zustand'
import { authService } from '@/lib/services/auth'
import type { User } from '@/lib/types'

let unsubscribe: (() => void) | null = null

interface AuthState {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null
  init: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<User>) => Promise<void>
  deleteAccount: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  error: null,

  init: async () => {
    const user = await authService.getCurrentUser()
    set({ user, status: user ? 'authenticated' : 'unauthenticated' })

    if (!unsubscribe) {
      unsubscribe = authService.onAuthChange(() => {
        // Defer to avoid re-entering Supabase's auth lock from its own callback.
        setTimeout(() => {
          void authService.getCurrentUser().then((next) =>
            set({ user: next, status: next ? 'authenticated' : 'unauthenticated' }),
          )
        }, 0)
      })
    }
  },

  signInWithGoogle: async () => {
    set({ error: null })
    try {
      const user = await authService.signInWithGoogle()
      // Real Supabase redirects the browser; only mock mode returns a user here.
      if (user) set({ user, status: 'authenticated' })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Google sign-in failed' })
      throw e
    }
  },

  signInAsGuest: async () => {
    const user = await authService.signInAsGuest()
    set({ user, status: 'authenticated' })
  },

  signOut: async () => {
    await authService.signOut()
    set({ user: null, status: 'unauthenticated' })
  },

  updateProfile: async (patch) => {
    const user = await authService.updateProfile(patch)
    set({ user })
  },

  deleteAccount: async () => {
    await authService.deleteAccount()
    set({ user: null, status: 'unauthenticated' })
  },
}))
