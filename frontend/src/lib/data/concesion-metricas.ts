import { COMUNAS_SVG, ZONAS_SVG } from './comunas-svg'
import { SUBESTACIONES_POR_COMUNA } from './subestaciones'
import { ZONAS_CONCESION } from './zonas'

/* ------------------------------------------------------------------ *
 * Métricas de concesión (clientes y energía).
 *
 * IMPORTANTE: estos valores son DEMOSTRATIVOS. Se generan de forma
 * determinista a partir del id de cada comuna para que la experiencia
 * (tooltips y modo Rayos X) sea estable entre renderizados mientras no
 * exista la fuente de datos real. Reemplazar por el endpoint de negocio
 * manteniendo la misma interfaz `MetricaComuna` / `MetricaZona`.
 * ------------------------------------------------------------------ */

export interface MetricaComuna {
  id: string
  nombre: string
  nombreCorto: string
  clientes: number
  mwh: number
  /** Subestaciones que abastecen la comuna. Vacío si no tiene S/E propia. */
  subestaciones: string[]
  cx: number
  cy: number
}

function ruido(semilla: string): number {
  let h = 2166136261
  for (let i = 0; i < semilla.length; i++) {
    h ^= semilla.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

const ZONA_DE_COMUNA = new Map<string, string>()
for (const zona of ZONAS_CONCESION) {
  for (const id of zona.comunas) ZONA_DE_COMUNA.set(id, zona.id)
}

const CLIENTES_MIN = 9000
const CLIENTES_MAX = 185000
const MWH_MIN_POR_CLIENTE = 2.4
const MWH_MAX_POR_CLIENTE = 6.3

export const METRICAS_COMUNA: MetricaComuna[] = COMUNAS_SVG.map((comuna) => {
  const r = ruido(comuna.id)
  const clientes = Math.round(CLIENTES_MIN + r * (CLIENTES_MAX - CLIENTES_MIN))
  const rMwh = ruido(`${comuna.id}::mwh`)
  const mwh = Math.round(
    clientes * (MWH_MIN_POR_CLIENTE + rMwh * (MWH_MAX_POR_CLIENTE - MWH_MIN_POR_CLIENTE)),
  )
  return {
    id: comuna.id,
    nombre: comuna.nombre,
    nombreCorto: comuna.nombreCorto,
    clientes,
    mwh,
    subestaciones: SUBESTACIONES_POR_COMUNA[comuna.id] ?? [],
    cx: comuna.cx,
    cy: comuna.cy,
  }
})

export const METRICA_COMUNA_POR_ID = new Map(METRICAS_COMUNA.map((m) => [m.id, m]))

export interface MetricaZona {
  id: string
  nombre: string
  color: string
  comunas: string[]
  totalComunas: number
  clientes: number
  mwh: number
  /** Subestaciones de todas las comunas de la zona, sin duplicados. */
  subestaciones: string[]
  cx: number
  cy: number
}

export const METRICAS_ZONA: MetricaZona[] = ZONAS_CONCESION.map((zona) => {
  const propias = METRICAS_COMUNA.filter((m) => ZONA_DE_COMUNA.get(m.id) === zona.id)
  const svg = ZONAS_SVG.find((s) => s.id === zona.id)
  const clientes = propias.reduce((acc, m) => acc + m.clientes, 0)
  const mwh = propias.reduce((acc, m) => acc + m.mwh, 0)
  const subestaciones = [...new Set(propias.flatMap((m) => m.subestaciones))]
  return {
    id: zona.id,
    nombre: zona.nombre,
    color: zona.color,
    comunas: zona.comunas,
    totalComunas: zona.comunas.length,
    clientes,
    mwh,
    subestaciones,
    cx: svg?.cx ?? 0,
    cy: svg?.cy ?? 0,
  }
})

export const METRICA_ZONA_POR_ID = new Map(METRICAS_ZONA.map((m) => [m.id, m]))
