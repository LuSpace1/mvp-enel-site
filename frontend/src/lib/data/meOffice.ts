export interface HerramientaMeOffice {
  id: string
  nombre: string
  descripcion: string
  /** Referencia breve que se muestra bajo el nombre. */
  nota?: string
  /** URL de destino. Vacía mientras el enlace esté pendiente. */
  url: string
}

// Accesos directos a las herramientas del ecosistema ME.
export const herramientasMeOffice: HerramientaMeOffice[] = [
  {
    id: 'portal-me',
    nombre: 'Portal ME',
    descripcion:
      'Accede a tu información personal y laboral, beneficios, servicios y herramientas para gestionar tu día a día en Enel.',
    url: 'https://enel.service-now.com/me',
  },
  {
    id: 'tell-me',
    nombre: 'People ME',
    descripcion:
      'Tu asistente virtual de P&O para resolver consultas y acceder a información sobre procesos, beneficios y servicios internos.',
    nota: 'Disponible en Tell ME',
    url: 'https://enelcom.sharepoint.com/sites/globalintranet/SitePages/es/TellMe.aspx?isSPOFile=1&xsdata=MDV8MDJ8fGY3NWM1MTU2NTI4ZTQwNTU4NmI5MDhkZjJmYjBhMGJhfGQ1MzlkNGJmNTYxMDQ3MWFhZmMyMWM3NjY4NWNmZWZhfDB8MHw2MzkyODIxMDc3NjcyMjgwODl8VW5rbm93bnxWR1ZoYlhOVFpXTjFjbWwwZVZObGNuWnBZMlY4ZXlKRFFTSTZJbFJsWVcxelgwRlVVRk5sY25acFkyVmZVMUJQVEU5R0lpd2lWaUk2SWpBdU1DNHdNREF3SWl3aVVDSTZJbGRwYmpNeUlpd2lRVTRpT2lKUGRHaGxjaUlzSWxkVUlqb3hNWDA9fDF8TDJOb1lYUnpMekU1T21FMk5URTRaREprTFRobU9ESXRORE5qT1MwNU9ERTJMV1UxTWpBMU56UTNPVEJpWkY5bU1XTTNaVGhpWXkxak5UTmpMVFE1WmpNdFltWmlOaTA0TWpZNE5tWTJOR1ZrTURKQWRXNXhMbWRpYkM1emNHRmpaWE12YldWemMyRm5aWE12TVRjNU1qWXhNemszTmpBME1nPT18NTViMWU4MTYwYmMzNDJlNDI0MDcwOGRmMmZiMGEwYmF8ZjVlZmQwYmY5ZjkyNGE4YWE4NjAxZDk4YWEzZjExNjE%3D&sdata=c2VTc05ZZUlsVmI4QnVidUg1ZGZ6Tm1VSzArYVB6cjgxMHBFanVxdHBLYz0%3D&ovuser=d539d4bf-5610-471a-afc2-1c76685cfefa%2Cflorencia.corvalan.external%40enel.com',
  },
  {
    id: 'me-learning',
    nombre: 'ME Learning',
    descripcion:
      'Revisa cursos y rutas de aprendizaje para desarrollar tus conocimientos y potenciar tus habilidades.',
    url: 'https://mylearninglxp.edcast.com/',
  },
  {
    id: 'me-office',
    nombre: 'ME Office',
    descripcion:
      'Reserva puestos de trabajo, salas de reuniones y coordina tus jornadas presenciales con tu equipo.',
    url: 'https://enel.service-now.com/meoffice',
  },
  {
    id: 'next-move',
    nombre: 'Next Move',
    descripcion:
      'Descubre oportunidades profesionales, proyectos y recursos para impulsar tu desarrollo y crecimiento en Enel.',
    url: 'https://enelcom.sharepoint.com/sites/globalintranet/SitePages/Next%20Move/es/NextMove.aspx?isSPOFile=1&xsdata=MDV8MDJ8fGFkYTI1MjAxNWIxMTRiOTkyMzgwMDhkZjJmYjBkODJifGQ1MzlkNGJmNTYxMDQ3MWFhZmMyMWM3NjY4NWNmZWZhfDB8MHw2MzkyODIxMDg2OTczNTUxMzZ8VW5rbm93bnxWR1ZoYlhOVFpXTjFjbWwwZVZObGNuWnBZMlY4ZXlKRFFTSTZJbFJsWVcxelgwRlVVRk5sY25acFkyVmZVMUJQVEU5R0lpd2lWaUk2SWpBdU1DNHdNREF3SWl3aVVDSTZJbGRwYmpNeUlpd2lRVTRpT2lKUGRHaGxjaUlzSWxkVUlqb3hNWDA9fDF8TDJOb1lYUnpMekU1T21FMk5URTRaREprTFRobU9ESXRORE5qT1MwNU9ERTJMV1UxTWpBMU56UTNPVEJpWkY5bU1XTTNaVGhpWXkxak5UTmpMVFE1WmpNdFltWmlOaTA0TWpZNE5tWTJOR1ZrTURKQWRXNXhMbWRpYkM1emNHRmpaWE12YldWemMyRm5aWE12TVRjNU1qWXhOREEyTnprM053PT18ODA1Y2Q4MGI5ODczNDNjYmQ1MzkwOGRmMmZiMGQ4MmF8MDZlNTBkZDYxNzQzNDQ1M2E3MTUzNTY4NWVkYWVlODg%3D&sdata=RnE5eWJGdjdCN3l1NER3QjVHbUYvVWVTZXZRUDRVVXY2Ym1mdE9YT0l0ND0%3D&ovuser=d539d4bf-5610-471a-afc2-1c76685cfefa%2Cflorencia.corvalan.external%40enel.com',
  },
]
