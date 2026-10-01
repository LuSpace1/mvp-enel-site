import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'

interface ParallaxProps {
  children: ReactNode
  className?: string
  /** Desplazamiento vertical total en px (positivo = sube al hacer scroll). */
  distancia?: number
}

export function Parallax({ children, className, distancia = 50 }: ParallaxProps) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [distancia, -distancia])
  const suave = useSpring(y, { stiffness: 120, damping: 30, mass: 0.4 })

  if (reduce) return <div className={className}>{children}</div>

  return (
    <div ref={ref} className={className}>
      <motion.div className="h-full w-full" style={{ y: suave }}>
        {children}
      </motion.div>
    </div>
  )
}
