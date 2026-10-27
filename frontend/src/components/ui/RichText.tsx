import type { ReactNode } from 'react'

import type { RichTextDoc, RichTextNode } from '@/types/cms'

function aplicarMarcas(texto: ReactNode, marcas: RichTextNode['marks'] = []) {
  return marcas.reduce<ReactNode>((contenido, marca, indice) => {
    switch (marca.type) {
      case 'bold':
        return <strong key={indice}>{contenido}</strong>
      case 'italic':
        return <em key={indice}>{contenido}</em>
      case 'underline':
        return <u key={indice}>{contenido}</u>
      case 'link': {
        const href = typeof marca.attrs?.href === 'string' ? marca.attrs.href : ''
        if (!href.startsWith('http://') && !href.startsWith('https://')) return contenido
        return (
          <a
            key={indice}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-enel-blue underline underline-offset-2"
          >
            {contenido}
          </a>
        )
      }
      default:
        return contenido
    }
  }, texto)
}

function Nodo({ nodo, indice }: { nodo: RichTextNode; indice: number }) {
  const hijos = nodo.content?.map((hijo, i) => <Nodo key={i} nodo={hijo} indice={i} />)

  switch (nodo.type) {
    case 'text':
      return <>{aplicarMarcas(nodo.text ?? '', nodo.marks)}</>
    case 'hardBreak':
      return <br />
    case 'paragraph':
      return <p className="mt-3 first:mt-0">{hijos}</p>
    case 'heading': {
      const nivel = nodo.attrs?.level === 3 ? 3 : 2
      return nivel === 3 ? (
        <h3 className="mt-5 text-lg font-semibold">{hijos}</h3>
      ) : (
        <h2 className="mt-5 text-xl font-semibold">{hijos}</h2>
      )
    }
    case 'bulletList':
      return <ul className="mt-3 list-disc space-y-1 pl-5">{hijos}</ul>
    case 'orderedList':
      return <ol className="mt-3 list-decimal space-y-1 pl-5">{hijos}</ol>
    case 'listItem':
      return <li>{hijos}</li>
    case 'blockquote':
      return (
        <blockquote className="border-enel-blue/40 mt-3 border-l-2 pl-4 text-neutral-600 italic">
          {hijos}
        </blockquote>
      )
    case 'doc':
      return <>{hijos}</>
    default:
      return <span key={indice}>{hijos}</span>
  }
}

export function RichText({
  doc,
  className,
}: {
  doc: RichTextDoc | null | undefined
  className?: string
}) {
  if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content)) return null
  return (
    <div className={className}>
      {doc.content.map((nodo, indice) => (
        <Nodo key={indice} nodo={nodo} indice={indice} />
      ))}
    </div>
  )
}

export function textoPlano(doc: RichTextDoc | null | undefined): string {
  if (!doc || doc.type !== 'doc') return ''
  const partes: string[] = []
  const recorrer = (nodo: RichTextNode) => {
    if (nodo.type === 'text' && nodo.text) partes.push(nodo.text)
    nodo.content?.forEach(recorrer)
  }
  doc.content?.forEach(recorrer)
  return partes.join(' ')
}
