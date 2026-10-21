import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import type { ValorCultura } from '@/lib/data/cultura'

export function ValorDialog({
  valor,
  onCerrar,
}: {
  valor: ValorCultura | null
  onCerrar: () => void
}) {
  const reduce = useReducedMotion()
  const cerrarRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!valor) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
      if (e.key === 'Tab') {
        e.preventDefault()
        cerrarRef.current?.focus()
      }
    }
    const prevOverflow = document.body.style.overflow
    const focoPrevio = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    cerrarRef.current?.focus()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      focoPrevio?.focus?.()
    }
  }, [valor, onCerrar])

  return createPortal(
    <AnimatePresence>
      {valor && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            aria-hidden="true"
            onClick={onCerrar}
            className="bg-enel-navy/35 absolute inset-0 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="valor-dialog-titulo"
            initial={reduce ? false : { opacity: 0, y: 32, scale: 0.94 }}
            animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            className="relative z-10 w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-[0_30px_80px_rgba(10,25,47,0.25)] ring-1 ring-black/[0.06] md:p-9"
          >
            <button
              ref={cerrarRef}
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar descripción"
              className="text-enel-navy/60 hover:text-enel-navy hover:bg-enel-navy/5 absolute top-3 right-3 rounded-full p-2 transition-colors"
            >
              <X size={20} weight="bold" />
            </button>

            <span className="from-enel-blue/10 mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br to-transparent ring-1 ring-black/[0.04]">
              <img
                src={valor.icono}
                alt=""
                aria-hidden="true"
                className="h-16 w-16 object-contain mix-blend-multiply"
              />
            </span>

            <h3
              id="valor-dialog-titulo"
              className="text-enel-navy mt-6 text-xl font-extrabold tracking-wide uppercase"
            >
              {valor.palabra}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-neutral-600">{valor.descripcion}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
