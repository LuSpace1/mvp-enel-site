import type { CmsPayload } from '@/types/cms'

function normalizar(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(normalizar)
  if (valor && typeof valor === 'object') {
    return Object.keys(valor as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acumulado, clave) => {
        acumulado[clave] = normalizar((valor as Record<string, unknown>)[clave])
        return acumulado
      }, {})
  }
  return valor
}

function iguales(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalizar(a)) === JSON.stringify(normalizar(b))
}

export interface ComparacionPayload {
  contenido: boolean
  orden: boolean
  soloOrden: boolean
}

/**
 * Compara el borrador con la publicación vigente sin depender del orden de
 * las claves del JSON. Si no hay publicación de referencia, asume que todo
 * cambió para no dar una falsa sensación de que no hay nada pendiente.
 */
export function compararPayload(
  borrador: CmsPayload | null | undefined,
  publicado: CmsPayload | null | undefined,
): ComparacionPayload {
  if (!borrador) return { contenido: false, orden: false, soloOrden: false }
  if (!publicado) return { contenido: true, orden: true, soloOrden: false }

  const contenido = !iguales(borrador.sections, publicado.sections)
  const orden = !iguales(borrador.order, publicado.order)
  return { contenido, orden, soloOrden: orden && !contenido }
}
