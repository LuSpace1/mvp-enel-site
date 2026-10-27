import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { http } from '@/lib/http'
import type { CmsCapabilities } from '@/types/cms'

export interface AuthUser {
  id: string
  username: string
  enel_id?: string | null
  email?: string
  full_name?: string
  is_active?: boolean
  groups?: string[]
  roles: string[]
  capabilities: CmsCapabilities
}

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

interface LoginResponse {
  access: string
  refresh: string
  user: AuthUser
}

interface AuthState {
  access: string | null
  refresh: string | null
  user: AuthUser | null
  status: AuthStatus
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setSession: (access: string, refresh?: string | null) => void
  actualizarPerfil: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      access: null,
      refresh: null,
      user: null,
      status: 'idle',
      error: null,

      login: async (username, password) => {
        set({ status: 'loading', error: null })
        try {
          const { data } = await http.post<LoginResponse>('/auth/login/', { username, password })
          set({
            access: data.access,
            refresh: data.refresh,
            user: data.user,
            status: 'authenticated',
            error: null,
          })
        } catch {
          set({
            status: 'error',
            error: 'Usuario o contraseña incorrectos.',
            access: null,
            refresh: null,
            user: null,
          })
          throw new Error('login_failed')
        }
      },

      logout: () => {
        set({
          access: null,
          refresh: null,
          user: null,
          status: 'idle',
          error: null,
        })
      },

      setSession: (access, refresh) => {
        set((state) => ({
          access,
          refresh: refresh === undefined ? state.refresh : refresh,
          status: 'authenticated',
        }))
      },

      actualizarPerfil: async () => {
        if (!get().access) return
        try {
          const { data } = await http.get<AuthUser>('/auth/me/')
          set({ user: data, status: 'authenticated' })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'portal-enel-auth',
      partialize: (state) => ({
        access: state.access,
        refresh: state.refresh,
        user: state.user,
      }),
    },
  ),
)
