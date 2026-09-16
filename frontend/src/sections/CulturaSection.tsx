import { startTransition, useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

import { Reveal } from '@/components/ui/Reveal'
import { SectionShell } from '@/components/ui/SectionShell'
import { pilaresCultura } from '@/lib/data/cultura'

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    zIndex: 0,
    x: dir < 0 ? 48 : -48,
    opacity: 0,
  }),
}

export function CulturaSection() {
  const reduce = useReducedMotion()
  const [slide, setSlide] = useState(0)
  const [direction, setDirection] = useState(1)
  const [pausado, setPausado] = useState(false)

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
        initial={reduce ? false : { opacity: 0, scale: 0.94, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ type: 'spring', stiffness: 60, damping: 18, mass: 1 }}
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
          {/* Controles y Barras de Progreso */}
          <div className="mb-5 flex items-center gap-4">
            <button
              onClick={prevSlide}
              className="text-enel-navy hover:bg-enel-navy flex size-10 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 shadow-sm transition-colors duration-300 hover:border-transparent hover:text-white active:scale-95"
              aria-label="Anterior pilar"
            >
              <CaretLeft size={16} weight="bold" />
            </button>

            <div className="flex h-1 flex-1 gap-1.5">
              {pilaresCultura.map((_, i) => (
                <div
                  key={i}
                  className="relative h-full flex-1 cursor-pointer overflow-hidden rounded-full bg-black/[0.08] transition-colors duration-300 hover:bg-black/[0.16]"
                  onClick={() => goToSlide(i)}
                >
                  {i === slide && !reduce && (
                    <div
                      key={`progress-${slide}`}
                      className="barra-cultura from-enel-pink absolute inset-y-0 left-0 rounded-full bg-gradient-to-r to-[#ff2d78]"
                      style={{ animationPlayState: pausado ? 'paused' : 'running' }}
                      onAnimationEnd={nextSlide}
                    />
                  )}
                  {/* Fallback de tiempo o completados */}
                  {(i < slide || reduce) && i !== slide && (
                    <div className="from-enel-pink/30 absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r to-[#ff2d78]/30" />
                  )}
                  {reduce && i === slide && (
                    <div className="from-enel-pink absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r to-[#ff2d78]" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="text-enel-navy hover:bg-enel-navy flex size-10 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-white/80 shadow-sm transition-colors duration-300 hover:border-transparent hover:text-white active:scale-95"
              aria-label="Siguiente pilar"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          {/* Contenedor del Carrusel */}
          <div className="relative w-full overflow-hidden px-2 md:px-0">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={slide}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                className="px-2 md:px-0"
              >
                <article
                  className="group float-subtle relative w-full overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_64px_-28px_rgba(10,25,47,0.25)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-black/[0.1] hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_36px_80px_-32px_rgba(10,25,47,0.35)]"
                  style={{ animationPlayState: pausado ? 'paused' : 'running' }}
                  onMouseEnter={() => setPausado(true)}
                  onMouseLeave={() => setPausado(false)}
                  onTouchStart={() => setPausado(true)}
                  onTouchEnd={() => setPausado(false)}
                >
                  <div className="relative z-10 flex min-h-[440px] flex-col p-7 sm:min-h-[400px] md:min-h-[360px] md:p-10">
                    <span className="relative block h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-black/[0.06]">
                      <span
                        key={`barra-card-${slide}`}
                        className="barra-cultura from-enel-blue to-enel-pink absolute inset-y-0 left-0 rounded-full bg-gradient-to-r"
                        style={{ animationPlayState: pausado ? 'paused' : 'running' }}
                      />
                    </span>
                    <h3 className="text-enel-navy mt-8 text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                      {pilaresCultura[slide]?.titulo}
                    </h3>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg">
                      {pilaresCultura[slide]?.descripcion}
                    </p>
                    <ul className="mt-auto flex flex-wrap gap-2 pt-8">
                      {pilaresCultura[slide]?.puntos.map((punto) => (
                        <li
                          key={punto}
                          className="text-enel-navy/80 group-hover:border-enel-blue/30 group-hover:text-enel-blue rounded-full border border-black/[0.08] bg-white px-4 py-1.5 text-sm font-medium transition-colors duration-300"
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
        <Reveal delay={0.15} className="relative z-10 mx-auto mt-14 max-w-2xl px-4 text-center">
          <span aria-hidden="true" className="bg-enel-blue/40 mx-auto mb-6 block h-px w-12" />
          <p className="text-enel-navy text-lg leading-relaxed font-medium text-balance md:text-xl">
            Te invitamos a vivir estos principios en tu trabajo diario y a ser parte de una cultura
            que promueve la seguridad, la colaboración, la mejora continua y la innovación.
          </p>
        </Reveal>
      </motion.div>
    </SectionShell>
  )
}
