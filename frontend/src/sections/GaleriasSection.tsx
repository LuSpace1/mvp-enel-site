import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  CaretLeft,
  CaretRight,
  GridFour,
  Images,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { motion, useInView, useReducedMotion } from 'motion/react'

import { Reveal } from '@/components/ui/Reveal'
import { SectionShell } from '@/components/ui/SectionShell'
import { EquiposGaleria } from '@/components/EquiposGaleria'
import { MeOfficeShowcase } from '@/components/MeOfficeShowcase'
import { VisorGaleria } from '@/components/VisorGaleria'
import { fotosEquipos, instalaciones } from '@/lib/data/galerias'
import { track } from '@/lib/analytics'
import { useViajeStore } from '@/store/useViajeStore'

import meOfficeLogo from '@/assets/images/me_office_logo.png'

const TEASER_POS = [
  { x: '-50%', rotate: -7 },
  { x: '0%', rotate: 2 },
  { x: '50%', rotate: 8 },
]

const DESCRIPCION_INSTALACIONES_EXTRA =
  'Espacios pensados para el trabajo seguro y colaborativo de los equipos, con estándares de eficiencia energética y confort para quienes los visitan a diario.'

export function GaleriasSection() {
  const instalacionesRef = useRef<HTMLDivElement>(null)
  const carruselRef = useRef<HTMLDivElement>(null)
  const [galeriaVisible, setGaleriaVisible] = useState(false)
  const [indiceInicial, setIndiceInicial] = useState<number | null>(null)
  const [puedeAtras, setPuedeAtras] = useState(false)
  const [puedeAdelante, setPuedeAdelante] = useState(true)
  const [instalacionActiva, setInstalacionActiva] = useState<number | null>(null)
  const [fotoInstalacion, setFotoInstalacion] = useState(0)
  const [dirInstalacion, setDirInstalacion] = useState(0)
  const reduce = useReducedMotion()
  const instalacionesInView = useInView(instalacionesRef, { once: true, amount: 0.15 })
  const navegar = useViajeStore((estado) => estado.navegar)

  useEffect(() => {
    const nodo = document.getElementById('personas')
    if (!nodo) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => navegar(entry.isIntersecting ? 'personas' : 'galerias'))
      },
      { root: null, rootMargin: '-30% 0px -30% 0px' },
    )
    observer.observe(nodo)
    return () => observer.disconnect()
  }, [navegar])

  useEffect(() => {
    const el = carruselRef.current
    if (!el) return
    const actualizar = () => {
      setPuedeAtras(el.scrollLeft > 8)
      setPuedeAdelante(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
    }
    actualizar()
    el.addEventListener('scroll', actualizar, { passive: true })
    window.addEventListener('resize', actualizar)
    return () => {
      el.removeEventListener('scroll', actualizar)
      window.removeEventListener('resize', actualizar)
    }
  }, [])

  function desplazarInstalaciones(direccion: -1 | 1) {
    const el = carruselRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const paso = (card?.offsetWidth ?? el.clientWidth / 3) + 24
    el.scrollBy({ left: paso * direccion, behavior: reduce ? 'auto' : 'smooth' })
    track('instalaciones.desplazar', { direccion })
  }

  function abrirGaleriaInstalacion(indice: number) {
    setDirInstalacion(0)
    setFotoInstalacion(0)
    setInstalacionActiva(indice)
    track('instalacion.galeria.abrir', { instalacion: instalaciones[indice]?.titulo })
  }

  function navegarGaleriaInstalacion(dir: number) {
    const total = instalaciones[instalacionActiva ?? 0]?.galeria.length ?? 1
    setDirInstalacion(dir)
    setFotoInstalacion((prev) => (prev + dir + total) % total)
  }

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
        {/* Herramienta Me Office */}
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <img
            src={meOfficeLogo}
            alt="Me Office"
            className="3xl:h-16 h-14 w-auto drop-shadow-sm"
            width={112}
            height={123}
          />
          <h2 className="text-enel-navy 3xl:mt-5 3xl:text-6xl mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Herramienta Me Office
          </h2>
          <p className="3xl:mt-6 3xl:text-xl mt-5 text-base leading-relaxed font-medium text-neutral-600 md:text-lg">
            Recorre la herramienta en cuatro presentaciones: elige una pestaña y mira cómo se usa en
            el día a día.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="3xl:mt-14 mt-10">
          <MeOfficeShowcase />
        </Reveal>

        <Reveal id="personas" delay={0.1} className="3xl:mt-36 relative mt-24">
          <div className="3xl:mb-10 mb-8 flex flex-col justify-between gap-6 px-6 md:flex-row md:items-end md:px-12">
            <div>
              <h2 className="text-enel-navy 3xl:text-5xl text-3xl font-bold tracking-tight md:text-4xl">
                Descubre a los equipos
              </h2>
              <p className="3xl:text-lg mt-4 font-medium text-neutral-600">
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
              className="3xl:pb-20 px-6 pt-6 pb-14 md:px-12"
            >
              <EquiposGaleria abiertoInicial={indiceInicial} />
            </motion.div>
          ) : (
            <div className="3xl:pb-20 flex flex-col items-center gap-8 px-6 pb-14 md:px-12">
              {/* Mosaico de polaroids: vista previa interactiva de los equipos */}
              <div className="3xl:h-[460px] relative flex h-[320px] w-full max-w-3xl items-center justify-center md:h-[380px]">
                {fotosEquipos.slice(0, 3).map((foto, indice) => {
                  const pos = TEASER_POS[indice] || { x: 0, rotate: 0 }
                  return (
                    <motion.figure
                      key={foto.titulo}
                      className="group absolute origin-center cursor-pointer rounded-md border border-neutral-200 bg-white p-3 pb-9 shadow-[0_20px_40px_rgba(0,0,0,0.14)]"
                      style={{ width: 'min(47vw, 340px)', zIndex: indice === 1 ? 20 : 10 }}
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

        {/* Conoce nuestras instalaciones */}
        <div className="3xl:mt-32 mt-24">
          <motion.div
            ref={instalacionesRef}
            className="mx-auto max-w-3xl text-center"
            initial={reduce ? false : { opacity: 0, scaleY: 0.55, y: 48 }}
            animate={reduce || !instalacionesInView ? {} : { opacity: 1, scaleY: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
            style={{ transformOrigin: 'bottom center' }}
          >
            <h2 className="text-enel-navy 3xl:text-6xl text-4xl font-bold tracking-tight md:text-5xl">
              Conoce nuestras instalaciones
            </h2>
            <p className="3xl:mt-6 3xl:text-xl mt-5 text-base leading-relaxed font-medium text-neutral-600 md:text-lg">
              Los espacios donde trabaja la energía que mueve a Chile, desde el centro de formación
              hasta las oficinas de operación.
            </p>
          </motion.div>

          <div className="3xl:mt-12 mt-10 flex items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => desplazarInstalaciones(-1)}
              disabled={!puedeAtras}
              aria-label="Ver instalaciones anteriores"
              className="border-enel-navy/10 text-enel-navy flex h-10 w-10 shrink-0 translate-y-[0.625rem] items-center justify-center rounded-full border bg-white/95 shadow-[0_10px_30px_rgba(10,25,47,0.3)] transition-all duration-300 hover:scale-105 hover:bg-white disabled:pointer-events-none disabled:opacity-35 md:h-11 md:w-11"
            >
              <CaretLeft size={18} weight="bold" />
            </button>

            <div
              ref={carruselRef}
              className="flex min-w-0 flex-1 snap-x snap-mandatory scroll-px-2 [scrollbar-width:none] gap-6 overflow-x-auto px-2 pt-1 pb-10 [&::-webkit-scrollbar]:hidden"
            >
              {instalaciones.map((instalacion, indice) => (
                <Reveal
                  key={instalacion.titulo}
                  delay={indice * 0.08}
                  className="w-[85%] shrink-0 snap-start sm:w-[60%] md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                >
                  <article
                    onClick={() => abrirGaleriaInstalacion(indice)}
                    className="group 3xl:h-[24rem] relative h-[20rem] cursor-pointer overflow-hidden rounded-[2rem] border-4 border-white/70 shadow-[0_20px_45px_-15px_rgba(10,25,47,0.55)]"
                  >
                    <img
                      src={instalacion.imagen}
                      alt={instalacion.alt}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.06]"
                    />
                    <div className="from-enel-navy via-enel-navy/55 absolute inset-0 bg-gradient-to-t to-transparent" />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        abrirGaleriaInstalacion(indice)
                      }}
                      aria-label={`Ver galería de ${instalacion.titulo}`}
                      className="absolute top-5 right-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-2 text-[11px] font-bold tracking-[0.08em] text-white uppercase shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/25"
                    >
                      <Images size={15} weight="fill" />
                      Galería
                    </button>

                    <div className="3xl:p-8 relative flex h-full flex-col justify-end p-6 md:p-7">
                      <span
                        aria-hidden="true"
                        className="bg-enel-pink mb-4 block h-1 w-10 rounded-full"
                      />
                      <h3 className="3xl:text-[1.7rem] text-2xl leading-tight font-bold tracking-tight text-white">
                        {instalacion.titulo}
                      </h3>
                      <p className="mt-2 text-[11px] font-bold tracking-[0.18em] text-white/65 uppercase">
                        {instalacion.subtitulo}
                      </p>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/75">
                        {instalacion.descripcion}
                      </p>
                      <a
                        href={instalacion.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.stopPropagation()
                          track('instalacion.abrir', { instalacion: instalacion.titulo })
                        }}
                        className="text-enel-navy mt-6 inline-flex w-fit items-center gap-2.5 rounded-full bg-white/95 px-5 py-3 text-xs font-bold tracking-wide uppercase shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
                      >
                        {instalacion.accion}
                        <ArrowUpRight size={16} weight="bold" />
                      </a>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            <button
              type="button"
              onClick={() => desplazarInstalaciones(1)}
              disabled={!puedeAdelante}
              aria-label="Ver más instalaciones"
              className="border-enel-navy/10 text-enel-navy flex h-10 w-10 shrink-0 translate-y-[0.625rem] items-center justify-center rounded-full border bg-white/95 shadow-[0_10px_30px_rgba(10,25,47,0.3)] transition-all duration-300 hover:scale-105 hover:bg-white disabled:pointer-events-none disabled:opacity-35 md:h-11 md:w-11"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Galería de fotos de cada instalación */}
      <VisorGaleria
        fotos={instalacionActiva !== null ? instalaciones[instalacionActiva]!.galeria : []}
        indice={instalacionActiva !== null ? fotoInstalacion : null}
        direccion={dirInstalacion}
        etiqueta="La instalación"
        descripcionExtra={DESCRIPCION_INSTALACIONES_EXTRA}
        onCerrar={() => setInstalacionActiva(null)}
        onNavegar={navegarGaleriaInstalacion}
      />
    </SectionShell>
  )
}
