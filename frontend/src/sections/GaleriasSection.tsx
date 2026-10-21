import { useEffect, useRef, useState, type RefObject } from 'react'
import { ArrowUpRight, CaretLeft, CaretRight, Images } from '@phosphor-icons/react'
import { motion, useInView, useReducedMotion } from 'motion/react'

import { Reveal } from '@/components/ui/Reveal'
import { RevealTexto } from '@/components/ui/RevealTexto'
import { SectionShell } from '@/components/ui/SectionShell'
import { MeOfficeHerramientas } from '@/components/MeOfficeHerramientas'
import { VisorGaleria } from '@/components/VisorGaleria'
import { instalaciones } from '@/lib/data/galerias'
import { track } from '@/lib/analytics'
import { useViajeStore } from '@/store/useViajeStore'

import meOfficeLogo from '@/assets/images/me_office_logo.png'
import portalMe from '@/assets/images/portal-me.png'

// La polaroid de la intranet muestra una vista del portal ME.
const PORTAL_INTRANET = {
  src: portalMe,
  alt: 'Vista del portal ME de Enel',
}

const DESCRIPCION_INSTALACIONES_EXTRA =
  'Espacios pensados para el trabajo seguro y colaborativo de los equipos, con estándares de eficiencia energética y confort para quienes los visitan a diario.'

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

export function GaleriasSection() {
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
  const navegar = useViajeStore((estado) => estado.navegar)

  useCarruselCentrado(carruselRef, instalacionesInView)

  useEffect(() => {
    // Cada bloque de la sección (intranet e instalaciones) es un capítulo propio:
    // cuando entra en la franja central actualiza el paso; al salir vuelve a "ME".
    const objetivos: { id: string; anterior: string }[] = [
      { id: 'personas', anterior: 'galerias' },
      { id: 'espacios', anterior: 'galerias' },
    ]

    const observers = objetivos.map(({ id, anterior }) => {
      const nodo = document.getElementById(id)
      if (!nodo) return null
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              navegar(id)
            } else if (useViajeStore.getState().pasoActual === id) {
              navegar(anterior)
            }
          })
        },
        { root: null, rootMargin: '-30% 0px -30% 0px' },
      )
      observer.observe(nodo)
      return observer
    })

    return () => observers.forEach((observer) => observer?.disconnect())
  }, [navegar])

  useEffect(() => {
    const el = carruselRef.current
    if (!el) return
    const actualizar = () => {
      const max = el.scrollWidth - el.clientWidth
      setPuedeAtras(el.scrollLeft > 8)
      setPuedeAdelante(el.scrollLeft < max - 8)
      // Se actualiza por DOM para no re-renderizar la sección en cada frame del scroll.
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
    <SectionShell id="galerias" className="relative overflow-hidden bg-white">
      <motion.div
        className="relative z-10 w-full"
        initial={reduce ? false : { opacity: 0, scale: 1.08, filter: 'blur(10px)' }}
        whileInView={reduce ? undefined : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
      >
        <Reveal y={0} className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <img
            src={meOfficeLogo}
            alt="Logo ME"
            className="3xl:h-16 h-14 w-auto drop-shadow-sm"
            width={112}
            height={123}
            loading="lazy"
            decoding="async"
          />
          <RevealTexto
            as="h2"
            className="text-enel-navy 3xl:mt-5 3xl:text-6xl mt-4 text-4xl font-bold tracking-tight md:text-5xl"
          >
            Herramientas ME
          </RevealTexto>
          <RevealTexto
            as="p"
            variante="parrafo"
            className="3xl:mt-6 3xl:text-xl mt-5 text-base leading-relaxed font-medium text-neutral-600 md:text-lg"
          >
            Todo el ecosistema ME en un solo lugar: accede directo a tus herramientas, formación y
            beneficios.
          </RevealTexto>
        </Reveal>

        <Reveal delay={0.1} className="3xl:mt-16 mt-12">
          <MeOfficeHerramientas />
        </Reveal>

        <Reveal id="personas" y={0} delay={0.1} className="3xl:mt-44 relative mt-32">
          <div className="grid items-center gap-10 px-6 pb-14 md:grid-cols-2 md:gap-16 md:px-12">
            <motion.figure
              className="group relative mx-auto w-full max-w-lg rounded-md border border-neutral-200 bg-white p-3 pb-12 shadow-[0_28px_60px_rgba(0,0,0,0.16)]"
              initial={reduce ? false : { opacity: 0, y: 32, rotate: -3 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0, rotate: -1.5 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              whileHover={reduce ? {} : { rotate: 0, y: -8 }}
            >
              <div className="bg-enel-mist relative aspect-[800/398] overflow-hidden rounded-sm shadow-inner">
                <img
                  src={PORTAL_INTRANET.src}
                  alt={PORTAL_INTRANET.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
                />
              </div>
              <figcaption className="text-enel-navy absolute right-0 bottom-4 left-0 flex items-baseline justify-center px-3">
                <span className="font-serif text-lg font-medium italic">Intranet</span>
              </figcaption>
            </motion.figure>

            <div className="max-w-xl">
              <RevealTexto
                as="h2"
                className="3xl:text-5xl text-3xl font-bold tracking-tight md:text-4xl"
              >
                Mantente al día
              </RevealTexto>
              <RevealTexto
                as="p"
                variante="parrafo"
                className="3xl:text-lg mt-4 text-base leading-relaxed font-medium text-neutral-600"
              >
                La energía que mueve a Chile también vive en nuestra intranet: novedades, personas y
                recursos para tu día a día.
              </RevealTexto>
              <a
                href="https://enelcom.sharepoint.com/sites/globalintranet/SitePages/es/Home.aspx"
                target="_blank"
                rel="noreferrer"
                onClick={() => track('personas.intranet')}
                className="group bg-enel-navy hover:bg-enel-blue 3xl:mt-10 mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold tracking-wide text-white uppercase shadow-[0_12px_28px_rgba(10,25,47,0.25)] transition-all duration-300 hover:-translate-y-0.5"
              >
                Accede a nuestra intranet
                <ArrowUpRight
                  size={18}
                  weight="bold"
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </div>
          </div>
        </Reveal>

        <div id="espacios" className="3xl:mt-40 mt-32">
          <motion.div
            ref={instalacionesRef}
            className="mx-auto max-w-3xl text-center"
            initial={reduce ? false : { opacity: 0, scaleY: 0.55, y: 48 }}
            animate={reduce || !instalacionesInView ? {} : { opacity: 1, scaleY: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18 }}
            style={{ transformOrigin: 'bottom center' }}
          >
            <RevealTexto
              as="h2"
              className="text-enel-navy 3xl:text-6xl text-4xl font-bold tracking-tight md:text-5xl"
            >
              Conoce nuestras instalaciones
            </RevealTexto>
            <RevealTexto
              as="p"
              variante="parrafo"
              className="3xl:mt-6 3xl:text-xl mt-5 text-base leading-relaxed font-medium text-neutral-600 md:text-lg"
            >
              Los espacios donde trabaja la energía que mueve a Chile, desde el centro de formación
              hasta las oficinas de operación.
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
                      className="group carrusel-centrado 3xl:h-[26rem] relative h-[22rem] cursor-pointer overflow-hidden rounded-[2rem] border-4 border-white/70 shadow-[0_20px_45px_-15px_rgba(10,25,47,0.55)] md:h-[24rem]"
                    >
                      <img
                        src={instalacion.imagen}
                        alt={instalacion.alt}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.06]"
                      />
                      <div className="from-enel-navy via-enel-navy/55 absolute inset-0 bg-gradient-to-t to-transparent" />
                      <div
                        aria-hidden="true"
                        className="carrusel-centrado-velo pointer-events-none absolute inset-0"
                      />

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

                      <div className="3xl:p-10 relative flex h-full flex-col justify-end p-6 md:p-8">
                        <span
                          aria-hidden="true"
                          className="bg-enel-pink mb-4 block h-1 w-10 rounded-full"
                        />
                        <h3 className="3xl:text-[1.9rem] text-2xl leading-tight font-bold tracking-tight text-white md:text-[1.75rem]">
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
        </div>
      </motion.div>

      {/* Galería de fotos de cada instalación */}
      <VisorGaleria
        fotos={instalacionActiva !== null ? instalaciones[instalacionActiva]!.galeria : []}
        indice={instalacionActiva !== null ? fotoInstalacion : null}
        direccion={dirInstalacion}
        titulo={instalacionActiva !== null ? instalaciones[instalacionActiva]!.titulo : ''}
        etiqueta="La instalación"
        descripcion={
          instalacionActiva !== null ? instalaciones[instalacionActiva]!.descripcion : undefined
        }
        descripcionExtra={DESCRIPCION_INSTALACIONES_EXTRA}
        onCerrar={() => setInstalacionActiva(null)}
        onNavegar={navegarGaleriaInstalacion}
      />
    </SectionShell>
  )
}
