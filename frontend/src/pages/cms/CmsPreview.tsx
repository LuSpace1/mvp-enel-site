import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useContenidoStore } from '@/lib/cms/contenido'
import { Viaje } from '@/pages/Viaje'
import { obtenerContenidoAdmin } from '@/services/cms'

export function CmsPreview() {
  const setPayload = useContenidoStore((estado) => estado.setPayload)
  const limpiar = useContenidoStore((estado) => estado.limpiar)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let activo = true
    obtenerContenidoAdmin()
      .then((contenido) => {
        if (!activo) return
        setPayload(contenido.draft.payload)
        setCargando(false)
      })
      .catch(() => {
        if (!activo) return
        setError(true)
        setCargando(false)
      })
    return () => {
      activo = false
      limpiar()
    }
  }, [setPayload, limpiar])

  if (cargando) {
    return (
      <div className="bg-background flex min-h-svh flex-col gap-4 p-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold">No se pudo cargar la vista previa.</p>
        <Button asChild variant="outline">
          <Link to="/cms">
            <ArrowLeft data-icon="inline-start" />
            Volver al editor
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Viaje preview />
      <div className="fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full border bg-white/95 px-3 py-2 shadow-xl backdrop-blur">
        <Badge variant="secondary" className="gap-1.5">
          <Eye className="size-3.5" />
          Vista previa del borrador
        </Badge>
        <Button asChild size="sm">
          <Link to="/cms">
            <ArrowLeft data-icon="inline-start" />
            Volver al editor
          </Link>
        </Button>
      </div>
    </>
  )
}
