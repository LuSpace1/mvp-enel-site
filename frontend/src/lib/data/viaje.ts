export interface PasoViaje {
  id: string
  nombre: string
}

export const PASOS_VIAJE: PasoViaje[] = [
  {
    id: 'portada',
    nombre: 'Inicio',
  },
  {
    id: 'historia',
    nombre: 'Historia del grupo',
  },
  {
    id: 'cultura',
    nombre: 'Cultura organizacional',
  },
  {
    id: 'organigrama',
    nombre: 'Equipos y gerencias',
  },
  {
    id: 'concesion-detalle',
    nombre: 'Mapa de concesión',
  },
  {
    id: 'cadena',
    nombre: 'Cadena de valor',
  },
  {
    id: 'politicas',
    nombre: 'Políticas del negocio',
  },
  {
    id: 'galerias',
    nombre: 'Herramienta Me Office',
  },
  {
    id: 'personas',
    nombre: 'Rostros y equipos',
  },
  {
    id: 'cierre',
    nombre: 'Cierre',
  },
  {
    id: 'faq',
    nombre: 'Preguntas frecuentes',
  },
]

export const PASO_INICIAL = 'portada'
