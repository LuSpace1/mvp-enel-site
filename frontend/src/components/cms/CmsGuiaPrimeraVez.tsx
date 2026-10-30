import { Info } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'

export function CmsGuiaPrimeraVez({
  onAbrir,
  onCerrar,
}: {
  onAbrir: () => void
  onCerrar: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <Info className="mt-0.5 size-5 shrink-0 text-sky-600" />
        <div>
          <p className="font-medium text-sky-950">¿Primera vez en el CMS?</p>
          <p className="text-sky-900/70">
            Edita, guarda y publica cuando esté listo. El portal no cambia hasta entonces.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-sky-200 bg-white text-sky-800 hover:bg-sky-100 hover:text-sky-900"
          onClick={onAbrir}
        >
          Ver guía
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-sky-800 hover:bg-sky-100 hover:text-sky-900"
          onClick={onCerrar}
        >
          Entendido
        </Button>
      </div>
    </div>
  )
}
