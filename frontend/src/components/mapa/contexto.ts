import { createContext, useContext } from 'react'

/**
 * Estado global de la vista del mapa de concesión.
 * Vive en un Context para que el mapa, los tooltips, el overlay de
 * "Rayos X" y los conectores SVG compartan una única fuente de verdad.
 */
export interface ValorMapa {
  /** Zona con zoom activo (null = vista general). */
  zonaActiva: string | null
  /** Zona bajo el cursor en la vista general. */
  zonaHover: string | null
  /** Comuna bajo el cursor dentro de la zona activa. */
  comunaActiva: string | null
  /** Modo infográfico "Rayos X". */
  modoRayosX: boolean
  setZonaHover: (id: string | null) => void
  setComunaActiva: (id: string | null) => void
  abrirZona: (id: string) => void
  cerrarZona: () => void
  alternarRayosX: () => void
  restablecer: () => void
}

export const ContextoMapa = createContext<ValorMapa | null>(null)

export function useMapaConcesion(): ValorMapa {
  const ctx = useContext(ContextoMapa)
  if (!ctx) throw new Error('useMapaConcesion debe usarse dentro de <ProveedorMapa>')
  return ctx
}
