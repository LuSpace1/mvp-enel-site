export interface AnonymousAuthResponse {
  user_id: string
  access: string
  refresh: string
}

export interface GerenteGeneral {
  nombre: string
  cargo: string
  empresa: string
  foto: string
  proposito: string
  video_titulo: string
  video_youtube_url: string
}

export interface Subgerencia {
  sigla: string
  nombre: string
  subgerente: string
  foto: string
  proposito: string
  areas: { nombre: string }[]
  video_titulo: string
  video_youtube_url: string
}

export interface AreaStaff {
  nombre: string
  lider: string
  foto: string
  detalle: { texto: string }[]
}

export interface ProcesoCadena {
  titulo: string
  descripcion: string
}

export interface EtapaCadena {
  clave: string
  titulo: string
  descripcion: string
  detalle: string
  imagen?: string
  procesos: ProcesoCadena[]
}

export interface PoliticaISO {
  id: string
  nombre: string
  codigo: string
  resumen: string
  url: string
}
