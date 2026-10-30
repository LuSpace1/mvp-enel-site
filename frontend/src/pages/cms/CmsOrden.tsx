import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  CloudArrowUp,
  DotsSixVertical,
  FloppyDisk,
  Info,
  LockKey,
  PencilSimpleLine,
} from '@phosphor-icons/react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { CmsConflictoBanner } from '@/components/cms/CmsConflictoBanner'
import { CmsPageHeader } from '@/components/cms/CmsPageHeader'
import { VistaPreviaPortal } from '@/components/cms/VistaPreviaPortal'
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
import { Textarea } from '@/components/ui/textarea'
import { compararPayload } from '@/lib/cms/comparar'
import { fechaHora } from '@/lib/cms/fechas'
import { useEstadoEditor } from '@/lib/cms/estadoEditor'
import { cn } from '@/lib/utils'
import {
  activarEdicion,
  guardarBorrador,
  obtenerContenidoAdmin,
  obtenerContenidoPublico,
  obtenerSchema,
  publicarContenido,
} from '@/services/cms'
import type { CmsPayload, CmsRevision, CmsRevisionDetail, CmsSchemaResponse } from '@/types/cms'

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
  const [published, setPublished] = useState<CmsRevision | null>(null)
  const [publicadoPayload, setPublicadoPayload] = useState<CmsPayload | null>(null)
  const [orden, setOrden] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [sobre, setSobre] = useState<string | null>(null)
  const [activando, setActivando] = useState(false)
  const [dialogoPublicar, setDialogoPublicar] = useState(false)
  const [mensajePublicacion, setMensajePublicacion] = useState('')
  const [conflicto, setConflicto] = useState(false)
  const setDirtyGlobal = useEstadoEditor((estado) => estado.setDirty)
  const setResumen = useEstadoEditor((estado) => estado.setResumen)
  const actualizarDraft = useEstadoEditor((estado) => estado.actualizarDraft)

  useEffect(() => {
    setDirtyGlobal(dirty)
    return () => setDirtyGlobal(false)
  }, [dirty, setDirtyGlobal])

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const [esquema, contenido, publico] = await Promise.all([
        obtenerSchema(),
        obtenerContenidoAdmin(),
        obtenerContenidoPublico().catch(() => null),
      ])
      setSchema(esquema)
      setDraft(contenido.draft)
      setPublished(contenido.published)
      setPublicadoPayload(publico?.payload ?? null)
      setOrden(contenido.draft?.payload.order ?? publico?.payload.order ?? esquema.default_order)
      setResumen({
        draft: contenido.draft,
        published: contenido.published,
        hasUnpublishedChanges: contenido.has_unpublished_changes,
      })
      setDirty(false)
      setConflicto(false)
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
    const mapa = new Map<string, { label: string; description: string; reorderable: boolean }>()
    schema?.sections.forEach((seccion) =>
      mapa.set(seccion.key, {
        label: seccion.label,
        description: seccion.description,
        reorderable: seccion.reorderable,
      }),
    )
    return mapa
  }, [schema])

  const payloadVisible = draft?.payload ?? publicadoPayload
  const payloadPreview = useMemo(
    () => (payloadVisible ? { ...payloadVisible, order: orden } : null),
    [payloadVisible, orden],
  )
  const comparacion = useMemo(
    () => compararPayload(draft?.payload, publicadoPayload),
    [draft?.payload, publicadoPayload],
  )
  const sinCambios = !comparacion.contenido && !comparacion.orden

  function reordenar(origen: string, destino: string) {
    if (origen === destino) return
    const detalleOrigen = detallePorClave.get(origen)
    const detalleDestino = detallePorClave.get(destino)
    if (!detalleOrigen?.reorderable || !detalleDestino?.reorderable) return

    const indiceOrigen = orden.indexOf(origen)
    const indiceDestino = orden.indexOf(destino)
    if (indiceOrigen < 0 || indiceDestino < 0) return

    const copia = [...orden]
    copia.splice(indiceOrigen, 1)
    copia.splice(indiceDestino, 0, origen)
    setOrden(copia)
    setDirty(true)
  }

  function mover(indice: number, direccion: -1 | 1) {
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

  async function guardar(): Promise<CmsRevisionDetail | null> {
    if (!draft) return null
    if (!dirty) return draft
    setGuardando(true)
    try {
      const respuesta = await guardarBorrador(
        { ...draft.payload, order: orden },
        draft.lock_version,
      )
      setDraft(respuesta.draft)
      setOrden(respuesta.draft.payload.order)
      setDirty(false)
      setConflicto(false)
      actualizarDraft(respuesta.draft, respuesta.has_unpublished_changes)
      toast.success('Orden guardado en el borrador.')
      return respuesta.draft
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) setConflicto(true)
      toast.error(detalleError(err))
      return null
    } finally {
      setGuardando(false)
    }
  }

  async function publicar() {
    if (!draft) return
    if (dirty) {
      toast.info('Guarda los cambios antes de publicar.')
      return
    }
    if (sinCambios) {
      toast.info('No hay cambios para publicar.')
      return
    }
    setGuardando(true)
    try {
      const respuesta = await publicarContenido(draft.lock_version, mensajePublicacion)
      setPublished(respuesta.published)
      setPublicadoPayload(draft.payload)
      setResumen({
        draft: null,
        published: respuesta.published,
        hasUnpublishedChanges: false,
      })
      // La publicación cierra la sesión de edición: volvemos al modo lectura.
      setDraft(null)
      setOrden(draft.payload.order)
      setDirty(false)
      setDialogoPublicar(false)
      setMensajePublicacion('')
      setConflicto(false)
      toast.success(
        `Publicado como v${respuesta.published.number}. Contenido y orden actualizados.`,
      )
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setConflicto(true)
        setDialogoPublicar(false)
      }
      toast.error(detalleError(err))
    } finally {
      setGuardando(false)
    }
  }

  function abrirDialogoPublicar() {
    if (!draft) return
    if (dirty) {
      toast.info('Guarda los cambios antes de publicar.')
      return
    }
    if (sinCambios) {
      toast.info('No hay cambios para publicar.')
      return
    }
    setMensajePublicacion(comparacion.soloOrden ? 'Cambio de orden de secciones' : '')
    setDialogoPublicar(true)
  }

  function soltar(evento: DragEvent<HTMLDivElement>, destino: string) {
    evento.preventDefault()
    setSobre(null)
    if (arrastrando) reordenar(arrastrando, destino)
    setArrastrando(null)
  }

  if (cargando) {
    return (
      <div className="min-h-svh">
        <div className="border-b border-black/5 bg-white/80 px-4 py-4 md:px-8">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-6 w-48" />
        </div>
        <div className="mx-auto grid max-w-[1200px] gap-6 p-4 md:p-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-[30rem] rounded-2xl" />
          <Skeleton className="hidden h-64 rounded-2xl lg:block" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 md:py-24">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
          <span className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full">
            <Info className="size-6" />
          </span>
          <h2 className="text-enel-navy mt-4 text-lg font-semibold">No se pudo cargar el orden</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {error ?? 'No hay datos del borrador.'}
          </p>
          <Button className="mt-5" onClick={() => void cargar()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  async function activarModoEdicion() {
    setActivando(true)
    try {
      await activarEdicion()
      await cargar()
      toast.success('Modo edición activado. Ya puedes reordenar las secciones.')
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setActivando(false)
    }
  }

  const enEdicion = Boolean(draft)

  return (
    <div className="min-h-svh">
      <CmsPageHeader
        back={{ to: '/cms', label: 'Volver al contenido' }}
        eyebrow="Orden del recorrido"
        title="Orden de secciones"
        description={
          enEdicion ? (
            <span className="text-muted-foreground text-xs">
              Arrastra las secciones para cambiar el orden. El portal no cambia hasta que publiques.
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">
              Modo lectura · así está publicado el portal en este momento.
            </span>
          )
        }
        actions={
          enEdicion ? (
            <>
              <Button
                variant="outline"
                onClick={() => void guardar()}
                disabled={!dirty || guardando}
              >
                <FloppyDisk data-icon="inline-start" />
                Guardar orden
              </Button>
              <span
                className="inline-flex"
                title={
                  dirty
                    ? 'Guarda los cambios antes de publicar.'
                    : guardando
                      ? 'Guardando los cambios…'
                      : sinCambios
                        ? 'No hay cambios para publicar.'
                        : undefined
                }
              >
                <Button onClick={abrirDialogoPublicar} disabled={guardando || dirty || sinCambios}>
                  <CloudArrowUp data-icon="inline-start" />
                  Publicar cambios
                </Button>
              </span>
            </>
          ) : (
            <Button asChild variant="outline">
              <Link to="/cms/revisiones">Ver versiones</Link>
            </Button>
          )
        }
      />

      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
        {conflicto && (
          <div className="mb-4">
            <CmsConflictoBanner onRecargar={() => void cargar()} />
          </div>
        )}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,44%)]">
          <div className="flex min-w-0 flex-col gap-4">
            {!enEdicion && (
              <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="bg-enel-blue/10 text-enel-blue flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <PencilSimpleLine className="size-5" weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-enel-navy text-base font-semibold">Modo lectura</h2>
                    <p className="text-muted-foreground mt-1 max-w-xl text-sm leading-relaxed">
                      Este es el orden publicado. Activa el modo edición para cambiarlo; se creará
                      un borrador.
                    </p>
                  </div>
                  <Button
                    className="shrink-0"
                    onClick={() => void activarModoEdicion()}
                    disabled={activando}
                  >
                    <PencilSimpleLine data-icon="inline-start" />
                    {activando ? 'Activando…' : 'Activar modo edición'}
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
                <div>
                  <h2 className="text-enel-navy text-base font-semibold">Recorrido del portal</h2>
                  <p className="text-muted-foreground text-xs">
                    {enEdicion
                      ? dirty
                        ? 'Tienes cambios sin guardar en el borrador.'
                        : 'Así se verá el orden en el portal.'
                      : 'Este es el orden que ve el portal público.'}
                  </p>
                </div>
                <Badge
                  variant={dirty ? 'secondary' : 'outline'}
                  className="text-[10px] tabular-nums"
                >
                  {enEdicion
                    ? dirty
                      ? 'Sin guardar'
                      : 'Borrador guardado'
                    : `Publicado · v${published?.number ?? '—'}`}
                </Badge>
              </div>

              <ol className="flex flex-col gap-2 p-3 md:p-4">
                {orden.map((clave, indice) => {
                  const detalle = detallePorClave.get(clave)
                  const etiqueta =
                    (payloadVisible?.sections[clave]?.nav_label as string | undefined) ??
                    detalle?.label ??
                    clave
                  const fija = !detalle?.reorderable
                  const anterior = indice > 0 ? detallePorClave.get(orden[indice - 1] ?? '') : null
                  const siguiente =
                    indice < orden.length - 1 ? detallePorClave.get(orden[indice + 1] ?? '') : null
                  const puedeSubir = enEdicion && !fija && Boolean(anterior?.reorderable)
                  const puedeBajar = enEdicion && !fija && Boolean(siguiente?.reorderable)
                  const arrastrable = enEdicion && !fija

                  return (
                    <li key={clave}>
                      <div
                        draggable={arrastrable}
                        onDragStart={(evento) => {
                          if (!arrastrable) {
                            evento.preventDefault()
                            return
                          }
                          evento.dataTransfer.effectAllowed = 'move'
                          evento.dataTransfer.setData('text/plain', clave)
                          setArrastrando(clave)
                        }}
                        onDragEnd={() => {
                          setArrastrando(null)
                          setSobre(null)
                        }}
                        onDragOver={(evento) => {
                          if (!arrastrable) return
                          evento.preventDefault()
                          evento.dataTransfer.dropEffect = 'move'
                          if (sobre !== clave) setSobre(clave)
                        }}
                        onDragLeave={() => setSobre((actual) => (actual === clave ? null : actual))}
                        onDrop={(evento) => soltar(evento, clave)}
                        className={cn(
                          'group flex items-center gap-2.5 rounded-xl border bg-white px-2.5 py-2.5 transition-all sm:gap-3 sm:px-3',
                          arrastrable && 'cursor-grab active:cursor-grabbing',
                          arrastrando === clave && 'opacity-40',
                          sobre === clave && arrastrando !== clave
                            ? 'border-enel-blue/50 bg-enel-blue/[0.03] ring-enel-blue/10 ring-2'
                            : 'border-black/[0.07] hover:border-black/10 hover:shadow-xs',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums',
                            fija
                              ? 'bg-enel-mist text-muted-foreground'
                              : 'bg-enel-blue/10 text-enel-blue',
                          )}
                        >
                          {indice + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-enel-navy truncate text-sm font-medium">
                              {etiqueta}
                            </p>
                            {fija && (
                              <Badge
                                variant="outline"
                                className="h-4 shrink-0 gap-1 px-1.5 text-[9px]"
                              >
                                <LockKey className="size-2.5" weight="bold" />
                                Fija
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground truncate text-[11px]">
                            {detalle?.description || clave}
                          </p>
                        </div>

                        {arrastrable && (
                          <span
                            className="text-muted-foreground/40 group-hover:text-muted-foreground hidden shrink-0 sm:block"
                            aria-hidden="true"
                          >
                            <DotsSixVertical className="size-5" />
                          </span>
                        )}
                        {!enEdicion && fija && (
                          <span className="hidden shrink-0 sm:block" aria-hidden="true">
                            <LockKey className="text-muted-foreground/30 size-4" />
                          </span>
                        )}

                        {enEdicion && (
                          <div className="flex shrink-0 items-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Mover ${etiqueta} arriba`}
                              title="Mover arriba"
                              disabled={!puedeSubir}
                              onClick={() => mover(indice, -1)}
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Mover ${etiqueta} abajo`}
                              title="Mover abajo"
                              disabled={!puedeBajar}
                              onClick={() => mover(indice, 1)}
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 bg-[#fbfcfd] px-5 py-3">
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px]">
                  {enEdicion ? (
                    <>
                      <DotsSixVertical className="size-3.5" />
                      Arrastra una fila o usa las flechas
                    </>
                  ) : (
                    <>
                      <LockKey className="size-3.5" />
                      Orden publicado y visible en el portal
                    </>
                  )}
                </span>
                <span className="text-muted-foreground/70 text-[11px] tabular-nums">
                  {orden.length} secciones
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
                Cómo funciona
              </p>
              <ul className="mt-3 flex flex-col gap-3 text-xs leading-relaxed">
                <li className="flex gap-2.5">
                  <CheckCircle className="text-enel-blue mt-0.5 size-4 shrink-0" weight="fill" />
                  <span>
                    <strong className="text-enel-navy font-medium">Inicio</strong> y{' '}
                    <strong className="text-enel-navy font-medium">Cierre</strong> están fijados en
                    los extremos del recorrido.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle className="text-enel-blue mt-0.5 size-4 shrink-0" weight="fill" />
                  <span>Arrastra una sección o usa las flechas para moverla.</span>
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle className="text-enel-blue mt-0.5 size-4 shrink-0" weight="fill" />
                  <span>
                    El orden alimenta la página, el header y el índice lateral del portal.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-24 xl:self-start">
            <div className="bg-enel-navy relative overflow-hidden rounded-2xl p-5 text-white shadow-sm">
              <div className="bg-enel-blue/30 pointer-events-none absolute -top-10 -right-10 size-32 rounded-full blur-2xl" />
              <p className="relative text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                {enEdicion ? 'Estado del borrador' : 'Contenido publicado'}
              </p>
              <p className="relative mt-1.5 text-2xl font-semibold tabular-nums">
                {enEdicion ? 'Sin publicar' : `v${published?.number ?? '—'}`}
              </p>
              <p className="relative mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/55">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    enEdicion ? (dirty ? 'bg-amber-400' : 'bg-sky-400') : 'bg-emerald-400',
                  )}
                />
                {enEdicion
                  ? dirty
                    ? 'Cambios sin guardar'
                    : 'Borrador guardado'
                  : 'Visible en el portal'}
              </p>
              <div className="relative mt-4 space-y-1.5 border-t border-white/10 pt-3 text-[11px]">
                {enEdicion ? (
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/40">Última edición</span>
                      <span className="text-right text-white/80">
                        {fechaHora(draft?.updated_at)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/40">Por</span>
                      <span className="max-w-[9rem] truncate text-right text-white/80">
                        {draft?.updated_by?.name ?? '—'}
                      </span>
                    </div>
                    {draft?.message && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white/40">Nota</span>
                        <span className="line-clamp-3 text-white/80" title={draft.message}>
                          {draft.message}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/40">Última publicación</span>
                      <span className="text-right text-white/80">
                        {fechaHora(published?.published_at)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-white/40">Autor</span>
                      <span className="max-w-[9rem] truncate text-right text-white/80">
                        {published?.published_by?.name ?? '—'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <VistaPreviaPortal
              payload={payloadPreview}
              enVivo={enEdicion}
              className="h-[62svh] xl:h-[calc(100svh-19rem)]"
            />
          </aside>
        </div>
      </div>

      <Dialog open={dialogoPublicar} onOpenChange={setDialogoPublicar}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-enel-navy text-lg">Publicar cambios</DialogTitle>
            <DialogDescription>
              Se publicará el contenido y el orden actuales. El portal se actualizará de inmediato y
              volverás al modo lectura.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-black/[0.06] bg-[#fbfcfd] p-4">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
              Resumen
            </p>
            <ul className="mt-2.5 flex flex-col gap-2 text-[13px]">
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-emerald-500" weight="fill" />
                {orden.length} secciones en el portal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-emerald-500" weight="fill" />
                Se creará una versión nueva
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-emerald-500" weight="fill" />
                La publicación actual es la v{published?.number ?? '—'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-emerald-500" weight="fill" />
                {comparacion.contenido && comparacion.orden
                  ? 'Cambian contenido y orden.'
                  : comparacion.contenido
                    ? 'Cambian textos o imágenes; el orden se mantiene.'
                    : comparacion.soloOrden
                      ? 'Solo cambia el orden de las secciones.'
                      : 'No hay cambios pendientes.'}
              </li>
            </ul>
          </div>

          {comparacion.contenido && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              También se publicarán los cambios de contenido del borrador.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="mensaje-publicacion-orden" className="text-sm font-medium">
              Mensaje de la publicación{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Textarea
              id="mensaje-publicacion-orden"
              value={mensajePublicacion}
              onChange={(e) => setMensajePublicacion(e.target.value)}
              placeholder="Ej: Ajuste de orden y textos de Portada"
              maxLength={255}
              rows={3}
            />
            <p className="text-muted-foreground text-[11px]">
              Quedará en el historial de versiones.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogoPublicar(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button onClick={() => void publicar()} disabled={guardando}>
              <CloudArrowUp data-icon="inline-start" />
              {guardando ? 'Publicando…' : 'Publicar ahora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
