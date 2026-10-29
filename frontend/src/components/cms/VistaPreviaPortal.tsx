import { useEffect, useRef, useState } from 'react'
import { ArrowClockwise, Desktop, DeviceMobile } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CmsPayload } from '@/types/cms'

const ANCHO_ESCRITORIO = 1440
const VISTA_MOVIL = { ancho: 390, alto: 844 }

interface VistaPreviaPortalProps {
  /** Contenido que se refleja. En edición es el borrador; en lectura, la publicación. */
  payload: CmsPayload | null
  /** Sección a la que se desplaza la vista previa. */
  seccion?: string
  /** Distingue el borrador en vivo de la última publicación. */
  enVivo?: boolean
  /** Alto del panel. El contenido se escala para ocupar el ancho disponible. */
  className?: string
}

/**
 * Vista previa aislada del portal dentro del CMS. El iframe dibuja el sitio a
 * un ancho real de escritorio o móvil y se escala para el espacio disponible.
 * El contenido se envía por postMessage para no recargar al editar.
 */
export function VistaPreviaPortal({
  payload,
  seccion,
  enVivo = false,
  className,
}: VistaPreviaPortalProps) {
  const [listo, setListo] = useState(false)
  const [modo, setModo] = useState<'escritorio' | 'movil'>('escritorio')
  const [lienzo, setLienzo] = useState({ escala: 0.5, alto: 900 })
  const [marco, setMarco] = useState<HTMLDivElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const ultimoPayloadEnviado = useRef<string | null>(null)

  useEffect(() => {
    function recibir(evento: MessageEvent) {
      if (evento.origin !== window.location.origin) return
      if (evento.source !== iframeRef.current?.contentWindow) return
      const data = evento.data as { tipo?: string }
      if (data?.tipo === 'cms:listo') setListo(true)
    }
    window.addEventListener('message', recibir)
    return () => window.removeEventListener('message', recibir)
  }, [])

  useEffect(() => {
    if (!listo || !payload) return
    const timer = window.setTimeout(() => {
      const serializado = JSON.stringify(payload)
      if (serializado === ultimoPayloadEnviado.current) return
      ultimoPayloadEnviado.current = serializado
      iframeRef.current?.contentWindow?.postMessage(
        { tipo: 'cms:draft', payload },
        window.location.origin,
      )
    }, 150)
    return () => window.clearTimeout(timer)
  }, [payload, listo])

  useEffect(() => {
    if (!listo || !seccion) return
    const timer = window.setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { tipo: 'cms:scroll', id: seccion },
        window.location.origin,
      )
    }, 260)
    return () => window.clearTimeout(timer)
  }, [seccion, listo])

  useEffect(() => {
    if (!marco) return
    const contenedor = marco
    let frame = 0

    function ajustar() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const { width, height } = contenedor.getBoundingClientRect()
        if (!width || !height) return
        if (modo === 'movil') {
          const disponibleAncho = Math.max(width - 24, 1)
          const disponibleAlto = Math.max(height - 24, 1)
          const escala = Math.min(
            disponibleAncho / VISTA_MOVIL.ancho,
            disponibleAlto / VISTA_MOVIL.alto,
            1,
          )
          setLienzo((anterior) =>
            Math.abs(anterior.escala - escala) < 0.001 && anterior.alto === VISTA_MOVIL.alto
              ? anterior
              : { escala, alto: VISTA_MOVIL.alto },
          )
        } else {
          const escala = Math.min(width / ANCHO_ESCRITORIO, 1)
          const alto = Math.round(height / escala)
          setLienzo((anterior) =>
            Math.abs(anterior.escala - escala) < 0.001 && anterior.alto === alto
              ? anterior
              : { escala, alto },
          )
        }
      })
    }

    ajustar()
    const observador = new ResizeObserver(ajustar)
    observador.observe(marco)
    return () => {
      observador.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [modo, marco])

  function recargar() {
    setListo(false)
    ultimoPayloadEnviado.current = null
    iframeRef.current?.contentWindow?.location.reload()
  }

  const esMovil = modo === 'movil'
  const anchoLienzo = esMovil ? VISTA_MOVIL.ancho : ANCHO_ESCRITORIO
  const altoLienzo = lienzo.alto
  const anchoMarco = esMovil ? anchoLienzo + 20 : anchoLienzo
  const altoMarco = esMovil ? altoLienzo + 20 : altoLienzo

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/5 px-3 py-2">
        <div className="text-enel-navy flex min-w-0 items-center gap-2 text-[11px] font-medium">
          {enVivo ? (
            <span className="relative flex size-1.5 shrink-0">
              <span className="bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-50" />
              <span className="bg-primary relative inline-flex size-1.5 rounded-full" />
            </span>
          ) : (
            <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
          )}
          <span className="truncate">
            {enVivo ? 'Vista previa en vivo' : 'Vista previa publicada'}
          </span>
          <span
            className="text-muted-foreground shrink-0 text-[10px] font-normal tabular-nums"
            title="La vista previa se ajusta automáticamente al espacio disponible"
          >
            {Math.round(lienzo.escala * 100)}%
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant={modo === 'escritorio' ? 'secondary' : 'ghost'}
            size="icon-xs"
            aria-label="Vista de escritorio"
            aria-pressed={modo === 'escritorio'}
            title="Escritorio"
            onClick={() => setModo('escritorio')}
          >
            <Desktop className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant={modo === 'movil' ? 'secondary' : 'ghost'}
            size="icon-xs"
            aria-label="Vista móvil"
            aria-pressed={modo === 'movil'}
            title="Móvil"
            onClick={() => setModo('movil')}
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
            onClick={recargar}
          >
            <ArrowClockwise className="size-3.5" />
          </Button>
        </div>
      </div>

      <div
        ref={setMarco}
        className={cn(
          'bg-muted/40 relative flex min-h-0 flex-1 items-center justify-center overflow-hidden',
          esMovil && 'p-3',
        )}
      >
        <div
          className="relative shrink-0"
          style={{
            width: anchoMarco * lienzo.escala,
            height: altoMarco * lienzo.escala,
          }}
        >
          <div
            className={cn(
              'absolute top-0 left-0 bg-white',
              esMovil
                ? 'rounded-[2.6rem] border-[10px] border-[#141413] bg-[#141413] shadow-[0_30px_80px_-32px_rgba(0,0,0,0.6)]'
                : 'overflow-hidden rounded-lg shadow-[0_18px_50px_-28px_rgba(16,20,24,0.5)] ring-1 ring-black/10',
            )}
            style={{
              width: anchoMarco,
              height: altoMarco,
              transform: `scale(${lienzo.escala})`,
              transformOrigin: 'top left',
            }}
          >
            <iframe
              ref={iframeRef}
              src="/cms/preview?embed=1"
              title="Vista previa del portal"
              width={anchoLienzo}
              height={altoLienzo}
              className={cn('block border-0 bg-white', esMovil && 'rounded-[2rem]')}
              style={{ width: anchoLienzo, height: altoLienzo }}
            />
          </div>
        </div>
        {!listo && (
          <div className="text-muted-foreground absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/70 text-xs backdrop-blur-[1px]">
            <span className="border-primary size-4 animate-spin rounded-full border-2 border-t-transparent" />
            Cargando vista previa…
          </div>
        )}
      </div>
    </div>
  )
}
