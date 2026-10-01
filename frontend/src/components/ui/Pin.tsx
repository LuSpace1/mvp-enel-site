import { useRef, type ReactNode } from 'react'
import { useReducedMotion, useScroll, useSpring, type MotionValue } from 'motion/react'

import { clsx } from 'clsx'

interface PinProps {
  children: (progreso: MotionValue<number>) => ReactNode
  /** Altura total del recorrido de scroll (la parte visible es 1 viewport). */
  alto?: string
  className?: string
}

export function Pin({ children, alto = '180vh', className }: PinProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const suave = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.0005 })
  const progreso = reduce ? scrollYProgress : suave

  return (
    <div ref={ref} className={clsx('relative', className)} style={{ height: alto }}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {children(progreso)}
      </div>
    </div>
  )
}
