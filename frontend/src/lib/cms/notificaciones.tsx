import { toast } from 'sonner'

import { CmsToast } from '@/components/cms/CmsToast'

type TipoNotificacion = 'success' | 'error' | 'info' | 'warning'

interface Notificacion {
  titulo: string
  descripcion?: string
  duracion?: number
}

function notificar(tipo: TipoNotificacion, { titulo, descripcion, duracion = 4500 }: Notificacion) {
  toast.custom(
    (id) => (
      <CmsToast
        tipo={tipo}
        titulo={titulo}
        descripcion={descripcion}
        onCerrar={() => toast.dismiss(id)}
      />
    ),
    { duration: duracion, unstyled: true },
  )
}

export function notificarExito(titulo: string, descripcion?: string) {
  notificar('success', { titulo, descripcion })
}

export function notificarError(titulo: string, descripcion?: string) {
  notificar('error', { titulo, descripcion })
}

export function notificarInfo(titulo: string, descripcion?: string) {
  notificar('info', { titulo, descripcion })
}

export function notificarAviso(titulo: string, descripcion?: string) {
  notificar('warning', { titulo, descripcion })
}
