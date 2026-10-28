const ID_YOUTUBE = /^[\w-]{6,20}$/
const HOSTS_YOUTUBE = new Set(['youtube.com', 'www.youtube.com'])

/**
 * Extrae el ID de los enlaces que el CMS acepta: watch, embed, shorts, live y
 * youtu.be. Mantener esta lista alineada con YOUTUBE_RE del backend.
 */
export function obtenerIdYouTube(url: string): string | null {
  let enlace: URL
  try {
    enlace = new URL(url)
  } catch {
    return null
  }
  if (enlace.protocol !== 'http:' && enlace.protocol !== 'https:') return null

  let id: string | null = null
  if (enlace.hostname === 'youtu.be') {
    id = enlace.pathname.split('/').filter(Boolean)[0] ?? null
  } else if (HOSTS_YOUTUBE.has(enlace.hostname)) {
    const segmentos = enlace.pathname.split('/').filter(Boolean)
    const tipo = segmentos[0]
    if (tipo === 'watch') {
      id = enlace.searchParams.get('v')
    } else if (tipo === 'embed' || tipo === 'shorts' || tipo === 'live') {
      id = segmentos[1] ?? null
    }
  }

  return id && ID_YOUTUBE.test(id) ? id : null
}
