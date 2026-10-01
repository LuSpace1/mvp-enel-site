import { Fragment, createElement, isValidElement, type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'

type Etiqueta = 'h1' | 'h2' | 'h3' | 'p' | 'span'

interface RevealTextoProps {
  as?: Etiqueta
  children: ReactNode
  className?: string
  delay?: number
  once?: boolean
}

const CONTENEDOR: Variants = {
  hidden: {},
  visible: (delay: number) => ({
    transition: { staggerChildren: 0.05, delayChildren: delay },
  }),
}

const PALABRA: Variants = {
  hidden: { y: '115%', opacity: 0, rotate: 3 },
  visible: {
    y: '0%',
    opacity: 1,
    rotate: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

function envolver(nodo: ReactNode, clave: string) {
  return (
    <span
      key={clave}
      className="-mt-[0.14em] -mb-[0.14em] inline-block overflow-hidden pt-[0.14em] pb-[0.14em] align-bottom"
    >
      <motion.span className="inline-block" variants={PALABRA}>
        {nodo}
      </motion.span>
    </span>
  )
}

function dividir(nodo: ReactNode, contador: { i: number }): ReactNode {
  if (typeof nodo === 'string') {
    return nodo.split(/(\s+)/).map((trozo, k) => {
      if (trozo === '') return null
      if (/^\s+$/.test(trozo)) return trozo
      const indice = contador.i++
      return envolver(trozo, `w-${indice}-${k}`)
    })
  }
  if (typeof nodo === 'number') {
    const indice = contador.i++
    return envolver(nodo, `n-${indice}`)
  }
  if (Array.isArray(nodo)) {
    return nodo.map((hijo, k) => <Fragment key={k}>{dividir(hijo, contador)}</Fragment>)
  }
  if (isValidElement(nodo)) {
    // Los elementos (p. ej. spans con gradiente) se animan como unidad
    // para conservar sus estilos y no romper el degradado de texto.
    const indice = contador.i++
    return envolver(nodo, `e-${indice}`)
  }
  return nodo
}

export function RevealTexto({
  as = 'h2',
  children,
  className,
  delay = 0,
  once = true,
}: RevealTextoProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return createElement(as, { className }, children)
  }

  const contador = { i: 0 }
  const contenido = dividir(children, contador)

  return createElement(
    as,
    { className },
    <motion.span
      className="block"
      variants={CONTENEDOR}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.4 }}
    >
      {contenido}
    </motion.span>,
  )
}
