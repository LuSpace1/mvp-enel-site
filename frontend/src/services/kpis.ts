import { http } from '@/lib/http'
import type { KpiPersonasRespuesta, KpiTablero } from '@/types/kpis'

export interface RangoKpi {
  desde: string
  hasta: string
}

export async function obtenerTablero(rango: RangoKpi): Promise<KpiTablero> {
  const { data } = await http.get<KpiTablero>('/analytics/admin/dashboard/', {
    params: rango,
  })
  return data
}

export async function obtenerPersonas(
  rango: RangoKpi & { pagina: number; tamano?: number },
): Promise<KpiPersonasRespuesta> {
  const { data } = await http.get<KpiPersonasRespuesta>('/analytics/admin/personas/', {
    params: rango,
  })
  return data
}

export async function descargarCsv(rango: RangoKpi): Promise<void> {
  const { data } = await http.get<Blob>('/analytics/admin/export/', {
    params: rango,
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `kpis-portal-${rango.hasta}.csv`
  enlace.click()
  URL.revokeObjectURL(url)
}
