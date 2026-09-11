import { startTransition, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { Lightning, CaretLeft, CaretRight } from '@phosphor-icons/react'

import { Reveal } from '@/components/ui/Reveal'
import { SectionShell } from '@/components/ui/SectionShell'
import { pilaresCultura, valoresCultura } from '@/lib/data/cultura'

const RAYO_CHICO = 'M12.5 4 L8 11 H10.5 L9 17 L15 6.5 H11.5 Z'
// Path chicos reutilizados con distinta rotación para la descarga al apretar
const RAYO_GRANDE = 'M14 2.5 L4.5 14.5 H10 L8 22 L20 9 H12.5 Z'
const RAYO_MEDIANO = 'M11 3.5 L5 12 H8.5 L6.5 19.5 L16 8.5 H11 Z'

const COLORES_PREGUNTA = [
  'text-enel-blue',
  'text-enel-pink',
  'text-enel-navy',
  'text-amber-500',
  'text-enel-violeta-soft',
]

// Dorsos de las tarjetas de valores: pastel azul y verde, alternados, para
// evitar una ensalada de colores.
const DORSOS_VALOR = [
  {
    clase: 'from-sky-100 to-sky-200 border-sky-300/60',
    texto: 'text-enel-navy',
  },
  {
    clase: 'from-emerald-100 to-emerald-200 border-emerald-300/60',
    texto: 'text-enel-navy',
  },
]

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '50%' : '-50%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    zIndex: 0,
    x: dir < 0 ? '50%' : '-50%',
    opacity: 0,
  }),
}

function RayoBurst({
  d,
  className = '',
  rotar = 0,
}: {
  d: string
  className?: string
  rotar?: number
}) {
  return (
    <motion.span aria-hidden="true" className={`pointer-events-none absolute ${className ?? ''}`}>
      <motion.svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        style={{ transform: `rotate(${rotar}deg)` }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.15, 1, 0.8] }}
        transition={{ duration: 0.65, times: [0, 0.25, 0.7, 1], ease: 'easeOut' }}
      >
        <motion.path
          d={d}
          fill="#ffd54a"
          stroke="#ffb300"
          strokeWidth={0.8}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 5px rgba(255, 200, 60, 0.9))' }}
        />
      </motion.svg>
    </motion.span>
  )
}

export function CulturaSection() {
  const reduce = useReducedMotion()
  const [slide, setSlide] = useState(0)
  const [direction, setDirection] = useState(1)
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({})
  const [spark, setSpark] = useState<Record<string, number>>({})

  const pulsar = (palabra: string) => {
    setFlippedCards((prev) => ({ ...prev, [palabra]: !prev[palabra] }))
    setSpark((prev) => ({ ...prev, [palabra]: (prev[palabra] ?? 0) + 1 }))
  }

  const nextSlide = () => {
    startTransition(() => {
      setDirection(1)
      setSlide((s) => (s + 1) % pilaresCultura.length)
    })
  }

  const prevSlide = () => {
    startTransition(() => {
      setDirection(-1)
      setSlide((s) => (s - 1 + pilaresCultura.length) % pilaresCultura.length)
    })
  }

  const goToSlide = (i: number) => {
    startTransition(() => {
      setDirection(i > slide ? 1 : -1)
      setSlide(i)
    })
  }

  return (
    <SectionShell id="cultura" className="relative overflow-hidden bg-[#f0eee6] pb-10 md:pb-14">
      {/* Fondo Cuadernillo Global */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(rgba(10, 25, 47, 0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.88, rotate: -2 }}
        whileInView={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ type: 'spring', stiffness: 50, damping: 15, mass: 1.2 }}
      >
        <Reveal className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="text-enel-navy text-3xl font-semibold tracking-tight md:text-5xl">
            Cómo trabajamos
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 md:text-lg">
            Nuestra cultura se construye día a día a través de acciones, decisiones y
            comportamientos que compartimos como equipo.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="relative z-10 mx-auto mt-12 w-full max-w-4xl">
          {/* Controles y Barras de Progreso (Estilo Stories) */}
          <div className="mb-6 flex items-center gap-4 px-4">
            <button
              onClick={prevSlide}
              className="text-enel-navy hover:text-enel-blue shrink-0 rounded-full border border-neutral-300 bg-white/50 p-2 transition hover:bg-white"
              aria-label="Anterior pilar"
            >
              <CaretLeft size={20} weight="bold" />
            </button>

            <div className="flex h-1.5 flex-1 gap-2 overflow-hidden rounded-full">
              {pilaresCultura.map((_, i) => (
                <div
                  key={i}
                  className="relative h-full flex-1 cursor-pointer overflow-hidden border border-neutral-300 bg-white"
                  onClick={() => goToSlide(i)}
                >
                  {i === slide && !reduce && (
                    <motion.div
                      key={`progress-${slide}`}
                      className="bg-enel-pink absolute top-0 left-0 h-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 7, ease: 'linear' }}
                      onAnimationComplete={nextSlide}
                    />
                  )}
                  {/* Fallback de tiempo o completados */}
                  {(i < slide || reduce) && i !== slide && (
                    <div className="bg-enel-pink absolute top-0 left-0 h-full w-full" />
                  )}
                  {reduce && i === slide && (
                    <div className="bg-enel-pink absolute top-0 left-0 h-full w-full" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="text-enel-navy hover:text-enel-blue shrink-0 rounded-full border border-neutral-300 bg-white/50 p-2 transition hover:bg-white"
              aria-label="Siguiente pilar"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </div>

          {/* Contenedor del Carrusel */}
          <div className="relative w-full overflow-hidden px-2 md:px-0">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={slide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                className="px-2 md:px-0"
              >
                <article
                  className="group bg-enel-fog/40 relative w-full overflow-hidden rounded-2xl p-[2px] shadow-sm transition-shadow hover:shadow-xl"
                  style={{ animation: 'float-subtle 4s ease-in-out infinite' }}
                >
                  {/* Capa giratoria del borde eléctrico (Chispa) */}
                  <div
                    className="absolute inset-[-100%] z-0 animate-[spin_2s_linear_infinite] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      backgroundImage:
                        'conic-gradient(from 0deg, transparent 35%, rgba(251, 191, 36, 1) 48%, rgba(255, 255, 255, 1) 50%, transparent 50%, transparent 85%, rgba(251, 191, 36, 1) 98%, rgba(255, 255, 255, 1) 100%)',
                    }}
                  />

                  {/* Contenedor Interior (La Máscara) */}
                  <div className="relative z-10 flex min-h-[500px] flex-col rounded-[14px] bg-white p-7 sm:min-h-[450px] md:min-h-[400px] md:p-8">
                    <span className="bg-enel-blue block h-1 w-8 rounded-full transition-all group-hover:w-12" />
                    <h3 className="text-enel-navy mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
                      {pilaresCultura[slide]?.titulo}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-neutral-600 md:text-lg">
                      {pilaresCultura[slide]?.descripcion}
                    </p>
                    <ul className="mt-auto flex flex-wrap gap-2 pt-5">
                      {pilaresCultura[slide]?.puntos.map((punto) => (
                        <li
                          key={punto}
                          className="bg-enel-mist text-enel-navy group-hover:bg-enel-blue/10 group-hover:text-enel-blue-dark rounded-full px-4 py-1.5 text-sm font-medium transition"
                        >
                          {punto}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Invitación Final */}
        <Reveal delay={0.15} className="relative z-10 mx-auto mt-10 max-w-2xl px-4 text-center">
          <p className="text-enel-navy rounded-2xl border border-neutral-200/80 bg-white/75 px-8 py-6 text-base leading-relaxed font-medium shadow-sm backdrop-blur-sm md:text-lg">
            Te invitamos a vivir estos principios en tu trabajo diario y a ser parte de una cultura
            que promueve la seguridad, la colaboración, la mejora continua y la innovación.
          </p>
        </Reveal>

        {/* Título de las tarjetas de valores: solo la frase, sin card ni íconos */}
        <Reveal delay={0.1} className="relative z-10 mt-16 mb-12">
          <div className="px-4 text-center">
            <h3 className="text-enel-navy text-2xl font-semibold tracking-tight md:text-3xl">
              Construimos el futuro a base de{' '}
              <span className="texto-gradiente-azul">energía</span>
            </h3>
            <p className="mt-3 text-sm font-semibold tracking-[0.2em] text-neutral-400 uppercase">
              Nuestros valores
            </p>
          </div>
        </Reveal>

        {/* Tarjetas Interactivas Volteables flotantes (Valores) */}
        <Reveal delay={0.2} className="relative z-10 mb-10">
          <div className="flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-7">
              {valoresCultura.map((valor, indice) => {
                const isFlipped = flippedCards[valor.palabra]
                const sparkId = spark[valor.palabra] ?? 0
                const dorso = DORSOS_VALOR[indice % DORSOS_VALOR.length] ?? DORSOS_VALOR[0]!
                return (
                  <motion.div
                    key={valor.palabra}
                    className="relative h-36 w-36 cursor-pointer [perspective:1000px]"
                    onClick={() => pulsar(valor.palabra)}
                    animate={reduce ? undefined : { y: [0, -9, 0] }}
                    transition={{
                      duration: 3.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: indice * 0.18,
                    }}
                  >
                    {/* Sombra flotante */}
                    <motion.span
                      aria-hidden="true"
                      className="bg-enel-navy/25 absolute -bottom-5 left-1/2 h-2.5 w-16 rounded-full blur-[6px]"
                      animate={
                        reduce
                          ? undefined
                          : { scaleX: [1, 0.7, 1], opacity: [0.45, 0.2, 0.45], x: '-50%' }
                      }
                      transition={{
                        duration: 3.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: indice * 0.18,
                      }}
                    />

                    {/* Anillo de descarga */}
                    {sparkId > 0 && !reduce && (
                      <motion.span
                        key={sparkId}
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-[7px] rounded-[1.4rem] border-2 border-amber-400/80"
                        initial={{ opacity: 0.9, scale: 0.9 }}
                        animate={{ opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    )}

                    {/* Descarga al apretar */}
                    {sparkId > 0 && !reduce && (
                      <motion.div
                        key={`sparks-${sparkId}`}
                        aria-hidden="true"
                        className="pointer-events-none absolute -inset-5 z-30"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      >
                        <RayoBurst d={RAYO_GRANDE} className="-top-6 left-1/2 -ml-3" />
                        <RayoBurst d={RAYO_MEDIANO} rotar={70} className="top-8 -right-4" />
                        <RayoBurst d={RAYO_CHICO} rotar={-60} className="bottom-9 -left-5" />
                      </motion.div>
                    )}

                    <motion.div
                      className="relative h-full w-full"
                      style={{ transformStyle: 'preserve-3d' }}
                      initial={false}
                      animate={{ rotateY: isFlipped ? 180 : 0, scale: isFlipped ? 1.14 : 1 }}
                      transition={{ duration: 0.6, type: 'spring', stiffness: 220, damping: 20 }}
                    >
                      {/* Frente */}
                      <motion.div
                        className="to-enel-mist border-enel-navy/25 absolute inset-0 grid place-items-center overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-[#fbf9f2] via-[#f4f1e8] [backface-visibility:hidden]"
                        whileHover={reduce ? undefined : { scale: 1.04 }}
                        whileTap={reduce ? undefined : { scale: 0.96 }}
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 opacity-60"
                          style={{
                            backgroundImage:
                              'radial-gradient(rgba(10, 25, 47, 0.10) 1px, transparent 1px)',
                            backgroundSize: '10px 10px',
                          }}
                        />
                        {!reduce && (
                          <motion.span
                            className={`${COLORES_PREGUNTA[indice % COLORES_PREGUNTA.length]} text-5xl font-extrabold drop-shadow-sm`}
                            animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
                            transition={{
                              duration: 2.6,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: indice * 0.35,
                            }}
                          >
                            ?
                          </motion.span>
                        )}
                        <span className="text-enel-navy/40 absolute bottom-2 text-[9px] font-bold tracking-[0.25em] uppercase">
                          Toca
                        </span>
                      </motion.div>

                      {/* Dorso */}
                      <div
                        className={`${dorso.clase} absolute inset-0 flex [transform:rotateY(180deg)] flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-gradient-to-br p-3 text-center shadow-xl [backface-visibility:hidden]`}
                      >
                        <Lightning size={16} weight="fill" className="text-amber-500" />
                        <span
                          className={`${dorso.texto} text-sm font-extrabold tracking-wide uppercase`}
                        >
                          {valor.palabra}
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </Reveal>
      </motion.div>
    </SectionShell>
  )
}
