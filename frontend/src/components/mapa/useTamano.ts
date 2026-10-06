import { useLayoutEffect, useRef, useState } from 'react'

import type { Tamano } from './geometria'

/** Mide el tamaño renderizado de un elemento y lo mantiene actualizado. */
export function useTamano<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [tam, setTam] = useState<Tamano>({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const actualizar = () => {
      const r = el.getBoundingClientRect()
      setTam((prev) =>
        Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5
          ? prev
          : { w: r.width, h: r.height },
      )
    }

    actualizar()
    const obs = new ResizeObserver(actualizar)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return [ref, tam] as const
}
