import { useState } from 'react'
import { Question } from '@phosphor-icons/react'

import { CmsComoFunciona } from '@/components/cms/CmsComoFunciona'
import { CmsTooltip } from '@/components/cms/CmsTooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Acceso contextual a la guía del CMS, junto a las acciones de la página. */
export function CmsHelpButton({ className }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <CmsTooltip lado="bottom" label="Cómo funciona el CMS">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn('text-muted-foreground hover:text-foreground shrink-0', className)}
          aria-label="Cómo funciona el CMS"
          onClick={() => setAbierto(true)}
        >
          <Question className="size-4" weight="bold" />
        </Button>
      </CmsTooltip>
      <CmsComoFunciona open={abierto} onOpenChange={setAbierto} />
    </>
  )
}
