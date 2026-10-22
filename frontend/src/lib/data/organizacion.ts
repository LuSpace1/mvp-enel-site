import type { EtapaCadena, Subgerencia } from '@/types/api'

import fotoHombre from '@/assets/images/placeholder_hombre.webp'
import fotoMujer from '@/assets/images/placeholder_mujer.jpg'

export const gerenteGeneral = {
  id: 'gerente',
  nombre: 'Paolo Leidi',
  cargo: 'Gerente General',
  empresa: 'Enel Distribución Chile',
  foto: fotoHombre,
  videoSection: 'gerencia_general',
}

export const subgerencias: Subgerencia[] = [
  {
    id: 'pc',
    sigla: 'P&C',
    nombre: 'Industrial P&C',
    subgerente: 'Francisco Evans',
    foto: fotoHombre,
    proposito:
      'Gestionar de manera estratégica la cadena de suministro, el abastecimiento y las contrataciones de servicios y materiales del negocio.',
    procesos: ['Compras estratégicas', 'Abastecimiento', 'Contratos'],
    videoSection: 'subgerencia_pc',
  },
  {
    id: 'hseq',
    sigla: 'HSEQ',
    nombre: 'Health, Safety, Environment and Quality',
    subgerente: 'Ximena León',
    foto: fotoMujer,
    proposito:
      'Garantizar la gestión integral en salud, seguridad, medio ambiente y calidad (HSEQ), asegurando el cumplimiento de estándares globales y normativas locales, promoviendo una cultura preventiva y de mejora continua.',
    procesos: ['SIG', 'Cumplimiento normativo', 'Inspección', 'Capacitación técnica'],
    videoSection: 'subgerencia_hseq',
  },
  {
    id: 'rco',
    sigla: 'RCO',
    nombre: 'Regulated Customer Operations',
    subgerente: 'Giovanni Zanchetta',
    foto: fotoHombre,
    proposito:
      'Gestionar eficientemente las operaciones comerciales reguladas, optimizando el balance energético, el ciclo de ingresos y la experiencia del cliente.',
    procesos: ['Activaciones', 'Meter to cash', 'Gestión de pérdidas', 'Atención a clientes'],
    videoSection: 'subgerencia_rco',
  },
  {
    id: 'com',
    sigla: 'COM',
    nombre: 'Construction Operation and Maintenance',
    subgerente: 'Francisco Messen',
    foto: fotoHombre,
    proposito:
      'Asegurar la continuidad y calidad del servicio eléctrico mediante la operación, mantenimiento y ejecución de proyectos en la red.',
    procesos: ['Operación de red', 'Mantenimiento', 'Gestión de fallas', 'Planes de emergencia'],
    videoSection: 'subgerencia_com',
  },
  {
    id: 'nd',
    sigla: 'ND',
    nombre: 'Network Development',
    subgerente: 'Marco Castro',
    foto: fotoHombre,
    proposito:
      'Planificar y desarrollar la red eléctrica asegurando eficiencia en inversiones, sostenibilidad y alineamiento con la regulación y estándares globales.',
    procesos: [
      'Planificación de red',
      'Gestión de activos',
      'Evaluación de proyectos',
      'Nuevos negocios',
    ],
    videoSection: 'subgerencia_nd',
  },
]

export const areasStaff = [
  {
    id: 'finanzas',
    nombre: 'Finanzas',
    etiqueta: 'Gestión Financiera',
    detalle:
      'Lidera la planificación financiera, contabilidad y control de gestión. Garantiza la asignación eficiente de recursos, viabilidad presupuestaria y sustentabilidad económica de las inversiones de red.',
  },
  {
    id: 'auditoria',
    nombre: 'Auditoría',
    etiqueta: 'Control y Riesgos',
    detalle:
      'Monitorea la transparencia, mitiga riesgos y evalúa el control interno. Asegura que los procesos organizacionales cumplan con el marco legal, las políticas del Grupo Enel y el código ético.',
  },
  {
    id: 'personas',
    nombre: 'Personas y Organizacionales',
    etiqueta: 'Talento y Cultura',
    detalle:
      'Gestiona la atracción, retención y desarrollo de talento. Impulsa la transformación cultural, diversidad, inclusión, el bienestar y clima laboral de los equipos de la distribuidora.',
  },
  {
    id: 'legal',
    nombre: 'Legal',
    etiqueta: 'Asesoría Jurídica y Regulatoria',
    detalle:
      'Proporciona asesoría jurídica y regulatoria integral. Asegura el resguardo legal de la infraestructura, vigila el cumplimiento de normas de mercado eléctrico y formaliza contratos clave.',
  },
  {
    id: 'comunicaciones',
    nombre: 'Comunicaciones Externas y Sostenibilidad',
    etiqueta: 'Reputación y Sostenibilidad',
    detalle:
      'Gestiona la relación con los medios, reputación y comunidades locales. Lidera la estrategia de sostenibilidad, valor compartido, compromisos ambientales y el apoyo a la transición energética.',
  },
]

export const etapasCadena: EtapaCadena[] = [
  {
    id: 'customer',
    titulo: 'Customer Management',
    descripcion: 'Gestionamos la relación con nuestros clientes y su experiencia',
    detalle:
      'Acompañamos a nuestros clientes desde su primer contacto, gestionando sus solicitudes, trámites y necesidades a través de distintos canales de atención, para entregar una experiencia de servicio cercana, simple y confiable.',
    procesos: [
      {
        titulo: 'Interacción con clientes',
        descripcion:
          'Gestionamos los distintos canales de atención y puntos de contacto, facilitando la comunicación y respuesta a las necesidades de nuestros clientes.',
      },
      {
        titulo: 'Oferta comercial y calidad',
        descripcion:
          'Gestionamos las conexiones, operaciones comerciales y la calidad del servicio que ofrecemos a nuestros clientes.',
      },
      {
        titulo: 'Experiencia del cliente',
        descripcion:
          'Atendemos reclamos y evaluamos la satisfacción de nuestros clientes para identificar oportunidades de mejora en su experiencia.',
      },
    ],
  },
  {
    id: 'strategy',
    titulo: 'Strategy and Development',
    descripcion: 'Definimos la dirección del negocio y su crecimiento',
    detalle:
      'Definimos el rumbo de la compañía, anticipándonos a las necesidades del negocio y del mercado. Planificamos el desarrollo de nuestra red, priorizamos inversiones e identificamos nuevas oportunidades para impulsar un crecimiento sostenible.',
    procesos: [
      {
        titulo: 'Estrategia de mercado y oportunidades',
        descripcion:
          'Analizamos el mercado, el entorno regulatorio y las nuevas oportunidades que contribuyen al desarrollo del negocio.',
      },
      {
        titulo: 'Análisis de la red',
        descripcion:
          'Evaluamos el estado y desempeño de nuestra red, identificando necesidades futuras de mantenimiento, mejora y expansión.',
      },
      {
        titulo: 'Desarrollo y planificación de inversiones',
        descripcion:
          'Planificamos, evaluamos y gestionamos proyectos e inversiones, asegurando su alineación con las necesidades y objetivos del negocio.',
      },
      {
        titulo: 'Gestión comercial',
        descripcion:
          'Planificamos y gestionamos ofertas, licitaciones y actividades comerciales que apoyan el desarrollo de nuevas oportunidades.',
      },
    ],
  },
  {
    id: 'supply',
    titulo: 'Supply Chain',
    descripcion: 'Abastecemos con eficiencia los insumos y servicios',
    detalle:
      'Aseguramos la disponibilidad de materiales, equipos y servicios necesarios para nuestra operación, gestionando las compras, los proveedores y el abastecimiento de manera eficiente, oportuna y con altos estándares de calidad.',
    procesos: [
      {
        titulo: 'Planificación de la demanda',
        descripcion:
          'Anticipamos las necesidades de materiales y servicios, definiendo qué recursos requerimos y cuándo deben estar disponibles.',
      },
      {
        titulo: 'Gestión de contratos y proveedores',
        descripcion:
          'Gestionamos las compras, contratos y relaciones con proveedores, evaluando la calidad y el cumplimiento de los servicios contratados.',
      },
      {
        titulo: 'Logística y abastecimiento',
        descripcion:
          'Coordinamos el almacenamiento, distribución y control de materiales, asegurando su disponibilidad para las distintas actividades de la operación.',
      },
    ],
  },
  {
    id: 'engineering',
    titulo: 'Engineering',
    descripcion: 'Diseñamos las soluciones técnicas de la red',
    detalle:
      'Transformamos las necesidades de nuestra red en soluciones de ingeniería seguras, eficientes y sostenibles. Desarrollamos diseños técnicos que permiten construir, operar y mantener nuestra infraestructura eléctrica.',
    procesos: [
      {
        titulo: 'Desarrollo de equipos y componentes',
        descripcion:
          'Diseñamos y estandarizamos los equipos y componentes que utilizamos en nuestra red, asegurando criterios técnicos y de calidad.',
      },
      {
        titulo: 'Ingeniería de red',
        descripcion:
          'Desarrollamos los diseños y especificaciones técnicas que definen cómo debe construirse y funcionar nuestra infraestructura eléctrica.',
      },
    ],
  },
  {
    id: 'construction',
    titulo: 'Construction and Operation',
    descripcion: 'Construimos y operamos la infraestructura eléctrica',
    detalle:
      'Construimos, operamos y mantenemos nuestra red de distribución eléctrica para asegurar un suministro continuo, seguro y de calidad. Supervisamos su funcionamiento y respondemos oportunamente ante fallas y emergencias.',
    procesos: [
      {
        titulo: 'Operación de la red y del sistema',
        descripcion:
          'Supervisamos y controlamos el funcionamiento de nuestra red, coordinando la respuesta ante fallas y emergencias para restablecer el suministro.',
      },
      {
        titulo: 'Planificación y despacho',
        descripcion:
          'Planificamos y coordinamos los trabajos, recursos y maniobras necesarios para operar nuestra red de manera segura y eficiente.',
      },
      {
        titulo: 'Mantenimiento',
        descripcion:
          'Realizamos actividades preventivas y correctivas para conservar nuestras instalaciones en buenas condiciones y reducir el riesgo de fallas.',
      },
      {
        titulo: 'Excelencia operacional',
        descripcion:
          'Evaluamos el desempeño de nuestros procesos e impulsamos mejoras que fortalecen la eficiencia, calidad y seguridad de la operación.',
      },
      {
        titulo: 'Construcción',
        descripcion:
          'Gestionamos los presupuestos, permisos y ejecución de obras de alta, media y baja tensión, manteniendo actualizada la información de nuestra red.',
      },
    ],
  },
  {
    id: 'cash',
    titulo: 'Service to Cash',
    descripcion: 'Convertimos el servicio en valor sostenible',
    detalle:
      'Completamos el ciclo de nuestro servicio mediante la medición de la energía, la facturación y la recuperación de ingresos. Así, transformamos la energía distribuida en valor para el negocio, contribuyendo a su sostenibilidad.',
    procesos: [
      {
        titulo: 'Medición y balance de energía',
        descripcion:
          'Medimos y analizamos la energía distribuida, verificando la coherencia entre los registros de consumo y la energía entregada a través de nuestra red.',
      },
      {
        titulo: 'Recuperación de energía y facturación',
        descripcion:
          'Gestionamos la facturación, el crédito y la recuperación de energía e ingresos no registrados correctamente, contribuyendo a la sostenibilidad del negocio.',
      },
    ],
  },
]
