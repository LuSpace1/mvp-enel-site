import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CloudArrowUp,
  FloppyDisk,
  LockKey,
} from '@phosphor-icons/react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  guardarBorrador,
  obtenerContenidoAdmin,
  obtenerSchema,
  publicarContenido,
} from '@/services/cms'
import type { CmsRevisionDetail, CmsSchemaResponse } from '@/types/cms'

function detalleError(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const objeto = data as Record<string, unknown>
      if (typeof objeto.detail === 'string') return objeto.detail
      const primero = Object.values(objeto)[0]
      if (Array.isArray(primero) && typeof primero[0] === 'string') return primero[0]
      if (typeof primero === 'string') return primero
    }
    return `Error ${error.response?.status ?? ''}`.trim()
  }
  return 'Ocurrió un error inesperado.'
}

export function CmsOrden() {
  const [schema, setSchema] = useState<CmsSchemaResponse | null>(null)
  const [draft, setDraft] = useState<CmsRevisionDetail | null>(null)
  const [orden, setOrden] = useState<string[]>([])
  const [canPublish, setCanPublish] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const [esquema, contenido] = await Promise.all([obtenerSchema(), obtenerContenidoAdmin()])
      setSchema(esquema)
      setDraft(contenido.draft)
      setOrden(contenido.draft.payload.order)
      setCanPublish(contenido.can_publish || esquema.can_publish)
      setDirty(false)
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

  const detallePorClave = useMemo(() => {
    const mapa = new Map<string, { label: string; reorderable: boolean }>()
    schema?.sections.forEach((seccion) =>
      mapa.set(seccion.key, {
        label: seccion.label,
        reorderable: seccion.reorderable,
      }),
    )
    return mapa
  }, [schema])

  function mover(indice: number, direccion: -1 | 1) {
    if (!canPublish) return
    const destino = indice + direccion
    if (destino < 0 || destino >= orden.length) return
    const actual = detallePorClave.get(orden[indice] ?? '')
    const objetivo = detallePorClave.get(orden[destino] ?? '')
    if (!actual?.reorderable || !objetivo?.reorderable) return
    const copia = [...orden]
    const [clave] = copia.splice(indice, 1)
    if (!clave) return
    copia.splice(destino, 0, clave)
    setOrden(copia)
    setDirty(true)
  }

  async function guardar(): Promise<boolean> {
    if (!draft) return false
    setGuardando(true)
    try {
      const respuesta = await guardarBorrador({ ...draft.payload, order: orden }, draft.version)
      setDraft(respuesta.draft)
      setOrden(respuesta.draft.payload.order)
      setCanPublish(respuesta.can_publish)
      setDirty(false)
      toast.success('Orden guardado en el borrador.')
      return true
    } catch (err) {
      toast.error(detalleError(err))
      return false
    } finally {
      setGuardando(false)
    }
  }

  async function publicar() {
    if (!canPublish) return
    const guardado = await guardar()
    if (!guardado) return
    setGuardando(true)
    try {
      const respuesta = await publicarContenido('Cambio de orden de secciones')
      setDraft(respuesta.draft)
      setOrden(respuesta.draft.payload.order)
      setDirty(false)
      toast.success('Nuevo orden publicado en el portal.')
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 md:p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el orden</AlertTitle>
          <AlertDescription>{error ?? 'Sin datos del borrador.'}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => void cargar()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/cms">
              <ArrowLeft data-icon="inline-start" />
              Volver al contenido
            </Link>
          </Button>
          <h1 className="text-enel-navy text-2xl font-semibold">Orden de secciones</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            El orden publicado alimenta la página, el header y el índice lateral.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void guardar()}
            disabled={!dirty || guardando || !canPublish}
          >
            <FloppyDisk data-icon="inline-start" />
            Guardar borrador
          </Button>
          <Button onClick={() => void publicar()} disabled={guardando || !canPublish}>
            <CloudArrowUp data-icon="inline-start" />
            Publicar orden
          </Button>
        </div>
      </div>

      {!canPublish && (
        <Alert>
          <LockKey />
          <AlertTitle>Solo lectura para editores</AlertTitle>
          <AlertDescription>
            El cambio de orden global requiere el rol de publicador. Puedes revisar el orden actual,
            pero no modificarlo.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Orden del borrador
            <Badge variant={dirty ? 'secondary' : 'outline'}>
              {dirty ? 'Sin guardar' : `v${draft.version}`}
            </Badge>
          </CardTitle>
          <CardDescription>
            Inicio y Cierre son fijos. Las demás secciones se mueven con las flechas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {orden.map((clave, indice) => {
            const detalle = detallePorClave.get(clave)
            const etiqueta =
              (draft.payload.sections[clave]?.nav_label as string | undefined) ??
              detalle?.label ??
              clave
            const fija = !detalle?.reorderable
            return (
              <div
                key={clave}
                className="bg-background flex items-center gap-3 rounded-lg border p-3"
              >
                <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {indice + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{etiqueta}</p>
                  <p className="text-muted-foreground truncate text-xs">{clave}</p>
                </div>
                {fija && <Badge variant="outline">Fija</Badge>}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Mover arriba"
                    disabled={indice === 0 || fija || !canPublish}
                    onClick={() => mover(indice, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Mover abajo"
                    disabled={indice === orden.length - 1 || fija || !canPublish}
                    onClick={() => mover(indice, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
