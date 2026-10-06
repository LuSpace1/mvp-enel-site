import { COMUNAS_SVG, ZONAS_SVG } from './comunas-svg'
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
  /** Duración media de interrupción por cliente, horas/año (índice SAIDI). */
  saidi: number
  /** Frecuencia media de interrupciones por cliente, veces/año (índice SAIFI). */
  saifi: number
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

const unaDecimal = (v: number) => Math.round(v * 10) / 10

const ZONA_DE_COMUNA = new Map<string, string>()
for (const zona of ZONAS_CONCESION) {
  for (const id of zona.comunas) ZONA_DE_COMUNA.set(id, zona.id)
}

const CLIENTES_MIN = 9000
const CLIENTES_MAX = 185000
const MWH_MIN_POR_CLIENTE = 2.4
const MWH_MAX_POR_CLIENTE = 6.3
// Rangos de referencia para distribuidoras urbanas en Chile (SEC/CNE).
const SAIDI_MIN = 3.6
const SAIDI_MAX = 8.8
const SAIFI_MIN = 2.1
const SAIFI_MAX = 5.9

/** Rangos de referencia (para gauges/indicadores). */
export const RANGO_SAIDI = { min: SAIDI_MIN, max: SAIDI_MAX }
export const RANGO_SAIFI = { min: SAIFI_MIN, max: SAIFI_MAX }

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
    saidi: unaDecimal(SAIDI_MIN + ruido(`${comuna.id}::saidi`) * (SAIDI_MAX - SAIDI_MIN)),
    saifi: unaDecimal(SAIFI_MIN + ruido(`${comuna.id}::saifi`) * (SAIFI_MAX - SAIFI_MIN)),
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
  /** Promedio ponderado por clientes de los índices de continuidad. */
  saidi: number
  saifi: number
  cx: number
  cy: number
}

export const METRICAS_ZONA: MetricaZona[] = ZONAS_CONCESION.map((zona) => {
  const propias = METRICAS_COMUNA.filter((m) => ZONA_DE_COMUNA.get(m.id) === zona.id)
  const svg = ZONAS_SVG.find((s) => s.id === zona.id)
  const clientes = propias.reduce((acc, m) => acc + m.clientes, 0)
  const mwh = propias.reduce((acc, m) => acc + m.mwh, 0)
  const ponderado = (clave: 'saidi' | 'saifi') =>
    clientes > 0
      ? unaDecimal(propias.reduce((acc, m) => acc + m[clave] * m.clientes, 0) / clientes)
      : 0
  return {
    id: zona.id,
    nombre: zona.nombre,
    color: zona.color,
    comunas: zona.comunas,
    totalComunas: zona.comunas.length,
    clientes,
    mwh,
    saidi: ponderado('saidi'),
    saifi: ponderado('saifi'),
    cx: svg?.cx ?? 0,
    cy: svg?.cy ?? 0,
  }
})

export const METRICA_ZONA_POR_ID = new Map(METRICAS_ZONA.map((m) => [m.id, m]))
