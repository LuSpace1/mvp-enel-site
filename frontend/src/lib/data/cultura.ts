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
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    palabra: 'INNOVACION',
    icono: iconoInnovacion,
    descripcion:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  },
  {
    palabra: 'RESPETO',
    icono: iconoRespeto,
    descripcion:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
  },
  {
    palabra: 'PROACTIVIDAD',
    icono: iconoProactividad,
    descripcion:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
  },
  {
    palabra: 'FLEXIBILIDAD',
    icono: iconoFlexibilidad,
    descripcion:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
  },
]
