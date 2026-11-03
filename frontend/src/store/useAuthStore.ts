import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isAxiosError } from 'axios'

import { olvidarIdentidad, vincularIdentidad } from '@/lib/analytics'
import { http } from '@/lib/http'
import type { CmsCapabilities } from '@/types/cms'

export interface AuthUser {
  id: string
  username: string
  enel_id?: string | null
  email?: string
  visitante_id?: string | null
  full_name?: string
  is_active?: boolean
  groups?: string[]
  roles: string[]
  capabilities: CmsCapabilities
}

export interface RegistroDatos {
  email: string
  first_name?: string
  last_name?: string
  password: string
  password_confirm: string
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
  registrar: (datos: RegistroDatos) => Promise<void>
  logout: () => void
  limpiarError: () => void
  setSession: (access: string, refresh?: string | null) => void
  actualizarPerfil: () => Promise<void>
}

function mensajeDeError(error: unknown): string {
  if (isAxiosError(error)) {
    const datos = error.response?.data
    if (typeof datos === 'string') return datos
    if (datos && typeof datos === 'object') {
      for (const valor of Object.values(datos as Record<string, unknown>)) {
        if (typeof valor === 'string') return valor
        if (Array.isArray(valor) && typeof valor[0] === 'string') return valor[0]
      }
    }
  }
  return 'No se pudo completar la operación. Inténtalo otra vez.'
}

/** Deja la identidad de analitica lista para la recarga posterior al login. */
function vincular(user: AuthUser) {
  if (user.email && user.visitante_id) vincularIdentidad(user.email, user.visitante_id)
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
          vincular(data.user)
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

      registrar: async (datos) => {
        set({ status: 'loading', error: null })
        try {
          const { data } = await http.post<LoginResponse>('/auth/register/', datos)
          set({
            access: data.access,
            refresh: data.refresh,
            user: data.user,
            status: 'authenticated',
            error: null,
          })
          vincular(data.user)
        } catch (error) {
          set({
            status: 'error',
            error: mensajeDeError(error),
            access: null,
            refresh: null,
            user: null,
          })
          throw error
        }
      },

      logout: () => {
        olvidarIdentidad()
        set({
          access: null,
          refresh: null,
          user: null,
          status: 'idle',
          error: null,
        })
      },

      limpiarError: () => {
        set({ error: null, status: 'idle' })
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
          vincular(data)
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
