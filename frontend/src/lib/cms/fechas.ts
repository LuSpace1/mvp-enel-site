const RELATIVO = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

export function fechaHora(valor: string | null | undefined): string {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function fechaCorta(valor: string | null | undefined): string {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function fechaRelativa(valor: string | null | undefined): string {
  if (!valor) return '—'
  const segundos = (new Date(valor).getTime() - Date.now()) / 1000
  const absoluto = Math.abs(segundos)
  if (absoluto < 60) return 'hace instantes'
  if (absoluto < 3600) return RELATIVO.format(Math.round(segundos / 60), 'minute')
  if (absoluto < 86400) return RELATIVO.format(Math.round(segundos / 3600), 'hour')
  if (absoluto < 2592000) return RELATIVO.format(Math.round(segundos / 86400), 'day')
  return fechaHora(valor)
}
