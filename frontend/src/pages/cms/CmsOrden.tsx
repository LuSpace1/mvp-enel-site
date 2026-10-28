import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
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

import { CmsPageHeader } from '@/components/cms/CmsPageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  activarEdicion,
  guardarBorrador,
  obtenerContenidoAdmin,
  obtenerSchema,
  publicarContenido,
} from '@/services/cms'
import type { CmsRevision, CmsRevisionDetail, CmsSchemaResponse } from '@/types/cms'

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

function fechaHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function CmsOrden() {
  const [schema, setSchema] = useState<CmsSchemaResponse | null>(null)
  const [draft, setDraft] = useState<CmsRevisionDetail | null>(null)
  const [published, setPublished] = useState<CmsRevision | null>(null)
  const [orden, setOrden] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [sobre, setSobre] = useState<string | null>(null)
  const [activando, setActivando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const [esquema, contenido] = await Promise.all([obtenerSchema(), obtenerContenidoAdmin()])
      setSchema(esquema)
      setDraft(contenido.draft)
      setPublished(contenido.published)
      setOrden(contenido.draft?.payload.order ?? [])
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
      const respuesta = await guardarBorrador({ ...draft.payload, order: orden }, draft.version)
      setDraft(respuesta.draft)
      setOrden(respuesta.draft.payload.order)
      setDirty(false)
      toast.success('Orden guardado en el borrador.')
      return respuesta.draft
    } catch (err) {
      toast.error(detalleError(err))
      return null
    } finally {
      setGuardando(false)
    }
  }

  async function publicar() {
    const guardado = await guardar()
    if (!guardado) return
    setGuardando(true)
    try {
      const respuesta = await publicarContenido(guardado.version, 'Cambio de orden de secciones')
      setDraft(respuesta.draft)
      setPublished(respuesta.published)
      setOrden(respuesta.draft.payload.order)
      setDirty(false)
      toast.success('Nuevo orden publicado en el portal.')
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setGuardando(false)
    }
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

  if (!draft) {
    return (
      <div className="min-h-svh">
        <CmsPageHeader
          back={{ to: '/cms', label: 'Volver al contenido' }}
          eyebrow="Orden del recorrido"
          title="Orden de secciones"
          description={
            <span className="text-muted-foreground text-xs">
              Modo lectura · no hay un borrador activo.
            </span>
          }
          actions={
            <Button onClick={() => void activarModoEdicion()} disabled={activando}>
              <PencilSimpleLine data-icon="inline-start" />
              {activando ? 'Activando…' : 'Activar modo edición'}
            </Button>
          }
        />
        <div className="mx-auto max-w-lg px-4 py-16 md:py-24">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
            <span className="bg-enel-blue/10 text-enel-blue mx-auto flex size-12 items-center justify-center rounded-xl">
              <PencilSimpleLine className="size-6" weight="duotone" />
            </span>
            <h2 className="text-enel-navy mt-4 text-lg font-semibold">Modo lectura</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              El orden publicado no se modifica hasta que actives el modo edición.
            </p>
            <Button className="mt-5" onClick={() => void activarModoEdicion()} disabled={activando}>
              <PencilSimpleLine data-icon="inline-start" />
              {activando ? 'Activando…' : 'Activar modo edición'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh">
      <CmsPageHeader
        back={{ to: '/cms', label: 'Volver al contenido' }}
        eyebrow="Orden del recorrido"
        title="Orden de secciones"
        description={
          <span className="text-muted-foreground text-xs">
            Arrastra las secciones para definir cómo se recorre el portal.
            {dirty ? ' Hay cambios sin guardar.' : ''}
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => void guardar()} disabled={!dirty || guardando}>
              <FloppyDisk data-icon="inline-start" />
              Guardar orden
            </Button>
            <Button onClick={() => void publicar()} disabled={guardando}>
              <CloudArrowUp data-icon="inline-start" />
              Publicar orden
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
                <div>
                  <h2 className="text-enel-navy text-base font-semibold">Recorrido del portal</h2>
                  <p className="text-muted-foreground text-xs">
                    {dirty
                      ? 'Tienes cambios sin guardar en el borrador.'
                      : 'Así se verá el orden en el portal.'}
                  </p>
                </div>
                <Badge
                  variant={dirty ? 'secondary' : 'outline'}
                  className="text-[10px] tabular-nums"
                >
                  {dirty ? 'Sin guardar' : `v${draft.version}`}
                </Badge>
              </div>

              <ol className="flex flex-col gap-2 p-3 md:p-4">
                {orden.map((clave, indice) => {
                  const detalle = detallePorClave.get(clave)
                  const etiqueta =
                    (draft.payload.sections[clave]?.nav_label as string | undefined) ??
                    detalle?.label ??
                    clave
                  const fija = !detalle?.reorderable
                  const anterior = indice > 0 ? detallePorClave.get(orden[indice - 1] ?? '') : null
                  const siguiente =
                    indice < orden.length - 1 ? detallePorClave.get(orden[indice + 1] ?? '') : null
                  const puedeSubir = !fija && Boolean(anterior?.reorderable)
                  const puedeBajar = !fija && Boolean(siguiente?.reorderable)
                  const arrastrable = !fija

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

                        {arrastrable ? (
                          <span
                            className="text-muted-foreground/40 group-hover:text-muted-foreground hidden shrink-0 sm:block"
                            aria-hidden="true"
                          >
                            <DotsSixVertical className="size-5" />
                          </span>
                        ) : (
                          <span className="hidden shrink-0 sm:block" aria-hidden="true">
                            <LockKey className="text-muted-foreground/30 size-4" />
                          </span>
                        )}

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
                      </div>
                    </li>
                  )
                })}
              </ol>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 bg-[#fbfcfd] px-5 py-3">
                <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px]">
                  <DotsSixVertical className="size-3.5" />
                  Arrastra una fila o usa las flechas
                </span>
                <span className="text-muted-foreground/70 text-[11px] tabular-nums">
                  {orden.length} secciones
                </span>
              </div>
            </div>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
              <div className="bg-enel-navy relative overflow-hidden rounded-2xl p-5 text-white shadow-sm">
                <div className="bg-enel-blue/30 pointer-events-none absolute -top-10 -right-10 size-32 rounded-full blur-2xl" />
                <p className="relative text-[10px] font-semibold tracking-[0.16em] text-white/45 uppercase">
                  Estado del borrador
                </p>
                <p className="relative mt-1.5 text-2xl font-semibold tabular-nums">
                  v{draft.version}
                </p>
                <p className="relative mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/55">
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      dirty ? 'bg-amber-400' : 'bg-emerald-400',
                    )}
                  />
                  {dirty ? 'Cambios sin guardar' : 'Orden guardado'}
                </p>
                <div className="relative mt-4 space-y-1.5 border-t border-white/10 pt-3 text-[11px]">
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
                      <strong className="text-enel-navy font-medium">Cierre</strong> están fijados
                      en los extremos del recorrido.
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
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
