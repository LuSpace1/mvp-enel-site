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
    descripcion: 'El punto de entrada a las novedades y servicios del ecosistema ME.',
    url: '',
  },
  {
    id: 'tell-me',
    nombre: 'Tell ME',
    descripcion: 'Comparte ideas, consultas y feedback con la compañía.',
    url: '',
  },
  {
    id: 'me-learning',
    nombre: 'ME Learning',
    descripcion: 'Cursos y rutas de formación para impulsar tu desarrollo.',
    url: '',
  },
  {
    id: 'me-office',
    nombre: 'ME Office',
    descripcion: 'Reserva de puestos, beneficios y gestión del día a día.',
    url: '',
  },
  {
    id: 'next-move',
    nombre: 'Next Move',
    descripcion: 'Movilidad interna y nuevas oportunidades dentro de Enel.',
    url: '',
  },
]
