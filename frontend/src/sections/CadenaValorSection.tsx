import { useState, useCallback } from 'react'
import {
  Compass,
  HandCoins,
  HardHat,
  Headset,
  Package,
  Wrench,
  type Icon,
} from '@phosphor-icons/react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { etapasCadena } from '@/lib/data/organizacion'
import type { EtapaCadena } from '@/types/api'

interface EtapaVisualConfig {
  id: string
  icono: Icon
  colorFondo: string
  colorTexto: string
}

const CONFIG_DEFAULT: EtapaVisualConfig = {
  id: 'customer',
  icono: Headset,
  colorFondo: 'bg-[#d2e8ea]',
  colorTexto: 'text-slate-800',
}

const CONFIG_ETAPAS: Record<string, EtapaVisualConfig> = {
  customer: CONFIG_DEFAULT,
  strategy: {
    id: 'strategy',
    icono: Compass,
    colorFondo: 'bg-[#b0d6dc]',
    colorTexto: 'text-slate-800',
  },
  supply: {
    id: 'supply',
    icono: Package,
    colorFondo: 'bg-[#89bfca]',
    colorTexto: 'text-slate-900',
  },
  engineering: {
    id: 'engineering',
    icono: Wrench,
    colorFondo: 'bg-[#66a7b4]',
    colorTexto: 'text-white',
  },
  construction: {
    id: 'construction',
    icono: HardHat,
    colorFondo: 'bg-[#4a8d9a]',
    colorTexto: 'text-white',
  },
  cash: {
    id: 'cash',
    icono: HandCoins,
    colorFondo: 'bg-[#31737f]',
    colorTexto: 'text-white',
  },
}

export function CadenaValorSection() {
  const reduce = useReducedMotion()
  const primeraEtapa = etapasCadena[0] ?? {
    id: 'customer',
    titulo: 'Customer Management',
    descripcion: '',
    detalle: '',
    actividades: [],
  }

  const [activa, setActiva] = useState<string>(primeraEtapa.id)
  const [isHovered, setIsHovered] = useState(false)

  const etapaActual: EtapaCadena =
    etapasCadena.find((e) => e.id === activa) ?? primeraEtapa

  const toggle = useCallback((id: string) => {
    setActiva(id)
  }, [])

  // Arreglo duplicado para la cinta continua infinita hacia la derecha
  const etapasDuplicadas = [...etapasCadena, ...etapasCadena]

  return (
    <section id="cadena" className="relative overflow-hidden bg-[#f0eee6] py-16 md:py-24">
      <motion.div
        className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-8"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Título Superior */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Cadena de Valor
          </h2>
        </div>

        {/* Cadena Continua en Movimiento (Avance hacia la derecha con animación de electricidad horizontal) */}
        <div
          className="relative w-full overflow-hidden py-4 select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Atenuaciones laterales para difuminar bordes */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 md:w-28 z-30 bg-gradient-to-r from-[#f0eee6] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 md:w-28 z-30 bg-gradient-to-l from-[#f0eee6] to-transparent" />

          {/* Barrido de onda / pulso de corriente eléctrica continua horizontal de izquierda a derecha */}
          {!reduce && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 z-25 w-[280px] md:w-[380px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0) 20%, rgba(56, 189, 248, 0.25) 45%, rgba(255, 255, 255, 0.7) 50%, rgba(56, 189, 248, 0.35) 55%, rgba(56, 189, 248, 0) 80%, transparent 100%)',
                filter: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.6))',
              }}
              animate={{
                x: ['-200%', '600%'],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          )}

          {/* Cinta continua de Chevrons en movimiento hacia la derecha */}
          <motion.div
            className="flex items-center gap-2 w-max cursor-pointer relative z-20"
            animate={
              reduce
                ? undefined
                : {
                    x: isHovered ? undefined : ['-50%', '0%'],
                  }
            }
            transition={{
              ease: 'linear',
              duration: 18,
              repeat: Infinity,
            }}
          >
            {etapasDuplicadas.map((etapa, idx) => {
              const config = CONFIG_ETAPAS[etapa.id] ?? CONFIG_DEFAULT
              const Icono = config.icono
              const estaActiva = etapa.id === activa

              return (
                <button
                  key={`${etapa.id}-${idx}`}
                  type="button"
                  onClick={() => toggle(etapa.id)}
                  style={{
                    clipPath:
                      'polygon(0% 0%, calc(100% - 24px) 0%, 100% 50%, calc(100% - 24px) 100%, 0% 100%, 24px 50%)',
                  }}
                  aria-pressed={estaActiva}
                  className={`
                    ${config.colorFondo} ${config.colorTexto}
                    group relative shrink-0 w-[210px] md:w-[230px] h-[115px]
                    flex flex-col items-center justify-center text-center px-6
                    transition-all duration-300 ease-out outline-none overflow-hidden
                    ${
                      estaActiva
                        ? 'scale-105 z-20 shadow-md ring-2 ring-slate-900/40 brightness-105'
                        : 'opacity-85 hover:opacity-100 hover:scale-[1.02]'
                    }
                  `}
                >
                  {/* Chispa / flujo eléctrico tenue continuo dentro de cada tarjeta */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.4)_0%,_rgba(56,189,248,0.15)_60%,_transparent_100%)]"
                  />

                  {/* Destello eléctrico tenue en hover */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.5)_0%,_rgba(56,189,248,0.3)_45%,_transparent_75%)]"
                  />
                  
                  {/* Arco tenue de corriente eléctrica */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-full group-hover:animate-[pulse_1.2s_ease-in-out_infinite] opacity-0 group-hover:opacity-60 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(186,230,253,0.3)_60deg,transparent_120deg)]"
                  />

                  <Icono
                    size={22}
                    weight={estaActiva ? 'fill' : 'bold'}
                    className={`relative z-10 mb-1.5 transition-transform duration-300 ${
                      estaActiva ? 'scale-110' : 'opacity-85 group-hover:scale-105'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="relative z-10 text-xs md:text-sm font-semibold leading-tight max-w-[140px]">
                    {etapa.titulo}
                  </span>
                </button>
              )
            })}
          </motion.div>
        </div>

        {/* Panel Informativo Minimalista & Clean */}
        <div className="mt-10 md:mt-14 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={etapaActual.id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 flex flex-col md:flex-row md:items-start justify-between gap-8 border-t border-slate-900/10 pt-8"
            >
              {/* Información Principal */}
              <div className="md:max-w-xl">
                <p className="text-xs font-semibold tracking-wider text-teal-800 uppercase mb-1">
                  {etapaActual.descripcion}
                </p>

                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 mb-2">
                  {etapaActual.titulo}
                </h3>

                <p className="text-xs md:text-sm leading-relaxed text-slate-600 font-normal">
                  {etapaActual.detalle}
                </p>
              </div>

              {/* Actividades Relevantes */}
              <div className="flex flex-col md:min-w-[220px]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Actividades
                </span>
                <ul className="flex flex-col gap-2">
                  {etapaActual.actividades.map((actividad) => (
                    <li
                      key={actividad}
                      className="text-xs md:text-sm text-slate-700 font-medium leading-normal flex items-baseline gap-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-600 shrink-0 self-center" />
                      <span>{actividad}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  )
}
