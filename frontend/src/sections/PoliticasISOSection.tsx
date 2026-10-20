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
import { politicasExtra, politicasISO } from '@/lib/data/iso'

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
            className="mt-4 text-base leading-relaxed text-neutral-600 md:text-lg"
          >
            En Enel Distribución Chile y Enel Colina, nuestro Sistema Integrado de Gestión (SIG)
            impulsa la mejora continua y promueve la participación y consulta de los trabajadores y
            sus representantes.
          </RevealTexto>
          <RevealTexto
            as="p"
            variante="parrafo"
            className="mt-3 text-sm leading-relaxed text-neutral-500 md:text-base"
          >
            Ocho políticas que orientan la forma en que trabajamos cada día. Accede a la versión
            completa en SharePoint.
          </RevealTexto>
        </Reveal>

        <div className="relative z-10 mt-10 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
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
                  className="group hover:ring-enel-blue/25 relative flex h-full w-full flex-col rounded-2xl bg-black/[0.03] p-[2px] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(10,25,47,0.1)]"
                >
                  <div className="relative flex h-full flex-col rounded-[calc(1rem-2px)] bg-white p-5 md:p-6">
                    <div className="relative z-10 flex items-start gap-4">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${estilo} text-white shadow-md`}
                      >
                        <Icono size={20} weight="duotone" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-enel-navy text-base font-semibold tracking-tight md:text-lg">
                          {politica.nombre}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
                          {politica.resumen}
                        </p>
                      </div>
                    </div>

                    <span className="text-enel-blue relative z-10 mt-auto inline-flex items-center gap-1.5 pt-5 text-[10px] font-bold tracking-[0.15em] uppercase">
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

        <Reveal className="mt-4 flex" delay={0.24} y={40}>
          <div className="relative flex w-full flex-col justify-center rounded-2xl bg-black/[0.02] p-[2px] ring-1 ring-black/5">
            <div className="rounded-[calc(1rem-2px)] bg-white p-5 md:p-6">
              <p className="mb-5 text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                Marco ampliado
              </p>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {politicasExtra.map((politica) => {
                  const Icono = ICONOS[politica.id] ?? Certificate

                  return (
                    <li key={politica.id} className="min-w-0">
                      <a
                        href={politica.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => track('iso.abrir', { politica: politica.id })}
                        className="group hover:bg-enel-blue/5 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200"
                      >
                        <span className="bg-enel-mist text-enel-blue group-hover:bg-enel-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 group-hover:text-white">
                          <Icono size={16} weight="duotone" />
                        </span>
                        <span className="text-enel-navy group-hover:text-enel-blue min-w-0 flex-1 text-sm font-semibold tracking-tight transition-colors">
                          {politica.nombre}
                        </span>
                        <ArrowUpRight
                          size={14}
                          weight="bold"
                          className="text-enel-blue shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                        />
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </Reveal>
      </motion.div>
    </SectionShell>
  )
}
