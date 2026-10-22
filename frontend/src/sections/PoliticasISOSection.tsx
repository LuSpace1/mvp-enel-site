import type { Icon } from '@phosphor-icons/react'
import {
  ArrowUpRight,
  ArrowsClockwise,
  BookOpen,
  Certificate,
  Files,
  FolderOpen,
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

const PORTAL_SIG = 'https://enelcom.sharepoint.com/sites/PortalSIG2/SitePages/Home.aspx'

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
    <SectionShell id="politicas" className="relative overflow-hidden bg-white">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 80, rotateX: 12 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
        style={{ perspective: 1200 }}
      >
        <Reveal y={0} className="relative z-10 max-w-3xl">
          <RevealTexto as="h2" className="text-enel-navy text-4xl md:text-6xl">
            Nuestro marco de actuación
          </RevealTexto>
          <RevealTexto
            as="p"
            variante="parrafo"
            className="mt-4 text-base leading-relaxed font-medium text-neutral-600 md:text-lg"
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
                    <h3 className="text-enel-navy mt-4 text-base">{politica.nombre}</h3>
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

        <Reveal delay={0.18} y={32} className="relative z-10 mt-12 md:mt-16">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#eaf4ff] via-[#f4f9ff] to-[#e2f0ff] p-6 md:p-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-white/55 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="bg-enel-blue/10 pointer-events-none absolute -right-16 -bottom-24 h-56 w-56 rounded-full blur-2xl"
            />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-enel-blue/80 text-[11px] font-bold tracking-[0.2em] uppercase">
                  Profundiza en nuestro SIG
                </p>
                <h3 className="text-enel-navy mt-2 text-2xl md:text-3xl">
                  Conoce nuestro Portal SIG
                </h3>
                <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-neutral-600 md:text-base">
                  Accede a la política completa, documentos asociados, normas ISO, procedimientos y
                  toda la información del Sistema Integrado de Gestión.
                </p>
              </div>

              <a
                href={PORTAL_SIG}
                target="_blank"
                rel="noreferrer"
                onClick={() => track('sig.portal.abrir')}
                className="bg-enel-blue hover:bg-enel-blue-dark inline-flex shrink-0 items-center justify-center gap-2.5 self-start rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(0,111,187,0.28)] transition-all duration-300 hover:-translate-y-0.5 lg:self-auto"
              >
                Ir al Portal SIG
                <ArrowUpRight size={17} weight="bold" />
              </a>
            </div>

            <div className="border-enel-blue/15 relative mt-6 flex flex-col gap-3 border-t pt-5 text-[12px] font-medium text-neutral-600 sm:flex-row sm:items-center sm:justify-between md:mt-7">
              <span className="flex items-center gap-2">
                <Files size={17} weight="duotone" className="text-enel-blue shrink-0" />
                Política y documentos
              </span>
              <span aria-hidden="true" className="bg-enel-navy/10 hidden h-4 w-px sm:block" />
              <span className="flex items-center gap-2">
                <FolderOpen size={17} weight="duotone" className="text-enel-blue shrink-0" />
                Procedimientos y lineamientos
              </span>
              <span aria-hidden="true" className="bg-enel-navy/10 hidden h-4 w-px sm:block" />
              <span className="flex items-center gap-2">
                <BookOpen size={17} weight="duotone" className="text-enel-blue shrink-0" />
                Información de las 8 normas ISO
              </span>
            </div>
          </div>
        </Reveal>
      </motion.div>
    </SectionShell>
  )
}
