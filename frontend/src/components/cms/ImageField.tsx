import { useRef, useState, type DragEvent } from 'react'
import { CircleNotch, ImageSquare, Trash, UploadSimple } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { notificarAviso, notificarError, notificarExito } from '@/lib/cms/notificaciones'
import { cn } from '@/lib/utils'
import { subirImagen } from '@/services/cms'

export function ImageField({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)

  async function subir(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      notificarAviso('Formato no compatible', 'El archivo debe ser una imagen JPEG, PNG o WebP.')
      return
    }
    setSubiendo(true)
    try {
      const media = await subirImagen(file)
      onChange(media.url)
      notificarExito('Imagen subida', 'La imagen quedó disponible para el CMS.')
    } catch {
      notificarError('No se pudo subir la imagen', 'Revisa el formato y el tamaño (máx. 5 MB).')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function soltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault()
    setArrastrando(false)
    void subir(evento.dataTransfer.files?.[0])
  }

  return (
    <div className="flex flex-col gap-2.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void subir(e.target.files?.[0])}
      />

      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-black/[0.08] bg-neutral-100">
          <img src={value} alt="Vista previa de la imagen" className="h-44 w-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/55 via-black/0 to-black/0 p-2.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={subiendo}
              onClick={() => inputRef.current?.click()}
            >
              <UploadSimple data-icon="inline-start" />
              Reemplazar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="text-destructive"
              disabled={subiendo}
              onClick={() => onChange('')}
            >
              <Trash data-icon="inline-start" />
              Quitar
            </Button>
          </div>
          {subiendo && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/70 text-sm font-medium backdrop-blur-sm">
              <CircleNotch className="text-enel-blue size-4 animate-spin" />
              Subiendo imagen…
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setArrastrando(true)
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
          className={cn(
            'focus-visible:ring-enel-blue/25 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-9 text-center transition-colors outline-none focus-visible:ring-3',
            arrastrando
              ? 'border-enel-blue bg-enel-blue/5'
              : 'hover:border-enel-blue/40 hover:bg-enel-blue/[0.03] border-black/15 bg-[#fbfcfd]',
          )}
        >
          {subiendo ? (
            <>
              <CircleNotch className="text-enel-blue size-6 animate-spin" />
              <p className="text-enel-navy text-sm font-medium">Subiendo imagen…</p>
            </>
          ) : (
            <>
              <span className="bg-enel-blue/10 text-enel-blue flex size-10 items-center justify-center rounded-xl">
                <ImageSquare className="size-5" />
              </span>
              <p className="text-enel-navy text-sm font-medium">
                {arrastrando
                  ? 'Suelta la imagen aquí'
                  : 'Arrastra una imagen o haz clic para subir'}
              </p>
              <p className="text-muted-foreground text-xs">JPEG, PNG o WebP · máx. 5 MB</p>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…o pega una URL: https://"
          autoComplete="off"
          className="h-8 text-xs"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
          >
            <UploadSimple data-icon="inline-start" />
            Subir
          </Button>
        )}
      </div>

      <p className="text-muted-foreground/80 text-[11px]">
        La imagen se optimiza a 2560 px de lado mayor.
      </p>
    </div>
  )
}
