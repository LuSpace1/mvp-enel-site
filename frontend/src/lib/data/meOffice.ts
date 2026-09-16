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
    id: 'primeros-pasos',
    etiqueta: 'Primeros pasos',
    titulo: 'Cómo empezar a usar Me Office',
    media: { tipo: 'video', src: '' },
  },
  {
    id: 'espacio-de-trabajo',
    etiqueta: 'Tu espacio de trabajo',
    titulo: 'Encuentra y reserva tu espacio',
    media: { tipo: 'video', src: '' },
  },
  {
    id: 'salas-y-reuniones',
    etiqueta: 'Salas y reuniones',
    titulo: 'Agenda salas y coordina con tu equipo',
    media: { tipo: 'video', src: '' },
  },
  {
    id: 'desde-el-movil',
    etiqueta: 'Desde tu móvil',
    titulo: 'Me Office en tu teléfono',
    media: { tipo: 'video', src: '' },
  },
]
