import iconoConfianza from '@/assets/icons/valores/confianza.png'
import iconoFlexibilidad from '@/assets/icons/valores/flexibilidad.png'
import iconoInnovacion from '@/assets/icons/valores/innovacion.png'
import iconoProactividad from '@/assets/icons/valores/proactividad.png'
import iconoRespeto from '@/assets/icons/valores/respeto.png'

export interface ValorCultura {
  palabra: string
  icono: string
  descripcion: string
}

export const valoresCultura: ValorCultura[] = [
  {
    palabra: 'CONFIANZA',
    icono: iconoConfianza,
    descripcion:
      'Actuamos con responsabilidad, integridad, legalidad y autonomía, construyendo relaciones de confianza con nuestros interlocutores y clientes. Fomentamos la colaboración, desarrollando capacidades y relaciones sólidas que nos permiten enfrentar desafíos y gestionar la complejidad de la mejor manera posible.',
  },
  {
    palabra: 'INNOVACION',
    icono: iconoInnovacion,
    descripcion:
      'Trabajamos con curiosidad para abrir la energía a nuevos usos, tecnologías y personas, aprendiendo los unos de los otros e identificando nuevos puntos de referencia. Transformamos ideas en valor para nosotros y para nuestros interlocutores.',
  },
  {
    palabra: 'RESPETO',
    icono: iconoRespeto,
    descripcion:
      'Reconocemos y valoramos las diferencias, ideas, opiniones, capacidades y méritos de las personas. Actuamos con responsabilidad, respetando las normas que protegen la seguridad, la salud, el medio ambiente y los derechos humanos, para asegurar la calidad en todo lo que hacemos.',
  },
  {
    palabra: 'PROACTIVIDAD',
    icono: iconoProactividad,
    descripcion:
      'Actuamos con espíritu emprendedor, tomando la iniciativa para alcanzar resultados concretos y sostenibles. Nos comprometemos con el futuro de nuestra compañía y la transición energética, poniendo las necesidades de nuestros clientes en el centro de nuestras decisiones.',
  },
  {
    palabra: 'FLEXIBILIDAD',
    icono: iconoFlexibilidad,
    descripcion:
      'Acogemos el cambio como una oportunidad, anticipándonos a nuevos desafíos y escenarios. Nos adaptamos con agilidad, solidez y sencillez, redefiniendo prioridades, aprendiendo de nuestros errores e impulsando la mejora continua.',
  },
]
