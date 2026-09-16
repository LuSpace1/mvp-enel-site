import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight, Lightbulb } from '@phosphor-icons/react'
import { Reveal } from '@/components/ui/Reveal'
import { SectionShell } from '@/components/ui/SectionShell'

const filiales = [
  'Enel Green Power Chile',
  'Enel Generación Chile',
  'Enel Distribución',
  'Enel X Chile',
]

const timelineSteps = [
  {
    titulo: 'Se genera',
    desc: 'Centrales producen la electricidad.',
    color: 'text-[#d64200]',
  },
  {
    titulo: 'Se transporta',
    desc: 'Líneas llevan la energía por el país.',
    color: 'text-[#0555fa]',
  },
  {
    titulo: 'Distribuimos',
    desc: 'Enel la hace llegar a hogares.',
    color: 'text-[#008556]',
  },
  {
    titulo: 'Los clientes',
    desc: 'La energía impulsa la ciudad.',
    color: 'text-[#eb0052]',
  },
]

const statCards = [
  {
    statVal: '14,5',
    statUnit: 'TWh',
    statDesc: 'Energía distribuida al año',
    color: 'text-[#d64200]',
    borderColor: 'border-[#c6c6c6]',
    bgColor: 'bg-[#d64200]/10',
    glow: 'hover:shadow-[0_0_40px_rgba(214,66,0,0.4)]',
  },
  {
    statVal: '18.248',
    statUnit: 'km',
    statDesc: 'Red de distribución eléctrica',
    color: 'text-[#0555fa]',
    borderColor: 'border-[#c6c6c6]',
    bgColor: 'bg-[#0555fa]/10',
    glow: 'hover:shadow-[0_0_40px_rgba(5,85,250,0.4)]',
  },
  {
    statVal: '33',
    statUnit: '',
    statDesc: 'Comunas en nuestra zona de concesión',
    color: 'text-[#008556]',
    borderColor: 'border-[#c6c6c6]',
    bgColor: 'bg-[#008556]/10',
    glow: 'hover:shadow-[0_0_40px_rgba(0,133,86,0.4)]',
  },
  {
    statVal: '2',
    statUnit: 'M',
    statDesc: 'Clientes en la Región Metropolitana',
    color: 'text-[#eb0052]',
    borderColor: 'border-[#c6c6c6]',
    bgColor: 'bg-[#eb0052]/10',
    glow: 'hover:shadow-[0_0_40px_rgba(235,0,82,0.4)]',
  },
]

export function HistoriaSection() {
  const [isBulbOn, setIsBulbOn] = useState(false)
  const reduce = useReducedMotion()

  return (
    <SectionShell id="historia" className="relative overflow-hidden bg-[#f0eee6]">
      {/* Fondo Cuadernillo Global */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(rgba(10, 25, 47, 0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />
      <Reveal className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="text-enel-navy text-3xl font-semibold tracking-tight md:text-5xl">
          Grupo Enel
        </h2>
        <p className="mt-5 text-base leading-relaxed text-neutral-600 md:text-lg">
          Enel es una empresa multinacional de energía y uno de los principales operadores
          integrados globales en los sectores de la energía y el gas. Está presente en 27 países de
          los 5 continentes, con una capacidad instalada de 91,8 GW y más de 69 millones de
          consumidores finales en todo el mundo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {filiales.map((filial) => (
            <span
              key={filial}
              className="text-enel-navy rounded-full border border-[#c6c6c6] bg-white px-4 py-1.5 text-sm font-medium shadow-sm"
            >
              {filial}
            </span>
          ))}
        </div>
        <a
          href="https://www.enel.cl/es/conoce-enel/grupo-enel.html"
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-enel-navy hover:bg-enel-blue mt-8 inline-flex h-12 items-center gap-3 rounded-full px-7 text-sm font-semibold text-white shadow-lg transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
        >
          Si quieres saber más, haz clic aquí
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-white/15">
            <ArrowUpRight size={13} weight="bold" />
          </span>
        </a>
      </Reveal>

      <motion.div
        className="relative z-10 mt-20"
        initial={reduce ? false : { opacity: 0, y: 50 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1, margin: '0px 0px -50px 0px' }}
        transition={{ type: 'spring', stiffness: 25, damping: 16, mass: 1.5 }}
      >
        {/* CARD PADRE */}
        <div
          className="border-enel-navy/80 relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2.5rem] border-4 bg-white p-10 shadow-2xl md:p-16"
          style={{ animation: 'float-subtle 4s ease-in-out infinite' }}
        >
          {/* Fondo Cuadernillo del Card Padre */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              backgroundImage: 'radial-gradient(rgba(10, 25, 47, 0.35) 1.5px, transparent 1.5px)',
              backgroundSize: '16px 16px',
            }}
          />

          <div className="relative z-10 grid gap-10 pt-8 sm:grid-cols-2 md:gap-6 md:pt-14 lg:grid-cols-4">
            {timelineSteps.map((step, idx) => {
              const stat = statCards[idx]
              return (
                <motion.div
                  key={step.titulo}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: idx * 0.12, duration: 0.55 }}
                >
                  <div
                    className="float-subtle flex flex-col items-center"
                    onMouseEnter={() => setIsBulbOn(true)}
                    onMouseLeave={() => setIsBulbOn(false)}
                    onTouchStart={() => setIsBulbOn(true)}
                    onTouchEnd={() => setIsBulbOn(false)}
                  >
                    {stat && (
                      <div
                        className={`flex w-full max-w-[200px] flex-col items-center justify-center rounded-2xl border-2 ${stat.borderColor} ${stat.bgColor} px-4 py-6 text-center shadow-xl transition-all duration-300 hover:-translate-y-1.5 ${stat.glow}`}
                      >
                        <p
                          className={`text-4xl font-extrabold tracking-tight drop-shadow-md ${stat.color}`}
                        >
                          {stat.statVal}
                          {stat.statUnit ? (
                            <span className="ml-1 text-2xl">{stat.statUnit}</span>
                          ) : null}
                        </p>
                        <p className="text-enel-navy mt-2 text-[11px] font-bold tracking-wider uppercase drop-shadow-sm">
                          {stat.statDesc}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Bombilla Interactiva (Se enciende al hacer hover en los objetos) */}
          <div className="absolute top-6 right-6 z-20 h-10 w-10 md:top-10 md:right-10 md:h-14 md:w-14">
            <Lightbulb
              size="100%"
              weight={isBulbOn ? 'fill' : 'duotone'}
              className={`transition-all duration-500 ${
                isBulbOn
                  ? 'scale-125 text-[#ff4687] drop-shadow-[0_0_45px_rgba(255,70,135,0.9)]'
                  : 'text-neutral-300'
              }`}
            />
          </div>
        </div>
      </motion.div>
    </SectionShell>
  )
}
