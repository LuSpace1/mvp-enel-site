import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  ArrowCounterClockwise,
  ArrowClockwise,
  CheckCircle,
  ClockCounterClockwise,
  Eye,
  PencilSimpleLine,
  User,
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
import { cn } from '@/lib/utils'
import {
  obtenerContenidoAdmin,
  obtenerRevision,
  obtenerRevisiones,
  restaurarRevision,
} from '@/services/cms'
import type { CmsRevision, CmsRevisionDetail } from '@/types/cms'

type Filtro = 'todas' | CmsRevision['status']

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'PUBLISHED', etiqueta: 'Publicadas' },
  { valor: 'DRAFT', etiqueta: 'Borradores' },
  { valor: 'ARCHIVED', etiqueta: 'Archivadas' },
]

const ESTADOS: Record<
  CmsRevision['status'],
  { punto: string; etiqueta: string; icono: typeof CheckCircle }
> = {
  PUBLISHED: {
    punto: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10',
    etiqueta: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
    icono: CheckCircle,
  },
  DRAFT: {
    punto: 'bg-enel-blue/10 text-enel-blue ring-1 ring-enel-blue/10',
    etiqueta: 'bg-enel-blue/10 text-enel-blue hover:bg-enel-blue/10',
    icono: PencilSimpleLine,
  },
  ARCHIVED: {
    punto: 'bg-neutral-100 text-neutral-500 ring-1 ring-neutral-500/10',
    etiqueta: 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100',
    icono: Archive,
  },
}

const RELATIVO = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

function fecha(valor: string | null): string {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function fechaRelativa(valor: string | null): string {
  if (!valor) return '—'
  const segundos = (new Date(valor).getTime() - Date.now()) / 1000
  const absoluto = Math.abs(segundos)
  if (absoluto < 60) return 'hace instantes'
  if (absoluto < 3600) return RELATIVO.format(Math.round(segundos / 60), 'minute')
  if (absoluto < 86400) return RELATIVO.format(Math.round(segundos / 3600), 'hour')
  if (absoluto < 2592000) return RELATIVO.format(Math.round(segundos / 86400), 'day')
  return fecha(valor)
}

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
  const [cargando, setCargando] = useState(true)
  const [recargando, setRecargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restaurando, setRestaurando] = useState<string | null>(null)
  const [aRestaurar, setARestaurar] = useState<CmsRevision | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [draftActual, setDraftActual] = useState<CmsRevisionDetail | null>(null)
  const [verRevision, setVerRevision] = useState<CmsRevision | null>(null)
  const [detalleRevision, setDetalleRevision] = useState<CmsRevisionDetail | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  async function cargar(silencioso = false) {
    if (silencioso) setRecargando(true)
    else setCargando(true)
    setError(null)
    try {
      const [lista, contenido] = await Promise.all([obtenerRevisiones(), obtenerContenidoAdmin()])
      setRevisiones(lista)
      setDraftActual(contenido.draft)
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

  const conteos = useMemo(() => {
    const mapa: Record<Filtro, number> = {
      todas: revisiones.length,
      PUBLISHED: 0,
      DRAFT: 0,
      ARCHIVED: 0,
    }
    revisiones.forEach((revision) => {
      mapa[revision.status] += 1
    })
    return mapa
  }, [revisiones])

  const visibles = useMemo(
    () => (filtro === 'todas' ? revisiones : revisiones.filter((r) => r.status === filtro)),
    [revisiones, filtro],
  )

  async function confirmarRestauracion() {
    const revision = aRestaurar
    if (!revision) return
    setRestaurando(revision.id)
    try {
      await restaurarRevision(revision.id)
      toast.success('Revisión restaurada en el borrador.')
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
    setCargandoDetalle(true)
    try {
      setDetalleRevision(await obtenerRevision(revision.id))
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setCargandoDetalle(false)
    }
  }

  function cerrarRevision() {
    setVerRevision(null)
    setDetalleRevision(null)
    setCargandoDetalle(false)
  }

  const cambios = useMemo(() => {
    if (!detalleRevision || !draftActual) return []
    const antes = detalleRevision.payload
    const ahora = draftActual.payload
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
  }, [detalleRevision, draftActual])

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
            No se pudo cargar el historial
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
        title="Historial de revisiones"
        description={
          <span className="text-muted-foreground text-xs">
            Cada publicación conserva autor, fecha y contenido. Restaurar crea un borrador nuevo.
          </span>
        }
        actions={
          <Button
            variant="outline"
            onClick={() => void cargar(true)}
            disabled={recargando}
            title="Actualizar historial"
          >
            <ArrowClockwise data-icon="inline-start" className={cn(recargando && 'animate-spin')} />
            {recargando ? 'Actualizando…' : 'Actualizar'}
          </Button>
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-5">
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
                  ? 'Todavía no hay revisiones registradas'
                  : 'No hay revisiones con este estado'}
              </p>
              <p className="text-muted-foreground max-w-sm text-xs">
                {filtro === 'todas'
                  ? 'Cuando publiques por primera vez, el historial conservará cada versión del contenido.'
                  : 'Prueba con otro filtro para ver el resto del historial.'}
              </p>
            </div>
          ) : (
            <ol className="relative flex flex-col gap-4 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-px before:bg-black/[0.08]">
              {visibles.map((revision) => {
                const estado = ESTADOS[revision.status]
                const Icono = estado.icono
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
                        estado.punto,
                      )}
                    >
                      <Icono className="size-3.5" weight="fill" />
                    </span>

                    <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                            <Badge className={cn('text-[10px] font-medium', estado.etiqueta)}>
                              {revision.status_label}
                            </Badge>
                            <span className="text-enel-navy text-sm font-semibold tabular-nums">
                              v{revision.version}
                            </span>
                            <span
                              className="text-muted-foreground text-xs"
                              title={fecha(revision.published_at ?? revision.created_at)}
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
                            <span>{fecha(revision.published_at ?? revision.created_at)}</span>
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
                            disabled={revision.status === 'DRAFT' || restaurando === revision.id}
                            onClick={() => setARestaurar(revision)}
                            title={
                              revision.status === 'DRAFT'
                                ? 'La revisión actual ya es el borrador'
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
              Versión v{verRevision?.version} · {verRevision?.status_label}
            </DialogTitle>
            <DialogDescription>
              {fecha(verRevision?.published_at ?? verRevision?.created_at ?? null)} ·{' '}
              {verRevision?.published_by?.name ??
                verRevision?.updated_by?.name ??
                verRevision?.created_by?.name ??
                'Sistema'}
              {detalleRevision && (
                <span className="mt-1 block">
                  {cambios.length > 0
                    ? `Diferencias con el borrador actual: ${cambios.join(', ')}.`
                    : 'Esta versión es igual al borrador actual.'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/30 relative h-[60vh] overflow-hidden rounded-xl border border-black/[0.06]">
            {verRevision && (
              <iframe
                src={`/cms/preview?embed=1&revision=${verRevision.id}`}
                title={`Vista previa de la versión ${verRevision.version}`}
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
                !verRevision ||
                verRevision.status === 'DRAFT' ||
                Boolean(restaurando) ||
                cargandoDetalle
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
            <AlertDialogTitle>Restaurar esta revisión</AlertDialogTitle>
            <AlertDialogDescription>
              Se copiará el contenido de la versión v{aRestaurar?.version} del{' '}
              {fecha(aRestaurar?.published_at ?? aRestaurar?.created_at ?? null)} en un borrador
              nuevo. El portal público no cambia hasta que publiques.
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
