import { memo, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { clsx } from 'clsx'

import { track } from '@/lib/analytics'
import { useNavegacion, type ItemNavegacion } from '@/lib/cms/contenido'
import { desplazarASeccion } from '@/lib/scroll'

const SPRING_BURBUJA = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 17,
  mass: 1,
}

export const Indice = memo(function Indice() {
  const reduce = useReducedMotion()
  const items = useNavegacion()
  const [activo, setActivo] = useState(0)
  const [mostrar, setMostrar] = useState(false)

  useEffect(() => {
    let frame = 0
    let geometriaValida = false
    let tops: (number | null)[] = []
    let linea = 0
    let altoDocumento = 0
    let finPortada = 0
    let hayPortada = false

    // Los tops de las secciones se miden una sola vez (y cuando cambia el
    // layout). Así el scroll no fuerza 11 reflows por frame.
    function recalcularGeometria() {
      linea = window.innerHeight * 0.35 + 64
      tops = items.map((item) => {
        const elemento = document.getElementById(item.id)
        return elemento ? elemento.getBoundingClientRect().top + window.scrollY : null
      })
      altoDocumento = document.documentElement.scrollHeight

      const portada = document.getElementById('portada')
      hayPortada = Boolean(portada)
      finPortada = portada ? portada.getBoundingClientRect().bottom + window.scrollY : 0
      geometriaValida = true
    }

    function medir() {
      frame = 0
      if (!geometriaValida) recalcularGeometria()

      const scroll = window.scrollY
      const umbral = scroll + linea
      let indice = 0
      for (let i = 0; i < tops.length; i++) {
        const top = tops[i] ?? null
        if (top !== null && top <= umbral) indice = i
      }
      const fondoAlcanzado = window.innerHeight + scroll >= altoDocumento - 2
      if (fondoAlcanzado) indice = items.length - 1
      setActivo(indice)

      const enHero = hayPortada ? finPortada - scroll > window.innerHeight * 0.25 : true
      setMostrar(!enHero)
    }

    function alScrollear() {
      if (!frame) frame = requestAnimationFrame(medir)
    }

    function invalidar() {
      geometriaValida = false
      alScrollear()
    }

    medir()
    window.addEventListener('scroll', alScrollear, { passive: true })
    window.addEventListener('resize', invalidar)

    // Recalibra cuando el contenido cambia de alto (imágenes, secciones lazy,
    // fuentes), sin volver a medir en cada frame de scroll.
    const observador = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(invalidar) : null
    observador?.observe(document.body)
    void document.fonts?.ready.then(invalidar)

    return () => {
      cancelAnimationFrame(frame)
      observador?.disconnect()
      window.removeEventListener('scroll', alScrollear)
      window.removeEventListener('resize', invalidar)
    }
  }, [items])

  function irA(item: ItemNavegacion) {
    track('indice.clic', { paso: item.id })
    desplazarASeccion(item.id)
  }

  return (
    <AnimatePresence>
      {mostrar && (
        <motion.nav
          aria-label="Índice de secciones"
          className="fixed top-1/2 right-5 z-30 hidden lg:block"
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: 24, y: '-50%' }}
          animate={{ opacity: 1, x: 0, y: '-50%' }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
          transition={reduce ? { duration: 0.25 } : { type: 'spring', stiffness: 320, damping: 22 }}
        >
          <div className="relative rounded-full border border-white/70 bg-white/55 p-1 shadow-[0_8px_32px_rgba(20,20,19,0.10)] backdrop-blur-2xl backdrop-saturate-150">
            <ul className="relative flex flex-col">
              {items.map((item, i) => {
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
