import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowClockwise,
  ArrowRight,
  BookOpen,
  Buildings,
  CheckCircle,
  ClockCounterClockwise,
  CloudArrowUp,
  Desktop,
  DeviceMobile,
  Eye,
  EyeSlash,
  Files,
  Flag,
  FloppyDisk,
  Graph,
  Heart,
  House,
  Images,
  LockKey,
  MagnifyingGlass,
  MapTrifold,
  NewspaperClipping,
  PencilSimpleLine,
  ShieldCheck,
  Tag,
  TreeStructure,
  WarningCircle,
} from '@phosphor-icons/react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { CmsPageHeader } from '@/components/cms/CmsPageHeader'
import { CampoEditor } from '@/components/cms/CampoEditor'
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useEstadoEditor } from '@/lib/cms/estadoEditor'
import { cn } from '@/lib/utils'
import {
  activarEdicion,
  descartarBorrador,
  guardarBorrador,
  obtenerContenidoAdmin,
  obtenerSchema,
  publicarContenido,
} from '@/services/cms'
import type {
  CmsFieldValue,
  CmsRevision,
  CmsRevisionDetail,
  CmsSchemaResponse,
  CmsSectionSchema,
  CmsSectionValues,
  RichTextDoc,
  RichTextNode,
} from '@/types/cms'

const ICONOS_SECCION: Record<string, typeof House> = {
  portada: House,
  historia: BookOpen,
  cultura: Heart,
  organigrama: TreeStructure,
  'concesion-detalle': MapTrifold,
  cadena: Graph,
  politicas: ShieldCheck,
  galerias: Images,
  personas: NewspaperClipping,
  espacios: Buildings,
  cierre: Flag,
}

function iconoDe(clave: string) {
  return ICONOS_SECCION[clave] ?? Files
}

function textoNodo(nodo?: RichTextNode): string {
  if (!nodo) return ''
  const propio = nodo.text ?? ''
  const hijos = (nodo.content ?? []).map((hijo) => textoNodo(hijo)).join(' ')
  return `${propio} ${hijos}`
}

function estaVacio(valor: CmsFieldValue): boolean {
  if (valor === null || valor === undefined) return true
  if (typeof valor === 'string') return valor.trim().length === 0
  if (typeof valor === 'number') return false
  if (Array.isArray(valor)) return valor.length === 0
  const documento = valor as RichTextDoc
  return !(documento.content ?? []).some((nodo) => textoNodo(nodo).trim().length > 0)
}

function fechaHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function fechaCorta(valor: string | null | undefined): string {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function detalleError(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === 'string') return data
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

export function CmsEditor() {
  const [schema, setSchema] = useState<CmsSchemaResponse | null>(null)
  const [draft, setDraft] = useState<CmsRevisionDetail | null>(null)
  const [published, setPublished] = useState<CmsRevision | null>(null)
  const [hayCambiosPendientes, setHayCambiosPendientes] = useState(false)
  const [activa, setActiva] = useState<string>('portada')
  const [filtro, setFiltro] = useState('')
  const [dirty, setDirty] = useState(false)
  const setDirtyGlobal = useEstadoEditor((estado) => estado.setDirty)
  const [saving, setSaving] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conflicto, setConflicto] = useState(false)
  const [dialogoPublicar, setDialogoPublicar] = useState(false)
  const [dialogoDescartar, setDialogoDescartar] = useState(false)
  const [descartando, setDescartando] = useState(false)
  const [activando, setActivando] = useState(false)
  const [mensajePublicacion, setMensajePublicacion] = useState('')
  const [previewVisible, setPreviewVisible] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches,
  )
  const [previewListo, setPreviewListo] = useState(false)
  const [modoPreview, setModoPreview] = useState<'escritorio' | 'movil'>('escritorio')
  const previewRef = useRef<HTMLIFrameElement>(null)

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const [esquema, contenido] = await Promise.all([obtenerSchema(), obtenerContenidoAdmin()])
      setSchema(esquema)
      setDraft(contenido.draft)
      setPublished(contenido.published)
      setHayCambiosPendientes(contenido.has_unpublished_changes)
      if (contenido.draft) {
        setActiva((actual) =>
          contenido.draft!.payload.order.includes(actual)
            ? actual
            : (contenido.draft!.payload.order[0] ?? 'portada'),
        )
      }
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

  useEffect(() => {
    setDirtyGlobal(dirty)
    return () => setDirtyGlobal(false)
  }, [dirty, setDirtyGlobal])

  const seccionesPorClave = useMemo(() => {
    const mapa = new Map<string, CmsSectionSchema>()
    schema?.sections.forEach((seccion) => mapa.set(seccion.key, seccion))
    return mapa
  }, [schema])

  const order = useMemo(() => draft?.payload.order ?? [], [draft])
  const seccionActiva = seccionesPorClave.get(activa)
  const valoresActivos = (draft?.payload.sections[activa] ?? {}) as CmsSectionValues

  const faltantes = useMemo(() => {
    const mapa = new Map<string, number>()
    if (!draft) return mapa
    for (const seccion of schema?.sections ?? []) {
      const valores = draft.payload.sections[seccion.key] ?? {}
      const pendientes = seccion.fields.filter((campo) => {
        if (!campo.required) return false
        const valor = valores[campo.key] ?? (campo.default as CmsFieldValue)
        return estaVacio(valor)
      }).length
      mapa.set(seccion.key, pendientes)
    }
    return mapa
  }, [draft, schema])

  const seccionesVisibles = useMemo(() => {
    const consulta = filtro.trim().toLowerCase()
    return order.filter((clave) => {
      if (!consulta) return true
      const seccion = seccionesPorClave.get(clave)
      const etiqueta = (draft?.payload.sections[clave]?.nav_label as string | undefined) ?? ''
      return `${seccion?.label ?? ''} ${etiqueta} ${clave}`.toLowerCase().includes(consulta)
    })
  }, [order, filtro, seccionesPorClave, draft])

  function actualizarCampo(campo: string, valor: CmsFieldValue) {
    setDraft((anterior) => {
      if (!anterior) return anterior
      return {
        ...anterior,
        payload: {
          ...anterior.payload,
          sections: {
            ...anterior.payload.sections,
            [activa]: {
              ...(anterior.payload.sections[activa] ?? {}),
              [campo]: valor,
            },
          },
        },
      }
    })
    setDirty(true)
  }

  async function persistir(silencioso = false): Promise<CmsRevisionDetail | null> {
    if (!draft) return null
    if (!dirty) return draft

    setSaving(true)
    try {
      const respuesta = await guardarBorrador(draft.payload, draft.version)
      setDraft(respuesta.draft)
      setHayCambiosPendientes(respuesta.has_unpublished_changes ?? true)
      setDirty(false)
      setConflicto(false)
      return respuesta.draft
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setConflicto(true)
        toast.error('Otra persona guardó el borrador. Recarga para continuar.')
      } else if (!silencioso) {
        toast.error(detalleError(err))
      }
      return null
    } finally {
      setSaving(false)
    }
  }

  async function guardar() {
    const guardado = await persistir()
    if (guardado) toast.success('Borrador guardado.')
  }

  const guardarRef = useRef(guardar)
  guardarRef.current = guardar
  const persistirRef = useRef(persistir)
  persistirRef.current = persistir

  async function publicar() {
    const guardado = await persistir()
    if (!guardado) return

    setSaving(true)
    try {
      const respuesta = await publicarContenido(mensajePublicacion)
      setPublished(respuesta.published)
      setDraft(respuesta.draft)
      setHayCambiosPendientes(false)
      setDirty(false)
      setDialogoPublicar(false)
      setMensajePublicacion('')
      toast.success('Contenido publicado. Ya está visible en el portal.')
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 's') {
        evento.preventDefault()
        if (!saving && dirty) void guardarRef.current()
      }
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [saving, dirty])

  // Autoguardado: el borrador queda en el servidor aunque se cierre el equipo.
  useEffect(() => {
    if (!dirty || saving || conflicto) return
    const timer = window.setTimeout(() => {
      void persistirRef.current(true)
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [dirty, saving, conflicto, draft])

  async function descartarBorradorActual() {
    setDescartando(true)
    try {
      const respuesta = await descartarBorrador()
      setDraft(respuesta.draft)
      setHayCambiosPendientes(false)
      setDirty(false)
      setConflicto(false)
      setDialogoDescartar(false)
      toast.success('Borrador descartado. Se restauró la última publicación.')
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setDescartando(false)
    }
  }

  async function activarModoEdicion() {
    setActivando(true)
    try {
      const respuesta = await activarEdicion()
      setDraft(respuesta.draft)
      setHayCambiosPendientes(respuesta.has_unpublished_changes)
      setActiva(respuesta.draft.payload.order[0] ?? 'portada')
      setDirty(false)
      setConflicto(false)
      toast.success('Modo edición activado. Ya puedes editar el borrador.')
    } catch (err) {
      toast.error(detalleError(err))
    } finally {
      setActivando(false)
    }
  }

  useEffect(() => {
    if (!dirty) return
    function alSalir(evento: BeforeUnloadEvent) {
      evento.preventDefault()
      evento.returnValue = ''
    }
    window.addEventListener('beforeunload', alSalir)
    return () => window.removeEventListener('beforeunload', alSalir)
  }, [dirty])

  useEffect(() => {
    function recibir(evento: MessageEvent) {
      if (evento.origin !== window.location.origin) return
      const data = evento.data as { tipo?: string }
      if (data?.tipo === 'cms:listo') setPreviewListo(true)
    }
    window.addEventListener('message', recibir)
    return () => window.removeEventListener('message', recibir)
  }, [])

  useEffect(() => {
    if (!previewVisible) {
      setPreviewListo(false)
      return
    }
    if (!previewListo || !draft) return
    const timer = window.setTimeout(() => {
      previewRef.current?.contentWindow?.postMessage(
        { tipo: 'cms:draft', payload: draft.payload },
        window.location.origin,
      )
    }, 150)
    return () => window.clearTimeout(timer)
  }, [draft, previewListo, previewVisible])

  useEffect(() => {
    if (!previewVisible || !previewListo) return
    const timer = window.setTimeout(() => {
      previewRef.current?.contentWindow?.postMessage(
        { tipo: 'cms:scroll', id: activa },
        window.location.origin,
      )
    }, 260)
    return () => window.clearTimeout(timer)
  }, [activa, previewVisible, previewListo])

  function alternarPreview() {
    const siguiente = !previewVisible
    setPreviewVisible(siguiente)
    if (!siguiente) setPreviewListo(false)
  }

  function recargarPreview() {
    setPreviewListo(false)
    previewRef.current?.contentWindow?.location.reload()
  }

  if (cargando) {
    return (
      <div className="min-h-svh">
        <div className="border-b border-black/5 bg-white/80 px-4 py-4 md:px-8">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-6 w-56" />
        </div>
        <div className="mx-auto grid max-w-[1440px] gap-6 p-4 md:p-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="hidden h-44 rounded-2xl lg:block" />
          </div>
          <Skeleton className="h-[38rem] rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !schema) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:py-24">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
          <span className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full">
            <WarningCircle className="size-6" />
          </span>
          <h2 className="text-enel-navy mt-4 text-lg font-semibold">No se pudo cargar el CMS</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {error ?? 'La respuesta del servidor llegó incompleta.'}
          </p>
          <Button className="mt-5" onClick={() => void cargar()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="min-h-svh">
        <CmsPageHeader
          eyebrow="Contenido del portal"
          title="Editor de contenido"
          description={
            <span className="text-muted-foreground text-xs">
              Modo lectura · el portal está mostrando la última publicación.
            </span>
          }
          actions={
            <Button onClick={() => void activarModoEdicion()} disabled={activando}>
              <PencilSimpleLine data-icon="inline-start" />
              {activando ? 'Activando…' : 'Activar modo edición'}
            </Button>
          }
        />

        <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
            <span className="bg-enel-blue/10 text-enel-blue mx-auto flex size-12 items-center justify-center rounded-xl">
              <PencilSimpleLine className="size-6" weight="duotone" />
            </span>
            <h2 className="text-enel-navy mt-4 text-xl font-semibold tracking-tight">
              Modo lectura
            </h2>
            <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-relaxed">
              No hay un borrador activo. Para editar el contenido, activa el modo edición. Recién
              entonces se crea un borrador y podrás guardar cambios.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Button size="lg" onClick={() => void activarModoEdicion()} disabled={activando}>
                <PencilSimpleLine data-icon="inline-start" />
                {activando ? 'Activando…' : 'Activar modo edición'}
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/cms/revisiones">Ver historial</Link>
              </Button>
            </div>

            <div className="border-border text-muted-foreground mt-8 border-t pt-4 text-xs">
              Publicado: v{published?.version ?? '—'}
              {published?.published_at ? ` · ${fechaHora(published.published_at)}` : ''}
              {published?.published_by ? ` · ${published.published_by.name}` : ''}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const faltantesActiva = faltantes.get(activa) ?? 0
  const IconoActivo = iconoDe(activa)
  const indiceActivo = Math.max(0, order.indexOf(activa))

  return (
    <div className="min-h-svh">
      <CmsPageHeader
        eyebrow="Contenido del portal"
        title="Editor de contenido"
        description={
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  saving ? 'bg-primary animate-pulse' : dirty ? 'bg-amber-500' : 'bg-emerald-500',
                )}
              />
              <span className="text-foreground/70 font-medium">
                {saving ? 'Guardando…' : dirty ? 'Cambios sin guardar' : 'Borrador guardado'}
              </span>
            </span>
            <span className="text-black/15">·</span>
            <span className="tabular-nums">Versión v{draft.version}</span>
            <span className="text-black/15">·</span>
            <span>
              {published?.published_at
                ? `Última publicación: ${fechaHora(published.published_at)}`
                : 'Todavía sin publicar'}
            </span>
          </div>
        }
        actions={
          <>
            <Button
              variant={previewVisible ? 'secondary' : 'outline'}
              onClick={alternarPreview}
              aria-pressed={previewVisible}
              title={
                previewVisible
                  ? 'Ocultar la vista previa en vivo'
                  : 'Mostrar la vista previa en vivo'
              }
            >
              {previewVisible ? (
                <EyeSlash data-icon="inline-start" />
              ) : (
                <Eye data-icon="inline-start" />
              )}
              Vista previa
            </Button>
            <Button
              variant={dirty ? 'secondary' : 'outline'}
              onClick={() => void guardar()}
              disabled={!dirty || saving}
              title="Guardar borrador (Ctrl+S)"
            >
              <FloppyDisk data-icon="inline-start" />
              Guardar
            </Button>
            <Button onClick={() => setDialogoPublicar(true)} disabled={saving}>
              <CloudArrowUp data-icon="inline-start" />
              Publicar
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4">
          {conflicto && (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <WarningCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Hay una versión más nueva del borrador</p>
                  <p className="text-red-700/80">
                    Otra persona guardó cambios mientras editabas. Recarga para no sobrescribirlos.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-red-200 bg-white text-red-700 hover:bg-red-100 hover:text-red-800"
                onClick={() => void cargar()}
              >
                Recargar borrador
              </Button>
            </div>
          )}

          {!dirty && hayCambiosPendientes && (
            <div className="flex flex-col gap-3 rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <ClockCounterClockwise className="mt-0.5 size-5 shrink-0 text-sky-600" />
                <div>
                  <p className="font-medium text-sky-950">Tienes un borrador guardado</p>
                  <p className="text-sky-900/70">
                    Última edición: {fechaHora(draft.updated_at)}
                    {draft.updated_by ? ` · ${draft.updated_by.name}` : ''}. Puedes continuar donde
                    quedaste o publicarlo cuando esté listo.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-sky-200 bg-white text-sky-800 hover:bg-sky-100 hover:text-sky-900"
                onClick={() => setDialogoDescartar(true)}
              >
                Descartar cambios
              </Button>
            </div>
          )}

          <div
            className={cn(
              'grid gap-6',
              previewVisible ? 'xl:grid-cols-[minmax(0,1fr)_minmax(380px,42%)]' : 'grid-cols-1',
            )}
          >
            <div
              className={cn(
                'grid min-w-0 gap-6',
                previewVisible
                  ? 'grid-cols-1 2xl:grid-cols-[220px_minmax(0,1fr)]'
                  : 'lg:grid-cols-[300px_minmax(0,1fr)]',
              )}
            >
              <aside
                className={cn(
                  'flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start',
                  previewVisible && 'hidden 2xl:flex',
                )}
              >
                <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#fbfcfd] shadow-sm">
                  <div className="border-b border-black/5 px-3.5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-enel-navy text-[11px] font-semibold tracking-[0.14em] uppercase">
                        Secciones
                      </p>
                      <span className="text-muted-foreground/70 text-[11px] tabular-nums">
                        {order.length}
                      </span>
                    </div>
                    <div className="relative mt-2.5">
                      <MagnifyingGlass className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                      <Input
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        placeholder="Buscar sección…"
                        aria-label="Buscar sección"
                        className="h-8 bg-white pl-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto p-1.5 lg:max-h-[calc(100svh-27rem)]">
                    {seccionesVisibles.map((clave) => {
                      const seccion = seccionesPorClave.get(clave)
                      if (!seccion) return null
                      const indice = order.indexOf(clave)
                      const etiqueta =
                        (draft.payload.sections[clave]?.nav_label as string | undefined) ??
                        seccion.label
                      const pendientes = faltantes.get(clave) ?? 0
                      const estaActiva = activa === clave
                      const Icono = iconoDe(clave)

                      return (
                        <button
                          key={clave}
                          type="button"
                          aria-current={estaActiva ? 'true' : undefined}
                          onClick={() => setActiva(clave)}
                          className={cn(
                            'group flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-all',
                            estaActiva
                              ? 'bg-white shadow-[0_1px_2px_rgba(16,20,24,0.05),0_8px_24px_-14px_rgba(16,20,24,0.28)] ring-1 ring-black/[0.06]'
                              : 'hover:bg-white/80',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                              estaActiva
                                ? 'bg-enel-blue text-white'
                                : 'bg-enel-mist text-muted-foreground group-hover:text-enel-navy',
                            )}
                          >
                            <Icono className="size-4" weight={estaActiva ? 'fill' : 'regular'} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={cn(
                                'block truncate text-[13px] font-medium',
                                estaActiva ? 'text-enel-navy' : 'text-foreground/75',
                              )}
                            >
                              {etiqueta}
                            </span>
                            <span className="text-muted-foreground/80 block truncate text-[11px]">
                              {seccion.description || `${indice + 1}. ${seccion.label}`}
                            </span>
                          </span>
                          {pendientes > 0 && (
                            <span
                              title={`${pendientes} campo(s) obligatorio(s) pendiente(s)`}
                              className="size-1.5 shrink-0 rounded-full bg-amber-400"
                            />
                          )}
                          {!seccion.reorderable && (
                            <LockKey className="text-muted-foreground/40 size-3 shrink-0" />
                          )}
                        </button>
                      )
                    })}

                    {seccionesVisibles.length === 0 && (
                      <p className="text-muted-foreground px-3 py-6 text-center text-xs">
                        No hay secciones que coincidan con “{filtro}”.
                      </p>
                    )}
                  </div>
                </div>

                <div className="hidden rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm lg:block">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
                      Estado del borrador
                    </p>
                    <Badge variant={dirty ? 'secondary' : 'outline'} className="h-5 text-[10px]">
                      {dirty ? 'Sin guardar' : 'Guardado'}
                    </Badge>
                  </div>
                  <p className="text-enel-navy mt-2 text-2xl font-semibold tabular-nums">
                    v{draft.version}
                  </p>
                  <dl className="mt-3 space-y-2 text-[11px]">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Publicado</dt>
                      <dd className="text-foreground/80 text-right">
                        {fechaCorta(published?.published_at)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted-foreground">Autor</dt>
                      <dd className="text-foreground/80 max-w-[9rem] truncate text-right">
                        {published?.published_by?.name ?? '—'}
                      </dd>
                    </div>
                  </dl>
                  <Button asChild variant="ghost" size="sm" className="mt-2 w-full justify-between">
                    <Link to="/cms/revisiones">
                      Ver historial
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </aside>

              <section className="flex min-w-0 flex-col gap-4">
                {previewVisible && (
                  <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm 2xl:hidden">
                    <div className="flex gap-1 overflow-x-auto p-1.5">
                      {order.map((clave) => {
                        const seccion = seccionesPorClave.get(clave)
                        if (!seccion) return null
                        const etiqueta =
                          (draft.payload.sections[clave]?.nav_label as string | undefined) ??
                          seccion.label
                        const estaActiva = activa === clave
                        const pendientes = faltantes.get(clave) ?? 0
                        return (
                          <button
                            key={clave}
                            type="button"
                            aria-current={estaActiva ? 'true' : undefined}
                            onClick={() => setActiva(clave)}
                            className={cn(
                              'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                              estaActiva
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                          >
                            {etiqueta}
                            {pendientes > 0 && (
                              <span
                                className={cn(
                                  'size-1.5 rounded-full',
                                  estaActiva ? 'bg-white/70' : 'bg-amber-400',
                                )}
                              />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {seccionActiva ? (
                  <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
                    <div className="to-enel-mist/50 flex flex-col gap-4 border-b border-black/[0.06] bg-gradient-to-br from-white via-white px-5 py-5 md:flex-row md:items-start md:px-7">
                      <span className="bg-enel-blue/10 text-enel-blue flex size-11 shrink-0 items-center justify-center rounded-xl">
                        <IconoActivo className="size-5" weight="duotone" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-enel-navy text-lg font-semibold tracking-tight">
                            {seccionActiva.label}
                          </h2>
                          <Badge
                            variant="outline"
                            className="bg-white/70 text-[10px] font-medium tabular-nums"
                          >
                            Sección {indiceActivo + 1} de {order.length}
                          </Badge>
                          {faltantesActiva > 0 ? (
                            <Badge className="bg-amber-100 text-[10px] text-amber-800 hover:bg-amber-100">
                              {faltantesActiva} campo{faltantesActiva === 1 ? '' : 's'} pendiente
                              {faltantesActiva === 1 ? '' : 's'}
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-[10px] text-emerald-700 hover:bg-emerald-100">
                              <CheckCircle className="size-3" weight="fill" />
                              Completa
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                          {seccionActiva.description}
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-black/[0.05]">
                      {seccionActiva.fields.map((campo) => (
                        <div
                          key={`${seccionActiva.key}-${campo.key}`}
                          className="px-5 py-5 md:px-7 md:py-6"
                        >
                          {campo.key === 'nav_label' ? (
                            <div className="rounded-xl border border-black/[0.06] bg-[#fbfcfd] p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <Tag className="text-enel-blue size-3.5" />
                                <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
                                  Navegación del portal
                                </p>
                              </div>
                              <CampoEditor
                                field={campo}
                                value={
                                  (valoresActivos[campo.key] ??
                                    (campo.default as CmsFieldValue)) as CmsFieldValue
                                }
                                onChange={(valor) => actualizarCampo(campo.key, valor)}
                              />
                            </div>
                          ) : (
                            <CampoEditor
                              field={campo}
                              value={
                                (valoresActivos[campo.key] ??
                                  (campo.default as CmsFieldValue)) as CmsFieldValue
                              }
                              onChange={(valor) => actualizarCampo(campo.key, valor)}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 border-t border-black/5 bg-[#fbfcfd] px-5 py-3 sm:flex-row sm:items-center sm:justify-between md:px-7">
                      <p className="text-muted-foreground max-w-xl text-[11px] leading-relaxed">
                        Los cambios se guardan en el borrador. El portal público no cambia hasta que
                        publiques.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void guardar()}
                        disabled={!dirty || saving}
                        className="shrink-0 bg-white"
                      >
                        <FloppyDisk data-icon="inline-start" />
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center text-sm">
                    Selecciona una sección para editar su contenido.
                  </div>
                )}
              </section>
            </div>

            {previewVisible && (
              <div className="min-w-0">
                <div className="xl:sticky xl:top-24">
                  <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm xl:flex xl:h-[calc(100svh-8rem)] xl:flex-col">
                    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/5 px-3 py-2">
                      <div className="text-enel-navy flex items-center gap-2 text-[11px] font-medium">
                        <span className="relative flex size-1.5">
                          <span className="bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-50" />
                          <span className="bg-primary relative inline-flex size-1.5 rounded-full" />
                        </span>
                        Vista previa en vivo
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant={modoPreview === 'escritorio' ? 'secondary' : 'ghost'}
                          size="icon-xs"
                          aria-label="Vista de escritorio"
                          aria-pressed={modoPreview === 'escritorio'}
                          title="Escritorio"
                          onClick={() => setModoPreview('escritorio')}
                        >
                          <Desktop className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant={modoPreview === 'movil' ? 'secondary' : 'ghost'}
                          size="icon-xs"
                          aria-label="Vista móvil"
                          aria-pressed={modoPreview === 'movil'}
                          title="Móvil"
                          onClick={() => setModoPreview('movil')}
                        >
                          <DeviceMobile className="size-3.5" />
                        </Button>
                        <span className="mx-1 h-4 w-px bg-black/10" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Recargar vista previa"
                          title="Recargar vista previa"
                          onClick={recargarPreview}
                        >
                          <ArrowClockwise className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'bg-muted/40 relative flex min-h-0 flex-1 justify-center',
                        modoPreview === 'movil' && 'p-3',
                      )}
                    >
                      <iframe
                        ref={previewRef}
                        src="/cms/preview?embed=1"
                        title="Vista previa en vivo del portal"
                        className={cn(
                          'border-0 bg-white',
                          modoPreview === 'movil'
                            ? 'h-[58svh] w-[390px] max-w-full rounded-xl border border-black/10 shadow-lg xl:h-full'
                            : 'h-[68svh] w-full xl:h-full',
                        )}
                      />
                      {!previewListo && (
                        <div className="text-muted-foreground absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/70 text-xs backdrop-blur-[1px]">
                          <span className="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent" />
                          Cargando vista previa…
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={dialogoDescartar} onOpenChange={setDialogoDescartar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar el borrador</AlertDialogTitle>
            <AlertDialogDescription>
              Se reemplazará el borrador actual por el contenido de la última publicación. Los
              cambios sin publicar se perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={descartando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={descartando}
              onClick={(evento) => {
                evento.preventDefault()
                void descartarBorradorActual()
              }}
            >
              {descartando ? 'Descartando…' : 'Descartar cambios'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogoPublicar} onOpenChange={setDialogoPublicar}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-enel-navy text-lg">Publicar cambios</DialogTitle>
            <DialogDescription>
              Se publican de forma atómica el contenido y el orden de las secciones. El portal los
              mostrará de inmediato.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-black/[0.06] bg-[#fbfcfd] p-4">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
              Resumen
            </p>
            <ul className="mt-2.5 flex flex-col gap-2 text-[13px]">
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-emerald-500" weight="fill" />
                {order.length} secciones en el recorrido del portal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-emerald-500" weight="fill" />
                Versión del borrador: v{draft.version}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-emerald-500" weight="fill" />
                {published?.published_at
                  ? `Reemplaza la publicación del ${fechaCorta(published.published_at)}`
                  : 'Será la primera publicación del portal'}
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="mensaje-publicacion" className="text-sm font-medium">
              Mensaje de la publicación{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Textarea
              id="mensaje-publicacion"
              value={mensajePublicacion}
              onChange={(e) => setMensajePublicacion(e.target.value)}
              placeholder="Ej: Actualización de cifras 2025"
              maxLength={255}
              rows={3}
            />
            <p className="text-muted-foreground text-[11px]">
              Quedará registrado en el historial de revisiones.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoPublicar(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void publicar()} disabled={saving}>
              <CloudArrowUp data-icon="inline-start" />
              {saving ? 'Publicando…' : 'Publicar ahora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
