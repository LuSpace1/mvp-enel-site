import type { VideoLink } from '@/types/api'

import { useVideosStore } from '@/store/useVideosStore'

const VIDEO_MUESTRA = 'https://www.youtube.com/watch?v=EQeBgrPs_-Y'

const videosMock: VideoLink[] = [
  {
    id: 1,
    title: 'Mensaje de la Gerente General Mónica Hodor',
    youtube_url: VIDEO_MUESTRA,
    section_identifier: 'hero_main',
    created_at: '',
    updated_at: '',
  },
  {
    id: 2,
    title: 'Presentación de Francisco Evans · Subgerencia Industrial P&C',
    youtube_url: VIDEO_MUESTRA,
    section_identifier: 'subgerencia_pc',
    created_at: '',
    updated_at: '',
  },
  {
    id: 3,
    title: 'Presentación de Ximena León · Subgerencia HSEQ',
    youtube_url: VIDEO_MUESTRA,
    section_identifier: 'subgerencia_hseq',
    created_at: '',
    updated_at: '',
  },
  {
    id: 4,
    title: 'Presentación de Giovanni Zanchetta · Subgerencia RCO',
    youtube_url: VIDEO_MUESTRA,
    section_identifier: 'subgerencia_rco',
    created_at: '',
    updated_at: '',
  },
  {
    id: 5,
    title: 'Presentación de Francisco Messen · Subgerencia COM',
    youtube_url: VIDEO_MUESTRA,
    section_identifier: 'subgerencia_com',
    created_at: '',
    updated_at: '',
  },
  {
    id: 6,
    title: 'Presentación de Marco Castro · Subgerencia Network Development',
    youtube_url: VIDEO_MUESTRA,
    section_identifier: 'subgerencia_nd',
    created_at: '',
    updated_at: '',
  },
]

const VIDEO_POR_SECCION = new Map(videosMock.map((video) => [video.section_identifier, video]))

export function videoDeSeccion(sectionIdentifier: string): VideoLink | undefined {
  const real = useVideosStore
    .getState()
    .videos.find((video) => video.section_identifier === sectionIdentifier)
  return real ?? VIDEO_POR_SECCION.get(sectionIdentifier)
}
