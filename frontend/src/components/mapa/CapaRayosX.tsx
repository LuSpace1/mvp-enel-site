import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'

import { VIEWBOX } from '@/lib/data/comunas-svg'
import {
  METRICAS_ZONA,
  METRICA_COMUNA_POR_ID,
  METRICA_ZONA_POR_ID,
  type MetricaZona,
} from '@/lib/data/concesion-metricas'
import { ZONA_POR_ID } from '@/lib/data/zonas'
import { useMapaConcesion } from './contexto'
import { compacto, dec } from './formato'
import {
  FACTOR_ZONA_XRAY,
  aContenedor,
  aPantalla,
  vistaZona,
  type Mapeo,
  type Tamano,
} from './geometria'
import { useMediaQuery } from './useMediaQuery'

type Lado = 'izq' | 'der'

/** Reparto geográfico de las tarjetas de zona en los laterales. */
const LADO_POR_ZONA: Record<string, Lado> = {
  chacabuco: 'izq',
  pacifico: 'izq',
  cordillera: 'der',
  florida: 'der',
}

const ALTO_TARJETA_COMUNA = 100
const ALTO_TARJETA_ZONA = 210
const HUECO_TARJETA = 10
const PAD_SUP = 58
const PAD_INF = 22

interface Ancla {
  x: number
  y: number
  lado: Lado
}

interface ObjetivoRayos {
  id: string
  color: string
  /** Coordenada del viewBox desde la que sale el conector. */
  punto: { cx: number; cy: number }
  lado: Lado
  /** Posición vertical de la tarjeta, en % del alto de la escena. */
  topPct: number
  tipo: 'zona' | 'comuna'
  titulo: string
  sub: string
  clientes: number
  mwh: number
  saidi: number
  saifi: number
  totalComunas?: number
  comunas?: string[]
}

interface Props {
  mapeo: Mapeo
  tam: Tamano
  escenaRef: RefObject<HTMLDivElement | null>
  mvX: MotionValue<number>
  mvY: MotionValue<number>
  mvEscala: MotionValue<number>
}

function mismoAnclaje(a: Record<string, Ancla>, b: Record<string, Ancla>): boolean {
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every((k) => {
    const pa = a[k]!
    const pb = b[k]
    return !!pb && pa.lado === pb.lado && Math.abs(pa.x - pb.x) < 0.5 && Math.abs(pa.y - pb.y) < 0.5
  })
}

/** Reparte tarjetas a lo largo de un lateral evitando solapamientos. */
function distribuir(items: { y: number }[], alto: number, altoEscena: number) {
  if (items.length === 0) return
  items.sort((a, b) => a.y - b.y)
  let cursor = PAD_SUP
  for (const item of items) {
    item.y = Math.max(item.y, cursor)
    cursor = item.y + alto + HUECO_TARJETA
  }
  const ultimo = items[items.length - 1]!
  const sobra = ultimo.y + alto - (altoEscena - PAD_INF)
  if (sobra > 0) for (const item of items) item.y -= sobra
  for (const item of items) item.y = Math.max(PAD_SUP, item.y)
}

/** Un conector: línea discontinua animada desde el mapa hasta la tarjeta. */
function ConectorRayos({
  id,
  color,
  punto,
  ancla,
  retraso,
  mapeo,
  mvX,
  mvY,
  mvEscala,
}: {
  id: string
  color: string
  punto: { cx: number; cy: number }
  ancla: Ancla
  retraso: number
  mapeo: Mapeo
  mvX: MotionValue<number>
  mvY: MotionValue<number>
  mvEscala: MotionValue<number>
}) {
  const d = useTransform<number, string>([mvX, mvY, mvEscala], ([x = 0, y = 0, s = 1]) => {
    const p = aContenedor(punto.cx, punto.cy, mapeo)
    const x0 = mapeo.w / 2 + s * (p.x - mapeo.w / 2) + x
    const y0 = mapeo.h / 2 + s * (p.y - mapeo.h / 2) + y
    const k = ancla.lado === 'izq' ? 58 : -58
    return `M ${x0} ${y0} C ${x0 + k} ${y0}, ${ancla.x - k} ${ancla.y}, ${ancla.x} ${ancla.y}`
  })

  const sx = useTransform<number, number>([mvX, mvEscala], ([x = 0, s = 1]) => {
    const p = aContenedor(punto.cx, punto.cy, mapeo)
    return mapeo.w / 2 + s * (p.x - mapeo.w / 2) + x
  })
  const sy = useTransform<number, number>([mvY, mvEscala], ([y = 0, s = 1]) => {
    const p = aContenedor(punto.cx, punto.cy, mapeo)
    return mapeo.h / 2 + s * (p.y - mapeo.h / 2) + y
  })

  const ref = useRef<SVGPathElement>(null)
  useMotionValueEvent(d, 'change', (valor) => ref.current?.setAttribute('d', valor))

  return (
    <g>
      <motion.path
        ref={ref}
        d={d.get()}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeDasharray="7 9"
        className="rayos-flujo"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.7, delay: retraso }}
        aria-label={id}
      />
      <motion.g
        style={{ x: sx, y: sy }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: retraso, type: 'spring', stiffness: 260, damping: 18 }}
      >
        <circle r={4.5} fill={color} stroke="#ffffff" strokeWidth={1.5} />
        <motion.circle
          r={4.5}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          animate={{ r: [4.5, 17], opacity: [0.5, 0] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut', delay: retraso }}
        />
      </motion.g>
    </g>
  )
}

function DatoDark({
  label,
  valor,
  unidad,
  sm,
}: {
  label: string
  valor: string
  unidad?: string
  sm?: boolean
}) {
  return (
    <div>
      <p
        className={`font-semibold tracking-wider text-neutral-400 uppercase ${
          sm ? 'text-[9px]' : 'text-[10px]'
        }`}
      >
        {label}
      </p>
      <p className={`leading-tight font-black tabular-nums ${sm ? 'text-[12px]' : 'text-[15px]'}`}>
        {valor}
        {unidad ? (
          <span
            className={`ml-1 font-semibold text-neutral-400 ${sm ? 'text-[9px]' : 'text-[10px]'}`}
          >
            {unidad}
          </span>
        ) : null}
      </p>
    </div>
  )
}

function TarjetaZona({
  zona,
  lado,
  indice,
  movil,
  refCb,
  onFin,
}: {
  zona: MetricaZona
  lado: Lado
  indice: number
  movil?: boolean
  refCb?: (el: HTMLDivElement | null) => void
  onFin?: () => void
}) {
  const nombres = zona.comunas
    .map((id) => METRICA_COMUNA_POR_ID.get(id)?.nombreCorto)
    .filter((n): n is string => Boolean(n))

  return (
    <motion.div
      ref={refCb}
      data-lado={lado}
      initial={{ opacity: 0, x: movil ? 0 : lado === 'izq' ? -30 : 30, y: movil ? 14 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 150, damping: 20, delay: 0.09 * indice }}
      onAnimationComplete={onFin}
      className={`pointer-events-auto overflow-hidden rounded-2xl border border-white/15 bg-neutral-950/70 p-4 text-white shadow-[0_24px_60px_-16px_rgba(0,0,0,0.8)] backdrop-blur-md ${
        movil ? 'w-full' : 'w-[236px]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="h-3 w-3 shrink-0 rounded-full shadow-sm"
          style={{ backgroundColor: zona.color }}
        />
        <h3 className="text-sm font-bold">Zona {zona.nombre}</h3>
        <span className="ml-auto text-[11px] font-semibold text-neutral-400">
          {zona.totalComunas} comunas
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        <DatoDark label="Clientes" valor={compacto(zona.clientes)} />
        <DatoDark label="Energía" valor={compacto(zona.mwh)} unidad="MWh" />
        <DatoDark label="SAIDI" valor={dec(zona.saidi)} unidad="h/año" />
        <DatoDark label="SAIFI" valor={dec(zona.saifi)} unidad="veces/año" />
      </div>

      <div className="mt-3 border-t border-white/10 pt-2.5">
        <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
          Comunas
        </p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutral-300">
          {nombres.join(' · ')}
        </p>
      </div>
    </motion.div>
  )
}

function TarjetaComuna({
  objetivo,
  indice,
  movil,
  refCb,
  onFin,
}: {
  objetivo: ObjetivoRayos
  indice: number
  movil?: boolean
  refCb?: (el: HTMLDivElement | null) => void
  onFin?: () => void
}) {
  const lado = objetivo.lado
  return (
    <motion.div
      ref={refCb}
      data-lado={lado}
      initial={{ opacity: 0, x: movil ? 0 : lado === 'izq' ? -26 : 26, y: movil ? 12 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 170, damping: 21, delay: 0.06 * indice }}
      onAnimationComplete={onFin}
      className={`pointer-events-auto rounded-xl border border-white/15 bg-neutral-950/75 px-3 py-2.5 text-white shadow-[0_16px_40px_-14px_rgba(0,0,0,0.8)] backdrop-blur-md ${
        movil ? 'w-full' : 'w-[224px]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: objetivo.color }}
        />
        <p className="truncate text-[13px] leading-tight font-bold" title={objetivo.sub}>
          {objetivo.titulo}
        </p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
        <DatoDark label="Clientes" valor={compacto(objetivo.clientes)} sm />
        <DatoDark label="Energía" valor={compacto(objetivo.mwh)} unidad="MWh" sm />
        <DatoDark label="SAIDI" valor={dec(objetivo.saidi)} unidad="h/año" sm />
        <DatoDark label="SAIFI" valor={dec(objetivo.saifi)} unidad="v/año" sm />
      </div>
    </motion.div>
  )
}

/**
 * Modo "Rayos X". Funciona en dos alcances:
 * - Global (sin zona activa): una tarjeta por zona y conectores desde el
 *   centro de cada zona.
 * - Zona (con zona activa): una tarjeta por comuna de esa zona, repartidas
 *   en ambos laterales, con conectores desde el centro de cada comuna.
 */
export function CapaRayosX({ mapeo, tam, escenaRef, mvX, mvY, mvEscala }: Props) {
  const { modoRayosX, zonaActiva } = useMapaConcesion()
  const lg = useMediaQuery('(min-width: 1024px)')

  const [anclas, setAnclas] = useState<Record<string, Ancla>>({})
  const anclasRef = useRef<Record<string, Ancla>>({})
  const refs = useRef(new Map<string, HTMLDivElement>())
  const [rev, setRev] = useState(0)

  const zona = zonaActiva ? ZONA_POR_ID.get(zonaActiva) : undefined
  const metricaZona = zonaActiva ? METRICA_ZONA_POR_ID.get(zonaActiva) : undefined
  const alcance: 'global' | 'zona' = zonaActiva ? 'zona' : 'global'

  const objetivos = useMemo<ObjetivoRayos[]>(() => {
    if (!modoRayosX || tam.w < 1 || tam.h < 1) return []

    const enZona = Boolean(zonaActiva && zona && metricaZona)
    const alto = enZona ? ALTO_TARJETA_COMUNA : ALTO_TARJETA_ZONA
    const porLado: Record<Lado, (ObjetivoRayos & { y: number })[]> = { izq: [], der: [] }

    if (enZona && zonaActiva && zona && metricaZona) {
      const vista = vistaZona(zonaActiva, mapeo, FACTOR_ZONA_XRAY)
      const items = zona.comunas.flatMap((id) => {
        const mc = METRICA_COMUNA_POR_ID.get(id)
        if (!mc) return []
        const p = aPantalla(mc.cx, mc.cy, mapeo, vista)
        return [{ mc, px: p.x, py: p.y }]
      })

      // Mitad por posición horizontal: reparto balanceado (los más a la
      // izquierda van al lateral izquierdo) para acotar la densidad.
      items.sort((a, b) => a.px - b.px)
      const mitad = Math.ceil(items.length / 2)
      items.forEach((item, i) => {
        const mc = item.mc
        const lado: Lado = i < mitad ? 'izq' : 'der'
        porLado[lado].push({
          id: mc.id,
          color: zona.color,
          punto: { cx: mc.cx, cy: mc.cy },
          lado,
          topPct: 0,
          tipo: 'comuna',
          titulo: mc.nombreCorto,
          sub: mc.nombre,
          clientes: mc.clientes,
          mwh: mc.mwh,
          saidi: mc.saidi,
          saifi: mc.saifi,
          y: item.py,
        })
      })
    } else {
      for (const z of METRICAS_ZONA) {
        const lado = LADO_POR_ZONA[z.id] ?? 'der'
        const y = Math.min(Math.max(z.cy / VIEWBOX.h, 0.16), 0.84) * tam.h
        porLado[lado].push({
          id: z.id,
          color: z.color,
          punto: { cx: z.cx, cy: z.cy },
          lado,
          topPct: 0,
          tipo: 'zona',
          titulo: `Zona ${z.nombre}`,
          sub: `${z.totalComunas} comunas`,
          clientes: z.clientes,
          mwh: z.mwh,
          saidi: z.saidi,
          saifi: z.saifi,
          totalComunas: z.totalComunas,
          comunas: z.comunas,
          y,
        })
      }
    }

    distribuir(porLado.izq, alto, tam.h)
    distribuir(porLado.der, alto, tam.h)

    return [...porLado.izq, ...porLado.der].map((o) => ({
      ...o,
      topPct: ((o.y + alto / 2) / tam.h) * 100,
    }))
  }, [modoRayosX, zonaActiva, zona, metricaZona, mapeo, tam.w, tam.h])

  const medir = useCallback(() => {
    const cont = escenaRef.current
    if (!cont || !lg) return
    const cr = cont.getBoundingClientRect()
    const siguiente: Record<string, Ancla> = {}
    refs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      const lado: Lado = el.dataset.lado === 'izq' ? 'izq' : 'der'
      siguiente[id] = {
        x: (lado === 'izq' ? r.right : r.left) - cr.left,
        y: r.top + r.height / 2 - cr.top,
        lado,
      }
    })
    if (!mismoAnclaje(siguiente, anclasRef.current)) {
      anclasRef.current = siguiente
      setAnclas(siguiente)
      setRev((r) => r + 1)
    }
  }, [escenaRef, lg])

  useEffect(() => {
    if (!modoRayosX || !lg) return
    const alRedimensionar = () => medir()
    window.addEventListener('resize', alRedimensionar)
    const respaldo = window.setTimeout(medir, 1300)
    return () => {
      window.removeEventListener('resize', alRedimensionar)
      window.clearTimeout(respaldo)
    }
  }, [modoRayosX, lg, medir, zonaActiva])

  const conectores = objetivos
    .map((o) => ({ o, ancla: anclas[o.id] }))
    .filter((c): c is { o: ObjetivoRayos; ancla: Ancla } => Boolean(c.ancla))

  const totales = useMemo(() => {
    if (alcance === 'zona' && metricaZona) {
      return {
        nombre: `Zona ${zona?.nombre ?? ''}`,
        clientes: metricaZona.clientes,
        mwh: metricaZona.mwh,
        n: metricaZona.totalComunas,
        color: zona?.color ?? '#ffffff',
      }
    }
    return {
      nombre: 'Concesión completa',
      clientes: METRICAS_ZONA.reduce((a, z) => a + z.clientes, 0),
      mwh: METRICAS_ZONA.reduce((a, z) => a + z.mwh, 0),
      n: METRICAS_ZONA.reduce((a, z) => a + z.totalComunas, 0),
      color: '#ffffff',
    }
  }, [alcance, metricaZona, zona])

  return (
    <AnimatePresence>
      {modoRayosX && (
        <motion.div
          key="capa-rayos"
          className="pointer-events-none absolute inset-0 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute top-4 left-1/2 z-10 hidden -translate-x-1/2 lg:flex"
          >
            <div className="flex items-center gap-3 rounded-full border border-white/15 bg-neutral-950/70 px-4 py-1.5 text-white shadow-lg backdrop-blur-md">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: totales.color }}
              />
              <span className="text-sm font-bold whitespace-nowrap">
                Rayos X · {totales.nombre}
              </span>
              <span className="hidden text-xs font-semibold text-neutral-300 tabular-nums sm:inline">
                {compacto(totales.clientes)} clientes · {compacto(totales.mwh)} MWh
              </span>
            </div>
          </motion.div>

          {lg && (
            <svg
              className="pointer-events-none absolute inset-0"
              width={tam.w}
              height={tam.h}
              viewBox={`0 0 ${tam.w} ${tam.h}`}
              aria-hidden="true"
            >
              {conectores.map(({ o, ancla }, i) => (
                <ConectorRayos
                  key={`${o.id}-${rev}`}
                  id={o.id}
                  color={o.color}
                  punto={o.punto}
                  ancla={ancla}
                  retraso={0.08 * i}
                  mapeo={mapeo}
                  mvX={mvX}
                  mvY={mvY}
                  mvEscala={mvEscala}
                />
              ))}
            </svg>
          )}

          {lg &&
            objetivos.map((o, i) => (
              <div
                key={o.id}
                className="pointer-events-none absolute -translate-y-1/2"
                style={
                  o.lado === 'izq'
                    ? { top: `${o.topPct}%`, left: 14 }
                    : { top: `${o.topPct}%`, right: 14 }
                }
              >
                {o.tipo === 'zona' ? (
                  METRICA_ZONA_POR_ID.has(o.id) && (
                    <TarjetaZona
                      zona={METRICA_ZONA_POR_ID.get(o.id)!}
                      lado={o.lado}
                      indice={i}
                      refCb={(el) => {
                        if (el) refs.current.set(o.id, el)
                        else refs.current.delete(o.id)
                      }}
                      onFin={i === objetivos.length - 1 ? medir : undefined}
                    />
                  )
                ) : (
                  <TarjetaComuna
                    objetivo={o}
                    indice={i}
                    refCb={(el) => {
                      if (el) refs.current.set(o.id, el)
                      else refs.current.delete(o.id)
                    }}
                    onFin={i === objetivos.length - 1 ? medir : undefined}
                  />
                )}
              </div>
            ))}

          {!lg && (
            <div
              className="pointer-events-auto absolute inset-0 flex flex-col gap-2.5 overflow-y-auto px-4 pt-16 pb-4"
              data-lenis-prevent
            >
              {objetivos.map((o, i) =>
                o.tipo === 'zona' && METRICA_ZONA_POR_ID.has(o.id) ? (
                  <TarjetaZona
                    key={o.id}
                    zona={METRICA_ZONA_POR_ID.get(o.id)!}
                    lado={o.lado}
                    indice={i}
                    movil
                  />
                ) : (
                  <TarjetaComuna key={o.id} objetivo={o} indice={i} movil />
                ),
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
