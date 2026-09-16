import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CaretDown, CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'

export type FotoVisor = {
  src: string
  titulo: string
  descripcion?: string
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -60 : 60 }),
}

export function VisorGaleria({
  fotos,
  indice,
  direccion = 0,
  etiqueta,
  descripcionExtra,
  nombreEntidad = 'foto',
  onCerrar,
  onNavegar,
}: {
  fotos: FotoVisor[]
  indice: number | null
  direccion?: number
  etiqueta: string
  descripcionExtra?: string
  nombreEntidad?: string
  onCerrar: () => void
  onNavegar: (dir: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const descripcionRef = useRef<HTMLElement>(null)
  const touchX = useRef<number | null>(null)

  const fotoActiva = indice !== null ? fotos[indice] : null

  useEffect(() => {
    if (indice === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
      if (e.key === 'ArrowRight') onNavegar(1)
      if (e.key === 'ArrowLeft') onNavegar(-1)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [indice, onCerrar, onNavegar])

  useEffect(() => {
    if (indice === null) return
    scrollRef.current?.scrollTo({ top: 0 })
  }, [indice])

  return createPortal(
    <AnimatePresence>
      {fotoActiva && indice !== null && (
        <motion.div
          ref={scrollRef}
          className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-[#f0eee6]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return
            const endX = e.changedTouches[0]?.clientX ?? touchX.current
            const delta = endX - touchX.current
            touchX.current = null
            if (Math.abs(delta) > 50) onNavegar(delta < 0 ? 1 : -1)
          }}
        >
          {/* Barra superior fija */}
          <div className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between gap-4 bg-gradient-to-b from-[#f0eee6]/90 to-transparent px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-xl font-bold tracking-tight text-[#d97757] md:text-2xl">
                {String(indice + 1).padStart(2, '0')}
              </span>
              <h3 className="truncate font-serif text-lg font-medium text-[#191919] italic md:text-xl">
                {fotoActiva.titulo}
              </h3>
              <span className="hidden shrink-0 text-sm font-semibold tracking-widest text-[#8a857c] uppercase sm:block">
                {indice + 1} / {fotos.length}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => onNavegar(-1)}
                aria-label={`Ver ${nombreEntidad} anterior`}
                className="rounded-full p-3 text-[#191919] transition-colors hover:bg-[#191919]/10"
              >
                <CaretLeft size={28} weight="bold" />
              </button>
              <button
                onClick={() => onNavegar(1)}
                aria-label={`Ver ${nombreEntidad} siguiente`}
                className="rounded-full p-3 text-[#191919] transition-colors hover:bg-[#191919]/10"
              >
                <CaretRight size={28} weight="bold" />
              </button>
              <button
                onClick={onCerrar}
                aria-label="Cerrar galería"
                className="rounded-full p-3 text-[#191919] transition-colors hover:bg-[#191919]/10"
              >
                <X size={24} weight="bold" />
              </button>
            </div>
          </div>

          {/* Contenido que cambia con la foto */}
          <AnimatePresence initial={false} custom={direccion} mode="wait">
            <motion.div
              key={indice}
              custom={direccion}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Primer apartado: imagen a pantalla completa */}
              <div className="relative flex min-h-dvh items-center justify-center px-4 py-16 md:px-20">
                <img
                  src={fotoActiva.src}
                  alt={fotoActiva.titulo}
                  className="max-h-[80vh] w-full max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-[#e0dcd0]"
                />
                <button
                  type="button"
                  onClick={() =>
                    descripcionRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }
                  className="absolute bottom-8 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full border border-[#e4e0d5] bg-white/70 px-4 py-2 text-xs font-medium whitespace-nowrap text-[#686561] transition-colors hover:bg-white hover:text-[#191919]"
                >
                  <CaretDown size={16} weight="bold" />
                  Ver mas!
                </button>
              </div>

              {/* Segundo apartado: descripción */}
              <section ref={descripcionRef} className="bg-[#191919] px-4 pt-16 pb-24 md:px-6">
                <div className="mx-auto max-w-3xl">
                  <p className="text-xs font-bold tracking-[0.2em] text-[#d97757] uppercase">
                    {etiqueta}
                  </p>
                  <h4 className="mt-3 font-serif text-2xl font-medium text-[#f0eee6] italic md:text-3xl">
                    {fotoActiva.titulo}
                  </h4>
                  <div className="mt-6 space-y-4">
                    {fotoActiva.descripcion && (
                      <p className="text-base leading-relaxed text-[#d8d4c9]">
                        {fotoActiva.descripcion}
                      </p>
                    )}
                    {descripcionExtra && (
                      <p className="text-base leading-relaxed text-[#a09b92]">{descripcionExtra}</p>
                    )}
                  </div>
                </div>
              </section>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
