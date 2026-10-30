import fotoCEO from '@/assets/images/centro_de_exelencia_enel.jpg'
import fotoMUT from '@/assets/images/torre_enel_mut.jpeg'

const DESCRIPCIONES_GALERIA_INSTALACION = [
  'Acceso principal y fachada del recinto, pensados para recibir a clientes, visitas y equipos de trabajo.',
  'Zonas comunes y espacios de encuentro donde se coordina la operación diaria.',
  'Salas de control y monitoreo desde donde se supervisa la red en tiempo real.',
  'Áreas técnicas y de mantenimiento que sostienen la continuidad del servicio.',
  'Espacios de formación y capacitación para los equipos de la compañía.',
]

// Placeholder: 5 fotos por instalación mientras llega el material real.
function galeriaInstalacion(slug: string, titulo: string) {
  return Array.from({ length: 5 }, (_, i) => ({
    src: `https://picsum.photos/seed/${slug}-${i + 1}/1600/1000`,
    titulo,
    descripcion: DESCRIPCIONES_GALERIA_INSTALACION[i]!,
  }))
}

export const instalaciones = [
  {
    titulo: 'Centro de Excelencia Operacional',
    subtitulo: 'Seguridad e innovación en acción',
    descripcion:
      'Un centro de formación y capacitación donde nuestros equipos perfeccionan sus conocimientos técnicos y refuerzan la cultura de seguridad.',
    url: 'https://www.enel.cl/es/conoce-enel/ceo-centro-de-excelencia-operacional-enel-distribucion.html',
    imagen: fotoCEO,
    alt: 'Centro de Excelencia Operacional',
    accion: 'Centro de Excelencia',
    galeria: galeriaInstalacion('instalacion-ceo', 'Centro de Excelencia Operacional'),
  },
  {
    titulo: 'Edificio Corporativo MUT',
    subtitulo: 'Nuestro hogar en el Mercado Urbano Tobalaba',
    descripcion:
      'Nuestro edificio corporativo en el Mercado Urbano Tobalaba, un espacio de trabajo colaborativo conectado con el centro de Santiago.',
    url: 'https://www.enel.cl/es/conoce-enel/prensa/press-enel-chile/d202404-enel-inicio-traslado-a-edificio-corporativo-en-mut.html',
    imagen: fotoMUT,
    alt: 'Edificio corporativo Enel en el MUT',
    accion: 'Conocer el MUT',
    galeria: galeriaInstalacion('instalacion-mut', 'Edificio Corporativo MUT'),
  },
  {
    titulo: 'Oficinas Comerciales',
    subtitulo: 'Atención presencial cerca de ti',
    descripcion:
      'Puntos de atención presencial donde clientes y vecinos realizan trámites, reciben asesoría y conocen nuestros servicios.',
    url: 'https://www.enel.cl/es/clientes/empalmes-y-proyectos-electricos/agenda-visita.html',
    imagen: 'https://picsum.photos/seed/enel-comercial/1200/800',
    alt: 'Oficinas comerciales Enel',
    accion: 'Agendar visita',
    galeria: galeriaInstalacion('instalacion-comercial', 'Oficinas Comerciales'),
  },
  {
    titulo: 'Oficinas Victoria',
    subtitulo: 'Operación y servicio en la zona sur',
    descripcion:
      'Oficinas de operación y atención que acompañan a los clientes y equipos de la zona sur de la Región Metropolitana.',
    url: 'https://www.enel.cl/es/historias/a201803-victoria-612.html',
    imagen: 'https://picsum.photos/seed/enel-victoria/1200/800',
    alt: 'Oficinas Enel Victoria',
    accion: 'Conocer Victoria',
    galeria: galeriaInstalacion('instalacion-victoria', 'Oficinas Victoria'),
  },
  {
    titulo: 'Oficinas Marathon',
    subtitulo: 'Equipos administrativos y operativos',
    descripcion:
      'Espacios de trabajo para los equipos administrativos y operativos que coordinan la gestión diaria de la compañía.',
    url: 'https://www.enel.cl/',
    imagen: 'https://picsum.photos/seed/enel-marathon/1200/800',
    alt: 'Oficinas Enel Marathon',
    accion: 'Conocer Marathon',
    galeria: galeriaInstalacion('instalacion-marathon', 'Oficinas Marathon'),
  },
]
