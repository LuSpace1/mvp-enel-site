import { ArrowDown, ArrowUp, Plus, Trash } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
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
    <div className="flex flex-col gap-3">
      {items.map((item, indice) => (
        <Card key={indice} size="sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span>
                {field.label} {indice + 1}
              </span>
              <span className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Subir"
                  disabled={indice === 0}
                  onClick={() => mover(indice, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Bajar"
                  disabled={indice === items.length - 1}
                  onClick={() => mover(indice, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Eliminar"
                  onClick={() => onChange(items.filter((_, i) => i !== indice))}
                >
                  <Trash />
                </Button>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              {(field.item_fields ?? []).map((sub) => (
                <CampoEditor
                  key={sub.key}
                  field={sub}
                  value={item[sub.key] ?? (sub.default as CmsFieldValue)}
                  onChange={(nuevo) => actualizar(indice, sub.key, nuevo)}
                />
              ))}
            </FieldGroup>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={items.length >= maximo}
        onClick={() => onChange([...items, valorLista(field)])}
      >
        <Plus data-icon="inline-start" />
        Agregar {field.label.toLowerCase()}
      </Button>
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
  const id = `campo-${field.key}`

  if (field.type === 'list') {
    return (
      <Field>
        <FieldLabel>{field.label}</FieldLabel>
        {field.help_text && <FieldDescription>{field.help_text}</FieldDescription>}
        <ListaEditor field={field} value={value} onChange={onChange} />
      </Field>
    )
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {field.label}
        {field.required && (
          <span className="text-destructive" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </FieldLabel>

      {field.type === 'text' && (
        <Input
          id={id}
          value={typeof value === 'string' ? value : ''}
          maxLength={field.max_length}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'textarea' && (
        <Textarea
          id={id}
          rows={4}
          value={typeof value === 'string' ? value : ''}
          maxLength={field.max_length}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {(field.type === 'url' || field.type === 'youtube') && (
        <Input
          id={id}
          type="url"
          value={typeof value === 'string' ? value : ''}
          placeholder={field.type === 'youtube' ? 'https://www.youtube.com/watch?v=…' : 'https://…'}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'image' && (
        <ImageField
          value={typeof value === 'string' ? value : ''}
          onChange={(url) => onChange(url)}
        />
      )}

      {field.type === 'number' && (
        <Input
          id={id}
          type="number"
          value={typeof value === 'number' ? value : 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}

      {field.type === 'select' && (
        <Select
          value={typeof value === 'string' ? value : String(field.default ?? '')}
          onValueChange={(nuevo) => onChange(nuevo)}
        >
          <SelectTrigger id={id} className="w-full">
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

      {field.help_text && <FieldDescription>{field.help_text}</FieldDescription>}
    </Field>
  )
}
