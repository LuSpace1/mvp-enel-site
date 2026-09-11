import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CaretDown, CaretLeft, CaretRight, MagnifyingGlass, X } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { clsx } from 'clsx'

import { fotosEquipos } from '@/lib/data/galerias'
import { track } from '@/lib/analytics'

const POR_PAGINA = 10
const TOTAL_PAGINAS = Math.ceil(fotosEquipos.length / POR_PAGINA)
const DESTACADOS = new Set([0, 5])

const DESCRIPCION_EXTRA = `Este equipo reúne a profesionales de distintas disciplinas que trabajan en coordinación para asegurar la continuidad del suministro eléctrico. Sus labores van desde la planificación de la red y el mantenimiento de las instalaciones hasta la atención directa de los clientes y la ejecución de proyectos de innovación.

Cada integrante aporta experiencia en su área, y juntos conforman una unidad que colabora diariamente con otras subgerencias para cumplir los objetivos estratégicos de la compañía. La comunicación constante, el trabajo en terreno y el seguimiento de indicadores de calidad forman parte de su rutina.

A lo largo del año, el equipo participa en programas de capacitación, simulacros de emergencia y revisiones operativas que permiten mejorar los tiempos de respuesta y la seguridad de todas las personas que trabajan con electricidad.`

const gridVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -60 : 60 }),
}

export function EquiposGaleria({ abiertoInicial = null }: { abiertoInicial?: number | null }) {
  const reduce = useReducedMotion()
  const gridRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const descripcionRef = useRef<HTMLElement>(null)
  const touchX = useRef<number | null>(null)
  const [spotActivo, setSpotActivo] = useState(false)
  const [pagina, setPagina] = useState(0)
  const [dirPagina, setDirPagina] = useState(0)
  const [abierto, setAbierto] = useState<number | null>(abiertoInicial)
  const [direccion, setDireccion] = useState(0)

  const moverSpot = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = gridRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  const irPagina = (dir: number) => {
    setDirPagina(dir)
    setPagina((prev) => (prev + dir + TOTAL_PAGINAS) % TOTAL_PAGINAS)
    track('galeria.equipo.pagina', { pagina: ((pagina + dir + TOTAL_PAGINAS) % TOTAL_PAGINAS) + 1 })
  }

  const abrir = (indice: number) => {
    setDireccion(0)
    setAbierto(indice)
    track('galeria.equipo.abrir', { equipo: fotosEquipos[indice]?.titulo })
  }

  const cerrar = () => {
    setAbierto(null)
  }

  const navegar = (dir: number) => {
    scrollRef.current?.scrollTo({ top: 0 })
    setAbierto((prev) => {
      if (prev === null) return prev
      return (prev + dir + fotosEquipos.length) % fotosEquipos.length
    })
    setDireccion(dir)
  }

  useEffect(() => {
    if (abierto === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar()
      if (e.key === 'ArrowRight') navegar(1)
      if (e.key === 'ArrowLeft') navegar(-1)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [abierto])

  const fotoActiva = abierto !== null ? fotosEquipos[abierto] : null
  const fotosPagina = fotosEquipos.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)
  const desde = pagina * POR_PAGINA + 1
  const hasta = Math.min((pagina + 1) * POR_PAGINA, fotosEquipos.length)

  return (
    <div className="relative">
      {/* Grid asimétrico paginado */}
      <AnimatePresence initial={false} custom={dirPagina} mode="wait">
        <motion.div
          key={pagina}
          ref={gridRef}
          custom={dirPagina}
          variants={gridVariants}
          initial={reduce ? false : 'enter'}
          animate={reduce ? { opacity: 1, x: 0 } : 'center'}
          exit={reduce ? undefined : 'exit'}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onMouseMove={moverSpot}
          onMouseEnter={() => setSpotActivo(true)}
          onMouseLeave={() => setSpotActivo(false)}
          className="relative grid grid-flow-dense grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
        >
          {fotosPagina.map((foto, indice) => {
            const indiceGlobal = pagina * POR_PAGINA + indice
            return (
              <motion.figure
                key={foto.titulo}
                className={clsx(
                  'group cv-auto bg-enel-mist relative cursor-pointer overflow-hidden rounded-2xl border border-white/40 shadow-[0_10px_30px_rgba(20,50,90,0.14)]',
                  'transition-shadow duration-500 hover:z-30 hover:shadow-[0_28px_70px_-20px_rgba(0,111,187,0.45)]',
                  DESTACADOS.has(indice) && 'col-span-2',
                )}
                initial={reduce ? false : { opacity: 0, y: 32 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.7,
                  delay: reduce ? 0 : indice * 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={reduce ? undefined : { y: -10, scale: 1.02 }}
                onClick={() => abrir(indiceGlobal)}
              >
                <img
                  src={foto.src}
                  alt={foto.titulo}
                  loading="lazy"
                  decoding="async"
                  className={clsx(
                    'aspect-[16/10] h-full w-full object-cover transition-transform duration-700',
                    reduce ? '' : 'group-hover:scale-105',
                  )}
                />

                {/* Sheen: barrido de luz sobre la tarjeta */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl"
                >
                  <div
                    className={clsx(
                      'absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent',
                      reduce
                        ? ''
                        : '-translate-x-[110%] transition-transform duration-700 ease-out group-hover:translate-x-[110%]',
                    )}
                  />
                </div>

                {/* Título siempre visible */}
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pt-14 pb-3 md:px-5 md:pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-enel-blue text-xl font-bold tracking-tight drop-shadow-sm md:text-2xl">
                      {String(indiceGlobal + 1).padStart(2, '0')}
                    </span>
                    <span className="font-serif text-lg font-medium text-white italic md:text-xl">
                      {foto.titulo}
                    </span>
                  </div>
                </figcaption>

                {/* Indicador de zoom en hover */}
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute top-3 right-3 z-20 rounded-full bg-white/15 p-2 text-white backdrop-blur-sm transition-opacity duration-300',
                    reduce ? 'opacity-0' : 'opacity-0 group-hover:opacity-100',
                  )}
                >
                  <MagnifyingGlass size={16} weight="bold" />
                </span>
              </motion.figure>
            )
          })}

          {/* Spotlight que sigue al cursor */}
          <div
            aria-hidden="true"
            className={clsx(
              'pointer-events-none absolute inset-0 z-30 transition-opacity duration-500',
              reduce || !spotActivo ? 'opacity-0' : 'opacity-100',
            )}
            style={{
              background:
                'radial-gradient(600px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(146, 208, 255, 0.30), rgba(146, 208, 255, 0.06) 40%, transparent 65%)',
              mixBlendMode: 'screen',
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Controles de paginación */}
      <div className="mt-10 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => irPagina(-1)}
            aria-label="Ver 10 equipos anteriores"
            className="border-enel-fog/50 text-enel-navy hover:border-enel-blue hover:text-enel-blue rounded-full border bg-white/50 p-3 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <span className="text-sm font-bold tracking-widest text-neutral-500 uppercase">
            {desde}–{hasta} de {fotosEquipos.length}
          </span>
          <button
            onClick={() => irPagina(1)}
            aria-label="Ver 10 equipos siguientes"
            className="border-enel-fog/50 text-enel-navy hover:border-enel-blue hover:text-enel-blue rounded-full border bg-white/50 p-3 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white"
          >
            <CaretRight size={20} weight="bold" />
          </button>
        </div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Páginas de la galería">
          {Array.from({ length: TOTAL_PAGINAS }, (_, p) => (
            <button
              key={p}
              role="tab"
              aria-selected={p === pagina}
              aria-label={`Página ${p + 1}`}
              onClick={() => {
                setDirPagina(p > pagina ? 1 : -1)
                setPagina(p)
              }}
              className={clsx(
                'h-2.5 rounded-full transition-all duration-300',
                p === pagina ? 'bg-enel-blue w-8' : 'hover:bg-enel-blue/40 bg-enel-fog w-2.5',
              )}
            />
          ))}
        </div>
      </div>

      {/* Lightbox (portaled a document.body para que cubra el viewport real) */}
      {createPortal(
        <AnimatePresence>
          {fotoActiva && (
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
                if (Math.abs(delta) > 50) navegar(delta < 0 ? 1 : -1)
              }}
            >
              {/* Barra superior fija */}
              <div className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between gap-4 bg-gradient-to-b from-[#f0eee6]/90 to-transparent px-4 py-3 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-xl font-bold tracking-tight text-[#d97757] md:text-2xl">
                    {String((abierto ?? 0) + 1).padStart(2, '0')}
                  </span>
                  <h3 className="truncate font-serif text-lg font-medium text-[#191919] italic md:text-xl">
                    {fotoActiva.titulo}
                  </h3>
                  <span className="hidden shrink-0 text-sm font-semibold tracking-widest text-[#8a857c] uppercase sm:block">
                    {(abierto ?? 0) + 1} / {fotosEquipos.length}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => navegar(-1)}
                    aria-label="Equipo anterior"
                    className="rounded-full p-3 text-[#191919] transition-colors hover:bg-[#191919]/10"
                  >
                    <CaretLeft size={28} weight="bold" />
                  </button>
                  <button
                    onClick={() => navegar(1)}
                    aria-label="Equipo siguiente"
                    className="rounded-full p-3 text-[#191919] transition-colors hover:bg-[#191919]/10"
                  >
                    <CaretRight size={28} weight="bold" />
                  </button>
                  <button
                    onClick={cerrar}
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
                  key={abierto}
                  custom={direccion}
                  variants={gridVariants}
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
                        El equipo
                      </p>
                      <h4 className="mt-3 font-serif text-2xl font-medium text-[#f0eee6] italic md:text-3xl">
                        {fotoActiva.titulo}
                      </h4>
                      <div className="mt-6 space-y-4">
                        <p className="text-base leading-relaxed text-[#d8d4c9]">
                          {fotoActiva.descripcion}
                        </p>
                        <p className="text-base leading-relaxed text-[#a09b92]">
                          {DESCRIPCION_EXTRA}
                        </p>
                      </div>
                    </div>
                  </section>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
