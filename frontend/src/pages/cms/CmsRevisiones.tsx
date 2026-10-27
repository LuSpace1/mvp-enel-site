import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowCounterClockwise,
  ArrowLeft,
  ClockCounterClockwise,
  User,
} from '@phosphor-icons/react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { obtenerRevisiones, restaurarRevision } from '@/services/cms'
import type { CmsRevision } from '@/types/cms'

function detalleError(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const objeto = data as Record<string, unknown>
      if (typeof objeto.detail === 'string') return objeto.detail
    }
    return `Error ${error.response?.status ?? ''}`.trim()
  }
  return 'Ocurrió un error inesperado.'
}

function variante(status: CmsRevision['status']) {
  if (status === 'PUBLISHED') return 'default' as const
  if (status === 'ARCHIVED') return 'secondary' as const
  return 'outline' as const
}

function fecha(valor: string | null): string {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function CmsRevisiones() {
  const navigate = useNavigate()
  const [revisiones, setRevisiones] = useState<CmsRevision[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurando, setRestaurando] = useState<string | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      setRevisiones(await obtenerRevisiones())
    } catch (err) {
      setError(detalleError(err))
    } finally {
      setCargando(false)
    }
  }

  const cargaInicial = useRef(false)
  useEffect(() => {
    if (cargaInicial.current) return
    cargaInicial.current = true
    void cargar()
  }, [])

  async function restaurar(revision: CmsRevision) {
    const confirmado = window.confirm(
      `¿Restaurar la revisión del ${fecha(revision.created_at)} como borrador? No se publica hasta que la publiques.`,
    )
    if (!confirmado) return
    setRestaurando(revision.id)
    try {
      await restaurarRevision(revision.id)
      toast.success('Revisión restaurada en el borrador.')
      navigate('/cms')
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setRestaurando(null)
    }
  }

  if (cargando) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 md:p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el historial</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => void cargar()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/cms">
            <ArrowLeft data-icon="inline-start" />
            Volver al contenido
          </Link>
        </Button>
        <h1 className="text-enel-navy text-2xl font-semibold">Historial de revisiones</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Cada publicación conserva autor, fecha y contenido. Restaurar crea un borrador nuevo.
        </p>
      </div>

      {revisiones.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
            <ClockCounterClockwise className="size-8" />
            <p>Todavía no hay revisiones registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {revisiones.map((revision) => {
            const autor =
              revision.published_by?.name ??
              revision.updated_by?.name ??
              revision.created_by?.name ??
              'Sistema'
            return (
              <Card key={revision.id}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    <Badge variant={variante(revision.status)}>{revision.status_label}</Badge>
                    <span>v{revision.version}</span>
                    <span className="text-muted-foreground text-sm font-normal">
                      {fecha(revision.published_at ?? revision.created_at)}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3.5" />
                      {autor}
                    </span>
                    {revision.message && <span>· {revision.message}</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revision.status === 'DRAFT' || restaurando === revision.id}
                    onClick={() => void restaurar(revision)}
                  >
                    <ArrowCounterClockwise data-icon="inline-start" />
                    {restaurando === revision.id ? 'Restaurando…' : 'Restaurar como borrador'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
