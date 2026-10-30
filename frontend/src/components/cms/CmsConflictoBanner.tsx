import { CmsAlert, CmsAlertAction } from '@/components/cms/CmsAlert'

export function CmsConflictoBanner({ onRecargar }: { onRecargar: () => void }) {
  return (
    <CmsAlert
      variant="danger"
      title="Hay cambios más recientes en el borrador"
      description="Otra persona guardó cambios mientras editabas. Recarga para no sobrescribirlos."
      action={
        <CmsAlertAction tono="danger" onClick={onRecargar}>
          Recargar borrador
        </CmsAlertAction>
      }
    />
  )
}
