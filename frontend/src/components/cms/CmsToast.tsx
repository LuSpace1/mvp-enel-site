import { X } from '@phosphor-icons/react'

import { CmsAlert, type CmsAlertVariant } from '@/components/cms/CmsAlert'
import { Button } from '@/components/ui/button'

type TipoToast = 'success' | 'error' | 'info' | 'warning'

const VARIANTE: Record<TipoToast, CmsAlertVariant> = {
  success: 'success',
  error: 'danger',
  info: 'info',
  warning: 'warning',
}

export function CmsToast({
  tipo,
  titulo,
  descripcion,
  onCerrar,
}: {
  tipo: TipoToast
  titulo: string
  descripcion?: string
  onCerrar: () => void
}) {
  return (
    <div className="relative w-[min(22rem,calc(100vw-2rem))]">
      <CmsAlert
        compact
        variant={VARIANTE[tipo]}
        title={titulo}
        description={descripcion}
        className="w-full pr-9"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
        aria-label="Cerrar notificación"
        onClick={onCerrar}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
