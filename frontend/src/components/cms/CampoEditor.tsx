import { useId, useState } from 'react'
import { ArrowDown, ArrowUp, CaretDown, Plus, Trash } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ImageField } from '@/components/cms/ImageField'
import { RichTextEditor } from '@/components/cms/RichTextEditor'
import { cn } from '@/lib/utils'
import type { CmsFieldSchema, CmsFieldValue, CmsListItem, RichTextDoc } from '@/types/cms'

function valorLista(field: CmsFieldSchema): CmsListItem {
  const item: CmsListItem = {}
  for (const sub of field.item_fields ?? []) {
    item[sub.key] =
      sub.default && typeof sub.default === 'object'
        ? (structuredClone(sub.default) as CmsFieldValue)
        : ((sub.default ?? '') as CmsFieldValue)
  }
  return item
}

function textoDe(valor: CmsFieldValue): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function ListaItem({
  field,
  item,
  indice,
  total,
  onChange,
  onMover,
  onEliminar,
}: {
  field: CmsFieldSchema
  item: CmsListItem
  indice: number
  total: number
  onChange: (clave: string, valor: CmsFieldValue) => void
  onMover: (direccion: -1 | 1) => void
  onEliminar: () => void
}) {
  const [abierto, setAbierto] = useState(indice === 0)

  const camposTexto = (field.item_fields ?? []).filter(
    (sub) => sub.type === 'text' || sub.type === 'textarea',
  )
  const textos = camposTexto
    .map((sub) => textoDe(item[sub.key] ?? ''))
    .filter((texto) => texto.length > 0)
  const titulo = textos[0] ?? `${field.label} ${indice + 1}`
  const subtitulo = textos[1] ?? `Elemento ${indice + 1} de ${total}`

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.07] bg-white shadow-xs">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <span className="bg-enel-mist text-enel-navy flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums">
          {indice + 1}
        </span>

        <button
          type="button"
          onClick={() => setAbierto((valor) => !valor)}
          aria-expanded={abierto}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-enel-navy truncate text-sm font-medium">{titulo}</p>
          <p className="text-muted-foreground truncate text-xs">{subtitulo}</p>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Mover arriba"
            title="Mover arriba"
            disabled={indice === 0}
            onClick={() => onMover(-1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Mover abajo"
            title="Mover abajo"
            disabled={indice === total - 1}
            onClick={() => onMover(1)}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Eliminar elemento"
            title="Eliminar"
            className="text-muted-foreground hover:text-destructive"
            onClick={onEliminar}
          >
            <Trash className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={abierto ? 'Contraer elemento' : 'Expandir elemento'}
            aria-expanded={abierto}
            onClick={() => setAbierto((valor) => !valor)}
          >
            <CaretDown className={cn('size-4 transition-transform', abierto && 'rotate-180')} />
          </Button>
        </div>
      </div>

      {abierto && (
        <div className="flex flex-col gap-5 border-t border-black/5 bg-[#fbfcfd] px-4 py-4">
          {(field.item_fields ?? []).map((sub) => (
            <CampoEditor
              key={sub.key}
              field={sub}
              value={item[sub.key] ?? (sub.default as CmsFieldValue)}
              onChange={(nuevo) => onChange(sub.key, nuevo)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ListaEditor({
  field,
  value,
  onChange,
}: {
  field: CmsFieldSchema
  value: CmsFieldValue
  onChange: (value: CmsFieldValue) => void
}) {
  const items = Array.isArray(value) ? (value as CmsListItem[]) : []
  const maximo = field.max_items ?? 40

  function actualizar(indice: number, clave: string, nuevo: CmsFieldValue) {
    const copia = items.map((item, i) => (i === indice ? { ...item, [clave]: nuevo } : item))
    onChange(copia)
  }

  function mover(indice: number, direccion: -1 | 1) {
    const destino = indice + direccion
    if (destino < 0 || destino >= items.length) return
    const copia = [...items]
    const [item] = copia.splice(indice, 1)
    if (!item) return
    copia.splice(destino, 0, item)
    onChange(copia)
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-1 rounded-xl border border-dashed border-black/10 bg-[#fbfcfd] px-4 py-8 text-center text-sm">
          <p className="text-enel-navy font-medium">Aún no hay {field.label.toLowerCase()}</p>
          <p className="text-xs">Agrega el primer elemento para empezar.</p>
        </div>
      )}

      {items.map((item, indice) => (
        <ListaItem
          key={indice}
          field={field}
          item={item}
          indice={indice}
          total={items.length}
          onChange={(clave, nuevo) => actualizar(indice, clave, nuevo)}
          onMover={(direccion) => mover(indice, direccion)}
          onEliminar={() => onChange(items.filter((_, i) => i !== indice))}
        />
      ))}

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={items.length >= maximo}
          onClick={() => onChange([...items, valorLista(field)])}
        >
          <Plus data-icon="inline-start" />
          Agregar {field.label.toLowerCase()}
        </Button>
        <span className="text-muted-foreground/70 text-[11px] tabular-nums">
          {items.length} / {maximo}
        </span>
      </div>
    </div>
  )
}

export function CampoEditor({
  field,
  value,
  onChange,
}: {
  field: CmsFieldSchema
  value: CmsFieldValue
  onChange: (value: CmsFieldValue) => void
}) {
  const id = useId()
  const ayudaId = useId()
  const conAyuda = Boolean(field.help_text)

  if (field.type === 'list') {
    return (
      <Field className="gap-2.5">
        <div className="flex items-end justify-between gap-3">
          <FieldLabel className="text-enel-navy text-[13px] font-medium">
            {field.label}
            {field.required && (
              <span className="text-destructive" aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </FieldLabel>
          <span className="text-muted-foreground/70 text-[11px]">Lista</span>
        </div>
        {field.help_text && <FieldDescription>{field.help_text}</FieldDescription>}
        <ListaEditor field={field} value={value} onChange={onChange} />
      </Field>
    )
  }

  const esTexto = typeof value === 'string'
  const largo = esTexto ? value.length : 0
  const mostrarContador = Boolean(field.max_length) && esTexto
  const cercaDelLimite = Boolean(field.max_length) && largo >= (field.max_length ?? 0) * 0.9

  const descripcion = conAyuda ? ayudaId : undefined

  return (
    <Field className="gap-2">
      <div className="flex items-end justify-between gap-3">
        <FieldLabel htmlFor={id} className="text-enel-navy text-[13px] font-medium">
          {field.label}
          {field.required && (
            <span className="text-destructive" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </FieldLabel>
        {mostrarContador && (
          <span
            className={cn(
              'text-[11px] tabular-nums',
              cercaDelLimite ? 'font-medium text-amber-600' : 'text-muted-foreground/70',
            )}
          >
            {largo} / {field.max_length}
          </span>
        )}
      </div>

      {field.type === 'text' && (
        <Input
          id={id}
          value={esTexto ? value : ''}
          maxLength={field.max_length}
          autoComplete="off"
          aria-describedby={descripcion}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'textarea' && (
        <Textarea
          id={id}
          rows={4}
          value={esTexto ? value : ''}
          maxLength={field.max_length}
          aria-describedby={descripcion}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {(field.type === 'url' || field.type === 'youtube') && (
        <Input
          id={id}
          type="url"
          value={esTexto ? value : ''}
          placeholder={field.type === 'youtube' ? 'https://www.youtube.com/watch?v=…' : 'https://…'}
          autoComplete="off"
          aria-describedby={descripcion}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'image' && (
        <ImageField value={esTexto ? value : ''} onChange={(url) => onChange(url)} />
      )}

      {field.type === 'number' && (
        <Input
          id={id}
          type="number"
          value={typeof value === 'number' ? value : 0}
          aria-describedby={descripcion}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}

      {field.type === 'select' && (
        <Select
          value={esTexto ? value : String(field.default ?? '')}
          onValueChange={(nuevo) => onChange(nuevo)}
        >
          <SelectTrigger id={id} className="w-full" aria-describedby={descripcion}>
            <SelectValue placeholder={field.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {(field.options ?? []).map((opcion) => (
                <SelectItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}

      {field.type === 'rich' && (
        <RichTextEditor
          value={
            value && typeof value === 'object' && !Array.isArray(value)
              ? (value as RichTextDoc)
              : undefined
          }
          onChange={(doc) => onChange(doc)}
        />
      )}

      {field.help_text && (
        <FieldDescription id={ayudaId} className="text-[12px] leading-relaxed">
          {field.help_text}
        </FieldDescription>
      )}
    </Field>
  )
}
