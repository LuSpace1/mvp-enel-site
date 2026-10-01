import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'
import { CaretRight } from '@phosphor-icons/react'

import { track } from '@/lib/analytics'
import logoEnel from '@/assets/icons/Enel_Group_logo_blanco.png'
import videoIntro from '@/assets/videos/portada.webm'
import posterPortada from '@/assets/images/portada-poster.jpg'

// Esqueleto del logo Enel: cada pieza se dibuja por trazo conforme avanza el scroll.
const PIEZAS_LAZO: { d: string; ancho: number; tramo: [number, number] }[] = [
  { d: 'M 16 79.5 A 40 40 0 1 1 15.9 79.5', ancho: 15, tramo: [0.14, 0.22] }, // anillo izquierdo
  { d: 'M 257 79.5 A 40 40 0 1 1 256.9 79.5', ancho: 15, tramo: [0.17, 0.25] }, // anillo derecho
  { d: 'M 155 84 A 52 52 0 0 1 259 84', ancho: 15, tramo: [0.2, 0.28] }, // arco central
  { d: 'M 54 80 L 108 80', ancho: 12, tramo: [0.22, 0.3] }, // conector horizontal izq
  { d: 'M 293 80 L 349 80', ancho: 12, tramo: [0.24, 0.32] }, // conector horizontal der
  { d: 'M 127 40 L 127 94', ancho: 12, tramo: [0.26, 0.34] }, // viga izq
  { d: 'M 184 84 L 184 140', ancho: 12, tramo: [0.28, 0.36] }, // viga central
  { d: 'M 368 2 L 368 56', ancho: 12, tramo: [0.3, 0.38] }, // viga der
  { d: 'M 368 58 L 385 58 L 385 106 L 401 128', ancho: 12, tramo: [0.32, 0.4] }, // cola verde
]

// Una pieza del esqueleto del logo: se dibuja por trazo conforme avanza el scroll.
function PiezaLazo({
  prog,
  config,
}: {
  prog: MotionValue<number>
  config: (typeof PIEZAS_LAZO)[number]
}) {
  const [inicio, fin] = config.tramo
  const pathLength = useTransform(prog, config.tramo, [0, 1])
  const gate = useTransform(prog, [inicio, fin], [0, 1])

  return (
    <motion.path
      d={config.d}
      fill="none"
      stroke="#0e4d7a"
      strokeWidth={config.ancho}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      style={{ pathLength, opacity: gate }}
    />
  )
}

export function StormIntro() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const marcado = useRef(false)
  const esPrimeraVez = useRef(true)
  const videoActivado = useRef(false)
  const [introCompletado, setIntroCompletado] = useState(false)
  const [videoActivo, setVideoActivo] = useState(false)
  const enVista = useInView(ref, { amount: 0.05 })

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progCrudo = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.0005,
  })
  const prog = useTransform(() => (esPrimeraVez.current ? progCrudo.get() : 0.7))

  useEffect(() => {
    track('intro.ver')
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (!marcado.current && v >= 0.9) {
      marcado.current = true
      track('intro.completar')
    }
    if (!introCompletado && v >= 0.62) setIntroCompletado(true)
    if (esPrimeraVez.current && v >= 0.99) esPrimeraVez.current = false
    if (!videoActivado.current && v > 0.01) {
      videoActivado.current = true
      setVideoActivo(true)
    }
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video || reduce || !videoActivo) return
    const ahorraDatos = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData
    if (enVista && !ahorraDatos) {
      if (!video.getAttribute('src')) video.setAttribute('src', videoIntro)
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [enVista, reduce, videoActivo])

  const saltar = () => {
    marcado.current = true
    esPrimeraVez.current = false
    track('intro.saltar')
    document.getElementById('portada')?.scrollIntoView({ behavior: 'smooth' })
  }

  const opCont = useTransform(prog, [0.82, 0.92], [1, 0])
  const scaleCont = useTransform(prog, [0.82, 0.92], [1, 0.96])
  const yCont = useTransform(prog, [0.82, 0.92], [0, -24])
  const yTelon = useTransform(prog, [0.92, 1], [0, '-100%'])

  const brillo = useTransform(prog, [0.38, 0.52], [0.4, 1.15])
  const gris = useTransform(prog, [0.38, 0.52], [1, 0])
  const escalaLogo = useTransform(prog, [0.05, 0.45], [4.5, 1])
  const opOfficial = useTransform(prog, [0.42, 0.52], [0, 1])
  const opEsqueleto = useTransform(prog, [0.44, 0.54], [1, 0])

  const imgFilter = useTransform(() => `brightness(${brillo.get()}) grayscale(${gris.get()})`)

  // Título: entrada temprana, muy larga y progresiva
  const opEnel = useTransform(prog, [0.35, 0.7], [0, 1])
  const yEnel = useTransform(prog, [0.35, 0.7], [80, 0])
  const scaleEnel = useTransform(prog, [0.35, 0.7], [0.85, 1])
  const opDist = useTransform(prog, [0.4, 0.7], [0, 1])

  if (reduce) return null

  return (
    <section
      ref={ref}
      aria-label="Intro animado: logo Enel"
      className="relative z-50 h-[200vh] md:h-[250vh]"
    >
      <motion.div className="sticky top-0 h-dvh overflow-hidden" style={{ y: yTelon }}>
        <motion.div className="absolute inset-0">
          {/* Video de fondo: Santiago en loop, al 100% */}
          <video
            ref={videoRef}
            poster={posterPortada}
            preload="none"
            muted
            loop
            playsInline
            disableRemotePlayback
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Contenido central: el logo se arma pieza a pieza */}
          <motion.div
            className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
            style={{ opacity: opCont, scale: scaleCont, y: yCont }}
          >
            <motion.div style={{ scale: escalaLogo }} className="relative w-[min(84vw,540px)]">
              <div className="relative">
                {/* Esqueleto que se dibuja con el scroll */}
                <motion.svg
                  viewBox="0 0 400 144"
                  aria-hidden="true"
                  className="h-auto w-full"
                  style={{ opacity: opEsqueleto }}
                >
                  {PIEZAS_LAZO.map((pieza, i) => (
                    <PiezaLazo key={i} prog={prog} config={pieza} />
                  ))}
                </motion.svg>
                {/* Logo oficial iluminado al completarse */}
                <motion.img
                  src={logoEnel}
                  alt="Logo Enel"
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ opacity: opOfficial, filter: imgFilter }}
                />
              </div>
            </motion.div>

            <motion.h1
              style={{ opacity: opEnel, y: yEnel, scale: scaleEnel }}
              className="text-enel-navy mt-4 w-[min(84vw,540px)] text-right text-4xl leading-[1.02] font-semibold tracking-tighter sm:text-6xl md:text-7xl"
            >
              <motion.span style={{ opacity: opDist }} className="texto-gradiente-azul">
                Distribución
              </motion.span>
            </motion.h1>
            <motion.p
              style={{ opacity: opDist }}
              className="bg-enel-navy/40 mt-6 max-w-md rounded-full px-6 py-3 text-sm leading-relaxed text-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-md md:text-base"
            >
              La energía que llega a tu casa empieza mucho antes. Sigue su viaje por nuestra red.
            </motion.p>
          </motion.div>

          {/* Indicador de scroll – estilo Apple, solo tras completar la intro */}
          {introCompletado && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-3"
            >
              <span className="text-[13px] font-semibold tracking-[0.28em] text-white/80 uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
                Desplázate
              </span>
              <div className="relative flex flex-col items-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.2,
                    }}
                    className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)]"
                  >
                    <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
                      <path
                        d="M2 2L14 12L26 2"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Escape */}
        <button
          type="button"
          onClick={saltar}
          className="text-enel-navy border-enel-navy/15 hover:border-enel-navy/30 absolute top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-20 inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-white/60 px-4 py-2 text-xs font-semibold shadow-[0_2px_8px_rgba(10,25,47,0.08)] backdrop-blur transition hover:bg-white"
        >
          Saltar intro
          <CaretRight size={13} weight="bold" />
        </button>
      </motion.div>
    </section>
  )
}
