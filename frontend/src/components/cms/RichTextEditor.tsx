import { Fragment, useEffect, type ReactNode } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  LinkSimple,
  ListBullets,
  ListNumbers,
  Quotes,
  TextB,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextUnderline,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RichTextDoc } from '@/types/cms'

const DOC_VACIO: RichTextDoc = { type: 'doc', content: [{ type: 'paragraph' }] }

interface Control {
  label: string
  icono: ReactNode
  activo?: boolean
  deshabilitado?: boolean
  onClick: () => void
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe el contenido…',
}: {
  value: RichTextDoc | undefined
  onChange: (doc: RichTextDoc) => void
  placeholder?: string
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
    ],
    content: value ?? DOC_VACIO,
    editorProps: {
      attributes: {
        class: 'tiptap',
        'aria-label': 'Editor de texto enriquecido',
      },
    },
    onUpdate: ({ editor: instancia }) => {
      onChange(instancia.getJSON() as RichTextDoc)
    },
  })

  useEffect(() => {
    if (!editor) return
    const actual = JSON.stringify(editor.getJSON())
    const nuevo = JSON.stringify(value ?? DOC_VACIO)
    if (actual !== nuevo) {
      editor.commands.setContent(value ?? DOC_VACIO)
    }
  }, [editor, value])

  if (!editor) return null

  function editarEnlace() {
    const anterior = editor!.getAttributes('link').href as string | undefined
    const href = window.prompt('URL del enlace (http o https):', anterior ?? 'https://')
    if (href === null) return
    if (!href.trim()) {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    if (!/^https?:\/\//i.test(href.trim())) {
      window.alert('El enlace debe comenzar con http:// o https://')
      return
    }
    editor!.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  const grupos: Control[][] = [
    [
      {
        label: 'Negrita',
        icono: <TextB className="size-4" />,
        activo: editor.isActive('bold'),
        onClick: () => editor.chain().focus().toggleBold().run(),
      },
      {
        label: 'Cursiva',
        icono: <TextItalic className="size-4" />,
        activo: editor.isActive('italic'),
        onClick: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        label: 'Subrayado',
        icono: <TextUnderline className="size-4" />,
        activo: editor.isActive('underline'),
        onClick: () => editor.chain().focus().toggleUnderline().run(),
      },
    ],
    [
      {
        label: 'Título nivel 2',
        icono: <TextHTwo className="size-4" />,
        activo: editor.isActive('heading', { level: 2 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        label: 'Título nivel 3',
        icono: <TextHThree className="size-4" />,
        activo: editor.isActive('heading', { level: 3 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
    ],
    [
      {
        label: 'Lista con viñetas',
        icono: <ListBullets className="size-4" />,
        activo: editor.isActive('bulletList'),
        onClick: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        label: 'Lista numerada',
        icono: <ListNumbers className="size-4" />,
        activo: editor.isActive('orderedList'),
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        label: 'Cita',
        icono: <Quotes className="size-4" />,
        activo: editor.isActive('blockquote'),
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        label: 'Enlace',
        icono: <LinkSimple className="size-4" />,
        activo: editor.isActive('link'),
        onClick: editarEnlace,
      },
    ],
    [
      {
        label: 'Deshacer',
        icono: <ArrowCounterClockwise className="size-4" />,
        deshabilitado: !editor.can().undo(),
        onClick: () => editor.chain().focus().undo().run(),
      },
      {
        label: 'Rehacer',
        icono: <ArrowClockwise className="size-4" />,
        deshabilitado: !editor.can().redo(),
        onClick: () => editor.chain().focus().redo().run(),
      },
    ],
  ]

  return (
    <div className="focus-within:border-enel-blue/40 focus-within:ring-enel-blue/10 overflow-hidden rounded-xl border border-black/10 bg-white shadow-xs transition-shadow focus-within:ring-4">
      <div
        role="toolbar"
        aria-label="Formato de texto"
        className="bg-enel-mist/60 flex flex-wrap items-center gap-0.5 border-b border-black/5 px-2 py-1.5"
      >
        {grupos.map((grupo, indice) => (
          <Fragment key={indice}>
            {indice > 0 && <span className="mx-1 h-5 w-px shrink-0 bg-black/10" />}
            <div className="flex items-center gap-0.5">
              {grupo.map((control) => (
                <Button
                  key={control.label}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={control.label}
                  aria-pressed={control.activo}
                  title={control.label}
                  disabled={control.deshabilitado}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={control.onClick}
                  className={cn(
                    'text-muted-foreground hover:text-enel-navy hover:bg-white/80',
                    control.activo &&
                      'text-enel-navy bg-white shadow-sm ring-1 ring-black/5 hover:bg-white',
                  )}
                >
                  {control.icono}
                </Button>
              ))}
            </div>
          </Fragment>
        ))}
      </div>

      <div className="relative">
        <EditorContent editor={editor} />
        {editor.isEmpty && (
          <p className="text-muted-foreground pointer-events-none absolute top-3 left-4 text-sm">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  )
}
