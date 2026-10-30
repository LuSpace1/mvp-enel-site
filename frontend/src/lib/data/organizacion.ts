import type { AreaStaff, EtapaCadena, GerenteGeneral, Subgerencia } from '@/types/api'

import fotoHombre from '@/assets/images/placeholder_hombre.webp'
import fotoMujer from '@/assets/images/placeholder_mujer.jpg'

export const gerenteGeneral: GerenteGeneral = {
  nombre: 'Paolo Leidi',
  cargo: 'Gerente General',
  empresa: 'Enel Distribución Chile',
  foto: fotoHombre,
  proposito:
    'Liderar y gestionar integralmente el negocio de distribución eléctrica, asegurando la operación y el desarrollo de la red, la gestión comercial y la atención de clientes. Administrar eficientemente los recursos e inversiones, impulsando el crecimiento sostenible y el cumplimiento de los objetivos estratégicos y normativos.',
  video_titulo: 'Mensaje de Paolo Leidi · Gerencia General',
  video_youtube_url: 'https://www.youtube.com/watch?v=EQeBgrPs_-Y',
}

export const subgerencias: Subgerencia[] = [
  {
    sigla: 'HSEQ',
    nombre: 'Health, Safety, Environment and Quality',
    subgerente: 'Ximena León',
    foto: fotoMujer,
    proposito:
      'Definir e implementar estrategias e iniciativas de Salud, Seguridad, Medio Ambiente y Calidad, asegurando el cumplimiento de los lineamientos globales y la normativa local. Promover la mejora continua, la prevención de riesgos y el fortalecimiento del Sistema Integrado de Gestión en las distintas actividades del negocio.',
    areas: [
      { nombre: 'Health & Safety' },
      { nombre: 'Environment' },
      { nombre: 'Quality' },
      { nombre: 'CEO' },
    ],
    video_titulo: 'Presentación de Ximena León · Subgerencia HSEQ',
    video_youtube_url: 'https://www.youtube.com/watch?v=EQeBgrPs_-Y',
  },
  {
    sigla: 'RCO',
    nombre: 'Regulated Customer Operations',
    subgerente: 'Giovanni Zanchetta',
    foto: fotoHombre,
    proposito:
      'Gestionar integralmente los procesos comerciales del suministro eléctrico, desde la conexión y medición hasta la facturación, cobranza y gestión de pérdidas de energía. Asegurar una atención eficiente y de calidad a través de los distintos canales, promoviendo la satisfacción de los clientes y optimizando la gestión de energía y los ingresos del negocio.',
    areas: [
      { nombre: 'Activation' },
      { nombre: 'Readings and Billing' },
      { nombre: 'Losses Management' },
      { nombre: 'Collection & Credit' },
      { nombre: 'Energy Balance & Supply' },
      { nombre: 'Customer Care' },
      { nombre: 'Customer Satisfaction & Quality Management' },
    ],
    video_titulo: 'Presentación de Giovanni Zanchetta · Subgerencia RCO',
    video_youtube_url: 'https://www.youtube.com/watch?v=EQeBgrPs_-Y',
  },
  {
    sigla: 'ND',
    nombre: 'Network Development',
    subgerente: 'Marco Castro',
    foto: fotoHombre,
    proposito:
      'Planificar y promover el desarrollo de la red de distribución eléctrica, identificando necesidades de inversión, riesgos y oportunidades de mejora para optimizar su desempeño y resiliencia. Impulsar nuevas oportunidades de negocio y soluciones técnicas eficientes y sostenibles, asegurando su alineación con los estándares globales y la normativa local.',
    areas: [
      { nombre: 'Network Analysis and Solutions Optimization' },
      { nombre: 'Network Business Opportunities Development' },
      { nombre: 'Engineering Support and Global Standards Adoption' },
    ],
    video_titulo: 'Presentación de Marco Castro · Subgerencia Network Development',
    video_youtube_url: 'https://www.youtube.com/watch?v=EQeBgrPs_-Y',
  },
  {
    sigla: 'COM',
    nombre: 'Construction and Maintenance',
    subgerente: 'Francisco Messen',
    foto: fotoHombre,
    proposito:
      'Gestionar la construcción, operación y mantenimiento de la red de distribución eléctrica, asegurando la continuidad, seguridad y calidad del suministro. Coordinar los trabajos en terreno, la atención de fallas y emergencias, así como la ejecución de proyectos y programas de mantenimiento, promoviendo la eficiencia operacional y la mejora continua de la infraestructura.',
    areas: [
      { nombre: 'Network Operation' },
      { nombre: 'Maintenance and Technical Support' },
      { nombre: 'Supply Chain' },
      { nombre: 'Meter Operation' },
      { nombre: 'Chile Operational Regional Area' },
    ],
    video_titulo: 'Presentación de Francisco Messen · Subgerencia COM',
    video_youtube_url: 'https://www.youtube.com/watch?v=EQeBgrPs_-Y',
  },
]

export const areasStaff: AreaStaff[] = [
  {
    nombre: 'Industrial Control',
    lider: 'Francisco Evans',
    foto: fotoHombre,
    detalle: [
      {
        texto:
          'Gestionar la planificación financiera, los presupuestos, las proyecciones y el control de gestión del negocio, monitoreando los resultados y proponiendo acciones de mejora. Evaluar y apoyar la aprobación de inversiones, el cumplimiento de objetivos y el impacto financiero de los aspectos regulatorios, contribuyendo a una toma de decisiones eficiente y alineada con la estrategia de la compañía.',
      },
    ],
  },
  {
    nombre: 'Legal Assistance',
    lider: 'Alfredo Montes',
    foto: fotoHombre,
    detalle: [
      {
        texto:
          'Brindar asesoría jurídica a las distintas áreas del negocio, asegurando el cumplimiento de la normativa vigente y anticipando los impactos de cambios legales y regulatorios. Supervisar la gestión de litigios y los asuntos societarios, contribuyendo a la protección de los intereses de la compañía y a una gestión responsable de sus operaciones.',
      },
    ],
  },
  {
    nombre: 'Regulatory',
    lider: 'Rodrigo Maldonado',
    foto: fotoHombre,
    detalle: [
      {
        texto:
          'Definir y resguardar la posición de la compañía frente a los desafíos regulatorios, identificando tendencias y evaluando su impacto económico y financiero en el negocio. Gestionar los asuntos regulatorios y la relación con organismos y grupos de interés relevantes, contribuyendo a la toma de decisiones estratégicas.',
      },
    ],
  },
  {
    nombre: 'People and Organization',
    lider: 'William Espitia',
    foto: fotoHombre,
    detalle: [
      {
        texto:
          'Gestionar los procesos de personas y desarrollo organizacional, impulsando la planificación del talento, la movilidad interna y el diseño de estructuras organizacionales alineadas con las necesidades del negocio. Administrar las políticas de compensaciones y las relaciones laborales con sindicatos y organizaciones de trabajadores, contribuyendo al desarrollo de las personas y la organización.',
      },
    ],
  },
]

export const etapasCadena: EtapaCadena[] = [
  {
    clave: 'customer',
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
    clave: 'strategy',
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
    clave: 'supply',
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
    clave: 'engineering',
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
    clave: 'construction',
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
    clave: 'cash',
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
