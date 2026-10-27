import { useRef, useState } from 'react'
import { ImageSquare, Trash, UploadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  async function subir(file: File | undefined) {
    if (!file) return
    setSubiendo(true)
    try {
      const media = await subirImagen(file)
      onChange(media.url)
      toast.success('Imagen subida al CMS.')
    } catch {
      toast.error('No se pudo subir la imagen. Revisa el formato y el tamaño (máx. 5 MB).')
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="bg-muted flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border">
          {value ? (
            <img src={value} alt="Vista previa" className="size-full object-cover" />
          ) : (
            <ImageSquare className="text-muted-foreground size-8" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… o sube una imagen"
          />
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void subir(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={subiendo}
              onClick={() => inputRef.current?.click()}
            >
              <UploadSimple data-icon="inline-start" />
              {subiendo ? 'Subiendo…' : 'Subir imagen'}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                <Trash data-icon="inline-start" />
                Quitar
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            JPEG, PNG o WebP. Máximo 5 MB; se optimiza a 2560 px de lado mayor.
          </p>
        </div>
      </div>
    </div>
  )
}
