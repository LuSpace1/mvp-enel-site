export interface ValorCultura {
  palabra: string
  descripcion: string
}

export const valoresCultura: ValorCultura[] = [
  {
    palabra: 'CONFIANZA',
    descripcion: 'Construimos relaciones sólidas basadas en la transparencia.',
  },
  {
    palabra: 'INNOVACION',
    descripcion: 'Buscamos nuevas formas de generar valor para la ciudad.',
  },
  {
    palabra: 'RESPETO',
    descripcion: 'Cuidamos a las personas, las comunidades y el entorno.',
  },
  {
    palabra: 'PROACTIVIDAD',
    descripcion: 'Anticipamos los desafíos y actuamos con iniciativa.',
  },
  {
    palabra: 'FLEXIBILIDAD',
    descripcion: 'Nos adaptamos con agilidad a un entorno en movimiento.',
  },
]

export const pilaresCultura = [
  {
    id: 'seguridad',
    titulo: 'La seguridad es nuestra prioridad',
    descripcion:
      'Promovemos una cultura preventiva donde cada tarea se realiza considerando los riesgos y las medidas necesarias para proteger a las personas, las comunidades y el entorno.',
    puntos: [
      'Reportamos condiciones inseguras.',
      'Política Stop Work',
      'Aprendemos de los incidentes y compartimos las lecciones aprendidas.',
      'Cuidamos nuestra seguridad y la de quienes nos rodean.',
    ],
  },
  {
    id: 'equipo',
    titulo: 'Trabajamos como un solo equipo',
    descripcion:
      'La continuidad del servicio, la experiencia de nuestros clientes y el desarrollo de la red son el resultado del trabajo coordinado de múltiples equipos.',
    puntos: [
      'Compartimos conocimiento.',
      'Escuchamos distintas perspectivas.',
      'Colaboramos entre áreas.',
      'Construimos soluciones en conjunto.',
    ],
  },
  {
    id: 'mejora',
    titulo: 'Mejora continua',
    descripcion:
      'Impulsamos una cultura donde cuestionamos procesos, identificamos oportunidades y promovemos cambios que generen mayor valor para nuestros clientes y equipos.',
    puntos: [
      'Proponemos nuevas ideas.',
      'Simplificamos procesos.',
      'Aprendemos de los errores.',
      'Compartimos buenas prácticas.',
    ],
  },
  {
    id: 'futuro',
    titulo: 'Pensamos en el futuro',
    descripcion:
      'Trabajamos impulsando una red más resiliente, eficiente y preparada para los desafíos energéticos y ambientales de los próximos años.',
    puntos: [
      'Utilizamos los recursos de manera responsable.',
      'Consideramos los impactos ambientales.',
      'Promovemos soluciones sostenibles.',
      'Apoyamos la electrificación y la innovación',
    ],
  },
  {
    id: 'cliente',
    titulo: 'Cliente en el centro',
    descripcion:
      'Detrás de cada conexión, atención o proyecto existen hogares, comercios, industrias y servicios que dependen de una energía segura y confiable.',
    puntos: [
      'Buscamos soluciones oportunas.',
      'Escuchamos las necesidades de nuestros clientes.',
      'Actuamos con cercanía y responsabilidad.',
      'Trabajamos para mejorar continuamente su experiencia.',
    ],
  },
]
