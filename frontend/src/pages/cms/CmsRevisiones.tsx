import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  CheckCircle,
  ClockCounterClockwise,
  Eye,
  User,
  WarningCircle,
} from '@phosphor-icons/react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { CmsPageHeader } from '@/components/cms/CmsPageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fechaHora, fechaRelativa } from '@/lib/cms/fechas'
import { useEstadoEditor } from '@/lib/cms/estadoEditor'
import { cn } from '@/lib/utils'
import {
  obtenerContenidoAdmin,
  obtenerRevision,
  obtenerRevisiones,
  restaurarRevision,
} from '@/services/cms'
import type { CmsAdminContent, CmsRevision, CmsRevisionDetail } from '@/types/cms'

type Filtro = 'todas' | 'vigente' | 'anteriores'

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'vigente', etiqueta: 'Vigente' },
  { valor: 'anteriores', etiqueta: 'Anteriores' },
]

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

export function CmsRevisiones() {
  const navigate = useNavigate()
  const [revisiones, setRevisiones] = useState<CmsRevision[]>([])
  const [contenidoAdmin, setContenidoAdmin] = useState<CmsAdminContent | null>(null)
  const [cargando, setCargando] = useState(true)
  const [recargando, setRecargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restaurando, setRestaurando] = useState<string | null>(null)
  const [aRestaurar, setARestaurar] = useState<CmsRevision | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [verRevision, setVerRevision] = useState<CmsRevision | null>(null)
  const [detalleRevision, setDetalleRevision] = useState<CmsRevisionDetail | null>(null)
  const [detalleVigente, setDetalleVigente] = useState<CmsRevisionDetail | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const setResumen = useEstadoEditor((estado) => estado.setResumen)

  async function cargar(silencioso = false) {
    if (silencioso) setRecargando(true)
    else setCargando(true)
    setError(null)
    try {
      const [lista, contenido] = await Promise.all([obtenerRevisiones(), obtenerContenidoAdmin()])
      setRevisiones(lista)
      setContenidoAdmin(contenido)
      setResumen({
        draft: contenido.draft,
        published: contenido.published,
        hasUnpublishedChanges: contenido.has_unpublished_changes,
      })
    } catch (err) {
      setError(detalleError(err))
    } finally {
      if (silencioso) setRecargando(false)
      else setCargando(false)
    }
  }

  const cargaInicial = useRef(false)
  useEffect(() => {
    if (cargaInicial.current) return
    cargaInicial.current = true
    void cargar()
  }, [])

  const vigente = useMemo(
    () => revisiones.find((revision) => revision.is_current) ?? null,
    [revisiones],
  )

  const conteos = useMemo(
    () => ({
      todas: revisiones.length,
      vigente: revisiones.filter((revision) => revision.is_current).length,
      anteriores: revisiones.filter((revision) => !revision.is_current).length,
    }),
    [revisiones],
  )

  const visibles = useMemo(() => {
    if (filtro === 'vigente') return revisiones.filter((revision) => revision.is_current)
    if (filtro === 'anteriores') return revisiones.filter((revision) => !revision.is_current)
    return revisiones
  }, [filtro, revisiones])

  async function confirmarRestauracion() {
    const revision = aRestaurar
    if (!revision) return
    setRestaurando(revision.id)
    try {
      const respuesta = await restaurarRevision(revision.id)
      setResumen({
        draft: respuesta.draft,
        published: vigente,
        hasUnpublishedChanges: Boolean(respuesta.has_unpublished_changes),
      })
      toast.success('Versión restaurada en el borrador. Publícala para aplicarla al portal.')
      setARestaurar(null)
      navigate('/cms')
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setRestaurando(null)
    }
  }

  async function abrirRevision(revision: CmsRevision) {
    setVerRevision(revision)
    setDetalleRevision(null)
    setDetalleVigente(null)
    setCargandoDetalle(true)
    try {
      const [detalle, actual] = await Promise.all([
        obtenerRevision(revision.id),
        vigente && vigente.id !== revision.id ? obtenerRevision(vigente.id) : Promise.resolve(null),
      ])
      setDetalleRevision(detalle)
      setDetalleVigente(actual)
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setCargandoDetalle(false)
    }
  }

  function cerrarRevision() {
    setVerRevision(null)
    setDetalleRevision(null)
    setDetalleVigente(null)
    setCargandoDetalle(false)
  }

  const cambios = useMemo(() => {
    if (!detalleRevision || !detalleVigente || detalleRevision.id === detalleVigente.id) {
      return []
    }
    const antes = detalleRevision.payload
    const ahora = detalleVigente.payload
    const claves = new Set([...Object.keys(antes.sections), ...Object.keys(ahora.sections)])
    const nombres: string[] = []
    claves.forEach((clave) => {
      const a = JSON.stringify(antes.sections[clave] ?? {})
      const b = JSON.stringify(ahora.sections[clave] ?? {})
      if (a !== b) {
        const etiqueta =
          (ahora.sections[clave]?.nav_label as string | undefined) ??
          (antes.sections[clave]?.nav_label as string | undefined) ??
          clave
        nombres.push(etiqueta)
      }
    })
    if (JSON.stringify(antes.order) !== JSON.stringify(ahora.order)) {
      nombres.push('Orden de secciones')
    }
    return nombres
  }, [detalleRevision, detalleVigente])

  if (cargando) {
    return (
      <div className="min-h-svh">
        <div className="border-b border-black/5 bg-white/80 px-4 py-4 md:px-8">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-6 w-52" />
        </div>
        <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4 md:p-8">
          <Skeleton className="h-9 w-72 rounded-lg" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 md:py-24">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
          <span className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full">
            <ClockCounterClockwise className="size-6" />
          </span>
          <h2 className="text-enel-navy mt-4 text-lg font-semibold">
            No se pudieron cargar las versiones
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{error}</p>
          <Button className="mt-5" onClick={() => void cargar()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh">
      <CmsPageHeader
        back={{ to: '/cms', label: 'Volver al contenido' }}
        eyebrow="Trazabilidad"
        title="Versiones publicadas"
        description={
          <span className="text-muted-foreground text-xs">
            Historial de las publicaciones del portal. Puedes restaurar una versión para editarla y
            publicarla de nuevo.
          </span>
        }
        actions={
          <Button
            variant="outline"
            onClick={() => void cargar(true)}
            disabled={recargando}
            title="Actualizar versiones"
          >
            <ArrowClockwise data-icon="inline-start" className={cn(recargando && 'animate-spin')} />
            {recargando ? 'Actualizando…' : 'Actualizar'}
          </Button>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-5">
          {contenidoAdmin?.draft && contenidoAdmin.has_unpublished_changes && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <WarningCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-950">Tienes cambios sin publicar</p>
                  <p className="text-amber-900/80">Restaurar una versión los reemplazará.</p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="shrink-0 border-amber-200 bg-white text-amber-800 hover:bg-amber-100 hover:text-amber-900"
              >
                <Link to="/cms">Continuar editando</Link>
              </Button>
            </div>
          )}

          <Tabs value={filtro} onValueChange={(valor) => setFiltro(valor as Filtro)}>
            <TabsList className="h-9 flex-wrap">
              {FILTROS.map((opcion) => (
                <TabsTrigger key={opcion.valor} value={opcion.valor} className="gap-1.5">
                  {opcion.etiqueta}
                  <span className="text-muted-foreground/70 text-[10px] tabular-nums">
                    {conteos[opcion.valor]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {visibles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
              <ClockCounterClockwise className="text-muted-foreground/50 size-8" />
              <p className="text-enel-navy text-sm font-medium">
                {filtro === 'todas'
                  ? 'Todavía no hay versiones publicadas'
                  : 'No hay versiones con este filtro'}
              </p>
              <p className="text-muted-foreground max-w-sm text-xs">
                {filtro === 'todas'
                  ? 'Cuando publiques por primera vez, las versiones aparecerán aquí.'
                  : 'Prueba con otro filtro para ver el resto del historial.'}
              </p>
            </div>
          ) : (
            <ol className="relative flex flex-col gap-4 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-px before:bg-black/[0.08]">
              {visibles.map((revision) => {
                const autor =
                  revision.published_by?.name ??
                  revision.updated_by?.name ??
                  revision.created_by?.name ??
                  'Sistema'

                return (
                  <li key={revision.id} className="relative pl-8">
                    <span
                      className={cn(
                        'absolute top-4 left-0 flex size-6 items-center justify-center rounded-full border-2 border-white shadow-sm',
                        revision.is_current
                          ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10'
                          : 'bg-neutral-100 text-neutral-500 ring-1 ring-neutral-500/10',
                      )}
                    >
                      <CheckCircle className="size-3.5" weight="fill" />
                    </span>

                    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                            <Badge
                              className={cn(
                                'text-[10px] font-medium',
                                revision.is_current
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100',
                              )}
                            >
                              {revision.is_current ? 'Vigente' : 'Anterior'}
                            </Badge>
                            <span className="text-enel-navy text-sm font-semibold tabular-nums">
                              v{revision.number}
                            </span>
                            <span
                              className="text-muted-foreground text-xs"
                              title={fechaHora(revision.published_at ?? revision.created_at)}
                            >
                              {fechaRelativa(revision.published_at ?? revision.created_at)}
                            </span>
                          </div>

                          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span className="text-foreground/70 inline-flex items-center gap-1.5 font-medium">
                              <User className="size-3.5" />
                              {autor}
                            </span>
                            <span className="text-black/15">·</span>
                            <span>{fechaHora(revision.published_at ?? revision.created_at)}</span>
                          </div>

                          {revision.message && (
                            <p className="text-foreground/70 mt-3 rounded-lg border border-black/[0.05] bg-[#fbfcfd] px-3 py-2 text-xs">
                              {revision.message}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void abrirRevision(revision)}
                          >
                            <Eye data-icon="inline-start" />
                            Ver versión
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white"
                            disabled={revision.is_current || restaurando === revision.id}
                            onClick={() => setARestaurar(revision)}
                            title={
                              revision.is_current
                                ? 'La versión vigente ya está publicada'
                                : 'Restaurar como borrador'
                            }
                          >
                            <ArrowCounterClockwise data-icon="inline-start" />
                            {restaurando === revision.id ? 'Restaurando…' : 'Restaurar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(verRevision)}
        onOpenChange={(abierto) => {
          if (!abierto) cerrarRevision()
        }}
      >
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-enel-navy text-lg">
              Versión v{verRevision?.number}
              {verRevision?.is_current ? ' · Vigente' : ' · Anterior'}
            </DialogTitle>
            <DialogDescription>
              {fechaHora(verRevision?.published_at ?? verRevision?.created_at ?? null)} ·{' '}
              {verRevision?.published_by?.name ??
                verRevision?.updated_by?.name ??
                verRevision?.created_by?.name ??
                'Sistema'}
              {detalleRevision && (
                <span className="mt-1 block">
                  {verRevision?.is_current
                    ? 'Esta es la versión vigente del portal.'
                    : cambios.length > 0
                      ? `Diferencias con la versión vigente: ${cambios.join(', ')}.`
                      : 'Esta versión es igual a la versión vigente.'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/30 relative h-[60vh] overflow-hidden rounded-xl border border-black/[0.06]">
            {verRevision && (
              <iframe
                src={`/cms/preview?embed=1&revision=${verRevision.id}`}
                title={`Vista previa de la versión ${verRevision.number}`}
                className="h-full w-full border-0 bg-white"
              />
            )}
            {cargandoDetalle && (
              <div className="text-muted-foreground absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/70 text-xs backdrop-blur-[1px]">
                <span className="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent" />
                Cargando diferencias…
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarRevision}>
              Cerrar
            </Button>
            <Button
              disabled={
                !verRevision || verRevision.is_current || Boolean(restaurando) || cargandoDetalle
              }
              onClick={() => {
                const revision = verRevision
                cerrarRevision()
                if (revision) setARestaurar(revision)
              }}
            >
              <ArrowCounterClockwise data-icon="inline-start" />
              Restaurar como borrador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(aRestaurar)}
        onOpenChange={(abierto) => {
          if (!abierto && !restaurando) setARestaurar(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar esta versión</AlertDialogTitle>
            <AlertDialogDescription>
              La versión v{aRestaurar?.number} del{' '}
              {fechaHora(aRestaurar?.published_at ?? aRestaurar?.created_at ?? null)} se copiará al
              borrador.{' '}
              {contenidoAdmin?.draft
                ? contenidoAdmin.has_unpublished_changes
                  ? 'Se reemplazarán los cambios sin publicar.'
                  : 'El borrador actual se reemplazará.'
                : 'Se creará un borrador nuevo.'}{' '}
              El portal no cambia hasta que publiques.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(restaurando)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(restaurando)}
              onClick={(evento) => {
                evento.preventDefault()
                void confirmarRestauracion()
              }}
            >
              {restaurando ? 'Restaurando…' : 'Restaurar borrador'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
