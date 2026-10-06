import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { track } from '@/lib/analytics'
import { ContextoMapa, type ValorMapa } from './contexto'

export function ProveedorMapa({ children }: { children: ReactNode }) {
  const [zonaActiva, setZonaActiva] = useState<string | null>(null)
  const [zonaHover, setZonaHover] = useState<string | null>(null)
  const [comunaActiva, setComunaActiva] = useState<string | null>(null)
  const [modoRayosX, setModoRayosX] = useState(false)

  const abrirZona = useCallback((id: string) => {
    setZonaActiva(id)
    setZonaHover(null)
    setComunaActiva(null)
    track('mapa.zona.abrir', { zona: id })
  }, [])

  const cerrarZona = useCallback(() => {
    setZonaActiva(null)
    setZonaHover(null)
    setComunaActiva(null)
    track('mapa.zona.cerrar')
  }, [])

  const alternarRayosX = useCallback(() => {
    setModoRayosX((activo) => {
      if (!activo) {
        setComunaActiva(null)
        setZonaHover(null)
      }
      track('mapa.rayosx', { activo: !activo })
      return !activo
    })
  }, [])

  const restablecer = useCallback(() => {
    setZonaActiva(null)
    setComunaActiva(null)
    setZonaHover(null)
    setModoRayosX(false)
    track('mapa.restablecer')
  }, [])

  const handleZonaHover = useCallback((id: string | null) => setZonaHover(id), [])
  const handleComunaActiva = useCallback((id: string | null) => setComunaActiva(id), [])

  const valor = useMemo<ValorMapa>(
    () => ({
      zonaActiva,
      zonaHover,
      comunaActiva,
      modoRayosX,
      setZonaHover: handleZonaHover,
      setComunaActiva: handleComunaActiva,
      abrirZona,
      cerrarZona,
      alternarRayosX,
      restablecer,
    }),
    [
      zonaActiva,
      zonaHover,
      comunaActiva,
      modoRayosX,
      handleZonaHover,
      handleComunaActiva,
      abrirZona,
      cerrarZona,
      alternarRayosX,
      restablecer,
    ],
  )

  return <ContextoMapa.Provider value={valor}>{children}</ContextoMapa.Provider>
}
