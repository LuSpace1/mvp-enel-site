import { motion, useReducedMotion } from 'motion/react'
import type { CSSProperties, PropsWithChildren } from 'react'

interface RevealProps {
  id?: string
  delay?: number
  className?: string
  y?: number
  x?: number
  style?: CSSProperties
}

/**
 * Revelado de contenido con entrega horizontal.
 *
 * Usa el string completo de `transform` en lugar de los shorthands `x`/`y` de
 * Motion: los shorthands corren por rAF en el main thread y pierden frames
 * durante el scroll, mientras que `transform` + `opacity` se componen en la GPU.
 *
 * `x` desplaza el bloque desde la derecha (misma dirección que el barrido de
 * `RevealTexto` variante "titulo"), `y` conserva la subida habitual.
 */
export function Reveal({
  id,
  children,
  delay = 0,
  className,
  y = 28,
  x = 16,
  style,
}: PropsWithChildren<RevealProps>) {
  const reduce = useReducedMotion()

  const inicial = { opacity: 0, transform: `translate3d(${x}px, ${y}px, 0)` }
  const visible = { opacity: 1, transform: 'translate3d(0px, 0px, 0)' }

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
