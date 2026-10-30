import { useEffect, useRef, useState, type RefObject } from 'react'
import { ArrowUpRight, CaretLeft, CaretRight, Images } from '@phosphor-icons/react'
import { motion, useInView, useReducedMotion } from 'motion/react'

import { Reveal } from '@/components/ui/Reveal'
import { RevealTexto } from '@/components/ui/RevealTexto'
import { SectionShell } from '@/components/ui/SectionShell'
import { VisorGaleria } from '@/components/VisorGaleria'
import { useCampo, useLista } from '@/lib/cms/contenido'
import { instalaciones as instalacionesBase } from '@/lib/data/galerias'
import { track } from '@/lib/analytics'

const DESCRIPCION_INSTALACIONES_EXTRA =
  'Espacios pensados para el trabajo seguro y colaborativo de los equipos, con estándares de eficiencia energética y confort para quienes los visitan a diario.'

interface GaleriaCms {
  imagen: string
  titulo: string
  descripcion: string
}

interface InstalacionCms {
  titulo: string
  subtitulo: string
  descripcion: string
  url: string
  accion: string
  imagen: string
  alt: string
  galeria: GaleriaCms[]
}

/**
 * Carrusel centrado al estilo HomeWorks: calcula en cada card su cercanía al centro
 * del viewport y la expone como `--centro` (1 = centro, 0 = borde) para que el CSS
 * escale la card activa y atenúe las laterales.
 */
function useCarruselCentrado(ref: RefObject<HTMLDivElement | null>, activo: boolean) {
  const reduce = useReducedMotion()

  useEffect(() => {
    const contenedor = ref.current
    if (!contenedor) return

    const hijos = Array.from(contenedor.children) as HTMLElement[]

    if (reduce || !activo) {
      hijos.forEach((hijo) => hijo.style.setProperty('--centro', '1'))
      return
    }

    let raf = 0
    const aplicar = () => {
      raf = 0
      const caja = contenedor.getBoundingClientRect()
      const centroVista = caja.left + caja.width / 2
      const mitad = caja.width / 2 || 1
      hijos.forEach((hijo) => {
        const rect = hijo.getBoundingClientRect()
        const centroHijo = rect.left + rect.width / 2
        const t = Math.max(0, Math.min(1, 1 - Math.abs(centroHijo - centroVista) / mitad))
        hijo.style.setProperty('--centro', t.toFixed(3))
      })
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(aplicar)
    }

    aplicar()
    contenedor.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      contenedor.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [ref, reduce, activo])
}

export function EspaciosSection() {
  const instalacionesRef = useRef<HTMLDivElement>(null)
  const carruselRef = useRef<HTMLDivElement>(null)
  const [puedeAtras, setPuedeAtras] = useState(false)
  const [puedeAdelante, setPuedeAdelante] = useState(true)
  const [instalacionActiva, setInstalacionActiva] = useState<number | null>(null)
  const [fotoInstalacion, setFotoInstalacion] = useState(0)
  const [dirInstalacion, setDirInstalacion] = useState(0)
  const progresoRef = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const instalacionesInView = useInView(instalacionesRef, { once: true, amount: 0.15 })

  const titulo = useCampo('espacios', 'titulo', 'Conoce nuestras instalaciones')
  const intro = useCampo(
    'espacios',
    'intro',
    'Los espacios donde trabaja la energía que mueve a Chile, desde el centro de formación hasta las oficinas de operación.',
  )
  const descripcionExtra = useCampo(
    'espacios',
    'descripcion_extra',
    DESCRIPCION_INSTALACIONES_EXTRA,
  )
  const instalacionesCms = useLista<InstalacionCms>('espacios', 'instalaciones', [])
  const instalaciones = instalacionesCms.length
    ? instalacionesCms.map((instalacion, indice) => {
        const base =
          instalacionesBase.find((item) => item.titulo === instalacion.titulo) ??
          instalacionesBase[indice]
        const imagen = instalacion.imagen || base?.imagen || ''
        const galeriaCms = (instalacion.galeria ?? [])
          .filter((foto) => foto.imagen)
          .map((foto) => ({
            src: foto.imagen,
            titulo: foto.titulo,
            descripcion: foto.descripcion,
          }))
        const galeriaBase = base?.galeria ?? []
        const galeria = galeriaCms.length
          ? galeriaCms
          : galeriaBase.length
            ? galeriaBase
            : imagen
              ? [
                  {
                    src: imagen,
                    titulo: instalacion.titulo,
                    descripcion: instalacion.descripcion,
                  },
                ]
              : []
        return {
          titulo: instalacion.titulo,
          subtitulo: instalacion.subtitulo,
          descripcion: instalacion.descripcion,
          url: instalacion.url,
          accion: instalacion.accion,
          imagen,
          alt: instalacion.alt || base?.alt || instalacion.titulo,
          galeria,
        }
      })
    : instalacionesBase

  useCarruselCentrado(carruselRef, instalacionesInView)

  useEffect(() => {
    const el = carruselRef.current
    if (!el) return
    const actualizar = () => {
      const max = el.scrollWidth - el.clientWidth
      setPuedeAtras(el.scrollLeft > 8)
      setPuedeAdelante(el.scrollLeft < max - 8)
      if (progresoRef.current) {
        const avance = max > 8 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0
        progresoRef.current.style.width = `${avance * 100}%`
      }
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
    if (!instalaciones[indice]?.galeria.length) return
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
    <SectionShell id="espacios" className="relative overflow-hidden bg-white">
      <motion.div
        ref={instalacionesRef}
        className="mx-auto max-w-3xl text-center"
        initial={reduce ? false : { opacity: 0, scaleY: 0.55, y: 48 }}
        animate={reduce || !instalacionesInView ? {} : { opacity: 1, scaleY: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 70, damping: 18 }}
        style={{ transformOrigin: 'bottom center' }}
      >
        <RevealTexto as="h2" className="text-enel-navy text-4xl md:text-6xl">
          {titulo}
        </RevealTexto>
        <RevealTexto
          as="p"
          variante="parrafo"
          className="mt-4 text-base leading-relaxed font-medium text-neutral-600 md:text-lg"
        >
          {intro}
        </RevealTexto>
      </motion.div>

      <div className="3xl:mt-12 mt-10">
        <div className="relative left-1/2 w-[min(100vw,1920px)] -translate-x-1/2">
          <div
            ref={carruselRef}
            className="flex min-w-0 snap-x snap-mandatory scroll-px-6 [scrollbar-width:none] gap-6 overflow-x-auto px-6 pt-1 pb-10 md:scroll-px-10 md:px-10 [&::-webkit-scrollbar]:hidden"
          >
            {instalaciones.map((instalacion, indice) => (
              <Reveal
                key={instalacion.titulo}
                delay={indice * 0.08}
                className="w-[86%] shrink-0 snap-start sm:w-[62%] md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
              >
                <article
                  onClick={() => abrirGaleriaInstalacion(indice)}
                  className="group carrusel-centrado bg-enel-navy 3xl:h-[26rem] relative h-[22rem] cursor-pointer overflow-hidden rounded-[2rem] border-4 border-white/70 shadow-[0_20px_45px_-15px_rgba(10,25,47,0.55)] md:h-[24rem]"
                >
                  {instalacion.imagen && (
                    <img
                      src={instalacion.imagen}
                      alt={instalacion.alt}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.06]"
                    />
                  )}
                  <div className="from-enel-navy via-enel-navy/55 absolute inset-0 bg-gradient-to-t to-transparent" />
                  <div
                    aria-hidden="true"
                    className="carrusel-centrado-velo pointer-events-none absolute inset-0"
                  />

                  {instalacion.galeria.length > 0 && (
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
                  )}

                  <div className="3xl:p-10 relative flex h-full flex-col justify-end p-6 md:p-8">
                    <span
                      aria-hidden="true"
                      className="bg-enel-pink mb-4 block h-1 w-10 rounded-full"
                    />
                    <h3 className="3xl:text-[1.9rem] text-2xl leading-tight text-white md:text-[1.75rem]">
                      {instalacion.titulo}
                    </h3>
                    <p className="mt-2 text-[11px] font-bold tracking-[0.18em] text-white/65 uppercase">
                      {instalacion.subtitulo}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/75 md:text-[15px]">
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

          <div className="mx-auto mt-1 flex w-full max-w-md items-center gap-4 px-6 md:mt-2 md:px-0">
            <button
              type="button"
              onClick={() => desplazarInstalaciones(-1)}
              disabled={!puedeAtras}
              aria-label="Ver instalaciones anteriores"
              className="border-enel-navy/10 text-enel-navy flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-[0_10px_30px_rgba(10,25,47,0.16)] transition-all duration-300 hover:scale-105 hover:bg-white disabled:pointer-events-none disabled:opacity-35"
            >
              <CaretLeft size={18} weight="bold" />
            </button>

            <div
              aria-hidden="true"
              className="bg-enel-navy/10 relative h-1 flex-1 overflow-hidden rounded-full"
            >
              <span
                ref={progresoRef}
                className="bg-enel-blue absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-out"
                style={{ width: '0%' }}
              />
            </div>

            <button
              type="button"
              onClick={() => desplazarInstalaciones(1)}
              disabled={!puedeAdelante}
              aria-label="Ver más instalaciones"
              className="border-enel-navy/10 text-enel-navy flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-[0_10px_30px_rgba(10,25,47,0.16)] transition-all duration-300 hover:scale-105 hover:bg-white disabled:pointer-events-none disabled:opacity-35"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      <VisorGaleria
        fotos={instalacionActiva !== null ? instalaciones[instalacionActiva]!.galeria : []}
        indice={instalacionActiva !== null ? fotoInstalacion : null}
        direccion={dirInstalacion}
        titulo={instalacionActiva !== null ? instalaciones[instalacionActiva]!.titulo : ''}
        etiqueta="La instalación"
        descripcion={
          instalacionActiva !== null ? instalaciones[instalacionActiva]!.descripcion : undefined
        }
        descripcionExtra={descripcionExtra}
        onCerrar={() => setInstalacionActiva(null)}
        onNavegar={navegarGaleriaInstalacion}
      />
    </SectionShell>
  )
}
