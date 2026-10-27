import { useEffect } from 'react'
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
import type { RichTextDoc } from '@/types/cms'

const DOC_VACIO: RichTextDoc = { type: 'doc', content: [{ type: 'paragraph' }] }

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
        'data-placeholder': placeholder,
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

  return (
    <div className="bg-background overflow-hidden rounded-md border">
      <div className="bg-muted/60 flex flex-wrap items-center gap-1 border-b p-1.5">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Negrita"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <TextB />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Cursiva"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <TextItalic />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Subrayado"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <TextUnderline />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Título nivel 2"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <TextHTwo />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Título nivel 3"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <TextHThree />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Lista con viñetas"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListBullets />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Lista numerada"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListNumbers />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Cita"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quotes />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('link') ? 'secondary' : 'ghost'}
          size="sm"
          aria-label="Enlace"
          onMouseDown={(e) => e.preventDefault()}
          onClick={editarEnlace}
        >
          <LinkSimple />
        </Button>
        <span className="bg-border mx-1 h-5 w-px" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Deshacer"
          disabled={!editor.can().undo()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <ArrowCounterClockwise />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Rehacer"
          disabled={!editor.can().redo()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <ArrowClockwise />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
