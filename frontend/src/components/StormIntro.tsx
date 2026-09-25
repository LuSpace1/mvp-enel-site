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
import { STORM_INTRO_CLAVE } from '@/lib/intro'
import { useMediaQuery } from '@/lib/useMediaQuery'
import logoEnel from '@/assets/icons/Enel_Group_logo_blanco.png'
import videoIntro from '@/assets/videos/portada.mp4'
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

// Una pieza del esqueleto del logo: se dibuja por trazo y al terminar una chispa amarilla recorre su longitud.
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
  const blipOff = useTransform(prog, [fin - 0.005, fin + 0.05], [0, 1])
  const blipOp = useTransform(prog, [fin - 0.005, fin + 0.015], [0, 1])

  return (
    <g>
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
      <motion.path
        d={config.d}
        fill="none"
        stroke="#ffd02f"
        strokeWidth={config.ancho + 4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{
          pathLength: 0.05,
          pathOffset: blipOff,
          opacity: blipOp,
        }}
      />
    </g>
  )
}

// Nuevo efecto de electricidad viva y realista usando SVG Filters (feTurbulence)
function CampoElectrico({ gateLogo, esMovil }: { gateLogo: MotionValue<number>; esMovil: boolean }) {
  // Anillos concéntricos que serán distorsionados por el filtro.
  // Al usar strokeDasharray y rotar, simulamos arcos de plasma viajando.
  const anillos = [
    { r: 120, width: 3, dash: "90 200", dur: 2.5, reverse: false, opacity: 0.9 },
    { r: 155, width: 2, dash: "150 250", dur: 3.2, reverse: true, opacity: 0.8 },
    { r: 190, width: 4, dash: "60 350", dur: 2.8, reverse: false, opacity: 0.6 },
    { r: 230, width: 2, dash: "120 400", dur: 4.5, reverse: true, opacity: 0.5 },
  ]

  // En móviles reducimos el número de anillos para mantener 60fps constantes (los filtros SVG son pesados)
  const anillosActivos = esMovil ? anillos.slice(0, 2) : anillos

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center translate-y-8 sm:translate-y-12"
      style={{ opacity: gateLogo }}
    >
      <svg viewBox="-300 -300 600 600" className="absolute w-[600px] h-[600px] sm:w-[700px] sm:h-[700px] mix-blend-screen max-w-none">
        <defs>
          <filter id="plasma-realista" x="-50%" y="-50%" width="200%" height="200%">
            {/* Ruido fractal animado para la distorsión eléctrica */}
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise">
              <animate 
                attributeName="seed" 
                values="0;1;2;3;4;5;6;7;8;9;10;11;12;13;14" 
                dur="0.6s" 
                calcMode="discrete" 
                repeatCount="indefinite" 
              />
            </feTurbulence>
            
            {/* Distorsiona las líneas base usando el ruido, rompiendo los círculos en rayos erráticos */}
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="40" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            
            {/* Sistema de resplandores superpuestos (Glow) realista */}
            <feGaussianBlur in="displaced" stdDeviation="3" result="blur1" />
            <feGaussianBlur in="displaced" stdDeviation="12" result="blur2" />
            <feGaussianBlur in="displaced" stdDeviation="25" result="blur3" />
            
            <feMerge>
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              {/* Núcleo del rayo caliente */}
              <feMergeNode in="displaced" />
            </feMerge>
          </filter>
        </defs>

        <g filter="url(#plasma-realista)">
          {anillosActivos.map((anillo, i) => (
            <motion.circle
              key={i}
              cx="0"
              cy="0"
              r={anillo.r}
              fill="none"
              stroke="#ffd02f" 
              strokeWidth={anillo.width}
              strokeDasharray={anillo.dash}
              strokeLinecap="round"
              style={{ opacity: anillo.opacity }}
              animate={{
                rotate: anillo.reverse ? [360, 0] : [0, 360],
              }}
              transition={{
                duration: anillo.dur,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          ))}
        </g>
      </svg>
    </motion.div>
  )
}

export function StormIntro() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const marcado = useRef(false)
  const esPrimeraVez = useRef(true)
  const [introCompletado, setIntroCompletado] = useState(false)
  const esMovil = useMediaQuery('(max-width: 767px)')
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
      sessionStorage.setItem(STORM_INTRO_CLAVE, '1')
      track('intro.completar')
    }
    if (!introCompletado && v >= 0.62) setIntroCompletado(true)
    if (esPrimeraVez.current && v >= 0.99) esPrimeraVez.current = false
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (enVista) {
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [enVista])

  const saltar = () => {
    marcado.current = true
    esPrimeraVez.current = false
    sessionStorage.setItem(STORM_INTRO_CLAVE, '1')
    track('intro.saltar')
    document.getElementById('portada')?.scrollIntoView({ behavior: 'smooth' })
  }

  const opCont = useTransform(prog, [0.82, 0.92], [1, 0])
  const scaleCont = useTransform(prog, [0.82, 0.92], [1, 0.96])
  const yCont = useTransform(prog, [0.82, 0.92], [0, -24])
  const yTelon = useTransform(prog, [0.92, 1], [0, '-100%'])

  const brillo = useTransform(prog, [0.38, 0.52], [0.4, 1.15])
  const gris = useTransform(prog, [0.38, 0.52], [1, 0])
  const gateLogo = useTransform(prog, [0.42, 0.52], [0, 1])
  const escalaLogo = useTransform(prog, [0.05, 0.45], [4.5, 1])
  const opOfficial = useTransform(prog, [0.42, 0.52], [0, 1])
  const opEsqueleto = useTransform(prog, [0.44, 0.54], [1, 0])
  
  const imgFilter = useTransform(() => `brightness(${brillo.get()}) grayscale(${gris.get()})`)
  
  // Título: entrada temprana, muy larga y progresiva
  const opEnel = useTransform(prog, [0.35, 0.70], [0, 1])
  const yEnel = useTransform(prog, [0.35, 0.70], [80, 0])
  const scaleEnel = useTransform(prog, [0.35, 0.70], [0.85, 1])
  const opDist = useTransform(prog, [0.40, 0.70], [0, 1])
  const sxLinea = useTransform(prog, [0.45, 0.70], [0, 1])

  if (reduce) return null

  return (
    <section
      ref={ref}
      aria-label="Intro animado: tormenta eléctrica Enel"
      className="relative z-50 h-[200vh] md:h-[250vh]"
    >
      <motion.div className="sticky top-0 h-dvh overflow-hidden" style={{ y: yTelon }}>
        <motion.div className="absolute inset-0">
          {/* Video de fondo: Santiago en loop, al 100% */}
          <video
            ref={videoRef}
            src={videoIntro}
            poster={posterPortada}
            preload="metadata"
            autoPlay
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
              {/* Nuevo efecto eléctrico continuo */}
              <CampoElectrico gateLogo={gateLogo} esMovil={esMovil} />
              
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
              className="text-enel-navy mt-4 text-4xl leading-[1.02] font-semibold tracking-tighter sm:text-6xl md:text-7xl"
            >
              Enel{' '}
              <motion.span style={{ opacity: opDist }} className="texto-gradiente-azul">
                Distribución
              </motion.span>
            </motion.h1>
            <motion.div
              style={{ scaleX: sxLinea }}
              className="mt-5 h-1 w-14 rounded-full bg-[#ffd02f] shadow-[0_0_12px_rgba(255,208,47,0.8)]"
            />
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
