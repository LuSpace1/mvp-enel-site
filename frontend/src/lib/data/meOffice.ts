export type TipoMedia = 'video' | 'gif' | 'imagen'

export interface PresentacionMeOffice {
  id: string
  etiqueta: string
  titulo: string
  media: {
    tipo: TipoMedia
    src: string
    poster?: string
  }
}

// Presentaciones de la sección «Herramienta Me Office».
// Para publicar cada video o gif: coloca el archivo en frontend/src/assets y
// reemplaza el `src` de la presentación correspondiente, por ejemplo:
//   import videoReservas from '@/assets/videos/meoffice-reservas.mp4'
//   media: { tipo: 'video', src: videoReservas }
// Mientras `src` esté vacío, la pantalla muestra un placeholder.
export const presentacionesMeOffice: PresentacionMeOffice[] = [
  {
    id: 'reserva-de-puestos',
    etiqueta: 'Reserva de puestos',
    titulo: 'Reserva tu puesto de trabajo',
    media: { tipo: 'video', src: '' },
  },
  {
    id: 'me-learning',
    etiqueta: 'Me learning (formación)',
    titulo: 'Me learning: formación y desarrollo',
    media: { tipo: 'video', src: '' },
  },
  {
    id: 'beneficios',
    etiqueta: 'Beneficios',
    titulo: 'Conoce tus beneficios',
    media: { tipo: 'video', src: '' },
  },
  {
    id: 'sueldo-y-liquidaciones',
    etiqueta: 'Sueldo y liquidaciones',
    titulo: 'Consulta y descarga tus liquidaciones',
    media: { tipo: 'video', src: '' },
  },
  {
    id: 'tramites-y-solicitudes',
    etiqueta: 'Trámites y solicitudes',
    titulo: 'Vacaciones, permisos y certificados',
    media: { tipo: 'video', src: '' },
  },
]
