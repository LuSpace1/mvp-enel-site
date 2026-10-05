export interface ZonaConcesion {
  id: string
  nombre: string
  color: string
  colorClaro: string
  comunas: string[]
}

export const ZONAS_CONCESION: ZonaConcesion[] = [
  {
    id: 'chacabuco',
    nombre: 'Chacabuco',
    color: '#009767',
    colorClaro: '#63c9a6',
    comunas: [
      'huechuraba',
      'conchali',
      'quilicura',
      'renca',
      'cerro-navia',
      'lampa',
      'colina',
      'quinta-normal',
      'til-til',
    ],
  },
  {
    id: 'cordillera',
    nombre: 'Cordillera',
    color: '#006fbb',
    colorClaro: '#6fa9d8',
    comunas: [
      'santiago',
      'providencia',
      'las-condes',
      'vitacura',
      'recoleta',
      'independencia',
      'lo-barnechea',
    ],
  },
  {
    id: 'pacifico',
    nombre: 'Pacifico',
    color: '#00a9dd',
    colorClaro: '#79cbe9',
    comunas: [
      'lo-prado',
      'estacion-central',
      'pa-c',
      'san-miguel',
      'cerrillos',
      'lo-espejo',
      'maipu',
      'pudahuel',
    ],
  },
  {
    id: 'florida',
    nombre: 'Florida',
    color: '#ea561f',
    colorClaro: '#f2a380',
    comunas: [
      'nunoa',
      'la-reina',
      'penalolen',
      'la-florida',
      'macul',
      'san-joaquin',
      'la-granja',
      'san-ramon',
      'la-cisterna',
    ],
  },
]

export const ZONA_POR_ID = new Map(ZONAS_CONCESION.map((z) => [z.id, z]))
