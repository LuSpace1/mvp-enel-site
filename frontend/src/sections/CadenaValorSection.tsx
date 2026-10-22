import { useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  HandCoins,
  HardHat,
  Headset,
  Package,
  Wrench,
  type Icon,
} from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { RevealTexto } from '@/components/ui/RevealTexto'
import { SectionShell } from '@/components/ui/SectionShell'
import { etapasCadena } from '@/lib/data/organizacion'

import fotoCliente from '@/assets/images/cadena/customer-management.jpg'
import fotoEstrategia from '@/assets/images/cadena/strategy-development.jpg'
import fotoSuministro from '@/assets/images/cadena/supply-chain.jpg'
import fotoIngenieria from '@/assets/images/cadena/engineering.jpg'
import fotoConstruccion from '@/assets/images/cadena/construction-operation.jpg'
import fotoCobro from '@/assets/images/cadena/service-to-cash.jpg'

const ICONOS: Record<string, Icon> = {
  customer: Headset,
  strategy: Compass,
  supply: Package,
  engineering: Wrench,
  construction: HardHat,
  cash: HandCoins,
}

// Fotos nuevas por etapa: cada una representa su proceso. Las imágenes
// genéricas son de StockSnap.io (CC0) y no se reutilizan en otras secciones.
const IMAGENES: Record<string, string> = {
  customer: fotoCliente,
  strategy: fotoEstrategia,
  supply: fotoSuministro,
  engineering: fotoIngenieria,
  construction: fotoConstruccion,
  cash: fotoCobro,
}

const CHEVRON = (primero: boolean) =>
  primero
    ? 'polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%)'
    : 'polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%)'

const SUBTITULO =
  'Conoce cómo se conectan nuestros procesos y áreas clave, desde la planificación hasta la atención de nuestros clientes, para entregar un servicio eléctrico continuo, seguro y de calidad.'

export function CadenaValorSection() {
  const reduce = useReducedMotion()
  const [indiceActivo, setIndiceActivo] = useState(0)

  const etapaActual = etapasCadena[indiceActivo] ?? etapasCadena[0]!
  const imagenActual = IMAGENES[etapaActual.id] ?? fotoCliente
  const total = etapasCadena.length

  function irA(indice: number) {
    setIndiceActivo(Math.min(Math.max(indice, 0), total - 1))
  }

  return (
    <SectionShell id="cadena" className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-3xl text-center">
        <RevealTexto
          as="h2"
          className="text-enel-navy text-3xl font-bold tracking-tight md:text-5xl"
        >
          Cadena de <span className="text-enel-blue">Valor</span>
        </RevealTexto>
        <RevealTexto
          as="p"
          variante="parrafo"
          className="mt-4 text-base leading-relaxed font-medium text-neutral-600 md:text-lg"
        >
          {SUBTITULO}
        </RevealTexto>
      </div>

      {/* Riel de etapas en forma de chevron, como en la maqueta de referencia. */}
      <div className="no-scrollbar mt-10 overflow-x-auto pb-1 md:mt-12">
        <div
          className="flex min-w-max items-stretch gap-1.5 lg:min-w-0"
          role="tablist"
          aria-label="Etapas de la cadena de valor"
        >
          {etapasCadena.map((etapa, indice) => {
            const Icono = ICONOS[etapa.id] ?? Headset
            const activa = indice === indiceActivo

            return (
              <button
                key={etapa.id}
                type="button"
                role="tab"
                aria-selected={activa}
                aria-controls="cadena-detalle"
                onClick={() => irA(indice)}
                style={{ clipPath: CHEVRON(indice === 0) } as CSSProperties}
                className={`group relative flex min-h-[104px] w-[185px] shrink-0 flex-col items-center justify-center gap-1.5 px-5 py-4 text-center transition-all duration-300 ease-out active:scale-[0.98] active:brightness-95 lg:w-auto lg:flex-1 ${
                  activa
                    ? 'text-enel-navy z-10 bg-gradient-to-br from-white to-[#eef7ff] drop-shadow-[0_14px_24px_rgba(0,111,187,0.18)]'
                    : 'hover:text-enel-navy bg-[#edf2f8] text-neutral-500 hover:-translate-y-0.5 hover:bg-white hover:drop-shadow-[0_12px_20px_rgba(10,25,47,0.14)]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 h-0.5 transition-opacity duration-300 ${
                    activa
                      ? 'bg-enel-blue opacity-100'
                      : 'bg-enel-blue/40 opacity-0 group-hover:opacity-100'
                  }`}
                />

                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors duration-300 ${
                      activa
                        ? 'bg-enel-blue text-white shadow-sm'
                        : 'group-hover:bg-enel-blue/10 group-hover:text-enel-blue bg-white/90 text-neutral-400'
                    }`}
                  >
                    {String(indice + 1).padStart(2, '0')}
                  </span>
                  <Icono
                    size={21}
                    weight={activa ? 'duotone' : 'bold'}
                    className={`transition-colors duration-300 ${
                      activa ? 'text-enel-blue' : 'group-hover:text-enel-blue text-neutral-500'
                    }`}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className={`max-w-[150px] text-[11px] leading-tight font-semibold tracking-tight transition-colors duration-300 md:text-xs ${
                    activa ? 'text-enel-navy' : 'group-hover:text-enel-navy text-neutral-500'
                  }`}
                >
                  {etapa.titulo}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detalle de la etapa activa */}
      <div
        id="cadena-detalle"
        className="border-enel-navy/10 ring-enel-navy/[0.03] mt-8 overflow-hidden rounded-[2rem] border bg-white shadow-[0_30px_90px_-50px_rgba(10,25,47,0.35)] ring-1 md:mt-10"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={etapaActual.id}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid gap-8 p-5 md:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:p-10">
              <div className="flex h-full flex-col">
                <p className="text-enel-blue text-[11px] font-bold tracking-[0.18em] uppercase">
                  {etapaActual.descripcion}
                </p>
                <h3 className="text-enel-navy mt-3 text-3xl leading-tight font-bold tracking-tight md:text-4xl">
                  {etapaActual.titulo}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-neutral-600">
                  {etapaActual.detalle}
                </p>

                <p className="mt-8 text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
                  Principales actividades
                </p>
                <ul className="mt-3 grid gap-2.5">
                  {etapaActual.actividades.map((actividad) => (
                    <li
                      key={actividad}
                      className="bg-enel-mist/70 flex items-center gap-3 rounded-xl px-3.5 py-3"
                    >
                      <span className="bg-enel-blue/10 text-enel-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                        <Check size={15} weight="bold" aria-hidden="true" />
                      </span>
                      <span className="text-enel-navy text-sm leading-snug font-medium">
                        {actividad}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-enel-mist ring-enel-navy/10 relative min-h-[280px] overflow-hidden rounded-[1.5rem] ring-1 sm:min-h-[340px] lg:min-h-full">
                <img
                  key={etapaActual.id}
                  src={imagenActual}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="from-enel-navy/70 via-enel-navy/10 absolute inset-0 bg-gradient-to-t to-transparent" />
              </div>
            </div>

            <div className="border-enel-navy/10 flex items-center justify-between gap-4 border-t px-5 py-4 md:px-8 lg:px-10">
              <div className="flex items-center gap-2" role="tablist" aria-label="Ir a una etapa">
                {etapasCadena.map((etapa, indice) => (
                  <button
                    key={etapa.id}
                    type="button"
                    role="tab"
                    aria-selected={indice === indiceActivo}
                    aria-controls="cadena-detalle"
                    aria-label={`Ir a ${etapa.titulo}`}
                    onClick={() => irA(indice)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      indice === indiceActivo
                        ? 'bg-enel-blue w-8'
                        : 'bg-enel-navy/15 hover:bg-enel-navy/35 w-2.5'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => irA(indiceActivo - 1)}
                  disabled={indiceActivo === 0}
                  aria-label="Etapa anterior"
                  className="border-enel-navy/10 text-enel-navy hover:border-enel-blue/30 hover:text-enel-blue flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-all duration-300 hover:scale-105 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowLeft size={17} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => irA(indiceActivo + 1)}
                  disabled={indiceActivo === total - 1}
                  aria-label="Etapa siguiente"
                  className="border-enel-navy/10 text-enel-navy hover:border-enel-blue/30 hover:text-enel-blue flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-all duration-300 hover:scale-105 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowRight size={17} weight="bold" />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </SectionShell>
  )
}
