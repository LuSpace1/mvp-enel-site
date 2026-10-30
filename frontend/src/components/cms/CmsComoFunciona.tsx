import {
  ArrowCounterClockwise,
  CloudArrowUp,
  FloppyDisk,
  PencilSimpleLine,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const PASOS = [
  {
    icono: PencilSimpleLine,
    titulo: 'Editas un borrador',
    texto:
      'Los cambios se guardan en un borrador. El portal sigue mostrando la última publicación.',
  },
  {
    icono: FloppyDisk,
    titulo: 'Guardar no publica',
    texto: 'Guardar conserva tu avance. Puedes salir y continuar después.',
  },
  {
    icono: CloudArrowUp,
    titulo: 'Publicar actualiza el portal',
    texto: 'Cada publicación crea una versión nueva y queda en el historial.',
  },
  {
    icono: ArrowCounterClockwise,
    titulo: 'Restaurar no cambia el portal',
    texto: 'Copia una versión anterior al borrador. El portal cambia recién cuando publicas.',
  },
] as const

export function CmsComoFunciona({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-enel-navy text-lg">Cómo funciona el CMS</DialogTitle>
          <DialogDescription>
            Guardar y publicar son pasos distintos. El portal solo cambia al publicar.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex flex-col gap-4">
          {PASOS.map((paso, indice) => {
            const Icono = paso.icono
            return (
              <li key={paso.titulo} className="flex gap-3">
                <span className="bg-enel-blue/10 text-enel-blue flex size-9 shrink-0 items-center justify-center rounded-xl">
                  <Icono className="size-4" weight="duotone" />
                </span>
                <div className="min-w-0">
                  <p className="text-enel-navy text-sm font-medium">
                    {indice + 1}. {paso.titulo}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                    {paso.texto}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>

        <p className="text-muted-foreground rounded-lg border border-black/[0.05] bg-[#fbfcfd] px-3 py-2 text-[11px] leading-relaxed">
          Las <strong className="text-enel-navy font-medium">versiones</strong> son copias
          publicadas del contenido. Puedes consultarlas o restaurarlas cuando quieras.
        </p>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
