import { useEffect, useEffectEvent, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'

export type FotoVisor = {
  src: string
  titulo: string
  descripcion?: string
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -40 : 40 }),
}

export function VisorGaleria({
  fotos,
  indice,
  direccion = 0,
  titulo,
  etiqueta,
  descripcion,
  descripcionExtra,
  nombreEntidad = 'foto',
  onCerrar,
  onNavegar,
}: {
  fotos: FotoVisor[]
  indice: number | null
  direccion?: number
  /** Título fijo de la galería; no cambia al navegar entre fotos. */
  titulo: string
  etiqueta: string
  /** Texto fijo de la galería; se mantiene mientras cambian las fotos. */
  descripcion?: string
  descripcionExtra?: string
  nombreEntidad?: string
  onCerrar: () => void
  onNavegar: (dir: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)

  const fotoActiva = indice !== null ? fotos[indice] : null
  const parrafos = [descripcion, descripcionExtra]
    .filter((texto): texto is string => Boolean(texto))
    .flatMap((texto) => texto.split(/\n{2,}/))

  // `useEffectEvent` permite leer los callbacks más recientes sin volver a
  // suscribir el listener ni re-bloquear el scroll en cada render del padre.
  const alPresionarTecla = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCerrar()
    if (e.key === 'ArrowRight') onNavegar(1)
    if (e.key === 'ArrowLeft') onNavegar(-1)
  })

  useEffect(() => {
    if (indice === null) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alPresionarTecla)
    return () => {
      window.removeEventListener('keydown', alPresionarTecla)
      document.body.style.overflow = prevOverflow
    }
  }, [indice])

  useEffect(() => {
    if (indice === null) return
    scrollRef.current?.scrollTo({ top: 0 })
  }, [indice])

  return createPortal(
    <AnimatePresence>
      {fotoActiva && indice !== null && (
        <motion.div
          ref={scrollRef}
          data-lenis-prevent
          className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-[#f5f2ea] md:overflow-hidden"
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
          {/* Contador */}
          <div className="pointer-events-none fixed top-0 left-0 z-30 p-4 md:p-6">
            <div className="flex items-center gap-3 rounded-full bg-white/80 px-4 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
              <span className="font-serif text-lg font-medium text-[#d97757] italic md:text-xl">
                {String(indice + 1).padStart(2, '0')}
              </span>
              <span className="text-[11px] font-semibold tracking-[0.22em] text-[#8a857c] uppercase">
                / {String(fotos.length).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row">
            {/* Imagen */}
            <div className="relative flex min-h-[52dvh] flex-1 items-center justify-center px-4 pt-20 pb-8 md:min-h-0 md:px-12 md:pt-24 md:pb-20 lg:px-16">
              {/* Controles centrados sobre la imagen */}
              <div className="absolute top-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => onNavegar(-1)}
                  aria-label={`Ver ${nombreEntidad} anterior`}
                  className="rounded-full p-2.5 text-[#191919] transition-colors hover:bg-[#191919]/10"
                >
                  <CaretLeft size={20} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavegar(1)}
                  aria-label={`Ver ${nombreEntidad} siguiente`}
                  className="rounded-full p-2.5 text-[#191919] transition-colors hover:bg-[#191919]/10"
                >
                  <CaretRight size={20} weight="bold" />
                </button>
                <span aria-hidden="true" className="mx-1 h-5 w-px bg-[#191919]/10" />
                <button
                  type="button"
                  onClick={onCerrar}
                  aria-label="Cerrar galería"
                  className="rounded-full p-2.5 text-[#191919] transition-colors hover:bg-[#191919]/10"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <AnimatePresence initial={false} custom={direccion} mode="wait">
                <motion.img
                  key={indice}
                  custom={direccion}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                  src={fotoActiva.src}
                  alt={fotoActiva.titulo}
                  decoding="async"
                  fetchPriority="high"
                  className="max-h-[62dvh] w-auto max-w-full rounded-sm object-contain shadow-[0_30px_70px_-20px_rgba(25,25,25,0.45)] ring-1 ring-[#e0dcd0] md:max-h-[74dvh]"
                />
              </AnimatePresence>
            </div>

            {/* Banner fijo: la información no cambia al pasar las fotos */}
            <aside className="relative flex shrink-0 flex-col justify-center bg-[#191919] px-6 py-10 md:w-[38%] md:max-w-[540px] md:overflow-y-auto md:px-10 md:py-20 lg:px-12">
              <p className="text-[11px] font-bold tracking-[0.24em] text-[#d97757] uppercase">
                {etiqueta}
              </p>
              <h3 className="mt-4 font-serif text-2xl leading-tight font-medium text-white italic md:text-3xl">
                {titulo || fotos[0]?.titulo}
              </h3>
              <span aria-hidden="true" className="mt-6 block h-px w-12 bg-white/20" />

              {parrafos.length > 0 && (
                <div className="mt-6 space-y-4">
                  {parrafos.map((parrafo, i) => (
                    <p
                      key={i}
                      className={
                        i === 0
                          ? 'text-[15px] leading-relaxed text-[#d8d4c9]'
                          : 'text-[15px] leading-relaxed text-[#a09b92]'
                      }
                    >
                      {parrafo}
                    </p>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
