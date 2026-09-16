import { ArrowUpRight, Certificate } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'

import { Reveal } from '@/components/ui/Reveal'
import { SectionShell } from '@/components/ui/SectionShell'
import { track } from '@/lib/analytics'
import { politicasExtra, politicasISO } from '@/lib/data/iso'

const PRINCIPAL = politicasISO[0]
const RESTO = politicasISO.slice(1)

const PUNTO_NAVY = {
  backgroundImage: 'radial-gradient(rgba(10, 25, 47, 0.35) 1.5px, transparent 1.5px)',
  backgroundSize: '16px 16px',
}

const PUNTO_BLANCO = {
  backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px)',
  backgroundSize: '16px 16px',
}

const POSICIONES_RESTO = [
  'md:col-start-3 md:row-start-1',
  'md:col-start-4 md:row-start-1',
  'md:col-start-3 md:row-start-2',
  'md:col-start-4 md:row-start-2',
]

export function PoliticasISOSection() {
  const reduce = useReducedMotion()

  return (
    <SectionShell id="politicas" className="relative overflow-hidden bg-[#f0eee6] pb-2 md:pb-4">
      {/* Fondo Cuadernillo Global */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-multiply"
        style={PUNTO_NAVY}
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 80, rotateX: 12 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
        style={{ perspective: 1200 }}
      >
        <Reveal className="relative z-10 max-w-2xl">
          <h2 className="text-enel-navy text-3xl font-semibold tracking-tight md:text-5xl">
            Nuestro marco de actuación
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 md:text-lg">
            Cinco políticas que orientan la forma en que trabajamos cada día. Accede a la versión
            completa en SharePoint.
          </p>
        </Reveal>

        <div className="relative z-10 mt-10 grid w-full grid-cols-1 gap-4 md:mt-14 md:grid-cols-[minmax(0,1.15fr)_3.5rem_minmax(0,0.72fr)_minmax(0,0.72fr)] md:grid-rows-2 md:gap-6">
          {PRINCIPAL && (
            <Reveal
              className="flex h-full md:col-start-1 md:row-span-2 md:row-start-1"
              delay={0.12}
              y={60}
            >
              <a
                href={PRINCIPAL.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => track('iso.abrir', { politica: PRINCIPAL.id })}
                className="group bg-enel-navy hover:shadow-enel-navy/30 relative flex h-full w-full flex-col overflow-hidden rounded-3xl p-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-3 hover:shadow-2xl"
                style={{ animation: 'float-subtle 4s ease-in-out infinite' }}
                data-analytics-component="iso"
                data-analytics-politica={PRINCIPAL.id}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen"
                  style={PUNTO_BLANCO}
                />
                <Certificate
                  aria-hidden="true"
                  size={230}
                  weight="duotone"
                  className="pointer-events-none absolute -right-14 -bottom-14 text-white/[0.05]"
                />
                <span className="bg-enel-blue relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-white">
                  <Certificate size={28} weight="duotone" />
                </span>
                <div className="relative z-10 mt-6">
                  <h3 className="text-3xl font-semibold tracking-tight">{PRINCIPAL.nombre}</h3>
                </div>
                <div className="relative z-10 mt-auto">
                  <p className="text-base leading-relaxed text-white/70">{PRINCIPAL.resumen}</p>
                  <span className="text-enel-blue mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                    Abrir política
                    <ArrowUpRight
                      size={18}
                      weight="bold"
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </div>
              </a>
            </Reveal>
          )}

          <div
            aria-hidden="true"
            className="pointer-events-none relative hidden md:col-start-2 md:row-span-2 md:row-start-1 md:block"
          >
            <svg
              className="absolute top-0 -right-6 bottom-0 -left-6 opacity-60"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,50 H 20"
                stroke="#006fbb"
                strokeWidth="4"
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="10,10"
                className="animate-march-politicas"
              />
              <path
                d="M 20,50 C 58,50 44,24 100,24"
                stroke="#006fbb"
                strokeWidth="4"
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="10,10"
                className="animate-march-politicas"
              />
              <path
                d="M 20,50 C 58,50 44,76 100,76"
                stroke="#006fbb"
                strokeWidth="4"
                fill="none"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="10,10"
                className="animate-march-politicas"
              />
            </svg>
          </div>

          {RESTO.map((politica, index) => (
            <Reveal
              key={politica.id}
              className={`flex h-full ${POSICIONES_RESTO[index] ?? ''}`}
              delay={0.12 + index * 0.07}
              y={50}
            >
              <a
                href={politica.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => track('iso.abrir', { politica: politica.id })}
                className="group hover:border-enel-blue hover:shadow-enel-blue/20 relative flex h-full w-full flex-col overflow-hidden rounded-3xl border-4 border-gray-300 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-3"
                style={{ animation: 'float-subtle 4s ease-in-out infinite' }}
                data-analytics-component="iso"
                data-analytics-politica={politica.id}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
                  style={PUNTO_NAVY}
                />
                <span className="bg-enel-mist text-enel-blue group-hover:bg-enel-blue relative z-10 flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:text-white">
                  <ArrowUpRight size={20} weight="bold" />
                </span>
                <h3 className="text-enel-navy relative z-10 mt-5 text-lg font-semibold tracking-tight">
                  {politica.nombre}
                </h3>
                <p className="relative z-10 mt-2 hidden text-sm leading-relaxed text-neutral-600 md:block">
                  {politica.resumen}
                </p>
              </a>
            </Reveal>
          ))}

          <Reveal className="flex md:col-span-full md:row-start-3" delay={0.2} y={50}>
            <div className="group hover:border-enel-blue hover:shadow-enel-blue/20 relative flex w-full flex-col justify-center overflow-hidden rounded-3xl border-4 border-dashed border-gray-300 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1.5 md:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-20 mix-blend-multiply"
                style={PUNTO_NAVY}
              />
              <p className="relative z-10 mb-6 text-center text-[12px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                Marco ampliado
              </p>
              <ul className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                {politicasExtra.map((politica) => (
                  <li key={politica.id} className="w-full">
                    <a
                      href={politica.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => track('iso.abrir', { politica: politica.id })}
                      className="group text-enel-navy hover:text-enel-blue hover:border-enel-blue flex w-full items-center justify-center gap-2 border-b-2 border-gray-200 pb-3 text-center text-base font-semibold transition-all md:text-lg"
                    >
                      {politica.nombre}
                      <ArrowUpRight
                        size={18}
                        weight="bold"
                        className="text-enel-blue opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </motion.div>
    </SectionShell>
  )
}
