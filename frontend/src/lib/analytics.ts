/**
 * Recoleccion de KPIs del portal.
 *
 * - Una visita equivale a una sesion: se cierra a los 30 minutos sin actividad.
 * - El identificador de navegador permite contar dispositivos unicos sin login.
 * - Los eventos se agrupan en lotes y se envian al backend propio del portal.
 */

export type EventoKpi = {
  nombre: string
  seccion: string
  recurso: string
  valor?: number
  datos: Record<string, unknown>
  ocurrido_en: string
}

type EstadoSesion = {
  id: string
  iniciadaEn: number
  ultimaActividad: number
  entrada: string
  vistas: string[]
  duracionActiva: number
  completo: boolean
  opinionEnviada: boolean
  opinionDescartada: boolean
}

const CLAVE_PID = 'enel.kpi.pid'
const CLAVE_SESION = 'enel.kpi.sesion'
const CLAVE_IDENTIDAD = 'enel.kpi.identidad'

const VENTANA_SESION_MS = 30 * 60 * 1000
const LATIDO_MS = 5_000
const INACTIVIDAD_MS = 60_000
const ENVIO_MS = 10_000
const MAX_COLA = 500

let iniciada = false
let paginaRegistrada = false
let cola: EventoKpi[] = []
let sesionActiva: EstadoSesion | null = null
let temporizadorEnvio: number | null = null
let intervaloLatido: number | null = null
let intervaloEnvio: number | null = null
let seccionActual = 'portada'
let totalSecciones = 11
let ultimaInteraccion = Date.now()
let ultimoLatido = Date.now()

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (caracter) => {
    const aleatorio = (Math.random() * 16) | 0
    const valor = caracter === 'x' ? aleatorio : (aleatorio & 0x3) | 0x8
    return valor.toString(16)
  })
}

function leer(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave)
  } catch {
    return null
  }
}

function escribir(clave: string, valor: string) {
  try {
    window.localStorage.setItem(clave, valor)
  } catch {
    // El navegador puede bloquear el almacenamiento; la medicion sigue en memoria.
  }
}

function borrar(clave: string) {
  try {
    window.localStorage.removeItem(clave)
  } catch {
    // Sin almacenamiento disponible no hay nada que borrar.
  }
}

export function identificadorAnonimo(): string {
  const existente = leer(CLAVE_PID)
  if (existente) return existente
  const nuevo = uuid()
  escribir(CLAVE_PID, nuevo)
  return nuevo
}

function leerSesion(): EstadoSesion | null {
  const crudo = leer(CLAVE_SESION)
  if (!crudo) return null
  try {
    const sesion = JSON.parse(crudo) as EstadoSesion
    if (!sesion.id || !sesion.iniciadaEn) return null
    return {
      ...sesion,
      opinionEnviada: Boolean(sesion.opinionEnviada),
      opinionDescartada: Boolean(sesion.opinionDescartada),
    }
  } catch {
    return null
  }
}

function nuevaSesion(): EstadoSesion {
  const sesion: EstadoSesion = {
    id: uuid(),
    iniciadaEn: Date.now(),
    ultimaActividad: Date.now(),
    entrada: seccionActual,
    vistas: [],
    duracionActiva: 0,
    completo: false,
    opinionEnviada: false,
    opinionDescartada: false,
  }
  escribir(CLAVE_SESION, JSON.stringify(sesion))
  return sesion
}

function sesionVigente(): EstadoSesion {
  const ahora = Date.now()
  if (sesionActiva && ahora - sesionActiva.ultimaActividad <= VENTANA_SESION_MS) {
    return sesionActiva
  }
  if (sesionActiva && cola.length) void enviarConSesion(sesionActiva, true)
  const guardada = leerSesion()
  if (guardada && ahora - guardada.ultimaActividad <= VENTANA_SESION_MS) {
    sesionActiva = guardada
    return guardada
  }
  sesionActiva = nuevaSesion()
  return sesionActiva
}

function guardarSesion(sesion: EstadoSesion) {
  escribir(CLAVE_SESION, JSON.stringify(sesion))
}

function dispositivo(): 'ESCRITORIO' | 'MOVIL' | 'TABLET' {
  if (typeof window === 'undefined') return 'ESCRITORIO'
  const angosto = window.matchMedia('(max-width: 767px)').matches
  const tactil = window.matchMedia('(pointer: coarse)').matches
  if (angosto && tactil) return 'MOVIL'
  if (tactil) return 'TABLET'
  return 'ESCRITORIO'
}

function campana(): string {
  const parametros = new URLSearchParams(window.location.search)
  return (
    parametros.get('utm_campaign') ??
    parametros.get('utm_source') ??
    parametros.get('origen') ??
    ''
  ).slice(0, 120)
}

function identidad(): { email: string; visitante_id?: string } | null {
  const crudo = leer(CLAVE_IDENTIDAD)
  if (!crudo) return null
  try {
    const datos = JSON.parse(crudo) as { email?: string; visitante_id?: string }
    if (!datos.email) return null
    return { email: datos.email, visitante_id: datos.visitante_id }
  } catch {
    return null
  }
}

function programarEnvio() {
  if (temporizadorEnvio !== null) return
  temporizadorEnvio = window.setTimeout(() => {
    temporizadorEnvio = null
    void enviar(false)
  }, ENVIO_MS)
}

function armarCarga(sesion: EstadoSesion): Record<string, unknown> {
  acumularTramoActivo(sesion)
  const actual = identidad()
  return {
    anonymous_id: identificadorAnonimo(),
    visitante_id: actual?.visitante_id,
    sesion: {
      id: sesion.id,
      iniciada_en: new Date(sesion.iniciadaEn).toISOString(),
      entrada: sesion.entrada,
      dispositivo: dispositivo(),
      referrer: document.referrer.slice(0, 255),
      campana: campana(),
      duracion_activa: sesion.duracionActiva,
      profundidad: Math.min(1, sesion.vistas.length / totalSecciones),
      secciones_vistas: sesion.vistas.length,
      completo: sesion.completo,
    },
    identificacion: actual ? { email: actual.email } : undefined,
    eventos: [...cola],
  }
}

let ultimaDuracionEnviada = 0

async function enviarConSesion(sesion: EstadoSesion, usarBeacon: boolean, forzar = false) {
  acumularTramoActivo(sesion)
  const duracionCambio = sesion.duracionActiva !== ultimaDuracionEnviada
  if (!cola.length && !forzar && !duracionCambio) return

  const carga = armarCarga(sesion)
  cola = []
  ultimaDuracionEnviada = sesion.duracionActiva

  if (usarBeacon && typeof navigator.sendBeacon === 'function') {
    const cuerpo = new Blob([JSON.stringify(carga)], { type: 'application/json' })
    const enviado = navigator.sendBeacon('/api/analytics/eventos/', cuerpo)
    if (!enviado) cola = (carga.eventos as EventoKpi[]).concat(cola).slice(-MAX_COLA)
    return
  }

  try {
    const respuesta = await fetch('/api/analytics/eventos/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(carga),
      keepalive: true,
    })
    if (!respuesta.ok) throw new Error('envio fallido')
  } catch {
    cola = (carga.eventos as EventoKpi[]).concat(cola).slice(-MAX_COLA)
  }
}

async function enviar(usarBeacon: boolean, forzar = false) {
  await enviarConSesion(sesionActiva ?? sesionVigente(), usarBeacon, forzar)
}

export function registrar(
  nombre: string,
  opciones: {
    seccion?: string
    recurso?: string
    valor?: number
    datos?: Record<string, unknown>
  } = {},
) {
  // Antes de identificarse no se mide nada: el recorrido aun no comenzo.
  if (!iniciada) return
  sesionVigente()
  cola.push({
    nombre,
    seccion: opciones.seccion ?? seccionActual,
    recurso: opciones.recurso ?? '',
    valor: opciones.valor,
    datos: opciones.datos ?? {},
    ocurrido_en: new Date().toISOString(),
  })
  if (cola.length > MAX_COLA) cola = cola.slice(-MAX_COLA)
  programarEnvio()
}

/** Claves que el portal usa para nombrar el recurso que se abrió. */
const CLAVES_RECURSO = ['recurso', 'herramienta', 'politica', 'instalacion', 'area', 'subgerencia']

function recursoDe(extra: Record<string, unknown>): string {
  for (const clave of CLAVES_RECURSO) {
    const valor = extra[clave]
    if (typeof valor === 'string' && valor.trim()) return valor.slice(0, 160)
  }
  return ''
}

/** Compatibilidad con los llamados existentes del portal. */
export function track(evento: string, datos?: unknown) {
  const extra = (datos ?? {}) as Record<string, unknown>
  const valor = typeof extra.valor === 'number' ? extra.valor : undefined
  const paso = typeof extra.paso === 'string' ? extra.paso : null
  const esNavegacion = evento.startsWith('nav.') || evento.startsWith('indice.')
  const seccion =
    typeof extra.seccion === 'string'
      ? extra.seccion
      : esNavegacion && paso
        ? paso
        : seccionActual
  registrar(evento, { seccion, recurso: recursoDe(extra), valor, datos: extra })
}

export function configurarSecciones(total: number) {
  if (total > 0) totalSecciones = total
}

export function establecerSeccion(id: string) {
  seccionActual = id
}

export function seccionVista(id: string) {
  const sesion = sesionVigente()
  if (sesion.vistas.includes(id)) return
  sesion.vistas.push(id)
  sesion.ultimaActividad = Date.now()
  guardarSesion(sesion)
  registrar('seccion.ver', { seccion: id, datos: { orden: sesion.vistas.length } })
}

export function cerrarSeccion(id: string, milisegundos: number) {
  if (!id || milisegundos < 1000) return
  registrar('seccion.tiempo', {
    seccion: id,
    valor: Math.round(milisegundos / 1000),
  })
}

/** Completitud con guardarrail: llegar al cierre sin recorrer no cuenta. */
export function marcarCompletado() {
  const sesion = sesionVigente()
  const profundidad = sesion.vistas.length / totalSecciones
  if (sesion.completo || profundidad < 0.6) return
  acumularTramoActivo(sesion)
  sesion.completo = true
  guardarSesion(sesion)
  registrar('sesion.completa', {
    seccion: 'cierre',
    valor: sesion.duracionActiva,
    datos: { profundidad: Number(profundidad.toFixed(2)) },
  })
  void enviar(false)
}

export function paginaVista() {
  if (paginaRegistrada) return
  paginaRegistrada = true
  registrar('pagina.vista', {
    datos: {
      ruta: window.location.pathname,
      referencia: document.referrer.slice(0, 255),
      campana: campana(),
      dispositivo: dispositivo(),
    },
  })
}

export async function identificar(email: string): Promise<boolean> {
  const limpio = email.trim().toLowerCase()
  if (!limpio) return false
  try {
    const respuesta = await fetch('/api/analytics/identificar/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymous_id: identificadorAnonimo(),
        email: limpio,
        visitante_id: identidad()?.visitante_id,
      }),
    })
    if (!respuesta.ok) return false
    const datos = (await respuesta.json()) as { visitante_id?: string }
    escribir(
      CLAVE_IDENTIDAD,
      JSON.stringify({ email: limpio, visitante_id: datos.visitante_id }),
    )
    return true
  } catch {
    return false
  }
}

export function identidadGuardada(): string | null {
  return identidad()?.email ?? null
}

/** Guarda la identidad que devuelve el backend al iniciar sesion. */
export function vincularIdentidad(email: string, visitanteId: string) {
  if (!email || !visitanteId) return
  escribir(
    CLAVE_IDENTIDAD,
    JSON.stringify({ email: email.trim().toLowerCase(), visitante_id: visitanteId }),
  )
}

/** Borra la identidad y la visita activa (al cerrar sesion). */
export function olvidarIdentidad() {
  borrar(CLAVE_IDENTIDAD)
  borrar(CLAVE_SESION)
}

export async function opinar(puntaje: number, comentario: string): Promise<boolean> {
  const sesion = sesionVigente()
  const actual = identidad()
  // Asegura que la visita exista en el servidor antes de asociarle la opinion.
  await enviarConSesion(sesion, false, true)
  try {
    const respuesta = await fetch('/api/analytics/opiniones/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        anonymous_id: identificadorAnonimo(),
        visitante_id: actual?.visitante_id,
        sesion_id: sesion.id,
        puntaje,
        comentario,
        seccion: 'cierre',
      }),
    })
    if (!respuesta.ok) return false
    sesion.opinionEnviada = true
    guardarSesion(sesion)
    return true
  } catch {
    return false
  }
}

export type EstadoOpinion = 'pendiente' | 'enviada' | 'descartada'

/** La encuesta se pide una vez por visita, no una vez por navegador. */
export function estadoOpinion(): EstadoOpinion {
  const sesion = sesionVigente()
  if (sesion.opinionEnviada) return 'enviada'
  if (sesion.opinionDescartada) return 'descartada'
  return 'pendiente'
}

export function marcarOpinionDescartada() {
  const sesion = sesionVigente()
  sesion.opinionDescartada = true
  guardarSesion(sesion)
}

function latido() {
  if (document.visibilityState !== 'visible') {
    ultimoLatido = Date.now()
    return
  }
  const sesion = sesionVigente()
  const ahora = Date.now()
  if (ahora - ultimaInteraccion <= INACTIVIDAD_MS) {
    sesion.duracionActiva += Math.round(
      Math.min((ahora - ultimoLatido) / 1000, INACTIVIDAD_MS / 1000),
    )
    sesion.ultimaActividad = ahora
    guardarSesion(sesion)
  }
  ultimoLatido = ahora
}

/** Suma el tramo activo pendiente antes de enviar el resumen de la visita. */
function acumularTramoActivo(sesion: EstadoSesion) {
  const ahora = Date.now()
  const activo =
    document.visibilityState === 'visible' && ahora - ultimaInteraccion <= INACTIVIDAD_MS
  if (activo) {
    const delta = Math.min((ahora - ultimoLatido) / 1000, INACTIVIDAD_MS / 1000)
    if (delta >= 1) {
      sesion.duracionActiva += Math.round(delta)
      sesion.ultimaActividad = ahora
      guardarSesion(sesion)
    }
  }
  ultimoLatido = ahora
}

function marcarInteraccion() {
  ultimaInteraccion = Date.now()
}

function alCambiarVisibilidad() {
  if (document.visibilityState === 'hidden') void enviar(true, true)
}

function alSalirDePagina() {
  void enviar(true, true)
}

export function iniciarAnalitica() {
  if (iniciada || typeof window === 'undefined') return
  iniciada = true

  const sesion = sesionVigente()
  seccionActual = sesion.entrada || 'portada'

  window.addEventListener('pointerdown', marcarInteraccion, { passive: true })
  window.addEventListener('keydown', marcarInteraccion)
  window.addEventListener('scroll', marcarInteraccion, { passive: true })

  intervaloLatido = window.setInterval(latido, LATIDO_MS)
  intervaloEnvio = window.setInterval(() => void enviar(false), ENVIO_MS)

  document.addEventListener('visibilitychange', alCambiarVisibilidad)
  window.addEventListener('pagehide', alSalirDePagina)
}

/**
 * Detiene la medicion al salir del portal.
 *
 * Sin esto, el latido seguiria corriendo mientras el equipo de Quality usa el
 * CMS y contaminaria las metricas de adopcion.
 */
export function detenerAnalitica() {
  if (!iniciada || typeof window === 'undefined') return
  void enviar(true, true)

  if (intervaloLatido !== null) window.clearInterval(intervaloLatido)
  if (intervaloEnvio !== null) window.clearInterval(intervaloEnvio)
  if (temporizadorEnvio !== null) window.clearTimeout(temporizadorEnvio)
  intervaloLatido = null
  intervaloEnvio = null
  temporizadorEnvio = null

  window.removeEventListener('pointerdown', marcarInteraccion)
  window.removeEventListener('keydown', marcarInteraccion)
  window.removeEventListener('scroll', marcarInteraccion)
  document.removeEventListener('visibilitychange', alCambiarVisibilidad)
  window.removeEventListener('pagehide', alSalirDePagina)

  iniciada = false
}

/** Limpia la identidad guardada (utilidad de soporte y pruebas). */
export function reiniciarIdentidad() {
  borrar(CLAVE_PID)
  borrar(CLAVE_SESION)
  borrar(CLAVE_IDENTIDAD)
}
