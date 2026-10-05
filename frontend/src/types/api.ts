export interface VideoLink {
  id: number
  title: string
  youtube_url: string
  section_identifier: string
  created_at: string
  updated_at: string
}

export interface AnonymousAuthResponse {
  user_id: string
  access: string
  refresh: string
}

export interface Subgerencia {
  id: string
  nombre: string
  sigla: string
  subgerente: string
  foto: string
  proposito: string
  procesos: string[]
  videoSection: string
}

export interface EtapaCadena {
  id: string
  titulo: string
  descripcion: string
  detalle: string
  actividades: string[]
}

export interface PoliticaISO {
  id: string
  nombre: string
  resumen: string
  url: string
}
