import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useContenidoStore } from '@/lib/cms/contenido'
import { desplazarASeccion } from '@/lib/scroll'
import { Viaje } from '@/pages/Viaje'
import { obtenerContenidoAdmin, obtenerContenidoPublico, obtenerRevision } from '@/services/cms'
import type { CmsPayload } from '@/types/cms'

interface MensajeCms {
  tipo?: string
  payload?: CmsPayload
  id?: string
}

export function CmsPreview() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const embed = params.get('embed') === '1'
  const revisionId = params.get('revision')
  const setPayload = useContenidoStore((estado) => estado.setPayload)
  const limpiar = useContenidoStore((estado) => estado.limpiar)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const pendienteScroll = useRef<string | null>(null)
  const scrollTimer = useRef<number | null>(null)

  useEffect(() => {
    let activo = true

    function desplazarPendiente(id: string, demora: number) {
      if (scrollTimer.current) window.clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(() => {
        if (!activo) return
        desplazarASeccion(id)
      }, demora)
    }

    function recibir(evento: MessageEvent) {
      if (evento.origin !== window.location.origin) return
      const data = evento.data as MensajeCms
      if (data?.tipo === 'cms:draft' && data.payload) {
        setPayload(data.payload)
        setCargando(false)
        const pendiente = pendienteScroll.current
        if (pendiente) {
          pendienteScroll.current = null
          desplazarPendiente(pendiente, 180)
        }
      }
      if (data?.tipo === 'cms:scroll' && data.id) {
        pendienteScroll.current = data.id
        desplazarPendiente(data.id, 120)
      }
    }

    if (revisionId) {
      obtenerRevision(revisionId)
        .then((revision) => {
          if (!activo) return
          setPayload(revision.payload)
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
    }

    if (embed) {
      window.addEventListener('message', recibir)
      window.parent.postMessage({ tipo: 'cms:listo' }, window.location.origin)

      // Respaldo si el iframe se abre directamente, sin un editor que lo controle.
      const respaldo = window.setTimeout(() => {
        if (!activo || useContenidoStore.getState().status === 'loaded') return
        obtenerContenidoAdmin()
          .then(async (contenido) => {
            if (!activo) return
            const payload = contenido.draft
              ? contenido.draft.payload
              : (await obtenerContenidoPublico()).payload
            if (!activo) return
            setPayload(payload)
            setCargando(false)
          })
          .catch(() => {
            if (!activo) return
            setError(true)
            setCargando(false)
          })
      }, 1600)

      return () => {
        activo = false
        window.clearTimeout(respaldo)
        if (scrollTimer.current) window.clearTimeout(scrollTimer.current)
        window.removeEventListener('message', recibir)
        limpiar()
      }
    }

    obtenerContenidoAdmin()
      .then(async (contenido) => {
        if (!activo) return
        const payload = contenido.draft
          ? contenido.draft.payload
          : (await obtenerContenidoPublico()).payload
        if (!activo) return
        setPayload(payload)
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
  }, [embed, revisionId, setPayload, limpiar])

  useEffect(() => {
    if (embed) return
    function alPresionar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') navigate('/cms')
    }
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [embed, navigate])

  if (cargando) {
    return (
      <div className="flex min-h-svh flex-col gap-4 bg-white p-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-enel-navy text-lg font-semibold">No se pudo cargar la vista previa.</p>
        <p className="text-muted-foreground text-sm">Revisa tu conexión e inténtalo otra vez.</p>
        <Button asChild variant="outline">
          <Link to="/cms">
            <ArrowLeft data-icon="inline-start" />
            Volver al editor
          </Link>
        </Button>
      </div>
    )
  }

  if (embed) {
    return <Viaje preview />
  }

  return (
    <>
      <Viaje preview />
      <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-black/10 bg-white/90 p-1.5 pl-3.5 shadow-[0_18px_50px_-12px_rgba(16,20,24,0.35)] backdrop-blur-xl">
        <span className="text-enel-navy inline-flex items-center gap-2 pr-1 text-xs font-medium">
          <span className="relative flex size-2">
            <span className="bg-enel-blue absolute inline-flex size-full animate-ping rounded-full opacity-60" />
            <span className="bg-enel-blue relative inline-flex size-2 rounded-full" />
          </span>
          <Eye className="size-3.5" />
          Vista previa del borrador
          <kbd className="text-muted-foreground hidden rounded border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-medium sm:inline">
            Esc
          </kbd>
        </span>
        <span className="hidden h-5 w-px bg-black/10 sm:block" />
        <Button asChild size="sm" variant="ghost" className="rounded-full">
          <Link to="/cms">
            <ArrowLeft data-icon="inline-start" />
            Volver al editor
          </Link>
        </Button>
      </div>
    </>
  )
}
