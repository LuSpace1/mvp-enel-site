import { useMemo } from 'react'
import { create } from 'zustand'

import { obtenerContenidoPublico } from '@/services/cms'
import type { CmsPayload, CmsSectionValues } from '@/types/cms'

import { ETIQUETAS_SECCION, SECCIONES_ORDEN } from './registro'

type ContenidoStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface ContenidoState {
  payload: CmsPayload | null
  status: ContenidoStatus
  error: string | null
  cargar: () => Promise<void>
  setPayload: (payload: CmsPayload) => void
  limpiar: () => void
}

export const useContenidoStore = create<ContenidoState>((set, get) => ({
  payload: null,
  status: 'idle',
  error: null,

  cargar: async () => {
    const estado = get().status
    if (estado === 'loaded' || estado === 'loading') return
    set({ status: 'loading', error: null })
    try {
      const data = await obtenerContenidoPublico()
      set({ payload: data.payload, status: 'loaded', error: null })
    } catch {
      // El sitio sigue funcionando con el contenido por defecto del codigo.
      set({ status: 'error', error: 'No se pudo cargar el contenido publicado.' })
    }
  },

  setPayload: (payload) => set({ payload, status: 'loaded', error: null }),
  limpiar: () => set({ payload: null, status: 'idle', error: null }),
}))

export function useSeccion(key: string): CmsSectionValues | undefined {
  const payload = useContenidoStore((estado) => estado.payload)
  return payload?.sections?.[key]
}

/** Campo editorial con fallback al contenido fijo del codigo. */
export function useCampo<T>(key: string, campo: string, porDefecto: T): T {
  const seccion = useSeccion(key)
  const valor = seccion?.[campo]
  if (valor === undefined || valor === null) return porDefecto
  return valor as T
}

/** Lista editorial; si viene vacia o ausente se usa la lista fija. */
export function useLista<T>(key: string, campo: string, porDefecto: T[]): T[] {
  const seccion = useSeccion(key)
  const valor = seccion?.[campo]
  if (!Array.isArray(valor)) return porDefecto
  return valor as T[]
}

export interface ItemNavegacion {
  id: string
  etiqueta: string
}

/** Orden y etiquetas publicados: fuente unica de header, indice y render. */
export function useNavegacion(): ItemNavegacion[] {
  const payload = useContenidoStore((estado) => estado.payload)
  const orden = payload?.order
  const secciones = payload?.sections

  return useMemo(() => {
    const claves = orden && orden.length > 0 ? orden : [...SECCIONES_ORDEN]
    return claves.map((clave) => {
      const etiqueta = secciones?.[clave]?.nav_label
      return {
        id: clave,
        etiqueta:
          typeof etiqueta === 'string' && etiqueta.trim()
            ? etiqueta
            : (ETIQUETAS_SECCION[clave] ?? clave),
      }
    })
  }, [orden, secciones])
}
