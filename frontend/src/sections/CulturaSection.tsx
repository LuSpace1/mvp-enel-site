import { startTransition, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

import { Reveal } from '@/components/ui/Reveal'
import { SectionShell } from '@/components/ui/SectionShell'
import { pilaresCultura } from '@/lib/data/cultura'

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

export function CulturaSection() {
  const reduce = useReducedMotion()
  const [slide, setSlide] = useState(0)
  const [direction, setDirection] = useState(1)
  const [pausado, setPausado] = useState(false)
  const [pausadoManual, setPausadoManual] = useState(false)
  const congelado = pausado || pausadoManual

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
                    <div
                      key={`progress-${slide}`}
                      className="barra-cultura bg-enel-pink absolute top-0 left-0 h-full"
                      style={{ animationPlayState: congelado ? 'paused' : 'running' }}
                      onAnimationEnd={nextSlide}
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
          <div className="relative w-full overflow-hidden px-2 py-4 md:px-0">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
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
                  style={{
                    animation: 'float-subtle 4s ease-in-out infinite',
                    animationPlayState: congelado ? 'paused' : 'running',
                  }}
                  onMouseEnter={() => setPausado(true)}
                  onMouseLeave={() => setPausado(false)}
                  onTouchStart={() => setPausado(true)}
                  onTouchEnd={() => setPausado(false)}
                  onClick={() => setPausadoManual((p) => !p)}
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
                    <span className="relative block h-1 w-24 overflow-hidden rounded-full bg-black/[0.06]">
                      <span
                        className="barra-cultura bg-enel-blue absolute inset-y-0 left-0 rounded-full"
                        style={{ animationPlayState: congelado ? 'paused' : 'running' }}
                      />
                    </span>
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

      </motion.div>
    </SectionShell>
  )
}
