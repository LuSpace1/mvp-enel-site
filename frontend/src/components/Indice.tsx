import { memo, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { clsx } from 'clsx'

import { track } from '@/lib/analytics'
import { desplazarASeccion } from '@/lib/scroll'

interface IndiceItem {
  id: string
  etiqueta: string
}

const ITEMS: IndiceItem[] = [
  { id: 'portada', etiqueta: 'Inicio' },
  { id: 'historia', etiqueta: 'Historia' },
  { id: 'cultura', etiqueta: 'Cultura' },
  { id: 'organigrama', etiqueta: 'Equipos' },
  { id: 'concesion-detalle', etiqueta: 'Concesión' },
  { id: 'cadena', etiqueta: 'Cadena' },
  { id: 'politicas', etiqueta: 'Políticas' },
  { id: 'galerias', etiqueta: 'Galerías' },
  { id: 'cierre', etiqueta: 'Cierre' },
]

const SPRING_BURBUJA = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 17,
  mass: 1,
}

export const Indice = memo(function Indice() {
  const reduce = useReducedMotion()
  const [activo, setActivo] = useState(0)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    let frame = 0

    function medir() {
      frame = 0
      const linea = window.innerHeight * 0.35 + 64
      let indice = 0
      ITEMS.forEach((item, i) => {
        const elemento = document.getElementById(item.id)
        if (!elemento) return
        if (elemento.getBoundingClientRect().top <= linea) indice = i
      })
      const fondoAlcanzado =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (fondoAlcanzado) indice = ITEMS.length - 1
      setActivo(indice)

      const portada = document.getElementById('portada')
      const enHero = portada
        ? portada.getBoundingClientRect().bottom > window.innerHeight * 0.25
        : true
      setMostrar(!enHero)
    }

    function alScrollear() {
      if (!frame) frame = requestAnimationFrame(medir)
    }

    medir()
    window.addEventListener('scroll', alScrollear, { passive: true })
    window.addEventListener('resize', alScrollear)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', alScrollear)
      window.removeEventListener('resize', alScrollear)
    }
  }, [])

  function irA(item: IndiceItem) {
    track('indice.clic', { paso: item.id })
    desplazarASeccion(item.id)
  }

  return (
    <AnimatePresence>
      {mostrar && (
        <motion.nav
          aria-label="Índice de secciones"
          className="fixed top-1/2 right-3 z-30 md:right-5"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24, y: '-50%' }}
          animate={{ opacity: 1, x: 0, y: '-50%' }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
          transition={reduce ? { duration: 0.25 } : { type: 'spring', stiffness: 320, damping: 22 }}
        >
          <div className="relative rounded-full border border-white/70 bg-white/55 p-1 shadow-[0_8px_32px_rgba(20,20,19,0.10)] backdrop-blur-2xl backdrop-saturate-150">
            <ul className="relative flex flex-col">
              {ITEMS.map((item, i) => {
                const esActivo = i === activo
                return (
                  <li key={item.id}>
                    <motion.button
                      type="button"
                      onClick={() => irA(item)}
                      whileTap={reduce ? undefined : { scale: 0.85 }}
                      aria-label={`Ir a ${item.etiqueta}`}
                      aria-current={esActivo ? 'true' : undefined}
                      className="group focus-visible:outline-enel-blue-light relative flex size-9 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <span
                        aria-hidden
                        className={clsx(
                          'text-enel-navy pointer-events-none absolute inset-y-0 right-full mr-3 hidden items-center rounded-full border border-white/70 bg-white/80 px-2.5 text-[11px] font-semibold whitespace-nowrap shadow-[0_4px_16px_rgba(20,20,19,0.12)] backdrop-blur-md transition-all duration-300 group-hover:flex group-focus-visible:flex md:mr-4 md:flex',
                          esActivo
                            ? 'translate-x-0 opacity-100'
                            : 'translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100',
                        )}
                      >
                        {item.etiqueta}
                      </span>

                      {esActivo && (
                        <motion.span
                          aria-hidden
                          layoutId="indice-burbuja"
                          className="bg-enel-blue-light absolute inset-0 m-auto size-6 rounded-full shadow-[0_2px_12px_rgba(47,155,226,0.45)]"
                          initial={false}
                          transition={reduce ? { duration: 0.25, ease: 'easeOut' } : SPRING_BURBUJA}
                        >
                          <motion.span
                            key={item.id}
                            className="absolute inset-0 m-auto size-2 rounded-full bg-white"
                            initial={reduce ? false : { scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 550, damping: 20 }}
                          />
                        </motion.span>
                      )}

                      <span
                        aria-hidden
                        className={clsx(
                          'relative block size-2 rounded-full transition-all duration-300',
                          esActivo
                            ? 'z-10 bg-white opacity-100 blur-none'
                            : 'bg-enel-navy/60 group-hover:bg-enel-navy opacity-40 blur-[1.5px] group-hover:opacity-75 group-hover:blur-none',
                        )}
                      />
                    </motion.button>
                  </li>
                )
              })}
            </ul>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
})
