export const SECCIONES_ORDEN = [
  'portada',
  'historia',
  'cultura',
  'organigrama',
  'concesion-detalle',
  'cadena',
  'politicas',
  'galerias',
  'personas',
  'espacios',
  'cierre',
] as const

export type SeccionKey = (typeof SECCIONES_ORDEN)[number]

export const ETIQUETAS_SECCION: Record<string, string> = {
  portada: 'Inicio',
  historia: 'Historia',
  cultura: 'Cultura',
  organigrama: 'Equipos',
  'concesion-detalle': 'Concesión',
  cadena: 'Cadena',
  politicas: 'SIG',
  galerias: 'ME',
  personas: 'Novedades',
  espacios: 'Espacios',
  cierre: 'Cierre',
}

export const SECCIONES_FIJAS: Record<string, number> = {
  portada: 0,
  cierre: -1,
}
