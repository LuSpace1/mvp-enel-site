import { useEffect } from 'react'
import { ArrowDown, MapPin, PlayCircle } from '@phosphor-icons/react'

import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { Reveal } from '@/components/ui/Reveal'
import { VideoEmbed } from '@/components/ui/VideoEmbed'
import { SenderoRuta } from '@/components/SenderoRuta'
import { track } from '@/lib/analytics'
import { useViajeStore } from '@/store/useViajeStore'
import { PASOS_VIAJE } from '@/lib/data/viaje'
import { videoDeSeccion } from '@/lib/data/videos'

import fotoMUT from '@/assets/images/MUT.jpg'

const PASOS_SIN_PORTADA = PASOS_VIAJE.filter((paso) => paso.id !== 'portada')

export function PortadaDelViaje() {
  const mostrarRuta = useViajeStore((estado) => estado.mostrarRuta)
  const abrirRuta = useViajeStore((estado) => estado.abrirRuta)
  const navegar = useViajeStore((estado) => estado.navegar)
  const video = videoDeSeccion('hero_main')
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!mostrarRuta) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navegar('mapa-del-viaje')
          }
        })
      },
      { root: null, rootMargin: '-30% 0px -30% 0px' },
    )

    const nodo = document.getElementById('mapa-del-viaje')
    if (nodo) observer.observe(nodo)
    return () => observer.disconnect()
  }, [mostrarRuta, navegar])

  const handleElegirRuta = () => {
    track('portada.cta.ruta')
    abrirRuta()
    setTimeout(() => {
      const el = document.getElementById('mapa-del-viaje')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <>
      <section
        id="portada"
        className="bg-enel-navy relative flex min-h-[72dvh] items-center overflow-hidden py-16 md:min-h-[80dvh] md:py-24"
      >
        <div className="pointer-events-none absolute inset-0">
          <motion.img
            src={fotoMUT}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover opacity-[0.55]"
            initial={reduce ? false : { scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.55 }}
            transition={{ duration: 2.0, ease: [0.25, 1, 0.5, 1] }}
          />
          <motion.div
            className="from-enel-navy via-enel-navy/70 to-enel-navy-soft/30 absolute inset-0 bg-gradient-to-b"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
          />
        </div>

        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 text-center md:px-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <h1 className="w-full text-4xl leading-[1.05] font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4rem]">
              Bienvenido a <span className="texto-gradiente-azul">Enel Distribución</span>.
            </h1>
          </motion.div>

          {video && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.3, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 w-full"
            >
              <VideoEmbed youtubeUrl={video.youtube_url} titulo={video.title} />
            </motion.div>
          )}

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col items-center"
          >
            <p className="max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              Bienvenido a Enel Distribución. En este sitio, encontrarás todo lo que necesitas saber
              sobre el negocio, nuestra cultura organizacional, quiénes somos y cómo trabajamos para
              ser la empresa de distribución de energía eléctrica más grande de Chile.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <motion.button
                type="button"
                onClick={() => {
                  track('portada.cta.iniciar')
                  const el = document.getElementById('historia')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                animate={
                  reduce
                    ? undefined
                    : {
                        x: [0, -3, 3, -2, 2, -1, 0],
                        y: [0, 2, -2, 1, -1, 0.5, 0],
                        boxShadow: [
                          '0 0 20px 4px rgba(235,0,83,0.35), 0 4px 24px rgba(235,0,83,0.25)',
                          '0 0 40px 10px rgba(235,0,83,0.6), 0 6px 32px rgba(235,0,83,0.45)',
                          '0 0 20px 4px rgba(235,0,83,0.35), 0 4px 24px rgba(235,0,83,0.25)',
                        ],
                      }
                }
                transition={
                  reduce
                    ? undefined
                    : {
                        x: { duration: 0.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' },
                        y: { duration: 0.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' },
                        boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                      }
                }
                whileHover={reduce ? undefined : { scale: 1.06, y: -3 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                className="border-enel-pink from-enel-pink relative inline-flex h-14 items-center gap-2.5 rounded-full border-2 bg-gradient-to-r to-[#ff2d78] px-8 text-[15px] font-bold text-white shadow-xl transition"
                data-analytics-component="portada"
                data-analytics-accion="iniciar"
              >
                <span className="bg-enel-pink/20 absolute -inset-0.5 -z-10 rounded-full blur-md" />
                Comenzar el viaje
                <ArrowDown size={18} weight="bold" className="animate-bounce" />
              </motion.button>
              <button
                type="button"
                onClick={handleElegirRuta}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-white/30 px-6 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
                data-analytics-component="portada"
                data-analytics-accion="elegir-ruta"
              >
                <MapPin size={18} weight="duotone" />
                Elige tu ruta
              </button>
              <button
                type="button"
                onClick={() => {
                  track('portada.cta.equipo')
                  const el = document.getElementById('organigrama')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                data-analytics-component="portada"
                data-analytics-accion="conocer-equipo"
              >
                <PlayCircle size={18} weight="duotone" />
                Conocer el equipo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {mostrarRuta && (
          <motion.section
            id="mapa-del-viaje"
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -32 }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.7 }}
            className="relative overflow-hidden bg-[#f0eee6] py-20 md:py-28"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-multiply"
              style={{
                backgroundImage: 'radial-gradient(rgba(10, 25, 47, 0.35) 1.5px, transparent 1.5px)',
                backgroundSize: '16px 16px',
              }}
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="bg-enel-blue/10 absolute -top-28 -left-28 h-96 w-96 rounded-full blur-3xl" />
              <div className="absolute top-1/3 -right-32 h-[26rem] w-[26rem] rounded-full bg-emerald-300/25 blur-3xl" />
              <div className="bg-enel-pink/15 absolute top-1/4 -left-16 h-64 w-64 rounded-full blur-3xl" />
              <div className="absolute top-[15%] right-[5%] h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />
              <div className="absolute right-[8%] bottom-[10%] h-56 w-56 rounded-full bg-sky-400/15 blur-3xl" />
              <svg
                className="absolute top-1/3 -left-8 h-64 w-2 opacity-[0.08]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="50%"
                  y1="0"
                  x2="50%"
                  y2="100%"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="6 10"
                />
              </svg>
              <svg
                className="absolute top-[40%] right-4 h-48 w-2 opacity-[0.08]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="50%"
                  y1="0"
                  x2="50%"
                  y2="100%"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="6 10"
                />
              </svg>
            </div>

            <div className="relative mx-auto w-full max-w-6xl px-5 md:px-8">
              <Reveal>
                <h2 className="text-enel-navy max-w-3xl text-4xl leading-[1.02] font-semibold tracking-tight sm:text-5xl md:text-6xl">
                  Elige tu ruta<span className="texto-gradiente-azul"> por el portal</span>
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-600 md:text-lg">
                  No hay un único camino. Salta entre capítulos en el orden que se te antoje.
                </p>
              </Reveal>

              <SenderoRuta pasos={PASOS_SIN_PORTADA} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
