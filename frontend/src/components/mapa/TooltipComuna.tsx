import { useEffect, useMemo, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import type { MotionValue } from 'motion/react'

import { COMUNAS_SVG } from '@/lib/data/comunas-svg'
import { METRICA_COMUNA_POR_ID, RANGO_SAIDI, RANGO_SAIFI } from '@/lib/data/concesion-metricas'
import { ZONA_POR_ID } from '@/lib/data/zonas'
import { useMapaConcesion } from './contexto'
import { dec, num } from './formato'
import { aContenedor, aPantalla, vistaGeneral, vistaZona, type Mapeo } from './geometria'

interface Props {
  mapeo: Mapeo
  mvX: MotionValue<number>
  mvY: MotionValue<number>
  mvEscala: MotionValue<number>
}

const posicionRango = (valor: number, rango: { min: number; max: number }) =>
  Math.min(Math.max(((valor - rango.min) / (rango.max - rango.min)) * 100, 6), 100)

/** Número que "cuenta" hasta su valor al montar. */
function Contador({
  valor,
  formato,
  reduce,
}: {
  valor: number
  formato: (v: number) => string
  reduce: boolean
}) {
  const mv = useMotionValue(reduce ? valor : 0)
  const [texto, setTexto] = useState(() => formato(reduce ? valor : 0))
  useMotionValueEvent(mv, 'change', (v) => setTexto(formato(v)))

  useEffect(() => {
    if (reduce) {
      mv.set(valor)
      return
    }
    const control = animate(mv, valor, { duration: 0.7, ease: [0.16, 1, 0.3, 1] })
    return () => control.stop()
  }, [valor, mv, reduce])

  return <>{texto}</>
}

function Gauge({
  label,
  valor,
  formato,
  unidad,
  pct,
  color,
  delay,
  reduce,
}: {
  label: string
  valor: number
  formato: (v: number) => string
  unidad: string
  pct: number
  color: string
  delay: number
  reduce: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-10 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
        {label}
      </span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <motion.span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: reduce ? `${pct}%` : 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: reduce ? 0 : delay, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="w-16 text-right text-[12px] font-bold tabular-nums">
        <Contador valor={valor} formato={formato} reduce={reduce} />
        <span className="ml-0.5 text-[9px] font-medium text-neutral-400">{unidad}</span>
      </span>
    </div>
  )
}

/**
 * Tooltip de comuna anclado al centro del polígono. Misma estética que las
 * tarjetas de Rayos X (glass oscuro, dot de zona, micro-labels), pero con
 * entrada animada: barra de acento, métricas escalonadas, contadores y
 * gauges que se llenan.
 */
export function TooltipComuna({ mapeo, mvX, mvY, mvEscala }: Props) {
  const { zonaActiva, comunaActiva } = useMapaConcesion()
  const reduce = useReducedMotion() ?? false
  const comuna = useMemo(() => COMUNAS_SVG.find((c) => c.id === comunaActiva), [comunaActiva])
  const metrica = comunaActiva ? METRICA_COMUNA_POR_ID.get(comunaActiva) : undefined
  const zona = zonaActiva ? ZONA_POR_ID.get(zonaActiva) : undefined

  const centro = useMemo(
    () => (comuna ? aContenedor(comuna.cx, comuna.cy, mapeo) : { x: 0, y: 0 }),
    [comuna, mapeo],
  )

  const left = useTransform<number, number>([mvX, mvEscala], ([x = 0, s = 1]) => {
    return mapeo.w / 2 + s * (centro.x - mapeo.w / 2) + x
  })
  const top = useTransform<number, number>([mvY, mvEscala], ([y = 0, s = 1]) => {
    return mapeo.h / 2 + s * (centro.y - mapeo.h / 2) + y
  })

  const objetivo = useMemo(
    () => (zonaActiva ? vistaZona(zonaActiva, mapeo) : vistaGeneral()),
    [zonaActiva, mapeo],
  )
  const enPantalla = useMemo(
    () => (comuna ? aPantalla(comuna.cx, comuna.cy, mapeo, objetivo) : { x: 0, y: 0 }),
    [comuna, mapeo, objetivo],
  )
  const debajo = enPantalla.y < mapeo.h * 0.4
  const tx = enPantalla.x < 140 ? '0%' : enPantalla.x > mapeo.w - 140 ? '-100%' : '-50%'
  const ty = debajo ? '20px' : 'calc(-100% - 20px)'

  if (!comuna || !metrica || !zona) return null

  return (
    <motion.div
      className="pointer-events-none absolute z-40"
      style={{ left, top }}
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.7 }}
    >
      <div
        className="w-[272px] overflow-hidden rounded-2xl border border-white/15 bg-neutral-950/72 text-white shadow-[0_30px_70px_-24px_rgba(0,0,0,0.85)] backdrop-blur-md"
        style={{ transform: `translate(${tx}, ${ty})` }}
      >
        <motion.div
          className="h-1 origin-left"
          style={{ backgroundColor: zona.color }}
          initial={{ scaleX: reduce ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        />

        <div className="p-3.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {!reduce && (
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ backgroundColor: zona.color }}
                />
              )}
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: zona.color }}
              />
            </span>
            <p className="text-[15px] leading-tight font-bold">{comuna.nombre}</p>
            <span className="ml-auto text-[9px] font-semibold tracking-[0.16em] text-neutral-400 uppercase">
              Zona {zona.nombre}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4">
            {[
              { label: 'Clientes', valor: metrica.clientes, formato: num },
              {
                label: 'Energía suministrada',
                valor: metrica.mwh,
                formato: (v: number) => `${num(v)} MWh`,
              },
            ].map((celda, i) => (
              <motion.div
                key={celda.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + 0.07 * i, type: 'spring', stiffness: 260, damping: 22 }}
              >
                <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                  {celda.label}
                </p>
                <p className="mt-0.5 text-[17px] leading-tight font-black tabular-nums">
                  <Contador valor={celda.valor} formato={celda.formato} reduce={reduce} />
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
            <Gauge
              label="SAIDI"
              valor={metrica.saidi}
              formato={dec}
              unidad="h/año"
              pct={posicionRango(metrica.saidi, RANGO_SAIDI)}
              color={zona.color}
              delay={0.32}
              reduce={reduce}
            />
            <Gauge
              label="SAIFI"
              valor={metrica.saifi}
              formato={dec}
              unidad="veces/año"
              pct={posicionRango(metrica.saifi, RANGO_SAIFI)}
              color={zona.color}
              delay={0.42}
              reduce={reduce}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
