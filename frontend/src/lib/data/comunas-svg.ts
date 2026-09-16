import { ZONAS_CONCESION } from './zonas'

export interface ComunaSvg {
  id: string
  nombre: string
  nombreCorto: string
  d: string
  bbox: { x: number; y: number; w: number; h: number }
  cx: number
  cy: number
  label: {
    x: number
    y: number
    anchor: 'start' | 'middle' | 'end'
    lineas?: string[]
    rot?: boolean
    rx?: number
    ry?: number
    fontSize?: number
  }
}

export interface ZonaSvg {
  id: string
  bbox: { x: number; y: number; w: number; h: number }
  cx: number
  cy: number
}

interface Punto {
  x: number
  y: number
}

/* ------------------------------------------------------------------ *
 * Ajuste de área relativa entre comunas.
 *
 * La geometría de abajo es la real: las comunas del centro (Santiago,
 * Providencia, Recoleta, Conchalí…) ocupan una fracción mínima del mapa y
 * sus nombres no caben dentro del territorio. Acá se redistribuye el área:
 * las comunas pequeñas crecen y las grandes se achican, conservando la
 * silueta de cada comuna (se escalan como una similaridad, sin deformar su
 * forma) y la continuidad del mapa (los vértices que comparten dos o más
 * comunas se vuelven a soldar en una única posición promedio).
 * ------------------------------------------------------------------ */
const PAD = 40 // aire arriba/abajo del mapa dentro del viewBox
const PAD_LATERAL = 112 // aire a los lados: hace más panorámico el recuadro
const EPS_SOLDADURA = 5 // radio del emparejamiento entre comunas vecinas
const EPS_SOLDADURA_FINA = 3 // segunda pasada para los pares que quedan sueltos
const ESCALA_MIN = 0.78
const ESCALA_MAX = 2
const AREA_REF = 6500 // área de referencia: sobre ella la comuna se achica
const AREA_EXP = 0.32
const RIGIDEZ = 0.015 // anclaje mínimo al lugar original durante la relajación
const ESTIRAMIENTO = 1.35 // cuánto se ensancha el mapa en horizontal
const RIGIDEZ_EXP = 1 // cuánto más anclada queda una comuna grande
const RELAJACION_ITERACIONES = 500
const PASO_RELAJACION = 0.5

function parsearTrazo(d: string): Punto[] {
  const puntos: Punto[] = []
  const re = /[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g
  let coincidencia: RegExpExecArray | null
  while ((coincidencia = re.exec(d)) !== null) {
    puntos.push({ x: Number(coincidencia[1]), y: Number(coincidencia[2]) })
  }
  return puntos
}

function serializarTrazo(puntos: Punto[]): string {
  return `M${puntos.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}Z`
}

function areaDe(puntos: Punto[]): number {
  let doble = 0
  for (let i = 0; i < puntos.length; i++) {
    const a = puntos[i]!
    const b = puntos[(i + 1) % puntos.length]!
    doble += a.x * b.y - b.x * a.y
  }
  return Math.abs(doble) / 2
}

/* ------------------------------------------------------------------ *
 * Colocación de etiquetas.
 *
 * Con las comunas ya redimensionadas, cada nombre se ancla en el punto
 * que deja su caja de texto mejor contenida dentro del territorio (se
 * conserva la posición si ya entra; si no, se busca la mejor).
 * ------------------------------------------------------------------ */
export const FUENTE_BASE = 10 // tamaño de etiqueta por defecto, en unidades del viewBox

// Ancho de cada carácter en em (Outfit Variable, weight 400, mayúsculas,
// letter-spacing 0.07em). Medido sobre la fuente real.
const ANCHO_CARACTER: Record<string, number> = {
  A: 0.7433,
  B: 0.69,
  C: 0.74,
  D: 0.81,
  E: 0.66,
  F: 0.64,
  G: 0.8467,
  H: 0.78,
  I: 0.33,
  J: 0.5367,
  K: 0.7267,
  L: 0.62,
  M: 0.91,
  N: 0.78,
  O: 0.8667,
  P: 0.6733,
  Q: 0.89,
  R: 0.6933,
  S: 0.6167,
  T: 0.6733,
  U: 0.75,
  V: 0.74,
  W: 1.03,
  X: 0.7267,
  Y: 0.7133,
  Z: 0.63,
  Á: 0.7433,
  É: 0.66,
  Í: 0.33,
  Ó: 0.8667,
  Ú: 0.75,
  Ñ: 0.78,
  ' ': 0.28,
  '.': 0.36,
  '0': 0.73,
  '1': 0.42,
  '2': 0.61,
  '3': 0.61,
  '4': 0.6567,
  '5': 0.61,
  '6': 0.63,
  '7': 0.5933,
  '8': 0.62,
  '9': 0.63,
}

function anchoDeTexto(texto: string, fontSize: number): number {
  let em = 0
  for (const caracter of texto.toUpperCase()) em += ANCHO_CARACTER[caracter] ?? 0.7
  return em * fontSize
}

interface CajaEtiqueta {
  ancho: number
  alto: number
  dy: number // centro de la caja respecto del ancla, sobre el eje del texto
}

function cajaDeEtiqueta(comuna: ComunaSvg, fontSize: number): CajaEtiqueta {
  const lineas = comuna.label.lineas ?? [comuna.nombreCorto]
  const ancho = Math.max(...lineas.map((linea) => anchoDeTexto(linea, fontSize)))
  const alto = fontSize * (1.22 + (lineas.length - 1) * 1.18)
  const dy = (fontSize * ((lineas.length - 1) * 1.18 - 0.74)) / 2
  return { ancho, alto, dy }
}

// Distancia de un punto al borde del polígono (positiva si está dentro).
function distanciaAlBorde(puntos: Punto[], x: number, y: number): number {
  let distancia2 = Infinity
  let dentro = false
  for (let i = 0; i < puntos.length; i++) {
    const a = puntos[i]!
    const b = puntos[(i + 1) % puntos.length]!
    const vx = b.x - a.x
    const vy = b.y - a.y
    const wx = x - a.x
    const wy = y - a.y
    const largo2 = vx * vx + vy * vy
    const t = largo2 > 0 ? Math.max(0, Math.min(1, (wx * vx + wy * vy) / largo2)) : 0
    const dx = x - (a.x + t * vx)
    const dy = y - (a.y + t * vy)
    distancia2 = Math.min(distancia2, dx * dx + dy * dy)
    if (a.y > y !== b.y > y) {
      const cruceX = a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y)
      if (cruceX > x) dentro = !dentro
    }
  }
  const distancia = Math.sqrt(distancia2)
  return dentro ? distancia : -distancia
}

interface Puntaje {
  dentro: number // muestras de la caja dentro de la comuna
  borde: number // distancia de la muestra más comprometida al borde
}

function puntajeDeCaja(
  puntos: Punto[],
  cx: number,
  cy: number,
  ancho: number,
  alto: number,
): Puntaje {
  let dentro = 0
  let borde = Infinity
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      const x = cx + ((i - 1) * ancho) / 2
      const y = cy + ((j - 1) * alto) / 2
      const distancia = distanciaAlBorde(puntos, x, y)
      if (distancia >= 0) dentro++
      borde = Math.min(borde, distancia)
    }
  }
  return { dentro, borde }
}

function mejorPuntaje(a: Puntaje, b: Puntaje): boolean {
  if (a.dentro !== b.dentro) return a.dentro > b.dentro
  return a.borde > b.borde
}

function mejorCentroDeCaja(
  puntos: Punto[],
  ancho: number,
  alto: number,
): { centro: Punto; puntaje: Puntaje } {
  const bbox = bboxDe(puntos)
  let paso = Math.max(4, Math.min(bbox.w, bbox.h) / 6)
  let centro: Punto = { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 }
  let puntaje = puntajeDeCaja(puntos, centro.x, centro.y, ancho, alto)

  // Barrido grueso y luego refinamiento alrededor del mejor candidato.
  for (let nivel = 0; nivel < 3; nivel++) {
    const x0 = nivel === 0 ? bbox.x : centro.x - 2 * paso
    const y0 = nivel === 0 ? bbox.y : centro.y - 2 * paso
    const x1 = nivel === 0 ? bbox.x + bbox.w : centro.x + 2 * paso
    const y1 = nivel === 0 ? bbox.y + bbox.h : centro.y + 2 * paso
    for (let y = y0; y <= y1; y += paso) {
      for (let x = x0; x <= x1; x += paso) {
        const valor = puntajeDeCaja(puntos, x, y, ancho, alto)
        if (mejorPuntaje(valor, puntaje)) {
          puntaje = valor
          centro = { x, y }
        }
      }
    }
    paso /= 3
  }
  return { centro, puntaje }
}

interface Colocacion {
  centro: Punto
  puntaje: Puntaje
  fontSize: number
}

// Tamaños candidatos: se conserva el mayor que deje la etiqueta contenida y con aire.
const TAMANOS_ETIQUETA = [FUENTE_BASE, 9, 8.5, 8, 7.5, 7]
const MARGEN_ETIQUETA = 0.5 // px (del viewBox) de aire mínimo hasta el borde de la comuna

function colocarEtiqueta(
  comuna: ComunaSvg,
  puntos: Punto[],
  rot: boolean,
  rigido: Punto,
): Colocacion {
  const preferido = comuna.label.fontSize ?? FUENTE_BASE
  const tamanos = preferido === FUENTE_BASE ? TAMANOS_ETIQUETA : [preferido]
  const candidatos: Colocacion[] = []
  const bbox = bboxDe(puntos)

  for (const fontSize of tamanos) {
    const caja = cajaDeEtiqueta(comuna, fontSize)
    const ancho = rot ? caja.alto : caja.ancho
    const alto = rot ? caja.ancho : caja.alto
    const centroRigido = rot
      ? { x: rigido.x + caja.dy, y: rigido.y }
      : { x: rigido.x, y: rigido.y + caja.dy }
    const puntajeRigido = puntajeDeCaja(puntos, centroRigido.x, centroRigido.y, ancho, alto)
    if (puntajeRigido.borde >= MARGEN_ETIQUETA) {
      return { centro: centroRigido, puntaje: puntajeRigido, fontSize }
    }
    // Si la caja no cabe ni en el rectángulo envolvente, no hay dónde buscarla.
    if (ancho > bbox.w + 2 || alto > bbox.h + 2) {
      candidatos.push({ centro: centroRigido, puntaje: puntajeRigido, fontSize })
      continue
    }
    const { centro, puntaje } = mejorCentroDeCaja(puntos, ancho, alto)
    if (puntaje.borde >= MARGEN_ETIQUETA) return { centro, puntaje, fontSize }
    candidatos.push({ centro, puntaje, fontSize })
  }

  // Ningún tamaño deja el aire pedido: se usa el mayor que quede casi tan
  // contenido como el mejor.
  let mejor = candidatos[0]!
  for (const candidato of candidatos) {
    if (mejorPuntaje(candidato.puntaje, mejor.puntaje)) mejor = candidato
  }
  const equivalente = candidatos.find(
    (candidato) =>
      candidato.fontSize > mejor.fontSize &&
      candidato.puntaje.dentro >= mejor.puntaje.dentro &&
      candidato.puntaje.borde >= mejor.puntaje.borde - 1.5,
  )
  return equivalente ?? mejor
}

function bboxDe(puntos: Punto[]): { x: number; y: number; w: number; h: number } {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const p of puntos) {
    x0 = Math.min(x0, p.x)
    y0 = Math.min(y0, p.y)
    x1 = Math.max(x1, p.x)
    y1 = Math.max(y1, p.y)
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

// prettier-ignore
const COMUNAS_BASE: ComunaSvg[] = [
  {"id":"til-til","nombre":"Tiltil","nombreCorto":"Til Til","d":"M371.2 75.9 L367.6 43.3 L281.8 40.8 L183.5 52.3 L139.4 101.1 L58.8 107 L46.5 121.3 L67.6 202 L45 241.2 L60.5 322.4 L82.8 359.3 L125.1 352.8 L152.2 370.6 L188.8 363.6 L187 401.2 L216.3 420 L234 384.7 L230.1 363.5 L295.3 353.5 L324.4 361 L356 342.6 L329.8 294.2 L342.8 222.1 L321.7 205 L339.3 150.5 L318 114.6 L371.2 75.9Z","bbox":{"x":45,"y":40.8,"w":326.2,"h":379.2},"cx":208.1,"cy":230.4,"label":{"x":206.7,"y":216.5,"anchor":"middle"}},
  {"id":"lampa","nombre":"Lampa","nombreCorto":"Lampa","d":"M295.3 353.5 L230.1 363.5 L234 384.7 L216.3 420 L187 401.2 L188.8 363.6 L152.2 370.6 L125.1 352.8 L82.8 359.3 L74 403.6 L109.1 501.1 L76.4 521 L71.9 542 L89.3 585 L132.1 620.8 L173.6 600 L245.5 621.2 L282.9 577.5 L283 577.2 L293.7 565.7 L372.4 544.7 L371.7 542.6 L304.8 364.3 L295.3 353.5Z","bbox":{"x":71.9,"y":352.8,"w":300.6,"h":268.5},"cx":222.2,"cy":487,"label":{"x":208.2,"y":489.6,"anchor":"middle"}},
  {"id":"colina","nombre":"Colina","nombreCorto":"Colina","d":"M295.3 353.5 L304.8 364.3 L371.7 542.6 L373.1 546.3 L412.1 552.7 L450.2 566.5 L501.9 560.4 L493 527.1 L524.7 500.3 L525.4 471.3 L543.4 439.7 L577.1 436.8 L589.6 413 L634.4 409.2 L643.1 359.2 L690 291.4 L736.7 268.5 L701.9 218.4 L709.4 178.4 L672.2 162.1 L622 237.5 L593.7 247.7 L574.6 201.3 L547.8 173.3 L542.5 133.4 L505.1 95.3 L493.8 62.3 L419.7 84.3 L371.2 75.9 L318 114.6 L339.3 150.5 L321.7 205 L342.8 222.1 L329.8 294.2 L356 342.6 L324.4 361 L295.3 353.5Z","bbox":{"x":295.3,"y":62.3,"w":441.4,"h":504.2},"cx":516,"cy":314.4,"label":{"x":479.8,"y":311,"anchor":"middle"}},
  {"id":"lo-barnechea","nombre":"Lo Barnechea","nombreCorto":"Lo Barnechea","d":"M672.5 742 L715.9 754 L760.2 754.1 L777.9 736.6 L873.3 685 L916.5 629.1 L945 573.3 L921.7 478.8 L895.3 425.7 L901.2 410 L873.7 371.1 L849.3 364.2 L843 300.5 L769.2 257.5 L736.7 268.5 L690 291.4 L643.1 359.2 L634.4 409.2 L589.6 413 L577.1 436.8 L543.4 439.7 L525.4 471.3 L524.7 500.3 L493 527.1 L501.9 560.4 L516.3 577.9 L584.7 605.2 L584.8 605.4 L619.7 594.7 L627.5 632.7 L652.5 639.8 L679.2 713.2 L672.5 742Z","bbox":{"x":493,"y":257.5,"w":452,"h":496.6},"cx":719,"cy":505.8,"label":{"x":741.8,"y":516,"anchor":"middle"}},
  {"id":"quilicura","nombre":"Quilicura","nombreCorto":"Quilicura","d":"M332.6 619.3 L353.1 631.4 L399.1 616.3 L398.1 613.5 L403.4 597.2 L403.6 597.2 L412.1 552.7 L373.1 546.3 L372.4 544.7 L293.7 565.7 L283 577.2 L283 577.3 L332.6 619.3Z","bbox":{"x":283,"y":544.7,"w":129.1,"h":86.7},"cx":347.5,"cy":588,"label":{"x":355.5,"y":588.6,"anchor":"middle"}},
  {"id":"huechuraba","nombre":"Huechuraba","nombreCorto":"Huechuraba","d":"M403.6 597.2 L403.7 597.2 L437 609.8 L438.5 610.5 L486.7 646.1 L505.6 583.7 L516.3 577.9 L501.9 560.4 L450.2 566.5 L412.1 552.7 L403.6 597.2Z","bbox":{"x":403.6,"y":552.7,"w":112.7,"h":93.4},"cx":459.9,"cy":599.4,"label":{"x":459.9,"y":595.3,"anchor":"middle"}},
  {"id":"vitacura","nombre":"Vitacura","nombreCorto":"Vitacura","d":"M584.7 605.2 L516.3 577.9 L505.6 583.7 L486.7 646.1 L482.5 651.4 L491.6 651.5 L567.6 619.4 L584.8 605.4 L584.7 605.2Z","bbox":{"x":482.5,"y":577.9,"w":102.3,"h":73.6},"cx":533.6,"cy":614.7,"label":{"x":527.4,"y":616.6,"anchor":"middle"}},
  {"id":"las-condes","nombre":"Las Condes","nombreCorto":"Las Condes","d":"M584.8 605.4 L567.6 619.4 L491.6 651.5 L514.2 679.9 L514.2 679.9 L520.4 679.4 L546.3 678.2 L562.1 676.3 L593.3 684.9 L617.1 717.7 L667.5 749.1 L672.5 742 L679.2 713.2 L652.5 639.8 L627.5 632.7 L619.7 594.7 L584.8 605.4 L584.8 605.4Z","bbox":{"x":491.6,"y":594.7,"w":187.5,"h":154.3},"cx":585.4,"cy":671.9,"label":{"x":600.7,"y":669.3,"anchor":"middle"}},
  {"id":"pudahuel","nombre":"Pudahuel","nombreCorto":"Pudahuel","d":"M332.6 619.3 L283 577.3 L282.9 577.5 L245.5 621.2 L173.6 600 L132.1 620.8 L123.3 700.3 L130.6 727.6 L158.7 751.2 L186.6 738.8 L234.5 740.6 L280 716.7 L356 728.1 L359.2 725.8 L359.3 709.1 L359 709 L349.3 685.7 L349.2 685.7 L305.5 657.4 L305.5 656 L332.6 619.3Z","bbox":{"x":123.3,"y":577.3,"w":236,"h":173.9},"cx":241.3,"cy":664.3,"label":{"x":230.5,"y":675.6,"anchor":"middle"}},
  {"id":"renca","nombre":"Renca","nombreCorto":"Renca","d":"M399.1 616.3 L353.1 631.4 L332.6 619.3 L305.5 656 L305.5 657.1 L337.6 655.2 L345.4 655.5 L368.2 654.8 L368.4 654.7 L368.4 654.2 L373.1 652.4 L388.1 649.9 L401.7 662.5 L406.4 665.4 L415.9 669.8 L419.6 672.1 L422.5 673.3 L422.7 672.5 L411.4 643.6 L399.4 617 L399.1 616.3Z","bbox":{"x":305.5,"y":616.3,"w":117.3,"h":57},"cx":364.1,"cy":644.8,"label":{"x":367.2,"y":645.4,"anchor":"middle"}},
  {"id":"conchali","nombre":"Conchalí","nombreCorto":"Conchalí","d":"M411.4 643.6 L436.5 638.6 L436.6 638 L437.9 610.2 L437 609.8 L403.7 597.2 L403.4 597.2 L398.1 613.5 L399.4 617 L411.4 643.6Z","bbox":{"x":398.1,"y":597.2,"w":39.8,"h":46.4},"cx":418,"cy":620.4,"label":{"x":418.3,"y":625.1,"anchor":"middle"}},
  {"id":"recoleta","nombre":"Recoleta","nombreCorto":"Recoleta","d":"M443.4 680.4 L449.8 682.2 L460.5 685.1 L460.5 684.8 L482.5 651.4 L486.7 646.1 L438.5 610.5 L437.9 610.2 L436.6 638 L436.5 638.7 L445 662.1 L444 669.3 L443.3 679.1 L443.4 680.4Z","bbox":{"x":436.5,"y":610.2,"w":50.2,"h":74.9},"cx":461.6,"cy":647.7,"label":{"x":461.6,"y":647.1,"anchor":"middle","rot":true,"rx":461.6,"ry":643.4}},
  {"id":"providencia","nombre":"Providencia","nombreCorto":"Providencia","d":"M514.2 679.9 L491.6 651.5 L482.5 651.4 L460.5 684.8 L460.5 685.5 L463.2 697.1 L464.6 702.7 L478 699.4 L498.7 696.2 L516.6 682.4 L516 682 L514.3 679.9 L514.2 679.9Z","bbox":{"x":460.5,"y":651.4,"w":56.1,"h":51.3},"cx":488.5,"cy":677,"label":{"x":486.2,"y":682.7,"anchor":"middle"}},
  {"id":"la-reina","nombre":"La Reina","nombreCorto":"La Reina","d":"M617.1 717.7 L593.3 684.9 L562.1 676.3 L546.3 678.2 L520.4 679.4 L514.2 679.9 L514.3 679.9 L516 682 L517 682.8 L527.1 714.3 L527.2 714.3 L617.1 717.7Z","bbox":{"x":514.2,"y":676.3,"w":102.9,"h":41.4},"cx":565.7,"cy":697,"label":{"x":564.1,"y":701.8,"anchor":"middle"}},
  {"id":"cerro-navia","nombre":"Cerro Navia","nombreCorto":"Cerro Navia","d":"M369.7 686 L368.6 654.6 L368.2 654.8 L345.4 655.5 L337.6 655.2 L305.5 657.1 L305.5 657.4 L349.2 685.7 L352.5 685.7 L369.7 686Z","bbox":{"x":305.5,"y":654.6,"w":64.2,"h":31.4},"cx":337.6,"cy":670.3,"label":{"x":346.8,"y":665.9,"anchor":"middle","lineas":["Cerro","Navia"]}},
  {"id":"quinta-normal","nombre":"Quinta Normal","nombreCorto":"Quinta Normal","d":"M422.5 673.3 L419.6 672.1 L415.9 669.8 L406.4 665.4 L401.7 662.5 L388.1 649.9 L373.1 652.4 L368.4 654.2 L368.4 654.7 L368.6 654.6 L369.7 686 L384.8 701.4 L385.7 701.3 L400.9 696.2 L401.1 692.7 L422.4 673.7 L422.5 673.3Z","bbox":{"x":368.4,"y":649.9,"w":54.1,"h":51.5},"cx":395.4,"cy":675.6,"label":{"x":393.5,"y":672.7,"anchor":"middle","lineas":["Quinta","Normal"]}},
  {"id":"independencia","nombre":"Independencia","nombreCorto":"Indep.","d":"M436.5 638.7 L436.5 638.6 L411.4 643.6 L422.7 672.5 L422.5 673.3 L433.2 677.6 L443.2 680.3 L443.4 680.4 L443.3 679.1 L444 669.3 L445 662.1 L436.5 638.7Z","bbox":{"x":411.4,"y":638.6,"w":33.6,"h":41.7},"cx":428.2,"cy":659.5,"label":{"x":428.2,"y":659.5,"anchor":"middle","rot":true,"rx":428.2,"ry":659.5}},
  {"id":"santiago","nombre":"Santiago","nombreCorto":"Santiago","d":"M443.2 680.3 L433.2 677.6 L422.5 673.3 L422.4 673.7 L401.1 692.7 L400.9 695.9 L413.9 695.2 L415.7 704.1 L414.4 727.4 L421.8 736.4 L412.6 736.3 L412.4 738.8 L422.2 738.8 L439.7 736.6 L453.4 736.8 L453.7 736.8 L468.4 731.1 L471.9 728.1 L471.3 727.6 L464.6 703 L463.2 697.1 L460.5 685.5 L460.5 685.1 L449.8 682.2 L443.2 680.3Z","bbox":{"x":400.9,"y":673.3,"w":71,"h":65.5},"cx":436.4,"cy":706,"label":{"x":438.3,"y":711.5,"anchor":"middle"}},
  {"id":"nunoa","nombre":"Ñuñoa","nombreCorto":"Ñuñoa","d":"M522.3 728.4 L522.8 726.6 L527.1 714.3 L527.1 714.3 L517 682.8 L516.6 682.4 L498.7 696.2 L478 699.4 L464.6 702.7 L464.6 703 L471.3 727.6 L472 728.1 L473.1 732.4 L473.6 734.3 L499.1 732.8 L510.7 733.7 L522.3 728.4Z","bbox":{"x":464.6,"y":682.4,"w":62.5,"h":51.9},"cx":495.8,"cy":708.4,"label":{"x":498.1,"y":716.8,"anchor":"middle"}},
  {"id":"penalolen","nombre":"Peñalolén","nombreCorto":"Peñalolén","d":"M508.4 778.8 L559.3 781.8 L604.2 763.2 L668.9 756.1 L667.5 749.1 L617.1 717.7 L527.2 714.3 L527.1 714.3 L522.8 726.6 L522.3 728.5 L508.4 778.8Z","bbox":{"x":508.4,"y":714.3,"w":160.5,"h":67.5},"cx":588.6,"cy":748,"label":{"x":576.4,"y":749.8,"anchor":"middle"}},
  {"id":"lo-prado","nombre":"Lo Prado","nombreCorto":"Lo Prado","d":"M362.1 709.7 L378.6 713.5 L386.4 711.9 L385.7 705.9 L384.8 701.4 L384.8 701.4 L369.7 686 L352.5 685.7 L349.3 685.7 L359 709 L362.1 709.7Z","bbox":{"x":349.3,"y":685.7,"w":37.2,"h":27.8},"cx":367.8,"cy":699.6,"label":{"x":367.8,"y":699.6,"anchor":"middle","lineas":["Lo","Prado"]}},
  {"id":"estacion-central","nombre":"Estación Central","nombreCorto":"Est. Central","d":"M412.4 738.8 L412.6 736.3 L421.8 736.4 L414.4 727.4 L415.7 704.1 L413.9 695.2 L400.9 695.9 L400.9 696.2 L385.7 701.3 L384.8 701.4 L385.7 705.9 L386.4 711.9 L378.6 713.5 L362.1 709.7 L359.3 709.1 L359.2 725.8 L356.6 727.6 L368.4 732.3 L368.7 732.4 L371.1 734.3 L379.8 744.1 L407.4 738.3 L407.4 738.4 L412.2 738.8 L412.4 738.8Z","bbox":{"x":356.6,"y":695.2,"w":65.2,"h":48.9},"cx":389.2,"cy":719.7,"label":{"x":392.2,"y":722.7,"anchor":"middle","lineas":["Est.","Central"]}},
  {"id":"pa-c","nombre":"Pedro Aguirre Cerda","nombreCorto":"P.A.C.","d":"M422.7 779.5 L423.6 777.2 L439.7 736.6 L422.2 738.8 L412.2 738.8 L407.4 738.4 L407.6 739 L397.2 769 L416.9 776.5 L422.7 779.5Z","bbox":{"x":397.2,"y":736.6,"w":42.6,"h":42.9},"cx":418.4,"cy":758,"label":{"x":417.6,"y":759.7,"anchor":"middle"}},
  {"id":"san-miguel","nombre":"San Miguel","nombreCorto":"San Miguel","d":"M459.2 789.6 L459.2 789.6 L458.6 782.5 L457.1 775.2 L455.8 760.1 L453.8 741.9 L453.6 736.8 L453.4 736.8 L439.7 736.6 L423.6 777.2 L422.7 779.5 L436.6 784.5 L450.7 787.9 L459.2 789.6Z","bbox":{"x":422.7,"y":736.6,"w":36.6,"h":53},"cx":440.9,"cy":763.1,"label":{"x":440.9,"y":763.1,"anchor":"middle","lineas":["San","Miguel"]}},
  {"id":"san-joaquin","nombre":"San Joaquín","nombreCorto":"San Joaquín","d":"M473.1 732.4 L472 728.1 L471.9 728.1 L468.4 731.1 L453.7 736.8 L453.6 736.8 L453.8 741.9 L455.8 760.1 L457.1 775.2 L458.6 782.5 L459.2 789.6 L459.7 789.5 L485.9 782.4 L485.9 781.9 L483.5 776.6 L483.3 776.4 L473.6 734.7 L473.1 732.4Z","bbox":{"x":453.6,"y":728.1,"w":32.4,"h":61.5},"cx":469.8,"cy":758.8,"label":{"x":467.7,"y":750.6,"anchor":"middle","lineas":["San","Joaquín"],"rot":true,"rx":467.7,"ry":752.9}},
  {"id":"macul","nombre":"Macul","nombreCorto":"Macul","d":"M522.3 728.5 L522.3 728.4 L510.7 733.7 L499.1 732.8 L473.6 734.3 L473.6 734.7 L483.3 776.4 L483.4 776.5 L486.6 776.6 L506.3 778.4 L508.4 778.8 L522.3 728.5Z","bbox":{"x":473.6,"y":728.4,"w":48.7,"h":50.4},"cx":497.9,"cy":753.6,"label":{"x":500,"y":759.2,"anchor":"middle"}},
  {"id":"maipu","nombre":"Maipú","nombreCorto":"Maipú","d":"M356 728.1 L280 716.7 L234.5 740.6 L186.6 738.8 L158.7 751.2 L170.9 778 L206 806.1 L267.1 814.1 L302 851 L321.2 856.8 L367.1 792.2 L350 778.7 L359.1 744.2 L366.3 744.1 L367.3 741.3 L368.7 732.4 L368.4 732.3 L356.6 727.6 L356 728.1Z","bbox":{"x":158.7,"y":716.7,"w":210,"h":140},"cx":263.7,"cy":786.7,"label":{"x":277.1,"y":780.1,"anchor":"middle"}},
  {"id":"cerrillos","nombre":"Cerrillos","nombreCorto":"Cerrillos","d":"M407.4 738.3 L379.8 744.1 L371.1 734.3 L368.7 732.4 L368.7 732.4 L367.3 741.3 L366.3 744.1 L359.1 744.2 L350 778.7 L367.1 792.2 L385.7 798 L397.2 769 L407.6 739 L407.4 738.3Z","bbox":{"x":350,"y":732.4,"w":57.5,"h":65.6},"cx":378.8,"cy":765.2,"label":{"x":378.8,"y":765.2,"anchor":"middle"}},
  {"id":"lo-espejo","nombre":"Lo Espejo","nombreCorto":"Lo Espejo","d":"M422.7 779.5 L416.9 776.5 L397.2 769 L385.7 798 L410.5 808.2 L422.6 779.7 L422.7 779.5Z","bbox":{"x":385.7,"y":769,"w":36.9,"h":39.1},"cx":404.2,"cy":788.6,"label":{"x":404.1,"y":786.2,"anchor":"middle","lineas":["Lo","Espejo"]}},
  {"id":"san-ramon","nombre":"San Ramón","nombreCorto":"San Ramón","d":"M459.2 789.6 L450.7 787.9 L442.1 826 L465.1 839.2 L459.2 789.6Z","bbox":{"x":442.1,"y":787.9,"w":23,"h":51.3},"cx":453.6,"cy":813.5,"label":{"x":454.3,"y":811.9,"anchor":"middle","lineas":["San","Ramón"],"rot":true,"rx":454.3,"ry":814.2}},
  {"id":"la-granja","nombre":"La Granja","nombreCorto":"La Granja","d":"M459.2 789.6 L465.1 839.2 L484.9 836.1 L486.2 785.1 L485.9 782.4 L459.7 789.5 L459.2 789.6Z","bbox":{"x":459.2,"y":782.4,"w":27,"h":56.8},"cx":472.7,"cy":810.8,"label":{"x":473.6,"y":814.2,"anchor":"middle","rot":true,"rx":473.6,"ry":810.5}},
  {"id":"la-florida","nombre":"La Florida","nombreCorto":"La Florida","d":"M668.9 756.1 L604.2 763.2 L559.3 781.8 L508.4 778.8 L506.3 778.4 L486.6 776.6 L483.4 776.5 L483.5 776.6 L485.9 781.9 L486.2 785.1 L484.9 836.1 L485.9 855 L542.8 842.7 L580.6 820.1 L616.5 820.8 L668.9 756.1Z","bbox":{"x":483.4,"y":756.1,"w":185.4,"h":98.9},"cx":576.1,"cy":805.5,"label":{"x":561,"y":806.2,"anchor":"middle"}},
  {"id":"la-cisterna","nombre":"La Cisterna","nombreCorto":"La Cisterna","d":"M442.1 826 L450.7 787.9 L436.6 784.5 L422.7 779.5 L422.6 779.7 L410.5 808.2 L442.1 826Z","bbox":{"x":410.5,"y":779.5,"w":40.2,"h":46.6},"cx":430.6,"cy":802.7,"label":{"x":430.6,"y":802.7,"anchor":"middle","lineas":["La","Cisterna"]}},
]

const puntosBase = COMUNAS_BASE.map((comuna) => parsearTrazo(comuna.d))

// Centro y factor de escala de cada comuna (relación de área, acotada).
const centros = puntosBase.map((puntos) => {
  const bbox = bboxDe(puntos)
  return { x: bbox.x + bbox.w / 2, y: bbox.y + bbox.h / 2 }
})
const escalas = puntosBase.map((puntos) =>
  Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, Math.pow(AREA_REF / areaDe(puntos), AREA_EXP))),
)

// Vértices compartidos en una misma posición: cada punto se agrupa con los de
// cualquier comuna que caiga dentro de EPS_SOLDADURA, de modo que al escalar
// las comunas el mapa siga siendo continuo (sin grietas ni traslapes).
interface Ocurrencia {
  comuna: number
  indice: number
}

const ocurrencias: Ocurrencia[] = []
puntosBase.forEach((puntos, comuna) => {
  puntos.forEach((_, indice) => ocurrencias.push({ comuna, indice }))
})

const padre = ocurrencias.map((_, i) => i)
function raizDe(i: number): number {
  let raiz = i
  while (padre[raiz]! !== raiz) raiz = padre[raiz]!
  while (padre[i]! !== raiz) {
    const siguiente = padre[i]!
    padre[i] = raiz
    i = siguiente
  }
  return raiz
}

function puntoDe(i: number): Punto {
  const ocurrencia = ocurrencias[i]!
  return puntosBase[ocurrencia.comuna]![ocurrencia.indice]!
}

function distancia(a: number, b: number): number {
  const pa = puntoDe(a)
  const pb = puntoDe(b)
  return Math.hypot(pa.x - pb.x, pa.y - pb.y)
}

function soldar(a: number, b: number): void {
  padre[raizDe(a)] = raizDe(b)
}

// 1. Duplicados exactos dentro de una comuna (el trazo cierra repitiendo el punto inicial).
for (let i = 0; i < ocurrencias.length; i++) {
  for (let j = i + 1; j < ocurrencias.length; j++) {
    if (ocurrencias[i]!.comuna === ocurrencias[j]!.comuna && distancia(i, j) <= 0.05) {
      soldar(i, j)
    }
  }
}

// 2. Emparejamiento codicioso entre comunas: se parte del par más cercano y cada
//    grupo puede soldarse una sola vez con cada comuna vecina. Así los vértices
//    que corresponden a una esquina compartida se unen, sin encadenar esquinas
//    distintas de un mismo borde.
interface Candidato {
  i: number
  j: number
  d: number
}

const candidatos: Candidato[] = []
for (let i = 0; i < ocurrencias.length; i++) {
  for (let j = i + 1; j < ocurrencias.length; j++) {
    if (ocurrencias[i]!.comuna === ocurrencias[j]!.comuna) continue
    const d = distancia(i, j)
    if (d <= EPS_SOLDADURA) candidatos.push({ i, j, d })
  }
}
candidatos.sort((a, b) => a.d - b.d)

const usados = new Set<string>()
for (const { i, j } of candidatos) {
  const ci = ocurrencias[i]!.comuna
  const cj = ocurrencias[j]!.comuna
  const clave = ci < cj ? `${ci}:${cj}#` : `${cj}:${ci}#`
  const ri = raizDe(i)
  const rj = raizDe(j)
  if (ri === rj) continue
  if (usados.has(clave + ri) || usados.has(clave + rj)) continue
  usados.add(clave + ri)
  usados.add(clave + rj)
  soldar(i, j)
}

// 3. Segunda pasada para los pares que el emparejamiento dejó sueltos.
for (let i = 0; i < ocurrencias.length; i++) {
  for (let j = i + 1; j < ocurrencias.length; j++) {
    if (ocurrencias[i]!.comuna === ocurrencias[j]!.comuna) continue
    if (distancia(i, j) <= EPS_SOLDADURA_FINA) soldar(i, j)
  }
}

const indiceDeGrupo = new Map<number, number>()
const grupos: number[][] = []
ocurrencias.forEach((_, i) => {
  const raiz = raizDe(i)
  let indice = indiceDeGrupo.get(raiz)
  if (indice === undefined) {
    indice = grupos.length
    indiceDeGrupo.set(raiz, indice)
    grupos.push([])
  }
  grupos[indice]!.push(i)
})

// 4. Relajación elástica. Los vértices compartidos tiran de cada comuna hacia el
//    promedio de las formas reescaladas (el mapa queda sin grietas), y cada comuna
//    se traslada para repartir ese error. Su anclaje crece con el área: las
//    comunas grandes ceden espacio y las chicas conservan su tamaño relativo.
const areas = puntosBase.map(areaDe)
const anclajes = areas.map((area) => RIGIDEZ * Math.pow(area / AREA_REF, RIGIDEZ_EXP))
const objetivo: Punto[] = ocurrencias.map(({ comuna, indice }) => {
  const base = puntosBase[comuna]![indice]!
  const centro = centros[comuna]!
  const escala = escalas[comuna]!
  return { x: centro.x + escala * (base.x - centro.x), y: centro.y + escala * (base.y - centro.y) }
})
const grupoDe = new Int32Array(ocurrencias.length)
for (let g = 0; g < grupos.length; g++) for (const i of grupos[g]!) grupoDe[i] = g

const mediosX = new Float64Array(grupos.length)
const mediosY = new Float64Array(grupos.length)
const sumaX = new Float64Array(COMUNAS_BASE.length)
const sumaY = new Float64Array(COMUNAS_BASE.length)
const cuentaComuna = new Int32Array(COMUNAS_BASE.length)
for (const { comuna } of ocurrencias) cuentaComuna[comuna]!++

const traslados = centros.map(() => ({ x: 0, y: 0 }))
for (let iteracion = 0; iteracion < RELAJACION_ITERACIONES; iteracion++) {
  mediosX.fill(0)
  mediosY.fill(0)
  for (let i = 0; i < objetivo.length; i++) {
    const comuna = ocurrencias[i]!.comuna
    const g = grupoDe[i]!
    mediosX[g]! += objetivo[i]!.x + traslados[comuna]!.x
    mediosY[g]! += objetivo[i]!.y + traslados[comuna]!.y
  }
  for (let g = 0; g < grupos.length; g++) {
    mediosX[g]! /= grupos[g]!.length
    mediosY[g]! /= grupos[g]!.length
  }
  sumaX.fill(0)
  sumaY.fill(0)
  for (let i = 0; i < objetivo.length; i++) {
    const comuna = ocurrencias[i]!.comuna
    const g = grupoDe[i]!
    sumaX[comuna]! += mediosX[g]! - (objetivo[i]!.x + traslados[comuna]!.x)
    sumaY[comuna]! += mediosY[g]! - (objetivo[i]!.y + traslados[comuna]!.y)
  }
  for (let comuna = 0; comuna < COMUNAS_BASE.length; comuna++) {
    const cuenta = cuentaComuna[comuna]!
    if (!cuenta) continue
    const amortiguacion = (1 - anclajes[comuna]!) * (PASO_RELAJACION / cuenta)
    const traslado = traslados[comuna]!
    traslado.x += sumaX[comuna]! * amortiguacion
    traslado.y += sumaY[comuna]! * amortiguacion
  }
}

const puntosNuevos: Punto[][] = puntosBase.map((puntos) => puntos.map(() => ({ x: 0, y: 0 })))
mediosX.fill(0)
mediosY.fill(0)
for (let i = 0; i < objetivo.length; i++) {
  const comuna = ocurrencias[i]!.comuna
  const g = grupoDe[i]!
  mediosX[g]! += objetivo[i]!.x + traslados[comuna]!.x
  mediosY[g]! += objetivo[i]!.y + traslados[comuna]!.y
}
for (let g = 0; g < grupos.length; g++) {
  mediosX[g]! /= grupos[g]!.length
  mediosY[g]! /= grupos[g]!.length
}
for (let i = 0; i < objetivo.length; i++) {
  const { comuna, indice } = ocurrencias[i]!
  const g = grupoDe[i]!
  puntosNuevos[comuna]![indice] = { x: mediosX[g]!, y: mediosY[g]! }
}

// Se reencuadra todo el mapa dentro del viewBox (con más aire a los lados que
// arriba/abajo, para que el recuadro sea panorámico) y se ensancha en horizontal.
const cajaContenido = bboxDe(puntosNuevos.flat())
const desplazamiento = { x: PAD_LATERAL - cajaContenido.x, y: PAD - cajaContenido.y }
function desplazar(punto: Punto): Punto {
  const x = punto.x + desplazamiento.x
  return { x: PAD_LATERAL + (x - PAD_LATERAL) * ESTIRAMIENTO, y: punto.y + desplazamiento.y }
}

/* ------------------------------------------------------------------ *
 * Centro del nombre de cada zona.
 *
 * El centro del rectángulo envolvente suele caer pegado al borde con otra
 * zona (caso de Cordillera y Pacífico). Acá se busca la posición donde la
 * caja del texto queda con más aire dentro de la propia zona, lejos de los
 * bordes con las zonas vecinas y del borde del mapa.
 * ------------------------------------------------------------------ */
const FUENTE_ZONA = 36 // tamaño del nombre de zona en la vista general (unidades del viewBox)
const TRACKING_ZONA = 0.32 // letter-spacing de los nombres de zona (em)

interface Caja {
  x: number
  y: number
  w: number
  h: number
}

interface PoligonoCercano {
  puntos: Punto[]
  caja: Caja
}

function anchoNombreDeZona(nombre: string): number {
  let em = 0
  for (const caracter of nombre.toUpperCase()) em += ANCHO_CARACTER[caracter] ?? 0.7
  return em * FUENTE_ZONA + nombre.length * (TRACKING_ZONA - 0.07) * FUENTE_ZONA
}

function contienePunto(puntos: Punto[], x: number, y: number): boolean {
  let dentro = false
  for (let i = 0; i < puntos.length; i++) {
    const a = puntos[i]!
    const b = puntos[(i + 1) % puntos.length]!
    if (a.y > y !== b.y > y) {
      const cruce = a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y)
      if (cruce > x) dentro = !dentro
    }
  }
  return dentro
}

function puntajeDeCajaDeZona(
  propias: Punto[][],
  ajenas: PoligonoCercano[],
  marco: Caja,
  cx: number,
  cy: number,
  ancho: number,
  alto: number,
): number {
  let dentro = 0
  let aire = Infinity
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      const x = cx + ((i - 1) * ancho) / 2
      const y = cy + ((j - 1) * alto) / 2
      if (!propias.some((poligono) => contienePunto(poligono, x, y))) continue
      dentro++
      let distancia = Math.min(
        x - marco.x,
        marco.x + marco.w - x,
        y - marco.y,
        marco.y + marco.h - y,
      )
      for (const ajena of ajenas) {
        const dx = Math.max(ajena.caja.x - x, 0, x - (ajena.caja.x + ajena.caja.w))
        const dy = Math.max(ajena.caja.y - y, 0, y - (ajena.caja.y + ajena.caja.h))
        if (dx * dx + dy * dy >= distancia * distancia) continue
        distancia = Math.min(distancia, Math.abs(distanciaAlBorde(ajena.puntos, x, y)))
      }
      aire = Math.min(aire, distancia)
    }
  }
  return dentro === 0 ? -1 : dentro * 1000 + aire
}

function centroDeZona(propias: Punto[][], ajenas: PoligonoCercano[], nombre: string): Punto {
  const ancho = anchoNombreDeZona(nombre)
  const alto = FUENTE_ZONA * 1.2
  const caja = bboxDe(propias.flat())
  const marco: Caja = {
    x: PAD_LATERAL,
    y: PAD,
    w: cajaContenido.w * ESTIRAMIENTO,
    h: cajaContenido.h,
  }
  let mejor: Punto = { x: caja.x + caja.w / 2, y: caja.y + caja.h / 2 }
  let mejorPuntaje = puntajeDeCajaDeZona(propias, ajenas, marco, mejor.x, mejor.y, ancho, alto)
  let paso = Math.max(12, Math.min(caja.w, caja.h) / 6)

  // Barrido grueso y refinamiento alrededor del mejor candidato.
  for (let nivel = 0; nivel < 3; nivel++) {
    const x0 = nivel === 0 ? caja.x : mejor.x - 2 * paso
    const y0 = nivel === 0 ? caja.y : mejor.y - 2 * paso
    const x1 = nivel === 0 ? caja.x + caja.w : mejor.x + 2 * paso
    const y1 = nivel === 0 ? caja.y + caja.h : mejor.y + 2 * paso
    for (let y = y0; y <= y1; y += paso) {
      for (let x = x0; x <= x1; x += paso) {
        const puntaje = puntajeDeCajaDeZona(propias, ajenas, marco, x, y, ancho, alto)
        if (puntaje > mejorPuntaje) {
          mejorPuntaje = puntaje
          mejor = { x, y }
        }
      }
    }
    paso /= 4
  }
  return mejor
}

const poligonosFinales = puntosNuevos.map((puntos) => puntos.map(desplazar))
const cajasFinales = poligonosFinales.map(bboxDe)

export const COMUNAS_SVG: ComunaSvg[] = COMUNAS_BASE.map((comuna, i) => {
  const centro = centros[i]!
  const escala = escalas[i]!
  const traslado = traslados[i]!
  const transformar = (punto: Punto) =>
    desplazar({
      x: centro.x + escala * (punto.x - centro.x) + traslado.x,
      y: centro.y + escala * (punto.y - centro.y) + traslado.y,
    })

  const puntos = poligonosFinales[i]!
  const bbox = cajasFinales[i]!
  const rot = comuna.label.rot === true
  const ancla = transformar({ x: comuna.label.x, y: comuna.label.y })
  const colocacion = colocarEtiqueta(comuna, puntos, rot, ancla)
  const caja = cajaDeEtiqueta(comuna, colocacion.fontSize)
  const anclaFinal = rot
    ? { x: colocacion.centro.x - caja.dy, y: colocacion.centro.y }
    : { x: colocacion.centro.x, y: colocacion.centro.y - caja.dy }

  return {
    ...comuna,
    d: serializarTrazo(puntos),
    bbox,
    cx: bbox.x + bbox.w / 2,
    cy: bbox.y + bbox.h / 2,
    label: {
      ...comuna.label,
      x: Number(anclaFinal.x.toFixed(1)),
      y: Number(anclaFinal.y.toFixed(1)),
      rx: rot ? Number(anclaFinal.x.toFixed(1)) : undefined,
      ry: rot ? Number(anclaFinal.y.toFixed(1)) : undefined,
      fontSize: colocacion.fontSize,
    },
  }
})

// `cx`/`cy` es dónde va el nombre de la zona (centrado en su territorio), no el
// centro del rectángulo envolvente; `bbox` sí es el envolvente, que se usa para
// el zoom de la zona.
const INDICE_POR_ID = new Map(COMUNAS_BASE.map((comuna, i) => [comuna.id, i]))

export const ZONAS_SVG: ZonaSvg[] = ZONAS_CONCESION.map((zona) => {
  const indices = zona.comunas.map((id) => INDICE_POR_ID.get(id)!)
  const propias = indices.map((i) => poligonosFinales[i]!)
  const ajenas = poligonosFinales
    .map((puntos, i) => ({ puntos, caja: cajasFinales[i]! }))
    .filter((_, i) => !indices.includes(i))
  const bbox = bboxDe(propias.flat())
  const centro = centroDeZona(propias, ajenas, zona.nombre)
  return {
    id: zona.id,
    bbox,
    cx: centro.x,
    cy: centro.y,
  }
})

export const VIEWBOX = {
  w: cajaContenido.w * ESTIRAMIENTO + 2 * PAD_LATERAL,
  h: cajaContenido.h + 2 * PAD,
}
