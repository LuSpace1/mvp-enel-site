import { useEffect, useState } from 'react'
import { CaretUp } from '@phosphor-icons/react'
import { LayoutGroup, motion, useReducedMotion, type Variants } from 'motion/react'

import { RevealTexto } from '@/components/ui/RevealTexto'
import { SectionShell } from '@/components/ui/SectionShell'
import { valoresCultura } from '@/lib/data/cultura'

const entrada: Variants = {
  hidden: {
    opacity: 0,
    y: 32,
    scale: 0.96,
  },
  visible: (indice: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
      delay: indice * 0.07,
    },
  }),
}

export function CulturaSection() {
  const reduce = useReducedMotion()
  const [valorActivo, setValorActivo] = useState<string | null>(null)
  // Las sombras solo se muestran cuando las tarjetas están en reposo: se ocultan
  // al abrir y se reactivan cuando termina la animación de vuelta al tamaño pequeño.
  const [sombrasVisibles, setSombrasVisibles] = useState(true)

  const alternarValor = (palabra: string) => {
    if (valorActivo === palabra) {
      setValorActivo(null)
      return
    }
    setSombrasVisibles(false)
    setValorActivo(palabra)
  }

  // Red de seguridad: si la animación de layout no dispara su callback (por
  // ejemplo con movimiento reducido), las sombras vuelven igualmente.
  useEffect(() => {
    if (valorActivo || sombrasVisibles) return
    const temporizador = window.setTimeout(() => setSombrasVisibles(true), 700)
    return () => window.clearTimeout(temporizador)
  }, [valorActivo, sombrasVisibles])

  return (
    <SectionShell id="cultura" className="relative overflow-hidden bg-white pb-10 md:pb-14">
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.88, rotate: -2 }}
        whileInView={reduce ? undefined : { opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ type: 'spring', stiffness: 50, damping: 15, mass: 1.2 }}
      >
        <div className="relative z-10 mb-12 text-center">
          <RevealTexto
            as="h2"
            className="text-enel-navy text-4xl font-semibold tracking-tight md:text-6xl"
          >
            Nuestros valores
          </RevealTexto>
          <RevealTexto
            as="p"
            variante="parrafo"
            delay={0.15}
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg"
          >
            Los principios que guían nuestra forma de actuar, tomar decisiones y enfrentar los
            desafíos del negocio, orientando nuestro compromiso con las personas, los clientes y el
            futuro de la energía.
          </RevealTexto>
        </div>

        <div className="relative z-10 flex flex-col items-center pb-10">
          <LayoutGroup>
            <div className="flex w-full flex-wrap justify-center gap-7">
              {valoresCultura.map((valor, indice) => {
                const abierta = valorActivo === valor.palabra

                return (
                  <motion.div
                    key={valor.palabra}
                    layout
                    custom={indice}
                    variants={entrada}
                    initial={reduce ? false : 'hidden'}
                    whileInView={reduce ? undefined : 'visible'}
                    viewport={{ once: true, amount: 0.4 }}
                    onLayoutAnimationComplete={() => {
                      if (!valorActivo && !sombrasVisibles) setSombrasVisibles(true)
                    }}
                    className={`group relative ${abierta ? 'order-first w-full basis-full' : 'h-40 w-40'}`}
                  >
                    <motion.div layout className="relative h-full w-full">
                      {!abierta && sombrasVisibles && (
                        <span
                          aria-hidden="true"
                          className="bg-enel-navy/25 absolute -bottom-5 left-1/2 -ml-8 h-2.5 w-16 rounded-full opacity-45 blur-[6px]"
                        />
                      )}

                      <motion.button
                        type="button"
                        layout
                        onClick={() => alternarValor(valor.palabra)}
                        aria-expanded={abierta}
                        aria-controls={`valor-${indice}`}
                        aria-label={`${valor.palabra}: ${abierta ? 'ocultar descripción' : 'ver descripción'}`}
                        whileHover={reduce || abierta ? undefined : { scale: 1.06, y: -6 }}
                        whileTap={reduce ? undefined : { scale: 0.97 }}
                        className={`border-enel-blue/35 group-hover:border-enel-blue focus-visible:ring-enel-blue/40 relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl border-2 bg-white shadow-sm transition-colors duration-300 group-hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                          abierta
                            ? 'mx-auto max-w-3xl items-stretch'
                            : 'items-center justify-center px-3 text-center'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="from-enel-blue/10 absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />

                        {abierta ? (
                          <span className="relative flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:items-start sm:gap-5 sm:p-7 sm:text-left">
                            <img
                              src={valor.icono}
                              alt=""
                              aria-hidden="true"
                              className="h-14 w-14 shrink-0 object-contain mix-blend-multiply"
                            />
                            <span className="block min-w-0">
                              <span className="text-enel-navy block text-base font-extrabold tracking-wide uppercase">
                                {valor.palabra}
                              </span>
                              <motion.span
                                id={`valor-${indice}`}
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.1 }}
                                className="mt-2 block text-sm leading-relaxed text-neutral-600 sm:text-[15px]"
                              >
                                {valor.descripcion}
                              </motion.span>
                            </span>
                            <CaretUp
                              size={16}
                              weight="bold"
                              aria-hidden="true"
                              className="text-enel-blue/60 absolute top-4 right-4 sm:top-5 sm:right-5"
                            />
                          </span>
                        ) : (
                          <span className="relative flex flex-col items-center gap-3">
                            <img
                              src={valor.icono}
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              decoding="async"
                              className="h-14 w-14 object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-110"
                            />
                            <span className="text-enel-navy text-base font-extrabold tracking-wide uppercase">
                              {valor.palabra}
                            </span>
                          </span>
                        )}
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          </LayoutGroup>
        </div>
      </motion.div>
    </SectionShell>
  )
}
