export interface KpiResumen {
  visitas: number
  personas: number
  page_views: number
  personas_completaron: number
  tasa_completitud: number
  profundidad_media: number
  secciones_promedio: number
  tiempo_completitud: number | null
  permanencia_mediana: number | null
  likert_promedio: number | null
  tasa_respuesta: number
}

export interface KpiSeccion {
  clave: string
  vistas: number
  personas: number
  interacciones: number
  personas_interactuaron: number
  tasa_interaccion: number
  tiempo_medio: number | null
}

export interface KpiRecurso {
  nombre: string
  recurso: string
  aperturas: number
  personas: number
}

export interface KpiOpinion {
  puntaje: number
  comentario: string
  seccion: string
  creada_en: string
}

export interface KpiSatisfaccion {
  distribucion: { puntaje: number; cantidad: number }[]
  ultimas: KpiOpinion[]
  promedio: number | null
  total: number
}

export interface KpiSeriePunto {
  fecha: string
  visitas: number
  completas: number
}

export interface KpiTablero {
  rango: { desde: string; hasta: string }
  resumen: KpiResumen
  secciones: KpiSeccion[]
  recorrido: { histograma: { secciones: number; visitas: number }[] }
  recursos: KpiRecurso[]
  satisfaccion: KpiSatisfaccion
  serie: KpiSeriePunto[]
}

export interface KpiPersona {
  id: string
  email: string
  origen: string
  primera_vez: string
  ultima_vez: string
  visitas: number
  tiempo_activo: number
  profundidad_maxima: number
  completo: boolean
  likert: number | null
}

export interface KpiPersonasRespuesta {
  total: number
  pagina: number
  tamano: number
  resultados: KpiPersona[]
}
