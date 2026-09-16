import fotoCEO from '@/assets/images/centro_de_exelencia_enel.jpg'
import fotoMUT from '@/assets/images/torre_enel_mut.jpeg'

export const fotosMeOffice = [
  { src: 'https://picsum.photos/seed/meoffice-lobby/900/600', alt: 'Lobby de Me Office' },
  { src: 'https://picsum.photos/seed/meoffice-sala/900/600', alt: 'Sala de reuniones Me Office' },
  { src: 'https://picsum.photos/seed/meoffice-cocina/900/600', alt: 'Cocina Me Office' },
  { src: 'https://picsum.photos/seed/meoffice-terraza/900/600', alt: 'Terraza Me Office' },
  { src: 'https://picsum.photos/seed/meoffice-auditorio/900/600', alt: 'Auditorio Me Office' },
  {
    src: 'https://picsum.photos/seed/meoffice-trabajo/900/600',
    alt: 'Zona de trabajo colaborativo',
  },
]

const DESCRIPCIONES_EQUIPOS = [
  'El equipo que mantiene la red eléctrica en marcha, día y noche.',
  'Especialistas en la operación segura de la infraestructura crítica.',
  'Ingeniería y proyectos que anticipan las necesidades del futuro.',
  'La voz de nuestros clientes, convertida en mejoras concretas.',
  'Seguridad, salud y calidad como prioridad absoluta.',
  'Tecnología y datos para una operación más inteligente.',
  'Personas que hacen crecer la cultura Enel cada día.',
  'Logística y suministros que sostienen todas las áreas.',
  'El equipo comercial que acerca la energía a cada hogar.',
  'Nuevas ideas para un futuro eléctrico más limpio.',
]

export const fotosEquipos = Array.from({ length: 50 }, (_, i) => ({
  src: `https://picsum.photos/seed/equipo-${i + 1}/1600/1000`,
  titulo: `Equipo ${i + 1}`,
  descripcion: DESCRIPCIONES_EQUIPOS[i % DESCRIPCIONES_EQUIPOS.length]!,
}))

export const instalaciones = [
  {
    titulo: 'Centro de Excelencia Operacional',
    subtitulo: 'Seguridad e innovación en acción',
    descripcion:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    url: 'https://www.enel.cl/es/conoce-enel/ceo-centro-de-excelencia-operacional-enel-distribucion.html',
    imagen: fotoCEO,
    alt: 'Centro de Excelencia Operacional',
    accion: 'Centro de Excelencia',
  },
  {
    titulo: 'Edificio Corporativo MUT',
    subtitulo: 'Nuestro hogar en el Mercado Urbano Tobalaba',
    descripcion:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    url: 'https://www.enel.cl/es/conoce-enel/prensa/press-enel-chile/d202404-enel-inicio-traslado-a-edificio-corporativo-en-mut.html',
    imagen: fotoMUT,
    alt: 'Edificio corporativo Enel en el MUT',
    accion: 'Conocer el MUT',
  },
  {
    titulo: 'Oficinas Comerciales',
    subtitulo: 'Atención presencial cerca de ti',
    descripcion:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    url: 'https://www.enel.cl/es/clientes/empalmes-y-proyectos-electricos/agenda-visita.html',
    imagen: 'https://picsum.photos/seed/enel-comercial/1200/800',
    alt: 'Oficinas comerciales Enel',
    accion: 'Agendar visita',
  },
  {
    titulo: 'Oficinas Victoria',
    subtitulo: 'Operación y servicio en la zona sur',
    descripcion:
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    url: 'https://www.enel.cl/es/historias/a201803-victoria-612.html',
    imagen: 'https://picsum.photos/seed/enel-victoria/1200/800',
    alt: 'Oficinas Enel Victoria',
    accion: 'Conocer Victoria',
  },
  {
    titulo: 'Oficinas Marathon',
    subtitulo: 'Equipos administrativos y operativos',
    descripcion:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
    url: 'https://www.enel.cl/',
    imagen: 'https://picsum.photos/seed/enel-marathon/1200/800',
    alt: 'Oficinas Enel Marathon',
    accion: 'Conocer Marathon',
  },
]
