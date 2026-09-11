import { useEffect, useState } from 'react'

// Hook mínimo para condicionar efectos pesados y variantes por breakpoint.
export function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(consulta).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(consulta)
    const alCambiar = (evento: MediaQueryListEvent) => setCoincide(evento.matches)
    mql.addEventListener('change', alCambiar)
    setCoincide(mql.matches)
    return () => mql.removeEventListener('change', alCambiar)
  }, [consulta])

  return coincide
}
