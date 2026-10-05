import { motion, useReducedMotion, type Variants } from 'motion/react'
import { Lightning } from '@phosphor-icons/react'

import { RevealTexto } from '@/components/ui/RevealTexto'
import { SectionShell } from '@/components/ui/SectionShell'
import { valoresCultura } from '@/lib/data/cultura'

const entrada: Variants = {
  hidden: (indice: number) => ({
    opacity: 0,
    y: 48,
    scale: 0.55,
    rotate: indice % 2 === 0 ? -10 : 10,
  }),
  visible: (indice: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 240,
      damping: 17,
      mass: 0.9,
      delay: indice * 0.09,
    },
  }),
}

export function CulturaSection() {
  const reduce = useReducedMotion()

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
        </div>

        <div className="relative z-10 flex flex-col items-center pb-10">
          <div className="flex flex-wrap justify-center gap-7">
            {valoresCultura.map((valor, indice) => (
              <motion.div
                key={valor.palabra}
                custom={indice}
                variants={entrada}
                initial={reduce ? false : 'hidden'}
                whileInView={reduce ? undefined : 'visible'}
                whileHover={reduce ? undefined : { scale: 1.06, y: -6 }}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                viewport={{ once: true, amount: 0.4 }}
                className="group relative h-40 w-40"
              >
                <motion.div
                  className="relative h-full w-full"
                  animate={reduce ? undefined : { y: [0, -9, 0] }}
                  transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: indice * 0.18,
                  }}
                >
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

                  <div className="border-enel-blue/35 group-hover:border-enel-blue relative grid h-full w-full place-items-center overflow-hidden rounded-3xl border-2 bg-white shadow-sm transition-colors duration-300 group-hover:shadow-lg">
                    <span
                      aria-hidden="true"
                      className="from-enel-blue/10 absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />
                    <div className="relative flex flex-col items-center gap-3 px-3 text-center">
                      <Lightning
                        size={24}
                        weight="fill"
                        className="text-enel-blue transition-transform duration-300 group-hover:scale-110"
                      />
                      <span className="text-enel-navy text-base font-extrabold tracking-wide uppercase">
                        {valor.palabra}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </SectionShell>
  )
}
