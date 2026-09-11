import { startTransition, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowUpRight,
  Buildings,
  GridFour,
  Image as ImageIcon,
  CaretLeft,
  CaretRight,
  MagnifyingGlass,
  CaretDown,
  X,
} from '@phosphor-icons/react'
import { motion, useInView, useReducedMotion, AnimatePresence } from 'motion/react'

import { Reveal } from '@/components/ui/Reveal'
import { SectionShell } from '@/components/ui/SectionShell'
import { EquiposGaleria } from '@/components/EquiposGaleria'
import { centroExcelencia, fotosEquipos, fotosMeOffice } from '@/lib/data/galerias'
import { track } from '@/lib/analytics'
import { clsx } from 'clsx'

import fotoCEO from '@/assets/images/centro_de_exelencia_enel.jpg'

const ORBIT_STEPS = 12
const ORBIT_PATHS = fotosMeOffice.map((_, indice) => {
  const offsetAngle = indice * (360 / fotosMeOffice.length)
  const xPath = []
  const yPath = []
  const rotatePath = []
  for (let i = 0; i <= ORBIT_STEPS; i++) {
    const a = (offsetAngle + i * (360 / ORBIT_STEPS)) * (Math.PI / 180)
    xPath.push(Math.cos(a) * 260)
    yPath.push(Math.sin(a) * 120)
    // Bamboleo suave para que parezcan flotar mientras orbitan
    rotatePath.push(Math.sin(a * 2) * 8)
  }
  return { x: xPath, y: yPath, rotate: rotatePath }
})

const TEASER_POS = [
  { x: -112, rotate: -7 },
  { x: 0, rotate: 2 },
  { x: 112, rotate: 8 },
]

const gridVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -60 : 60 }),
}

export function GaleriasSection() {
  const bannerRef = useRef<HTMLDivElement>(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [galeriaVisible, setGaleriaVisible] = useState(false)
  const [indiceInicial, setIndiceInicial] = useState<number | null>(null)
  const reduce = useReducedMotion()
  const bannerInView = useInView(bannerRef, { once: true, amount: 0.15 })

  const nextPhoto = () => {
    startTransition(() => {
      setActivePhoto((prev) => (prev + 1) % fotosMeOffice.length)
    })
  }

  const prevPhoto = () => {
    startTransition(() => {
      setActivePhoto((prev) => (prev - 1 + fotosMeOffice.length) % fotosMeOffice.length)
    })
  }

  // Lightbox logic
  const [lightboxAbierto, setLightboxAbierto] = useState<number | null>(null)
  const [lightboxDir, setLightboxDir] = useState(0)
  const lightboxScrollRef = useRef<HTMLDivElement>(null)
  const lightboxDescRef = useRef<HTMLElement>(null)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    if (lightboxAbierto === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxAbierto(null)
      if (e.key === 'ArrowRight') navegarLightbox(1)
      if (e.key === 'ArrowLeft') navegarLightbox(-1)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightboxAbierto])

  const navegarLightbox = (dir: number) => {
    lightboxScrollRef.current?.scrollTo({ top: 0 })
    setLightboxDir(dir)
    setLightboxAbierto((prev) => {
      if (prev === null) return null
      return (prev + dir + fotosMeOffice.length) % fotosMeOffice.length
    })
  }

  const lightboxFotoActiva = lightboxAbierto !== null ? fotosMeOffice[lightboxAbierto] : null

  return (
    <SectionShell id="galerias" className="relative overflow-hidden bg-[#f0eee6]">
      {/* Fondo Cuadernillo Global */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(rgba(10, 25, 47, 0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />

      <motion.div
        className="relative z-10 w-full"
        initial={reduce ? false : { opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
        whileInView={reduce ? undefined : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
      >
        <Reveal className="max-w-2xl">
          <div className="border-enel-blue bg-enel-blue/10 text-enel-blue mb-6 inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 text-sm font-bold tracking-wider uppercase shadow-sm">
            <ImageIcon size={18} weight="bold" /> Galería Visual
          </div>
          <h2 className="text-enel-navy text-4xl font-bold tracking-tight md:text-6xl">
            Un espacio pensado para el equipo
          </h2>
          <p className="mt-6 text-base leading-relaxed font-medium text-neutral-600 md:text-xl">
            Conoce las oficinas donde el equipo construye el día a día del negocio.
          </p>
        </Reveal>

        {/* Mazo Flotante - Me Office */}
        <div className="mt-16 flex w-full flex-col items-center">
          <div className="relative flex h-[450px] w-full max-w-4xl items-center justify-center overflow-visible md:h-[550px]">
            {fotosMeOffice.map((foto, indice) => {
              const isActive = indice === activePhoto
              const path = ORBIT_PATHS[indice] || { x: [0], y: [0], rotate: [0] }

              return (
                <motion.figure
                  key={foto.src}
                  className="absolute origin-center cursor-pointer rounded-md border border-neutral-200 bg-white p-4 pb-16 shadow-[0_20px_40px_rgba(0,0,0,0.12)]"
                  style={{ width: 'min(75vw, 320px)', zIndex: isActive ? 50 : 10 + indice }}
                  onClick={() => {
                    if (!isActive) setActivePhoto(indice)
                    else setLightboxAbierto(indice)
                  }}
                  animate={
                    isActive
                      ? { x: 0, y: 0, rotate: 0, scale: 1.15, opacity: 1 }
                      : {
                          x: reduce ? path.x[0] : path.x,
                          y: reduce ? path.y[0] : path.y,
                          rotate: reduce ? 0 : path.rotate,
                          scale: 0.7,
                          opacity: 0.65,
                        }
                  }
                  transition={
                    isActive || reduce
                      ? { type: 'spring', stiffness: 220, damping: 22 }
                      : {
                          duration: 12,
                          repeat: Infinity,
                          ease: 'linear',
                        }
                  }
                  whileHover={!isActive ? { scale: 0.75, opacity: 0.95 } : {}}
                >
                  <div className="bg-enel-mist relative aspect-[4/3] overflow-hidden rounded-sm shadow-inner">
                    <img
                      src={foto.src}
                      alt={foto.alt}
                      loading="lazy"
                      className={clsx(
                        'h-full w-full object-cover transition duration-700',
                        isActive ? 'grayscale-0' : 'grayscale-[40%]',
                      )}
                    />
                  </div>
                  <figcaption className="text-enel-navy absolute bottom-5 left-0 w-full px-4 text-center font-serif text-lg font-medium italic">
                    {foto.alt}
                  </figcaption>
                </motion.figure>
              )
            })}
          </div>

          {/* Controles del Mazo Flotante */}
          <div className="mt-8 flex items-center gap-4 md:mt-2">
            <button
              onClick={prevPhoto}
              className="border-enel-fog/50 text-enel-navy hover:text-enel-blue hover:border-enel-blue rounded-full border bg-white/50 p-3 shadow-sm backdrop-blur-sm transition-all hover:bg-white"
              aria-label="Foto anterior"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <span className="text-sm font-bold tracking-widest text-neutral-500 uppercase">
              {activePhoto + 1} / {fotosMeOffice.length}
            </span>
            <button
              onClick={nextPhoto}
              className="border-enel-fog/50 text-enel-navy hover:text-enel-blue hover:border-enel-blue rounded-full border bg-white/50 p-3 shadow-sm backdrop-blur-sm transition-all hover:bg-white"
              aria-label="Siguiente foto"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>
        </div>

        <Reveal delay={0.1} className="relative mt-36">
          <div className="mb-10 flex flex-col justify-between gap-6 px-6 md:flex-row md:items-end md:px-12">
            <div>
              <h2 className="text-enel-navy text-3xl font-bold tracking-tight md:text-5xl">
                Descubre a los equipos
              </h2>
              <p className="mt-4 font-medium text-neutral-600 md:text-lg">
                La energía que mueve a Chile tiene rostros e historias.
              </p>
            </div>
          </div>

          {/* Galería interactiva de equipos (bajo demanda) */}
          {galeriaVisible ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 40, scale: 0.98 }}
              animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="px-6 pt-6 pb-20 md:px-12"
            >
              <EquiposGaleria abiertoInicial={indiceInicial} />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-8 px-6 pb-20 md:px-12">
              {/* Mosaico de polaroids: vista previa interactiva de los equipos */}
              <div className="relative flex h-[330px] w-full max-w-3xl items-center justify-center md:h-[360px]">
                {fotosEquipos.slice(0, 3).map((foto, indice) => {
                  const pos = TEASER_POS[indice] || { x: 0, rotate: 0 }
                  return (
                    <motion.figure
                      key={foto.titulo}
                      className="group absolute origin-center cursor-pointer rounded-md border border-neutral-200 bg-white p-3 pb-9 shadow-[0_20px_40px_rgba(0,0,0,0.14)]"
                      style={{ width: 'min(44vw, 240px)', zIndex: indice === 1 ? 20 : 10 }}
                      initial={{ x: pos.x, y: 0, rotate: pos.rotate }}
                      animate={
                        reduce
                          ? { x: pos.x, rotate: pos.rotate }
                          : { x: pos.x, rotate: pos.rotate, y: [0, -10, 0] }
                      }
                      transition={{
                        default: { type: 'spring', stiffness: 300, damping: 24 },
                        y: {
                          duration: 4.5 + indice * 0.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: indice * 0.5,
                        },
                      }}
                      whileHover={reduce ? {} : { rotate: 0, scale: 1.12, y: -12, zIndex: 30 }}
                      onClick={() => {
                        setIndiceInicial(indice)
                        setGaleriaVisible(true)
                        track('galeria.equipo.ver', { origen: 'polaroid' })
                      }}
                    >
                      <div className="bg-enel-mist relative aspect-[16/10] overflow-hidden rounded-sm shadow-inner">
                        <img
                          src={foto.src}
                          alt={foto.titulo}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                        <span
                          aria-hidden="true"
                          className="absolute top-2 right-2 rounded-full bg-white/15 p-2 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
                        >
                          <MagnifyingGlass size={14} weight="bold" />
                        </span>
                      </div>
                      <figcaption className="text-enel-navy absolute right-0 bottom-3 left-0 flex items-baseline justify-center gap-1.5 px-3">
                        <span className="text-enel-blue text-sm font-bold tabular-nums">
                          {String(indice + 1).padStart(2, '0')}
                        </span>
                        <span className="font-serif text-base font-medium italic">
                          {foto.titulo}
                        </span>
                      </figcaption>
                    </motion.figure>
                  )
                })}
              </div>

              <button
                onClick={() => {
                  setIndiceInicial(null)
                  setGaleriaVisible(true)
                  track('galeria.equipo.ver')
                }}
                className="group border-enel-fog text-enel-navy hover:border-enel-blue hover:text-enel-blue inline-flex items-center gap-2.5 rounded-full border bg-white/60 px-6 py-3 text-sm font-bold tracking-wide uppercase shadow-sm backdrop-blur-sm transition-colors"
              >
                <GridFour size={18} weight="fill" className="text-enel-blue" />
                Descubre a los 50 equipos
                <ArrowUpRight
                  size={16}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            </div>
          )}
        </Reveal>

        {/* Banner CEO */}
        <motion.div
          ref={bannerRef}
          className="mt-32"
          initial={reduce ? false : { opacity: 0, scaleY: 0.55, y: 48 }}
          animate={reduce || !bannerInView ? {} : { opacity: 1, scaleY: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
          style={{ transformOrigin: 'bottom center' }}
        >
          <div className="relative overflow-visible rounded-[2rem] border-4 border-white/70 bg-gradient-to-br from-[#eef5fc] to-[#d3e3f4] px-8 py-12 shadow-[0_24px_60px_rgba(20,50,90,0.18)] md:px-16 md:py-16">
            <div className="pointer-events-none absolute -top-32 -right-32 h-[30rem] w-[30rem] rounded-full bg-[#f3d9de]/60 blur-[120px]" />
            <div className="relative grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div className="relative z-10">
                <h3 className="text-enel-navy text-3xl leading-tight font-bold tracking-tight md:text-5xl">
                  {centroExcelencia.titulo}
                </h3>
                <p className="text-enel-blue-dark mt-4 text-xl font-semibold">
                  {centroExcelencia.subtitulo}
                </p>
                <p className="text-enel-navy/75 mt-6 max-w-xl text-base leading-relaxed">
                  {centroExcelencia.descripcion}
                </p>
                <a
                  href={centroExcelencia.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track('ceo.abrir')}
                  className="bg-enel-navy hover:bg-enel-blue-dark hover:shadow-enel-blue/40 mt-10 inline-flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold tracking-wide text-white uppercase shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <Buildings size={20} weight="fill" />
                  Centro de Excelencia
                  <ArrowUpRight size={18} weight="bold" />
                </a>
              </div>
              <motion.div
                className="group relative z-20 md:-my-24 md:-mr-24"
                initial={reduce ? false : { opacity: 0, scale: 0.85, y: 28 }}
                animate={reduce || !bannerInView ? {} : { opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="absolute inset-0 rounded-3xl bg-[#f3d9de]/50 opacity-60 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                <motion.img
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  src={fotoCEO}
                  alt="Centro de Excelencia Operacional"
                  loading="lazy"
                  className="relative aspect-[4/3] w-full rounded-2xl border-4 border-white object-cover shadow-[0_25px_60px_rgba(20,50,90,0.35)]"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Lightbox para Me Office */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {lightboxFotoActiva && (
              <motion.div
                ref={lightboxScrollRef}
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
                  if (Math.abs(delta) > 50) navegarLightbox(delta < 0 ? 1 : -1)
                }}
              >
                {/* Barra superior fija */}
                <div className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between gap-4 bg-gradient-to-b from-[#f0eee6]/90 to-transparent px-4 py-3 md:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-xl font-bold tracking-tight text-[#d97757] md:text-2xl">
                      {String((lightboxAbierto ?? 0) + 1).padStart(2, '0')}
                    </span>
                    <h3 className="truncate font-serif text-lg font-medium text-[#191919] italic md:text-xl">
                      {lightboxFotoActiva.alt}
                    </h3>
                    <span className="hidden shrink-0 text-sm font-semibold tracking-widest text-[#8a857c] uppercase sm:block">
                      {(lightboxAbierto ?? 0) + 1} / {fotosMeOffice.length}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => navegarLightbox(-1)}
                      aria-label="Anterior"
                      className="rounded-full p-3 text-[#191919] transition-colors hover:bg-[#191919]/10"
                    >
                      <CaretLeft size={28} weight="bold" />
                    </button>
                    <button
                      onClick={() => navegarLightbox(1)}
                      aria-label="Siguiente"
                      className="rounded-full p-3 text-[#191919] transition-colors hover:bg-[#191919]/10"
                    >
                      <CaretRight size={28} weight="bold" />
                    </button>
                    <button
                      onClick={() => setLightboxAbierto(null)}
                      aria-label="Cerrar galería"
                      className="rounded-full p-3 text-[#191919] transition-colors hover:bg-[#191919]/10"
                    >
                      <X size={24} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Contenido que cambia con la foto */}
                <AnimatePresence initial={false} custom={lightboxDir} mode="wait">
                  <motion.div
                    key={lightboxAbierto}
                    custom={lightboxDir}
                    variants={gridVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    {/* Primer apartado: imagen a pantalla completa */}
                    <div className="relative flex min-h-dvh items-center justify-center px-4 py-16 md:px-20">
                      <img
                        src={lightboxFotoActiva.src}
                        alt={lightboxFotoActiva.alt}
                        className="max-h-[80vh] w-full max-w-full rounded-lg object-contain shadow-2xl ring-1 ring-[#e0dcd0]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          lightboxDescRef.current?.scrollIntoView({
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
                    <section ref={lightboxDescRef} className="bg-[#191919] px-4 pt-16 pb-24 md:px-6">
                      <div className="mx-auto max-w-3xl">
                        <p className="text-xs font-bold tracking-[0.2em] text-[#d97757] uppercase">
                          El espacio
                        </p>
                        <h4 className="mt-3 font-serif text-2xl font-medium text-[#f0eee6] italic md:text-3xl">
                          {lightboxFotoActiva.alt}
                        </h4>
                        <div className="mt-6 space-y-4">
                          <p className="text-base leading-relaxed text-[#d8d4c9]">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
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
    </SectionShell>
  )
}
