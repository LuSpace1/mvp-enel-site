import { WarningCircle } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

export function CmsConflictoBanner({ onRecargar }: { onRecargar: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <WarningCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
        <div>
          <p className="font-medium text-red-900">Hay cambios más recientes en el borrador</p>
          <p className="text-red-700/80">
            Otra persona guardó cambios mientras editabas. Recarga para no sobrescribirlos.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 border-red-200 bg-white text-red-700 hover:bg-red-100 hover:text-red-800"
        onClick={onRecargar}
      >
        Recargar borrador
      </Button>
    </div>
  )
}
