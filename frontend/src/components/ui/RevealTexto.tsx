import { Fragment, createElement, isValidElement, type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'

type Etiqueta = 'h1' | 'h2' | 'h3' | 'p' | 'span'

/**
 * `titulo`: los caracteres entran deslizándose desde la derecha (barrido horizontal).
 * `parrafo`: los caracteres suben enmascarados con un leve giro.
 *
 * Ambas reproducen el revelado de La Haute Société (SplitText + GSAP):
 *  - título: x 25rem→0, expo.out 1.2s + fade, líneas escalonadas.
 *  - párrafo: y 100%→0, rotate 3→0, power3.out 1s + fade, stagger muy corto.
 */
type Variante = 'titulo' | 'parrafo'

interface RevealTextoProps {
  as?: Etiqueta
  children: ReactNode
  className?: string
  delay?: number
  once?: boolean
  variante?: Variante
}

const CHAR_TITULO: Variants = {
  hidden: { x: '2em', opacity: 0 },
  visible: {
    x: '0em',
    opacity: 1,
    transition: {
      x: { duration: 1.2, ease: [0.19, 1, 0.22, 1] },
      opacity: { duration: 0.7, ease: [0.455, 0.03, 0.515, 0.955] },
    },
  },
}

const CHAR_PARRAFO: Variants = {
  hidden: { y: '110%', rotate: 3, opacity: 0 },
  visible: {
    y: '0%',
    rotate: 0,
    opacity: 1,
    transition: {
      y: { duration: 1, ease: [0.215, 0.61, 0.355, 1] },
      rotate: { duration: 1, ease: [0.215, 0.61, 0.355, 1] },
      opacity: { duration: 0.7, ease: [0.455, 0.03, 0.515, 0.955] },
    },
  },
}

const MASCARA =
  '-mt-[0.14em] -mb-[0.14em] inline-block overflow-hidden pt-[0.14em] pb-[0.14em] align-bottom'

function envolver(nodo: ReactNode, clave: string, variante: Variante) {
  const animado = (
    <motion.span
      className="inline-block"
      variants={variante === 'titulo' ? CHAR_TITULO : CHAR_PARRAFO}
    >
      {nodo}
    </motion.span>
  )

  if (variante === 'titulo') return <Fragment key={clave}>{animado}</Fragment>

  return (
    <span key={clave} className={MASCARA}>
      {animado}
    </span>
  )
}

function dividir(
  nodo: ReactNode,
  contador: { i: number; w: number },
  variante: Variante,
): ReactNode {
  if (typeof nodo === 'string') {
    return nodo.split(/(\s+)/).map((trozo, k) => {
      if (trozo === '') return null
      if (/^\s+$/.test(trozo)) return trozo

      const palabra = contador.w++
      return (
        <span key={`w-${palabra}-${k}`} className="inline-block whitespace-nowrap">
          {Array.from(trozo).map((caracter, j) => {
            const indice = contador.i++
            return envolver(caracter, `c-${indice}-${j}`, variante)
          })}
        </span>
      )
    })
  }

  if (typeof nodo === 'number') {
    const indice = contador.i++
    return envolver(String(nodo), `n-${indice}`, variante)
  }

  if (Array.isArray(nodo)) {
    return nodo.map((hijo, k) => <Fragment key={k}>{dividir(hijo, contador, variante)}</Fragment>)
  }

  if (isValidElement(nodo)) {
    // Los elementos (p. ej. spans con gradiente o <strong>) se animan como unidad
    // para conservar sus estilos y no romper el degradado de texto.
    const indice = contador.i++
    return envolver(nodo, `e-${indice}`, variante)
  }

  return nodo
}

export function RevealTexto({
  as = 'h2',
  children,
  className,
  delay = 0,
  once = true,
  variante = 'titulo',
}: RevealTextoProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return createElement(as, { className }, children)
  }

  const contador = { i: 0, w: 0 }
  const contenido = dividir(children, contador, variante)

  // Acota el escalonado total para que párrafos largos no tarden una eternidad.
  const total = Math.max(contador.i, 1)
  const stagger = variante === 'titulo' ? Math.min(0.03, 1 / total) : Math.min(0.02, 0.9 / total)

  const contenedor: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }

  return createElement(
    as,
    { className },
    <>
      <span className="sr-only">{children}</span>
      <motion.span
        aria-hidden="true"
        className="block"
        variants={contenedor}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: variante === 'titulo' ? 0.4 : 0.25 }}
      >
        {contenido}
      </motion.span>
    </>,
  )
}
