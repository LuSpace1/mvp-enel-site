import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloudArrowUp, Eye, FloppyDisk, WarningCircle } from '@phosphor-icons/react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { CampoEditor } from '@/components/cms/CampoEditor'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
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
} from '@/types/cms'

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
  const navigate = useNavigate()
  const [schema, setSchema] = useState<CmsSchemaResponse | null>(null)
  const [draft, setDraft] = useState<CmsRevisionDetail | null>(null)
  const [published, setPublished] = useState<CmsRevision | null>(null)
  const [canPublish, setCanPublish] = useState(false)
  const [activa, setActiva] = useState<string>('portada')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [conflicto, setConflicto] = useState(false)
  const [dialogoPublicar, setDialogoPublicar] = useState(false)
  const [mensajePublicacion, setMensajePublicacion] = useState('')

  async function cargar() {
    setCargando(true)
    setError(null)
    try {
      const [esquema, contenido] = await Promise.all([obtenerSchema(), obtenerContenidoAdmin()])
      setSchema(esquema)
      setDraft(contenido.draft)
      setPublished(contenido.published)
      setCanPublish(contenido.can_publish || esquema.can_publish)
      setActiva(contenido.draft.payload.order[0] ?? 'portada')
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

  const seccionesPorClave = useMemo(() => {
    const mapa = new Map<string, CmsSectionSchema>()
    schema?.sections.forEach((seccion) => mapa.set(seccion.key, seccion))
    return mapa
  }, [schema])

  const order = draft?.payload.order ?? []
  const seccionActiva = seccionesPorClave.get(activa)
  const valoresActivos = (draft?.payload.sections[activa] ?? {}) as CmsSectionValues

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

  async function persistir(): Promise<CmsRevisionDetail | null> {
    if (!draft) return null
    if (!dirty) return draft

    setSaving(true)
    try {
      const respuesta = await guardarBorrador(draft.payload, draft.version)
      setDraft(respuesta.draft)
      setCanPublish(respuesta.can_publish)
      setDirty(false)
      setConflicto(false)
      return respuesta.draft
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setConflicto(true)
        toast.error('Otra persona guardó el borrador. Recarga para continuar.')
      } else {
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

  async function abrirPreview() {
    const guardado = await persistir()
    if (!guardado) return
    navigate('/cms/preview')
  }

  async function publicar() {
    const guardado = await persistir()
    if (!guardado) return

    setSaving(true)
    try {
      const respuesta = await publicarContenido(mensajePublicacion)
      setPublished(respuesta.published)
      setDraft(respuesta.draft)
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

  if (cargando) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 md:p-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-96" />
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-[36rem]" />
        </div>
      </div>
    )
  }

  if (error || !draft || !schema) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Alert variant="destructive">
          <WarningCircle />
          <AlertTitle>No se pudo cargar el CMS</AlertTitle>
          <AlertDescription>{error ?? 'Respuesta incompleta del servidor.'}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => void cargar()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-enel-navy text-2xl font-semibold">Contenido del portal</h1>
            <Badge variant={dirty ? 'secondary' : 'outline'}>Borrador v{draft.version}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Publicado:{' '}
            {published?.published_at
              ? new Date(published.published_at).toLocaleString('es-CL')
              : 'sin publicar'}
            {published?.published_by ? ` · ${published.published_by.name}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void abrirPreview()} disabled={saving}>
            <Eye data-icon="inline-start" />
            Previsualizar
          </Button>
          <Button variant="outline" onClick={() => void guardar()} disabled={!dirty || saving}>
            <FloppyDisk data-icon="inline-start" />
            Guardar borrador
          </Button>
          <Button onClick={() => setDialogoPublicar(true)} disabled={!canPublish || saving}>
            <CloudArrowUp data-icon="inline-start" />
            Publicar
          </Button>
        </div>
      </header>

      {conflicto && (
        <Alert>
          <WarningCircle />
          <AlertTitle>Hay una versión más nueva del borrador</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <span>
              Otra persona guardó cambios mientras editabas. Recarga para no sobrescribirlos.
            </span>
            <Button size="sm" className="self-start" onClick={() => void cargar()}>
              Recargar borrador
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!canPublish && (
        <Alert>
          <WarningCircle />
          <AlertTitle>Modo editor</AlertTitle>
          <AlertDescription>
            Puedes guardar y previsualizar cambios. Publicar y cambiar el orden requiere el rol de
            publicador.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Secciones</CardTitle>
            <CardDescription>Orden publicado actualmente.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {order.map((clave) => {
              const seccion = seccionesPorClave.get(clave)
              if (!seccion) return null
              const etiqueta =
                (draft.payload.sections[clave]?.nav_label as string | undefined) ?? seccion.label
              return (
                <button
                  key={clave}
                  type="button"
                  aria-label={etiqueta}
                  onClick={() => setActiva(clave)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                    activa === clave
                      ? 'bg-enel-blue/10 text-enel-blue font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="truncate">{etiqueta}</span>
                  {!seccion.reorderable && (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      Fija
                    </Badge>
                  )}
                </button>
              )
            })}
          </CardContent>
        </Card>

        {seccionActiva && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{seccionActiva.label}</CardTitle>
              <CardDescription>{seccionActiva.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="gap-6">
                {seccionActiva.fields.map((campo) => (
                  <CampoEditor
                    key={`${seccionActiva.key}-${campo.key}`}
                    field={campo}
                    value={
                      (valoresActivos[campo.key] ??
                        (campo.default as CmsFieldValue)) as CmsFieldValue
                    }
                    onChange={(valor) => actualizarCampo(campo.key, valor)}
                  />
                ))}
              </FieldGroup>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogoPublicar} onOpenChange={setDialogoPublicar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar cambios</DialogTitle>
            <DialogDescription>
              Se publican de forma atómica el contenido y el orden de secciones. El portal los
              mostrará de inmediato.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor="mensaje-publicacion" className="text-sm font-medium">
              Mensaje de la publicación (opcional)
            </label>
            <Textarea
              id="mensaje-publicacion"
              value={mensajePublicacion}
              onChange={(e) => setMensajePublicacion(e.target.value)}
              placeholder="Ej: Actualización de cifras 2025"
              maxLength={255}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoPublicar(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void publicar()} disabled={saving}>
              {saving ? 'Publicando…' : 'Publicar ahora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
