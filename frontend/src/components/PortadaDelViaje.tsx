import { useEffect, useState } from 'react'
import { ArrowDown } from '@phosphor-icons/react'

import { motion, useReducedMotion } from 'motion/react'
import { VideoEmbed } from '@/components/ui/VideoEmbed'
import { RevealTexto } from '@/components/ui/RevealTexto'
import { track } from '@/lib/analytics'
import { useCampo } from '@/lib/cms/contenido'
import { useViajeStore } from '@/store/useViajeStore'

// Curva sinusoidal muestreada: el título sube y baja sin detenerse en los
// extremos, en lugar del típico rebote entre dos posiciones.
const FLOTE_Y = Array.from({ length: 25 }, (_, i) =>
  Number((-4 + 4 * Math.cos((i / 24) * Math.PI * 2)).toFixed(2)),
)

// Flotación del CTA: amplitud menor para no competir con el pulso de escala.
const FLOTE_CTA_Y = Array.from({ length: 25 }, (_, i) =>
  Number((-2.5 + 2.5 * Math.cos((i / 24) * Math.PI * 2)).toFixed(2)),
)

const DESCRIPCION_POR_DEFECTO =
  'Descubre quiénes somos, cómo funciona nuestro negocio y qué nos mueve cada día. Un espacio para conocer nuestra operación, los principios que nos guían y nuestro rol en la distribución de energía eléctrica en Chile.'

// Video fijo en código: no se toma del CMS.
const VIDEO_PORTADA_URL = 'https://www.youtube.com/watch?v=5aEIFxjHEf0'

export function PortadaDelViaje() {
  const tituloDestacado = useCampo('portada', 'titulo_destacado', 'Enel Distribución')
  const descripcion = useCampo('portada', 'descripcion', DESCRIPCION_POR_DEFECTO)
  const ctaTexto = useCampo('portada', 'cta_texto', 'Explorar el sitio')
  const videoUrl = VIDEO_PORTADA_URL
  const videoTitulo = useCampo('portada', 'video_titulo', 'Mensaje del Gerente General Paolo Leidi')
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
            className="text-enel-navy w-full text-4xl leading-[1.05] sm:text-5xl md:text-6xl lg:text-[4rem]"
          >
            Conoce{' '}
            <motion.span
              className="inline-block will-change-transform"
              animate={reduce ? undefined : { y: FLOTE_Y }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
              <span className="texto-gradiente-azul">{tituloDestacado}</span>
            </motion.span>
          </RevealTexto>
        </div>

        {videoUrl && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={reduce || entrada ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1.2, delay: entrada ? 0.5 : 0, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-8 w-full max-w-3xl"
          >
            <VideoEmbed youtubeUrl={videoUrl} titulo={videoTitulo} />
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
            className="max-w-2xl text-base leading-relaxed font-medium text-neutral-600 md:text-lg"
          >
            {descripcion}
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
                      y: FLOTE_CTA_Y,
                      scale: [1, 1, 1.045, 1, 1],
                      boxShadow: [
                        '0 0 18px 2px rgba(235,0,83,0.28), 0 4px 20px rgba(235,0,83,0.22)',
                        '0 0 26px 6px rgba(235,0,83,0.45), 0 6px 26px rgba(235,0,83,0.32)',
                        '0 0 18px 2px rgba(235,0,83,0.28), 0 4px 20px rgba(235,0,83,0.22)',
                      ],
                    }
              }
              transition={
                reduce
                  ? undefined
                  : {
                      y: { duration: 5, repeat: Infinity, ease: 'linear' },
                      scale: {
                        duration: 5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        times: [0, 0.4, 0.52, 0.64, 0.74],
                      },
                      boxShadow: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
                    }
              }
              whileHover={reduce ? undefined : { scale: 1.1, y: -3 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              className="border-enel-pink from-enel-pink relative inline-flex h-14 cursor-pointer items-center gap-2.5 rounded-full border-2 bg-gradient-to-r to-[#ff2d78] px-8 text-[15px] font-bold text-white shadow-xl transition"
              data-analytics-component="portada"
              data-analytics-accion="iniciar"
            >
              <span className="bg-enel-pink/20 absolute -inset-0.5 -z-10 rounded-full blur-md" />
              {ctaTexto}
              <ArrowDown size={18} weight="bold" className="animate-bounce" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
