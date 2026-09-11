import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Lightbulb } from '@phosphor-icons/react'
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
    num: '1',
    titulo: 'Se genera',
    desc: 'Centrales producen la electricidad.',
    color: 'text-amber-600',
    borderColor: 'border-amber-600',
  },
  {
    num: '2',
    titulo: 'Se transporta',
    desc: 'Líneas llevan la energía por el país.',
    color: 'text-blue-600',
    borderColor: 'border-blue-600',
  },
  {
    num: '3',
    titulo: 'Distribuimos',
    desc: 'Enel la hace llegar a hogares.',
    color: 'text-emerald-600',
    borderColor: 'border-emerald-600',
  },
  {
    num: '4',
    titulo: 'Los clientes',
    desc: 'La energía impulsa la ciudad.',
    color: 'text-enel-pink',
    borderColor: 'border-enel-pink',
  },
]

const statCards = [
  {
    statVal: '14,5',
    statUnit: 'TWh',
    statDesc: 'Energía distribuida al año',
    color: 'text-amber-600',
    borderColor: 'border-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    statVal: '18.248',
    statUnit: 'km',
    statDesc: 'Red de distribución eléctrica',
    color: 'text-blue-600',
    borderColor: 'border-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    statVal: '33',
    statUnit: '',
    statDesc: 'Comunas en nuestra zona de concesión',
    color: 'text-emerald-600',
    borderColor: 'border-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    statVal: '2',
    statUnit: 'M',
    statDesc: 'Clientes en la Región Metropolitana',
    color: 'text-enel-pink',
    borderColor: 'border-enel-pink',
    bgColor: 'bg-pink-50',
  },
  {
    statVal: '538',
    statUnit: '',
    statDesc: 'Personas que hacen posible el servicio',
    color: 'text-purple-600',
    borderColor: 'border-purple-600',
    bgColor: 'bg-purple-50',
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
          El grupo que impulsa la energía del país
        </h2>
        <p className="mt-5 text-base leading-relaxed text-neutral-600 md:text-lg">
          Enel Chile S.A. es uno de los holdings eléctricos más importantes de Chile, constituido en
          2016 y parte de Enel SpA, compañía multinacional presente en más de 30 países. Enel
          Distribución Chile es la empresa de distribución de energía eléctrica más grande del país.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {filiales.map((filial) => (
            <span
              key={filial}
              className="border-enel-fog text-enel-navy rounded-full border bg-white px-4 py-1.5 text-sm font-medium shadow-sm"
            >
              {filial}
            </span>
          ))}
        </div>
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
          className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2.5rem] border-4 border-amber-500 bg-white p-10 shadow-2xl md:p-16"
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

          <div className="relative z-10 flex flex-col gap-10 md:gap-16">
            {/* MÓVIL: filas punto → tarjeta, una por etapa */}
            <div className="relative flex flex-col gap-4 pt-12 md:pt-0 md:hidden">
              {/* Línea conectora vertical */}
              <div className="bg-enel-fog/80 absolute top-20 bottom-8 left-6 w-0.5" aria-hidden="true" />
              {timelineSteps.map((step, idx) => {
                const stat = statCards[idx]
                return (
                  <motion.div
                    key={step.num}
                    className="relative flex items-center gap-4"
                    initial={reduce ? false : { opacity: 0, x: -16 }}
                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                  >
                    {/* Círculo numérico con título debajo */}
                    <div className="z-10 flex w-12 shrink-0 flex-col items-center gap-1.5">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white drop-shadow-lg ${step.borderColor} ${step.color} text-xl font-bold`}
                      >
                        {step.num}
                      </div>
                      <p className={`text-[10px] leading-tight font-bold ${step.color}`}>
                        {step.titulo}
                      </p>
                    </div>
                    {/* Tarjeta de estadística a la par */}
                    {stat && (
                      <div
                        className={`flex min-w-0 flex-1 flex-col items-start gap-1 rounded-2xl border-2 ${stat.borderColor} ${stat.bgColor} bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md`}
                        onTouchStart={() => setIsBulbOn(true)}
                        onTouchEnd={() => setIsBulbOn(false)}
                      >
                        <p
                          className={`text-2xl font-extrabold tracking-tight ${stat.color}`}
                        >
                          {stat.statVal}
                          {stat.statUnit ? <span className="ml-0.5 text-base">{stat.statUnit}</span> : null}
                        </p>
                        <p className="text-enel-navy text-[10px] leading-snug font-bold tracking-wider uppercase">
                          {stat.statDesc}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )
              })}
              {/* 5ª estadística (equipo) sin número: fila completa */}
              {statCards[4] && (
                <motion.div
                  className="relative pl-16"
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div
                    className={`flex flex-col items-start gap-1 rounded-2xl border-2 ${statCards[4].borderColor} ${statCards[4].bgColor} bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md`}
                  >
                    <p
                      className={`text-2xl font-extrabold tracking-tight ${statCards[4].color}`}
                    >
                      {statCards[4].statVal}
                    </p>
                    <p className="text-enel-navy text-[10px] leading-snug font-bold tracking-wider uppercase">
                      {statCards[4].statDesc}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* DESKTOP: TIMELINE SUPERIOR */}
            <div className="relative hidden w-full flex-col items-start justify-between gap-12 md:flex md:flex-row md:gap-4">
              {/* Línea conectora horizontal */}
              <div className="bg-enel-fog/80 absolute top-8 right-[10%] left-[10%] h-0.5" />

              {timelineSteps.map((step, idx) => (
                <motion.div
                  key={step.num}
                  className="relative flex flex-1 flex-col items-center text-center"
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: idx * 0.15, duration: 0.6 }}
                >
                  {/* Círculo numérico */}
                  <div
                    className={`z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white drop-shadow-xl ${step.borderColor} ${step.color} text-2xl font-bold transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_20px_rgba(251,191,36,1)]`}
                    onMouseEnter={() => setIsBulbOn(true)}
                    onMouseLeave={() => setIsBulbOn(false)}
                  >
                    {step.num}
                  </div>

                  {/* Título y Descripción de la etapa */}
                  <div className={`mt-5 flex flex-col items-center ${step.color} drop-shadow-md`}>
                    <h3 className="text-lg font-bold tracking-tight">{step.titulo}</h3>
                    <p className="mt-1.5 px-2 text-[13px] leading-snug font-medium drop-shadow-sm">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* DESKTOP: tarjetas de estadísticas */}
            <div className="hidden flex-wrap justify-center gap-6 md:flex">
              {statCards.map((stat, idx) => (
                <motion.div
                  key={stat.statVal}
                  className={`flex w-full max-w-[200px] flex-col items-center justify-center rounded-2xl border-2 ${stat.borderColor} ${stat.bgColor} bg-white/90 px-4 py-6 text-center shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_40px_rgba(251,191,36,0.8)]`}
                  style={{ animation: 'float-subtle 4s ease-in-out infinite' }}
                  initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                  whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                  onMouseEnter={() => setIsBulbOn(true)}
                  onMouseLeave={() => setIsBulbOn(false)}
                >
                  <p
                    className={`text-4xl font-extrabold tracking-tight drop-shadow-md ${stat.color}`}
                  >
                    {stat.statVal}
                    {stat.statUnit ? <span className="ml-1 text-2xl">{stat.statUnit}</span> : null}
                  </p>
                  <p className="text-enel-navy mt-2 text-[11px] font-bold tracking-wider uppercase drop-shadow-sm">
                    {stat.statDesc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bombilla Interactiva (Se enciende al hacer hover en los objetos) */}
          <div className="absolute top-6 right-6 z-20 md:top-10 md:right-10 w-10 h-10 md:w-14 md:h-14">
            <Lightbulb
              size="100%"
              weight={isBulbOn ? 'fill' : 'duotone'}
              className={`transition-all duration-500 ${
                isBulbOn
                  ? 'scale-125 text-amber-400 drop-shadow-[0_0_45px_rgba(251,191,36,1)]'
                  : 'text-neutral-300'
              }`}
            />
          </div>
        </div>
      </motion.div>
    </SectionShell>
  )
}
