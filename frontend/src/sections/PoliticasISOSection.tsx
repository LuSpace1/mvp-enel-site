import type { Icon } from '@phosphor-icons/react'
import {
  ArrowUpRight,
  ArrowsClockwise,
  Certificate,
  GearSix,
  Leaf,
  Lightning,
  LockKey,
  Scales,
  ShieldCheck,
} from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'

import { Reveal } from '@/components/ui/Reveal'
import { RevealTexto } from '@/components/ui/RevealTexto'
import { SectionShell } from '@/components/ui/SectionShell'
import { track } from '@/lib/analytics'
import { politicasISO } from '@/lib/data/iso'

const ICONOS: Record<string, Icon> = {
  calidad: Certificate,
  ambiental: Leaf,
  salud: ShieldCheck,
  energia: Lightning,
  continuidad: ArrowsClockwise,
  antisoborno: Scales,
  activos: GearSix,
  'seguridad-info': LockKey,
}

const ESTILOS: Record<string, string> = {
  calidad: 'from-enel-blue to-sky-600',
  ambiental: 'from-emerald-500 to-green-600',
  salud: 'from-amber-500 to-orange-600',
  energia: 'from-enel-navy to-enel-blue',
  continuidad: 'from-enel-pink to-rose-600',
  antisoborno: 'from-enel-navy to-enel-blue',
  activos: 'from-sky-500 to-cyan-600',
  'seguridad-info': 'from-violet-500 to-purple-600',
}

export function PoliticasISOSection() {
  const reduce = useReducedMotion()

  return (
    <SectionShell id="politicas" className="relative overflow-hidden bg-white pb-2 md:pb-4">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 80, rotateX: 12 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
        style={{ perspective: 1200 }}
      >
        <Reveal y={0} className="relative z-10 max-w-3xl">
          <RevealTexto
            as="h2"
            className="text-enel-navy text-3xl font-semibold tracking-tight md:text-5xl"
          >
            Nuestro marco de actuación
          </RevealTexto>
          <RevealTexto
            as="p"
            variante="parrafo"
            className="mt-4 text-lg font-medium text-neutral-700 md:text-xl"
          >
            8 normas ISO que guían nuestra forma de trabajar día a día.
          </RevealTexto>
          <RevealTexto
            as="p"
            variante="parrafo"
            className="mt-3 text-base leading-relaxed text-neutral-600 md:text-lg"
          >
            En Enel Distribución Chile y Enel Colina, contamos con un Sistema Integrado de Gestión
            (SIG) que nos permite fortalecer nuestros procesos, impulsar la mejora continua y
            trabajar de manera más segura, eficiente y responsable.
          </RevealTexto>
        </Reveal>

        <div className="relative z-10 mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {politicasISO.map((politica, index) => {
            const Icono = ICONOS[politica.id] ?? Certificate
            const estilo = ESTILOS[politica.id] ?? 'from-enel-navy to-enel-blue'

            return (
              <Reveal key={politica.id} className="flex h-full" delay={0.08 + index * 0.06} y={40}>
                <a
                  href={politica.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track('iso.abrir', { politica: politica.id })}
                  data-analytics-component="iso"
                  data-analytics-politica={politica.id}
                  className="group hover:ring-enel-blue/25 relative flex h-full w-full flex-col rounded-2xl bg-black/[0.05] p-[2px] ring-1 ring-black/[0.08] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(10,25,47,0.1)]"
                >
                  <div className="relative flex h-full flex-col rounded-[calc(1rem-2px)] bg-white p-5">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${estilo} text-white shadow-md`}
                    >
                      <Icono size={20} weight="duotone" />
                    </span>
                    <h3 className="text-enel-navy mt-4 text-base font-semibold tracking-tight">
                      {politica.nombre}
                    </h3>
                    <span className="mt-1 block text-[10px] font-medium tracking-[0.15em] text-neutral-400 uppercase">
                      {politica.codigo}
                    </span>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                      {politica.resumen}
                    </p>

                    <span className="text-enel-blue mt-auto inline-flex items-center gap-1.5 pt-5 text-[10px] font-bold tracking-[0.15em] uppercase">
                      Abrir política
                      <ArrowUpRight
                        size={13}
                        weight="bold"
                        className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </a>
              </Reveal>
            )
          })}
        </div>
      </motion.div>
    </SectionShell>
  )
}
