import { VIEWBOX, ZONAS_SVG } from '@/lib/data/comunas-svg'

export interface Tamano {
  w: number
  h: number
}

/** Mapeo del viewBox del SVG al rectángulo medido del contenedor. */
export interface Mapeo {
  sf: number
  ox: number
  oy: number
  w: number
  h: number
}

/** Transform afín aplicado al envoltorio (CSS transform). */
export interface Vista {
  escala: number
  x: number
  y: number
}

export function mapeoContenedor({ w, h }: Tamano): Mapeo {
  const sf = w > 0 && h > 0 ? Math.min(w / VIEWBOX.w, h / VIEWBOX.h) : 0
  const ancho = VIEWBOX.w * sf
  const alto = VIEWBOX.h * sf
  return { sf, ox: (w - ancho) / 2, oy: (h - alto) / 2, w, h }
}

/** Punto del viewBox en coordenadas del contenedor (antes del transform). */
export function aContenedor(px: number, py: number, m: Mapeo) {
  return { x: m.ox + px * m.sf, y: m.oy + py * m.sf }
}

/** Punto del viewBox en coordenadas de pantalla, dado el transform actual. */
export function aPantalla(px: number, py: number, m: Mapeo, vista: Vista) {
  const p = aContenedor(px, py, m)
  return {
    x: m.w / 2 + vista.escala * (p.x - m.w / 2) + vista.x,
    y: m.h / 2 + vista.escala * (p.y - m.h / 2) + vista.y,
  }
}

export function vistaGeneral(): Vista {
  return { escala: 1, x: 0, y: 0 }
}

/** Zoom de zona por defecto y versión más amplia para el modo Rayos X. */
export const FACTOR_ZONA = 0.9
export const FACTOR_ZONA_XRAY = 0.7

/** Transform con spring hacia el bounding box de una zona. */
export function vistaZona(id: string, m: Mapeo, factor = FACTOR_ZONA): Vista {
  const zona = ZONAS_SVG.find((z) => z.id === id)
  if (!zona || m.sf === 0) return vistaGeneral()

  const escala = Math.min(VIEWBOX.w / zona.bbox.w, VIEWBOX.h / zona.bbox.h) * factor
  const centro = aContenedor(zona.bbox.x + zona.bbox.w / 2, zona.bbox.y + zona.bbox.h / 2, m)
  const mx = m.w / 2
  const my = m.h / 2
  return { escala, x: escala * (mx - centro.x), y: escala * (my - centro.y) }
}
