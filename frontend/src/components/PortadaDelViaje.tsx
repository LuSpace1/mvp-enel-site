import { useEffect, useState } from 'react'
import { ArrowDown } from '@phosphor-icons/react'

import { motion, useReducedMotion } from 'motion/react'
import { VideoEmbed } from '@/components/ui/VideoEmbed'
import { RevealTexto } from '@/components/ui/RevealTexto'
import { track } from '@/lib/analytics'
import { videoDeSeccion } from '@/lib/data/videos'
import { useViajeStore } from '@/store/useViajeStore'

export function PortadaDelViaje() {
  const video = videoDeSeccion('hero_main')
  const reduce = useReducedMotion()

  const introTerminada = useViajeStore((estado) => estado.introTerminada)
  const [entradaForzada, setEntradaForzada] = useState(false)

  // La portada se revela cuando la intro lo indica; el timeout es una red de
  // seguridad para que nunca quede oculta si la intro no llega a montarse.
  useEffect(() => {
    const temporizador = window.setTimeout(() => setEntradaForzada(true), 7000)
    return () => window.clearTimeout(temporizador)
  }, [])

  const entrada = Boolean(reduce) || introTerminada || entradaForzada

  return (
    <section
      id="portada"
      className="relative flex min-h-[72dvh] items-center overflow-hidden bg-white py-16 md:min-h-[80dvh] md:py-24"
    >
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 text-center md:px-8">
        <div className="flex flex-col items-center">
          <RevealTexto
            as="h1"
            delay={0.15}
            activar={entrada}
            className="text-enel-navy w-full text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-[4rem]"
          >
            Conoce <span className="texto-gradiente-azul">Enel Distribución</span>
          </RevealTexto>
        </div>

        {video && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={reduce || entrada ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1.2, delay: entrada ? 0.5 : 0, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-8 w-full max-w-3xl"
          >
            <VideoEmbed youtubeUrl={video.youtube_url} titulo={video.title} />
          </motion.div>
        )}

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={reduce || entrada ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1.2, delay: entrada ? 0.7 : 0, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col items-center"
        >
          <RevealTexto
            as="p"
            variante="parrafo"
            activar={entrada}
            delay={0.35}
            className="max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg"
          >
            En este sitio, encontrarás todo lo que necesitas saber sobre el negocio, nuestra cultura
            organizacional, quiénes somos y cómo trabajamos para ser la empresa de distribución de
            energía eléctrica más grande de Chile.
          </RevealTexto>
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
          </div>
        </motion.div>
      </div>
    </section>
  )
}
