export interface HerramientaMeOffice {
  id: string
  nombre: string
  descripcion: string
  /** URL de destino. Vacía mientras el enlace esté pendiente. */
  url: string
}

// Accesos directos a las herramientas del ecosistema ME.
// Completar `url` en cada elemento cuando estén disponibles los enlaces.
export const herramientasMeOffice: HerramientaMeOffice[] = [
  {
    id: 'portal-me',
    nombre: 'Portal ME',
    descripcion: 'Novedades, servicios y accesos del ecosistema ME.',
    url: '',
  },
  {
    id: 'tell-me',
    nombre: 'Tell ME',
    descripcion: 'Ideas, consultas y feedback para la compañía.',
    url: '',
  },
  {
    id: 'me-learning',
    nombre: 'ME Learning',
    descripcion: 'Cursos y rutas de formación para tu desarrollo.',
    url: '',
  },
  {
    id: 'me-office',
    nombre: 'ME Office',
    descripcion: 'Reserva de puestos, beneficios y trámites.',
    url: '',
  },
  {
    id: 'next-move',
    nombre: 'Next Move',
    descripcion: 'Movilidad interna y nuevas oportunidades en Enel.',
    url: '',
  },
]
