import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Buildings,
  CaretLeft,
  CaretRight,
  CheckCircle,
  CloudArrowUp,
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
  SidebarSimple,
  Tag,
  TreeStructure,
  WarningCircle,
} from '@phosphor-icons/react'
import { isAxiosError } from 'axios'

import { CmsAlert, CmsAlertAction } from '@/components/cms/CmsAlert'
import { CmsConflictoBanner } from '@/components/cms/CmsConflictoBanner'
import { CmsDraftStatus } from '@/components/cms/CmsDraftStatus'
import { CmsHelpButton } from '@/components/cms/CmsHelpButton'
import { CmsPageHeader } from '@/components/cms/CmsPageHeader'
import { CmsTooltip } from '@/components/cms/CmsTooltip'
import { CampoEditor } from '@/components/cms/CampoEditor'
import { VistaPreviaPortal } from '@/components/cms/VistaPreviaPortal'
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
import { fechaHora } from '@/lib/cms/fechas'
import { notificarError, notificarExito, notificarInfo } from '@/lib/cms/notificaciones'
import { cn } from '@/lib/utils'
import {
  activarEdicion,
  descartarBorrador,
  guardarBorrador,
  obtenerContenidoAdmin,
  obtenerContenidoPublico,
  obtenerSchema,
  publicarContenido,
} from '@/services/cms'
import type {
  CmsFieldSchema,
  CmsFieldValue,
  CmsListItem,
  CmsPayload,
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

/** Considera incompleto un campo requerido, incluso dentro de listas anidadas. */
function campoIncompleto(campo: CmsFieldSchema, valor: CmsFieldValue): boolean {
  if (campo.type === 'list') {
    const items = Array.isArray(valor) ? (valor as CmsListItem[]) : []
    if (items.length === 0) return Boolean(campo.required)
    return items.some((item) =>
      (campo.item_fields ?? []).some((sub) =>
        campoIncompleto(sub, item[sub.key] ?? (sub.default as CmsFieldValue)),
      ),
    )
  }
  return Boolean(campo.required) && estaVacio(valor)
}

const CLAVE_SECCIONES = 'cms:secciones-colapsadas'

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

/**
 * Desplazamiento horizontal por proximidad al borde. El trackpad ya funciona,
 * pero con mouse no hay una barra visible: al acercar el puntero a un extremo
 * la lista se mueve sola, con velocidad proporcional a la cercanía.
 */
function useDesplazamientoEnBordes() {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const velocidad = useRef(0)
  const [hayIzquierda, setHayIzquierda] = useState(false)
  const [hayDerecha, setHayDerecha] = useState(false)

  function actualizarBordes() {
    const elemento = ref.current
    if (!elemento) return
    const izquierda = elemento.scrollLeft > 2
    const derecha = elemento.scrollLeft + elemento.clientWidth < elemento.scrollWidth - 2
    setHayIzquierda((valor) => (valor === izquierda ? valor : izquierda))
    setHayDerecha((valor) => (valor === derecha ? valor : derecha))
  }

  function detener() {
    velocidad.current = 0
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }

  function animar() {
    const elemento = ref.current
    if (!elemento || velocidad.current === 0) {
      detener()
      return
    }
    const anterior = elemento.scrollLeft
    elemento.scrollLeft = anterior + velocidad.current
    if (elemento.scrollLeft === anterior) {
      detener()
      return
    }
    frame.current = requestAnimationFrame(animar)
  }

  function mover(evento: React.PointerEvent<HTMLDivElement>) {
    if (evento.pointerType !== 'mouse') return
    const elemento = ref.current
    if (!elemento) return
    const rect = elemento.getBoundingClientRect()
    const posicion = evento.clientX - rect.left
    const zona = Math.min(64, rect.width / 4)
    let siguiente = 0
    if (posicion < zona) {
      siguiente = -((zona - posicion) / zona) * 14
    } else if (posicion > rect.width - zona) {
      siguiente = ((posicion - (rect.width - zona)) / zona) * 14
    }
    velocidad.current = siguiente
    if (siguiente === 0) {
      detener()
      return
    }
    if (frame.current === null) frame.current = requestAnimationFrame(animar)
  }

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    actualizarBordes()
    const observador = new ResizeObserver(actualizarBordes)
    observador.observe(elemento)
    return () => {
      observador.disconnect()
      detener()
    }
  }, [])

  return { ref, hayIzquierda, hayDerecha, mover, detener, actualizarBordes }
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
  const setResumen = useEstadoEditor((estado) => estado.setResumen)
  const actualizarDraft = useEstadoEditor((estado) => estado.actualizarDraft)
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
  const [publicadoPayload, setPublicadoPayload] = useState<CmsPayload | null>(null)
  const [seccionesColapsadas, setSeccionesColapsadas] = useState(() => {
    try {
      return window.localStorage.getItem(CLAVE_SECCIONES) === '1'
    } catch {
      return false
    }
  })
  const barraSecciones = useDesplazamientoEnBordes()
  const edicionRef = useRef(0)
  const guardandoRef = useRef(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(CLAVE_SECCIONES, seccionesColapsadas ? '1' : '0')
    } catch {
      // La preferencia es cosmética; si el navegador bloquea el storage, seguimos.
    }
  }, [seccionesColapsadas])

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
      setHayCambiosPendientes(contenido.has_unpublished_changes)
      setResumen({
        draft: contenido.draft,
        published: contenido.published,
        hasUnpublishedChanges: contenido.has_unpublished_changes,
      })
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
        const valor = valores[campo.key] ?? (campo.default as CmsFieldValue)
        return campoIncompleto(campo, valor)
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
    edicionRef.current += 1
    setDirty(true)
  }

  async function persistir(): Promise<CmsRevisionDetail | null> {
    if (!draft) return null
    if (!dirty) return draft
    if (guardandoRef.current) return null

    const edicionEnviada = edicionRef.current
    guardandoRef.current = true
    setSaving(true)
    try {
      const respuesta = await guardarBorrador(draft.payload, draft.lock_version)
      const huboEdicionesNuevas = edicionRef.current !== edicionEnviada
      setHayCambiosPendientes(Boolean(respuesta.has_unpublished_changes) || huboEdicionesNuevas)
      setConflicto(false)

      if (huboEdicionesNuevas) {
        // La respuesta corresponde a un snapshot anterior: conserva lo editado
        // mientras la peticion estaba en vuelo y adopta la nueva version de bloqueo.
        setDraft((anterior) =>
          anterior
            ? {
                ...anterior,
                lock_version: respuesta.draft.lock_version,
                updated_at: respuesta.draft.updated_at,
                updated_by: respuesta.draft.updated_by,
              }
            : respuesta.draft,
        )
      } else {
        const mismoContenido =
          JSON.stringify(draft.payload) === JSON.stringify(respuesta.draft.payload)
        if (mismoContenido) {
          // Conserva las referencias locales (listas, editores) cuando el
          // servidor solo incrementó el contador de bloqueo.
          setDraft((anterior) =>
            anterior
              ? {
                  ...anterior,
                  lock_version: respuesta.draft.lock_version,
                  updated_at: respuesta.draft.updated_at,
                  updated_by: respuesta.draft.updated_by,
                }
              : respuesta.draft,
          )
        } else {
          setDraft(respuesta.draft)
        }
        setDirty(false)
      }
      actualizarDraft(respuesta.draft, respuesta.has_unpublished_changes)
      return respuesta.draft
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setConflicto(true)
        notificarError(
          'No se pudo guardar el borrador',
          'Otra persona guardó cambios. Recarga para continuar.',
        )
      } else {
        notificarError('No se pudo guardar el borrador', detalleError(err))
      }
      return null
    } finally {
      guardandoRef.current = false
      setSaving(false)
    }
  }

  async function guardar() {
    const edicionAntes = edicionRef.current
    const guardado = await persistir()
    if (!guardado) return
    if (edicionRef.current !== edicionAntes) {
      notificarInfo('Se guardaron los cambios anteriores', 'Los nuevos cambios siguen pendientes.')
    } else {
      notificarExito(
        'Borrador guardado',
        'Los cambios quedaron guardados. Publícalos para aplicarlos al portal.',
      )
    }
  }

  const guardarRef = useRef(guardar)
  guardarRef.current = guardar

  async function publicar() {
    if (!draft) return
    if (dirty) {
      notificarInfo(
        'Guarda los cambios antes de publicar',
        'El borrador tiene cambios sin guardar.',
      )
      return
    }
    if (!hayCambiosPendientes) {
      notificarInfo(
        'No hay cambios para publicar',
        'El borrador coincide con la última publicación.',
      )
      return
    }

    setSaving(true)
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
      setHayCambiosPendientes(false)
      setDirty(false)
      setDialogoPublicar(false)
      setMensajePublicacion('')
      notificarExito(
        `Publicado como v${respuesta.published.number}`,
        'El contenido ya está visible en el portal.',
      )
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setConflicto(true)
        setDialogoPublicar(false)
      }
      notificarError('No se pudo publicar', detalleError(err))
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

  async function descartarBorradorActual() {
    setDescartando(true)
    try {
      const respuesta = await descartarBorrador()
      setDraft(respuesta.draft)
      setResumen({
        draft: respuesta.draft,
        published,
        hasUnpublishedChanges: false,
      })
      setHayCambiosPendientes(false)
      setDirty(false)
      setConflicto(false)
      setDialogoDescartar(false)
      notificarExito('Borrador descartado', 'Se restauró la última publicación.')
    } catch (err) {
      notificarError('No se pudo descartar el borrador', detalleError(err))
    } finally {
      setDescartando(false)
    }
  }

  async function activarModoEdicion() {
    setActivando(true)
    try {
      const respuesta = await activarEdicion()
      setDraft(respuesta.draft)
      setResumen({
        draft: respuesta.draft,
        published,
        hasUnpublishedChanges: respuesta.has_unpublished_changes,
      })
      setHayCambiosPendientes(respuesta.has_unpublished_changes)
      setActiva(respuesta.draft.payload.order[0] ?? 'portada')
      setDirty(false)
      setConflicto(false)
      notificarExito('Modo edición activado', 'Ya puedes editar el borrador.')
    } catch (err) {
      notificarError('No se pudo activar el modo edición', detalleError(err))
    } finally {
      setActivando(false)
    }
  }

  function alternarPreview() {
    setPreviewVisible((visible) => !visible)
  }

  if (cargando) {
    return (
      <div className="min-h-svh">
        <div className="border-b border-black/5 bg-white/80 px-4 py-4 md:px-8">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-6 w-56" />
        </div>
        <div className="grid w-full gap-6 p-4 md:p-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:p-8">
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
    const seccionesPublicadas = publicadoPayload?.order ?? schema.default_order
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
            <>
              <Button asChild variant="outline">
                <Link to="/cms/revisiones">Ver versiones</Link>
              </Button>
              <Button onClick={() => void activarModoEdicion()} disabled={activando}>
                <PencilSimpleLine data-icon="inline-start" />
                {activando ? 'Activando…' : 'Activar modo edición'}
              </Button>
            </>
          }
        />

        <div className="w-full px-4 py-6 md:px-6 md:py-8 xl:px-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(440px,0.95fr)_minmax(0,1.3fr)]">
            <div className="flex min-w-0 flex-col gap-4">
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span className="bg-enel-blue/10 text-enel-blue flex size-12 shrink-0 items-center justify-center rounded-xl">
                    <PencilSimpleLine className="size-6" weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-enel-navy text-xl font-semibold tracking-tight">
                      Modo lectura
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
                      El portal está mostrando la última publicación. Activa el modo edición para
                      crear un borrador y empezar a editar.
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <Button onClick={() => void activarModoEdicion()} disabled={activando}>
                        <PencilSimpleLine data-icon="inline-start" />
                        {activando ? 'Activando…' : 'Activar modo edición'}
                      </Button>
                      <Button asChild variant="outline">
                        <Link to="/cms/revisiones">Ver versiones</Link>
                      </Button>
                    </div>
                  </div>
                </div>

                <dl className="mt-6 grid gap-3 border-t border-black/5 pt-4 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Versión publicada</dt>
                    <dd className="text-enel-navy mt-0.5 font-medium tabular-nums">
                      v{published?.number ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Fecha</dt>
                    <dd className="text-foreground/80 mt-0.5 font-medium">
                      {fechaHora(published?.published_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Autor</dt>
                    <dd className="text-foreground/80 mt-0.5 truncate font-medium">
                      {published?.published_by?.name ?? '—'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-5 py-3.5">
                  <div>
                    <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
                      Recorrido publicado
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {seccionesPublicadas.length} secciones visibles en el portal.
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/cms/orden">
                      Ver orden
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
                <ol className="divide-y divide-black/[0.05]">
                  {seccionesPublicadas.map((clave, indice) => {
                    const seccion = seccionesPorClave.get(clave)
                    const Icono = iconoDe(clave)
                    const etiqueta =
                      (publicadoPayload?.sections[clave]?.nav_label as string | undefined) ??
                      seccion?.label ??
                      clave
                    return (
                      <li key={clave} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="text-muted-foreground/60 w-4 shrink-0 text-[11px] font-medium tabular-nums">
                          {indice + 1}
                        </span>
                        <span className="bg-enel-mist text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-lg">
                          <Icono className="size-3.5" />
                        </span>
                        <span className="text-enel-navy min-w-0 flex-1 truncate text-[13px] font-medium">
                          {etiqueta}
                        </span>
                        {!seccion?.reorderable && (
                          <LockKey className="text-muted-foreground/40 size-3 shrink-0" />
                        )}
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>

            <div className="min-w-0">
              <div className="xl:sticky xl:top-24">
                <VistaPreviaPortal
                  payload={publicadoPayload}
                  className="h-[70svh] xl:h-[calc(100svh-8rem)]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const faltantesActiva = faltantes.get(activa) ?? 0
  const IconoActivo = iconoDe(activa)
  const indiceActivo = Math.max(0, order.indexOf(activa))
  const motivoGuardarDeshabilitado = saving
    ? 'Guardando los cambios…'
    : 'No hay cambios pendientes.'
  const publicarDeshabilitado = saving || dirty || !hayCambiosPendientes
  const motivoPublicarDeshabilitado = saving
    ? 'Guardando los cambios…'
    : dirty
      ? 'Guarda los cambios antes de publicar.'
      : 'No hay cambios para publicar.'

  return (
    <div className="min-h-svh">
      <CmsPageHeader
        eyebrow="Contenido del portal"
        title="Editor de contenido"
        description={
          <span className="text-muted-foreground text-xs">
            {published?.published_at
              ? `Última publicación: ${fechaHora(published.published_at)}`
              : 'Todavía sin publicar'}
          </span>
        }
        actions={
          <>
            <CmsDraftStatus />
            <CmsTooltip
              lado="bottom"
              label={previewVisible ? 'Ocultar vista previa' : 'Mostrar vista previa'}
            >
              <Button
                variant={previewVisible ? 'secondary' : 'outline'}
                onClick={alternarPreview}
                aria-pressed={previewVisible}
              >
                {previewVisible ? (
                  <EyeSlash data-icon="inline-start" />
                ) : (
                  <Eye data-icon="inline-start" />
                )}
                Vista previa
              </Button>
            </CmsTooltip>
            <CmsTooltip
              lado="bottom"
              label={!dirty || saving ? motivoGuardarDeshabilitado : 'Guardar borrador'}
              shortcut={!dirty || saving ? undefined : 'Ctrl S'}
            >
              <Button
                variant={dirty ? 'secondary' : 'outline'}
                onClick={() => void guardar()}
                disabled={!dirty || saving}
                aria-keyshortcuts="Control+S"
              >
                <FloppyDisk data-icon="inline-start" />
                Guardar
              </Button>
            </CmsTooltip>
            <CmsTooltip
              lado="bottom"
              label={publicarDeshabilitado ? motivoPublicarDeshabilitado : 'Publicar cambios'}
            >
              <Button onClick={() => setDialogoPublicar(true)} disabled={publicarDeshabilitado}>
                <CloudArrowUp data-icon="inline-start" />
                Publicar
              </Button>
            </CmsTooltip>
            <CmsHelpButton />
          </>
        }
      />

      <div className="w-full px-4 py-6 md:px-6 md:py-8 xl:px-8">
        <div className="flex flex-col gap-4">
          {conflicto && <CmsConflictoBanner onRecargar={() => void cargar()} />}

          {!dirty && hayCambiosPendientes && (
            <CmsAlert
              variant="info"
              title="Tienes cambios guardados sin publicar"
              description={
                <>
                  Última edición: {fechaHora(draft.updated_at)}
                  {draft.updated_by ? ` · ${draft.updated_by.name}` : ''}. Puedes continuar cuando
                  quieras.
                  {draft.message && <p className="mt-1">{draft.message}</p>}
                </>
              }
              action={
                <CmsAlertAction tono="info" onClick={() => setDialogoDescartar(true)}>
                  Descartar cambios
                </CmsAlertAction>
              }
            />
          )}

          <div
            className={cn(
              'grid gap-6',
              previewVisible
                ? 'xl:grid-cols-[minmax(440px,0.95fr)_minmax(0,1.3fr)]'
                : 'grid-cols-1',
            )}
          >
            <div
              className={cn(
                'grid min-w-0 gap-6',
                seccionesColapsadas || previewVisible
                  ? 'grid-cols-1'
                  : 'lg:grid-cols-[300px_minmax(0,1fr)]',
              )}
            >
              <aside
                className={cn(
                  'flex-col gap-4 lg:sticky lg:top-24 lg:self-start',
                  seccionesColapsadas || previewVisible ? 'hidden' : 'flex',
                )}
              >
                <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#fbfcfd] shadow-sm">
                  <div className="border-b border-black/5 px-3.5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-enel-navy text-[11px] font-semibold tracking-[0.14em] uppercase">
                        Secciones
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground/70 text-[11px] tabular-nums">
                          {order.length}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-foreground -mr-1"
                          onClick={() => setSeccionesColapsadas(true)}
                          aria-label="Ocultar lista de secciones"
                          title="Ocultar lista de secciones"
                        >
                          <SidebarSimple className="size-3.5" />
                        </Button>
                      </div>
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
              </aside>

              <section className="flex min-w-0 flex-col gap-4">
                {(previewVisible || seccionesColapsadas) && (
                  <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm">
                    <div className="flex items-center gap-2 p-1.5">
                      <span className="text-muted-foreground hidden shrink-0 pl-1 text-[10px] font-semibold tracking-[0.14em] uppercase sm:inline">
                        Secciones
                      </span>
                      <div className="relative min-w-0 flex-1">
                        <div
                          ref={barraSecciones.ref}
                          onPointerMove={barraSecciones.mover}
                          onPointerLeave={barraSecciones.detener}
                          onPointerCancel={barraSecciones.detener}
                          onScroll={barraSecciones.actualizarBordes}
                          className="flex [scrollbar-width:none] gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden"
                        >
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
                        {barraSecciones.hayIzquierda && (
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center bg-gradient-to-r from-white via-white/90 to-transparent pl-1"
                          >
                            <CaretLeft className="text-muted-foreground/60 size-3.5" />
                          </div>
                        )}
                        {barraSecciones.hayDerecha && (
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-end bg-gradient-to-l from-white via-white/90 to-transparent pr-1"
                          >
                            <CaretRight className="text-muted-foreground/60 size-3.5" />
                          </div>
                        )}
                      </div>
                      {seccionesColapsadas && !previewVisible && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-foreground shrink-0"
                          onClick={() => setSeccionesColapsadas(false)}
                          aria-label="Mostrar lista de secciones"
                          title="Mostrar lista de secciones"
                        >
                          <SidebarSimple className="size-3.5" />
                        </Button>
                      )}
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
                        {saving
                          ? 'Guardando los cambios…'
                          : dirty
                            ? 'Hay cambios sin guardar. Guárdalos antes de publicar.'
                            : 'Cambios guardados. El portal no cambia hasta que publiques.'}
                      </p>
                      <span className="group relative inline-flex shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void guardar()}
                          disabled={!dirty || saving}
                          aria-describedby={!dirty || saving ? 'motivo-guardar-cambios' : undefined}
                          className="shrink-0 bg-white"
                        >
                          <FloppyDisk data-icon="inline-start" />
                          Guardar cambios
                        </Button>
                        {(!dirty || saving) && (
                          <span
                            id="motivo-guardar-cambios"
                            role="tooltip"
                            className="bg-enel-navy pointer-events-none absolute right-0 bottom-full z-20 mb-2.5 w-max max-w-[17rem] rounded-md px-2.5 py-1.5 text-[11px] leading-snug font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
                          >
                            {motivoGuardarDeshabilitado}
                            <span
                              aria-hidden="true"
                              className="bg-enel-navy absolute top-full right-5 size-2 -translate-y-1/2 rotate-45"
                            />
                          </span>
                        )}
                      </span>
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
                  <VistaPreviaPortal
                    payload={draft.payload}
                    seccion={activa}
                    enVivo
                    className="h-[70svh] xl:h-[calc(100svh-8rem)]"
                  />
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
                {order.length} secciones en el portal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-emerald-500" weight="fill" />
                Se creará una versión nueva
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-emerald-500" weight="fill" />
                {published?.published_at
                  ? `La publicación actual es la v${published.number}`
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
              Quedará en el historial de versiones.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoPublicar(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void publicar()} disabled={publicarDeshabilitado}>
              <CloudArrowUp data-icon="inline-start" />
              {saving ? 'Publicando…' : 'Publicar ahora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
