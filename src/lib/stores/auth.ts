import { create } from 'zustand'
import { authService, type SignUpInput } from '@/lib/services/auth'
import type { User } from '@/lib/types'

interface AuthState {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null
  init: () => Promise<void>
  signUp: (input: SignUpInput) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
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
  },

  signUp: async (input) => {
    set({ error: null })
    try {
      const user = await authService.signUp(input)
      set({ user, status: 'authenticated' })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Sign up failed' })
      throw e
    }
  },

  signIn: async (email, password) => {
    set({ error: null })
    try {
      const user = await authService.signIn(email, password)
      set({ user, status: 'authenticated' })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Sign in failed' })
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
