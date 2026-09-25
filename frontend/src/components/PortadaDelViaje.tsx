import { useEffect, useRef } from 'react'
import { ArrowDown, PlayCircle } from '@phosphor-icons/react'

import { motion, useInView, useReducedMotion } from 'motion/react'
import { VideoEmbed } from '@/components/ui/VideoEmbed'
import { track } from '@/lib/analytics'
import { videoDeSeccion } from '@/lib/data/videos'

import videoPortada from '@/assets/videos/hero.mp4'
import posterPortada from '@/assets/images/hero-poster.jpg'

export function PortadaDelViaje() {
  const video = videoDeSeccion('hero_main')
  const reduce = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const enVista = useInView(videoRef, { amount: 0.1 })

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (enVista) {
      void el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [enVista])

  return (
    <section
      id="portada"
      className="bg-enel-navy relative flex min-h-[72dvh] items-center overflow-hidden py-16 md:min-h-[80dvh] md:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.video
          ref={videoRef}
          src={videoPortada}
          poster={posterPortada}
          preload="metadata"
          autoPlay
          muted
          loop
          playsInline
          disableRemotePlayback
          aria-hidden="true"
          className="h-full w-full object-cover opacity-[0.45]"
          initial={reduce ? false : { scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.45 }}
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
            className="mx-auto mt-8 w-full max-w-3xl"
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
  )
}
