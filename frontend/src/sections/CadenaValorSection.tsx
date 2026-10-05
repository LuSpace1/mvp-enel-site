import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Compass,
  HandCoins,
  HardHat,
  Headset,
  Package,
  Wrench,
  type Icon,
} from '@phosphor-icons/react'
import { motion, AnimatePresence, useMotionValue, useReducedMotion } from 'motion/react'
import { RevealTexto } from '@/components/ui/RevealTexto'
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

  const etapaActual: EtapaCadena = etapasCadena.find((e) => e.id === activa) ?? primeraEtapa

  const toggle = useCallback((id: string) => {
    setActiva(id)
  }, [])

  const etapasDuplicadas = [...etapasCadena, ...etapasCadena]

  const cintaRef = useRef<HTMLDivElement>(null)
  const cintaX = useMotionValue(0)
  const velocidadRef = useRef(1)

  useEffect(() => {
    if (reduce) return
    let raf = 0
    let ultimo = performance.now()
    const paso = (ahora: number) => {
      const dt = Math.min((ahora - ultimo) / 1000, 0.05)
      ultimo = ahora
      const mitad = cintaRef.current ? cintaRef.current.scrollWidth / 2 : 0
      if (mitad > 0) {
        // ~55 px/s a velocidad 1: ciclo completo de la mitad en ~18s
        const siguiente = cintaX.get() - 55 * velocidadRef.current * dt
        cintaX.set(siguiente <= -mitad ? siguiente + mitad : siguiente)
      }
      raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [reduce, cintaX])

  return (
    <section id="cadena" className="relative overflow-hidden bg-white py-16 md:py-24">
      <motion.div
        className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-8"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-8 text-center md:mb-10">
          <RevealTexto
            as="h2"
            className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-4xl"
          >
            Cadena de Valor
          </RevealTexto>
        </div>

        <div
          className="relative w-full overflow-hidden py-4 select-none"
          onMouseEnter={() => {
            velocidadRef.current = 0.1
          }}
          onMouseLeave={() => {
            velocidadRef.current = 1
          }}
        >
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-30 w-16 bg-gradient-to-r from-white to-transparent md:w-28" />
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-30 w-16 bg-gradient-to-l from-white to-transparent md:w-28" />

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

          <motion.div
            ref={cintaRef}
            className="relative z-20 flex w-max cursor-pointer items-center gap-2"
            style={{ x: cintaX }}
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
                  className={` ${config.colorFondo} ${config.colorTexto} group relative flex h-[115px] w-[210px] shrink-0 flex-col items-center justify-center overflow-hidden px-6 text-center transition-all duration-300 ease-out outline-none md:w-[230px] ${
                    estaActiva
                      ? 'z-20 scale-105 shadow-md ring-2 ring-slate-900/40 brightness-105'
                      : 'opacity-85 hover:scale-[1.02] hover:opacity-100'
                  } `}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.4)_0%,_rgba(56,189,248,0.15)_60%,_transparent_100%)] opacity-20"
                  />

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.5)_0%,_rgba(56,189,248,0.3)_45%,_transparent_75%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-full bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(186,230,253,0.3)_60deg,transparent_120deg)] opacity-0 group-hover:animate-[pulse_1.2s_ease-in-out_infinite] group-hover:opacity-60"
                  />

                  <Icono
                    size={22}
                    weight={estaActiva ? 'fill' : 'bold'}
                    className={`relative z-10 mb-1.5 transition-transform duration-300 ${
                      estaActiva ? 'scale-110' : 'opacity-85 group-hover:scale-105'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="relative z-10 max-w-[140px] text-xs leading-tight font-semibold md:text-sm">
                    {etapa.titulo}
                  </span>
                </button>
              )
            })}
          </motion.div>
        </div>

        <div className="mx-auto mt-10 max-w-4xl md:mt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={etapaActual.id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col justify-between gap-8 border-t border-slate-900/10 px-4 pt-8 md:flex-row md:items-start"
            >
              <div className="md:max-w-xl">
                <p className="mb-1 text-xs font-semibold tracking-wider text-teal-800 uppercase">
                  {etapaActual.descripcion}
                </p>

                <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  {etapaActual.titulo}
                </h3>

                <p className="text-xs leading-relaxed font-normal text-slate-600 md:text-sm">
                  {etapaActual.detalle}
                </p>
              </div>

              <div className="flex flex-col md:min-w-[220px]">
                <span className="mb-2.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  Actividades
                </span>
                <ul className="flex flex-col gap-2">
                  {etapaActual.actividades.map((actividad) => (
                    <li
                      key={actividad}
                      className="flex items-baseline gap-2 text-xs leading-normal font-medium text-slate-700 md:text-sm"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 self-center rounded-full bg-teal-600" />
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
