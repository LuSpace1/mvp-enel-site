const NUMERO = new Intl.NumberFormat('es-CL')
const COMPACTO = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const num = (valor: number) => NUMERO.format(Math.round(valor))
export const compacto = (valor: number) => COMPACTO.format(valor)
