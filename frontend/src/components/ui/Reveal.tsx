import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, PropsWithChildren } from 'react'

interface RevealProps {
  id?: string
  delay?: number
  className?: string
  y?: number
  style?: CSSProperties
}

export function Reveal({
  id,
  children,
  delay = 0,
  className,
  y = 28,
  style,
}: PropsWithChildren<RevealProps>) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      id={id}
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
