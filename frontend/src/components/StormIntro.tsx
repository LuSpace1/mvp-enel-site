import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'

import { track } from '@/lib/analytics'
import { prefiereAhorrarDatos } from '@/lib/conexion'
import { useViajeStore } from '@/store/useViajeStore'
import logoEnel from '@/assets/icons/Enel_Group_logo_blanco.png'
import videoIntro from '@/assets/videos/portada.webm'
import posterPortada from '@/assets/images/portada-poster.jpg'

// La intro se reproduce sola al entrar y queda como portada dentro del flujo de
// la página: al bajar se accede al contenido y al subir se vuelve a ella.
const SEGUNDOS_ENTRADA = 3.4
const PROGRESO_FIN_ENTRADA = 0.9

// Esqueleto del logo Enel: cada pieza se dibuja por trazo conforme avanza la
// animación. Las coordenadas se derivan de la geometría real del logo
// (viewBox 0 0 400 143.59): grosor de trazo 16.82, anillos con radio medio
// 47.66 y barras de 16.82 de alto.
const GROSOR_LOGO = 16.82

const PIEZAS_LAZO: { d: string; ancho: number; tramo: [number, number] }[] = [
  { d: 'M 56 31.8 A 47.66 47.66 0 1 1 55.99 31.8', ancho: GROSOR_LOGO, tramo: [0.12, 0.2] }, // anillo "e" izq
  { d: 'M 56 87.34 L 102.6 87.34', ancho: GROSOR_LOGO, tramo: [0.15, 0.22] }, // barra "e" izq
  { d: 'M 135.21 46.26 L 135.21 87.85', ancho: GROSOR_LOGO, tramo: [0.2, 0.27] }, // pata izq de la "n"
  { d: 'M 135.21 46.26 C 150 20 205 30 217.91 91.75', ancho: GROSOR_LOGO, tramo: [0.22, 0.31] }, // arco "n"
  { d: 'M 217.91 91.75 L 217.91 133.34', ancho: GROSOR_LOGO, tramo: [0.28, 0.35] }, // pata der de la "n"
  { d: 'M 297 31.8 A 47.66 47.66 0 1 1 296.99 31.8', ancho: GROSOR_LOGO, tramo: [0.26, 0.34] }, // anillo "e" der
  { d: 'M 297 87.34 L 343.6 87.34', ancho: GROSOR_LOGO, tramo: [0.29, 0.36] }, // barra "e" der
  { d: 'M 376.3 8.41 L 376.3 50', ancho: GROSOR_LOGO, tramo: [0.32, 0.38] }, // asta de la "l"
  {
    d: 'M 376.3 50 L 376.3 98 C 376.3 118 382 130 390 136',
    ancho: GROSOR_LOGO,
    tramo: [0.34, 0.41],
  }, // cola de la "l"
]

// Una pieza del esqueleto del logo: se dibuja por trazo conforme avanza la animación.
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
  const videoRef = useRef<HTMLVideoElement>(null)

  const marcarIntroTerminada = useViajeStore((estado) => estado.marcarIntroTerminada)

  const ahorraDatos = prefiereAhorrarDatos()
  const prog = useMotionValue(0)
  // El logo entra con un resorte propio para que frene con un pequeño rebote.
  const escalaLogo = useMotionValue(4.5)

  // El video de fondo parte apenas se entra, sin esperar al scroll.
  useEffect(() => {
    if (reduce || ahorraDatos) return
    void videoRef.current?.play().catch(() => {})
  }, [reduce, ahorraDatos])

  // La portada que sigue a la intro puede mostrarse desde el inicio: la intro
  // ya no bloquea el scroll, simplemente es el primer bloque de la página.
  useEffect(() => {
    marcarIntroTerminada()
  }, [marcarIntroTerminada])

  // Timeline automático: dibuja el logo y lo deja como portada estable.
  useEffect(() => {
    if (reduce) return

    track('intro.ver')

    let cancelado = false
    const entrada = animate(prog, PROGRESO_FIN_ENTRADA, {
      duration: SEGUNDOS_ENTRADA,
      ease: [0.22, 1, 0.36, 1],
    })
    const rebote = animate(escalaLogo, 1, {
      type: 'spring',
      visualDuration: 1.5,
      bounce: 0.22,
    })

    void entrada.then(() => {
      if (cancelado) return
      track('intro.completar')
    })

    return () => {
      cancelado = true
      entrada.stop()
      rebote.stop()
    }
  }, [prog, escalaLogo, reduce])

  const brillo = useTransform(prog, [0.38, 0.52], [0.4, 1.15])
  const gris = useTransform(prog, [0.38, 0.52], [1, 0])
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
      aria-label="Intro animado: logo Enel"
      className="relative z-50 h-dvh overflow-hidden bg-[#0b1f33]"
    >
      <video
        ref={videoRef}
        src={ahorraDatos ? undefined : videoIntro}
        poster={posterPortada}
        preload="auto"
        autoPlay
        muted
        loop
        playsInline
        disableRemotePlayback
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div style={{ scale: escalaLogo }} className="relative w-[min(84vw,540px)]">
          <div className="relative">
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
      </div>
    </section>
  )
}
