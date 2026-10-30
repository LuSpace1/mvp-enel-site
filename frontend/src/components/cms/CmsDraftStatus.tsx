import { Link } from 'react-router-dom'
import { ArrowRight, CaretDown } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { fechaHora } from '@/lib/cms/fechas'
import { useEstadoEditor } from '@/lib/cms/estadoEditor'
import { cn } from '@/lib/utils'

/** Botón consultable con el estado del borrador y sus datos de edición. */
export function CmsDraftStatus() {
  const resumen = useEstadoEditor((estado) => estado.resumen)
  const dirty = useEstadoEditor((estado) => estado.dirty)
  const draft = resumen?.draft ?? null
  const published = resumen?.published ?? null
  const publicado = !draft
  const conCambios = Boolean(draft) && Boolean(resumen?.hasUnpublishedChanges)

  const texto = !resumen
    ? 'Estado'
    : publicado
      ? 'Todo publicado'
      : dirty
        ? 'Borrador sin guardar'
        : conCambios
          ? 'Borrador sin publicar'
          : 'Borrador al día'

  const color = !resumen
    ? 'bg-muted-foreground/40'
    : publicado
      ? 'bg-emerald-500'
      : dirty
        ? 'bg-amber-500'
        : conCambios
          ? 'bg-sky-500'
          : 'bg-emerald-500'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white"
          aria-label={`Consultar estado del borrador: ${texto}`}
        >
          <span className={cn('size-1.5 shrink-0 rounded-full', color)} aria-hidden="true" />
          <span className="hidden sm:inline">{texto}</span>
          <CaretDown className="text-muted-foreground size-3" aria-hidden="true" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[21rem] p-0">
        <div className="border-b border-black/5 bg-[#fbfcfd] px-4 py-3">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
            Estado del borrador
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p className="text-enel-navy text-lg leading-tight font-semibold">
              {publicado
                ? 'Todo publicado'
                : dirty
                  ? 'Cambios sin guardar'
                  : conCambios
                    ? 'Borrador sin publicar'
                    : 'Sin cambios pendientes'}
            </p>
            <Badge variant="outline" className="shrink-0 bg-white text-[10px]">
              {publicado
                ? published
                  ? `v${published.number}`
                  : 'Sin publicar'
                : dirty
                  ? 'Sin guardar'
                  : conCambios
                    ? 'Sin publicar'
                    : 'Al día'}
            </Badge>
          </div>
        </div>

        <div className="px-4 py-3">
          {!resumen ? (
            <p className="text-muted-foreground text-xs">Cargando estado del borrador…</p>
          ) : (
            <dl className="space-y-2 text-[11px]">
              {draft ? (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">Última edición</dt>
                    <dd className="text-foreground/80 text-right">{fechaHora(draft.updated_at)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">Por</dt>
                    <dd className="text-foreground/80 max-w-[10rem] truncate text-right">
                      {draft.updated_by?.name ?? '—'}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">Publicado</dt>
                    <dd className="text-foreground/80 text-right">
                      {published
                        ? `v${published.number} · ${fechaHora(published.published_at)}`
                        : '—'}
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">Última publicación</dt>
                    <dd className="text-foreground/80 text-right">
                      {fechaHora(published?.published_at)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">Autor</dt>
                    <dd className="text-foreground/80 max-w-[10rem] truncate text-right">
                      {published?.published_by?.name ?? '—'}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          )}

          {draft?.message && (
            <div className="mt-3 rounded-lg border border-black/[0.05] bg-[#fbfcfd] px-2.5 py-2">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
                Nota
              </p>
              <p
                className="text-foreground/70 mt-1 line-clamp-3 text-[11px] leading-relaxed"
                title={draft.message}
              >
                {draft.message}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-black/5 px-3 py-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-between">
            <Link to="/cms/revisiones">
              Ver versiones
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
