export interface PasoViaje {
  id: string
  nombre: string
  descripcion: string
}

export const PASOS_VIAJE: PasoViaje[] = [
  {
    id: 'portada',
    nombre: 'Inicio',
    descripcion: 'Bienvenido al Portal Interactivo.',
  },
  {
    id: 'mapa-del-viaje',
    nombre: 'Elige tu ruta',
    descripcion: 'Selecciona tu recorrido por el portal.',
  },
  {
    id: 'historia',
    nombre: 'Historia del grupo',
    descripcion: 'Cómo nació y creció Enel Distribución Chile.',
  },
  {
    id: 'cultura',
    nombre: 'Cultura organizacional',
    descripcion: 'Valores, propósito y forma de trabajar.',
  },
  {
    id: 'organigrama',
    nombre: 'Equipos y gerencias',
    descripcion: 'Quién lidera cada área y qué hace cada equipo.',
  },
  {
    id: 'concesion-detalle',
    nombre: 'Mapa de concesión',
    descripcion: 'Las 33 comunas que se encienden con nosotros.',
  },
  {
    id: 'cadena',
    nombre: 'Cadena de valor',
    descripcion: 'Cómo creamos valor de punta a punta.',
  },
  {
    id: 'politicas',
    nombre: 'Políticas del negocio',
    descripcion: 'El marco que guía nuestro trabajo diario.',
  },
  {
    id: 'galerias',
    nombre: 'Espacios y equipos',
    descripcion: 'Conoce las oficinas y a las personas del negocio.',
  },
  {
    id: 'cierre',
    nombre: 'Cierre',
    descripcion: 'El propósito que nos une cada día.',
  },
  {
    id: 'faq',
    nombre: 'Preguntas frecuentes',
    descripcion: 'Respuestas a consultas habituales.',
  },
]

export const PASO_INICIAL = 'portada'
