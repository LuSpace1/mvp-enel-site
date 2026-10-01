import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, PropsWithChildren } from 'react'

interface RevealProps {
  id?: string
  delay?: number
  className?: string
  y?: number
  blur?: number
  escala?: number
  style?: CSSProperties
}

export function Reveal({
  id,
  children,
  delay = 0,
  className,
  y = 28,
  blur = 0,
  escala = 1,
  style,
}: PropsWithChildren<RevealProps>) {
  const reduce = useReducedMotion()

  const inicial = {
    opacity: 0,
    y,
    ...(blur ? { filter: `blur(${blur}px)` } : {}),
    ...(escala !== 1 ? { scale: escala } : {}),
  }
  const visible = {
    opacity: 1,
    y: 0,
    ...(blur ? { filter: 'blur(0px)' } : {}),
    ...(escala !== 1 ? { scale: 1 } : {}),
  }

  return (
    <motion.div
      id={id}
      className={className}
      style={style}
      initial={reduce ? false : inicial}
      whileInView={reduce ? undefined : visible}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
