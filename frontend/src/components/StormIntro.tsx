import { useEffect, useRef } from 'react'
import { ArrowDown } from '@phosphor-icons/react'
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
  const seccionRef = useRef<HTMLElement>(null)

  const marcarIntroTerminada = useViajeStore((estado) => estado.marcarIntroTerminada)

  const ahorraDatos = prefiereAhorrarDatos()
  const prog = useMotionValue(0)
  // El logo entra con un resorte propio para que frene con un pequeño rebote.
  const escalaLogo = useMotionValue(4.5)

  // Reproduce el video solo cuando el intro está a la vista. Al bajar se pausa
  // para no decodificar en loop fuera de pantalla; al volver a subir se reanuda.
  useEffect(() => {
    if (reduce || ahorraDatos) return
    const video = videoRef.current
    const seccion = seccionRef.current
    if (!video || !seccion) return

    let visible = false

    const sincronizar = () => {
      if (visible && !document.hidden) {
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        visible = entrada?.isIntersecting ?? false
        sincronizar()
      },
      { threshold: 0.1 },
    )

    const alCambiarVisibilidad = () => sincronizar()

    observador.observe(seccion)
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => {
      observador.disconnect()
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    }
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
  const opOfficial = useTransform(prog, [0.42, 0.52], [0, 1])
  const opEsqueleto = useTransform(prog, [0.44, 0.54], [1, 0])

  // El logo ya es blanco: solo hace falta animar el brillo, sin grayscale.
  const imgFilter = useTransform(brillo, (valor) => `brightness(${valor})`)

  // Título: entrada temprana, muy larga y progresiva
  const opEnel = useTransform(prog, [0.35, 0.7], [0, 1])
  const yEnel = useTransform(prog, [0.35, 0.7], [80, 0])
  const scaleEnel = useTransform(prog, [0.35, 0.7], [0.85, 1])
  const opDist = useTransform(prog, [0.4, 0.7], [0, 1])

  // El mensaje entra en dos tiempos desde la derecha: primero la frase
  // principal y luego la invitación.
  const xMensaje = useTransform(opDist, [0.45, 0.72], [56, 0])
  const opMensaje = useTransform(opDist, [0.45, 0.62], [0, 1])
  const xInvitacion = useTransform(opDist, [0.66, 0.93], [56, 0])
  const opInvitacion = useTransform(opDist, [0.66, 0.83], [0, 1])

  const irAbajo = () => {
    document.getElementById('portada')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (reduce) return null

  return (
    <section
      ref={seccionRef}
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

      {/* Velo para estabilizar el contraste del logo y del texto sobre el video. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#06111d]/30" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#06111d]/55 to-transparent"
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-16 text-center sm:pb-20">
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
          className="text-enel-navy mt-4 w-[min(84vw,540px)] text-right text-4xl leading-[1.02] sm:text-6xl md:text-7xl"
        >
          <motion.span style={{ opacity: opDist }} className="texto-gradiente-azul">
            Distribución
          </motion.span>
        </motion.h1>
        <motion.p className="mt-7 max-w-xl text-white [text-shadow:0_1px_18px_rgba(0,0,0,0.55)]">
          <motion.span
            style={{ x: xMensaje, opacity: opMensaje }}
            className="block text-lg leading-snug font-semibold sm:text-xl md:text-2xl"
          >
            La energía que nos conecta comienza mucho antes.
          </motion.span>
          <motion.span
            style={{ x: xInvitacion, opacity: opInvitacion }}
            className="mt-2 block text-sm leading-relaxed font-medium text-white/70 sm:text-base md:text-lg"
          >
            Descubre todo lo que hay detrás de nuestra red.
          </motion.span>
        </motion.p>

        <motion.button
          type="button"
          onClick={irAbajo}
          aria-label="Bajar a la siguiente sección"
          className="absolute inset-x-0 bottom-5 mx-auto flex w-fit cursor-pointer flex-col items-center gap-1.5 rounded-2xl px-5 py-2.5 text-white/60 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)] transition-colors duration-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 sm:bottom-7"
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-[10px] font-semibold tracking-[0.22em] uppercase">
            Desliza para descubrir
          </span>
          <ArrowDown size={15} weight="bold" className="animate-bounce" aria-hidden="true" />
        </motion.button>
      </div>
    </section>
  )
}
