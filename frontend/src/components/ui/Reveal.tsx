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

  const inicial = { opacity: 0, y }
  const visible = { opacity: 1, y: 0 }

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
