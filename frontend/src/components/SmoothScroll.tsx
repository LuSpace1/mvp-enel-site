import { useEffect } from 'react'
import { useReducedMotion } from 'motion/react'

import { crearLenis, destruirLenis } from '@/lib/smoothScroll'

export function SmoothScroll() {
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return

    const lenis = crearLenis()
    let raf = 0
    const loop = (tiempo: number) => {
      lenis.raf(tiempo)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      destruirLenis()
    }
  }, [reduce])

  return null
}
