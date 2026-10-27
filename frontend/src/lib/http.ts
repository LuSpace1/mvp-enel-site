import axios, { type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '@/store/useAuthStore'

export const http = axios.create({
  baseURL: '/api',
})

http.interceptors.request.use((config) => {
  const access = useAuthStore.getState().access
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

type ReintentableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refrescando: Promise<string> | null = null

async function refrescarAccess(): Promise<string> {
  const refresh = useAuthStore.getState().refresh
  if (!refresh) throw new Error('sin_refresh')

  const { data } = await axios.post<{ access: string; refresh?: string }>(
    '/api/auth/token/refresh/',
    { refresh },
  )
  useAuthStore.getState().setSession(data.access, data.refresh)
  return data.access
}

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error)
    const original = error.config as ReintentableConfig | undefined
    const status = error.response?.status
    const esLogin = original?.url?.includes('/auth/login') ?? false

    if (status === 401 && original && !original._retry && !esLogin) {
      original._retry = true
      try {
        refrescando ??= refrescarAccess()
        const access = await refrescando
        original.headers.Authorization = `Bearer ${access}`
        return http(original)
      } catch {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      } finally {
        refrescando = null
      }
    }
    return Promise.reject(error)
  },
)
