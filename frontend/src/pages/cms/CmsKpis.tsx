import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowClockwise,
  ArrowsDownUp,
  BookOpen,
  ChartBar,
  Clock,
  Compass,
  DownloadSimple,
  Info,
  ListDashes,
  SmileyMeh,
  SquaresFour,
  Star,
  Target,
  TrendUp,
} from '@phosphor-icons/react'
import { isAxiosError } from 'axios'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { CmsPageHeader } from '@/components/cms/CmsPageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ETIQUETAS_SECCION, SECCIONES_ORDEN } from '@/lib/cms/registro'
import { notificarError, notificarExito } from '@/lib/cms/notificaciones'
import { cn } from '@/lib/utils'
import { descargarCsv, obtenerTablero, type RangoKpi } from '@/services/kpis'
import type { KpiSeccion, KpiTablero } from '@/types/kpis'

const RANGOS = [
  { valor: '7', etiqueta: 'Últimos 7 días' },
  { valor: '30', etiqueta: 'Últimos 30 días' },
  { valor: '90', etiqueta: 'Últimos 90 días' },
]

// Paleta analítica corporativa sobria (Enel Institucional + Neutrales de precisión)
const COLOR_PRIMARIO = '#006fbb' // Azul Enel
const COLOR_SECUNDARIO = '#334155' // Slate corporativo
const COLOR_LINEA_GRIS = '#f1f5f9'
const COLOR_BORDE = '#e2e8f0'

type ExplicacionKpi = {
  resumen: string
  calculo: string
  nota?: string
}

const EXPLICACIONES = {
  personas: {
    resumen: 'Personas distintas que ingresaron al portal en el período.',
    calculo:
      'Cuentas autenticadas únicas que iniciaron sesión al menos una vez. Al exigir autenticación corporativa, cada usuario se computa de forma singular independientemente del dispositivo.',
    nota: 'Un usuario puede generar múltiples sesiones; en este indicador computa como 1.',
  },
  visitas: {
    resumen: 'Sesiones de navegación generadas en el portal.',
    calculo:
      'Una sesión se abre con la primera actividad y se cierra automáticamente tras 30 minutos continuos de inactividad.',
    nota: 'Permite medir la recurrencia media al contrastarse con los usuarios únicos.',
  },
  pageViews: {
    resumen: 'Volumen bruto de cargas y renderizaciones del portal.',
    calculo:
      'Total de invocaciones del portal registradas por el cliente, incluyendo reaperturas y recargas directas de página.',
    nota: 'Muestra el volumen de tráfico total procesado por el frontend.',
  },
  completitud: {
    resumen: 'Tasa de conversión de usuarios que completaron el recorrido corporativo.',
    calculo:
      'Proporción de usuarios cuya sesión alcanzó la sección final (Cierre) habiendo navegado por al menos el 60% de las secciones previas.',
    nota: 'Un acceso directo a la URL de cierre no califica como viaje completado.',
  },
  profundidad: {
    resumen: 'Promedio de secciones revisadas por sesión de navegación.',
    calculo:
      'Media de secciones únicas visitadas en cada sesión respecto al total de 11 estaciones del viaje corporativo.',
    nota: 'No computa reiteraciones de una misma sección dentro de la misma sesión.',
  },
  tiempoCompletitud: {
    resumen: 'Tiempo mediano de lectura activa hasta completar el viaje.',
    calculo:
      'Mediana del tiempo activo de lectura acumulado por las visitas que alcanzaron la sección final de Cierre.',
    nota: 'El uso de mediana evita distorsiones causadas por sesiones atípicas o pausas prolongadas.',
  },
  permanencia: {
    resumen: 'Tiempo mediano de atención activa por sesión.',
    calculo:
      'Tiempo efectivo con la pestaña en foco y con interacción activa detectada (scroll, clics o cursor).',
    nota: 'No contabiliza tiempo en segundo plano o ventanas minimizadas.',
  },
  satisfaccion: {
    resumen: 'Índice de valoración cualitativa en escala de 1 a 5.',
    calculo:
      'Media aritmética de las calificaciones registradas por los colaboradores en el formulario de cierre del portal.',
    nota: 'Se detalla además la tasa de participación del total de visitantes evaluados.',
  },
} satisfies Record<string, ExplicacionKpi>

function iso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function rangoDeDias(dias: number): RangoKpi {
  const hasta = new Date()
  const desde = new Date()
  desde.setDate(hasta.getDate() - (dias - 1))
  return { desde: iso(desde), hasta: iso(hasta) }
}

function numero(valor: number | null | undefined): string {
  return new Intl.NumberFormat('es-CL').format(valor ?? 0)
}

function plural(cantidad: number, singular: string, varios: string): string {
  return `${numero(cantidad)} ${cantidad === 1 ? singular : varios}`
}

function porcentaje(valor: number | null | undefined): string {
  return `${Math.round((valor ?? 0) * 100)}%`
}

function promedio(valor: number): string {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(valor)
}

function duracion(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined) return '—'
  if (segundos <= 0) return '0 s'
  if (segundos < 60) return `${Math.round(segundos)} s`
  const minutos = Math.floor(segundos / 60)
  const resto = Math.round(segundos % 60)
  if (minutos < 60) return resto ? `${minutos}m ${resto}s` : `${minutos}m`
  const horas = Math.floor(minutos / 60)
  return `${horas}h ${minutos % 60}m`
}

function etiqueta(clave: string): string {
  return ETIQUETAS_SECCION[clave] ?? clave
}

function seccionesCompletas(datos: KpiSeccion[]): KpiSeccion[] {
  const porClave = new Map(datos.map((fila) => [fila.clave, fila]))
  return SECCIONES_ORDEN.map(
    (clave) =>
      porClave.get(clave) ?? {
        clave,
        vistas: 0,
        personas: 0,
        interacciones: 0,
        personas_interactuaron: 0,
        tasa_interaccion: 0,
        tiempo_medio: null,
      },
  )
}

function detalleError(error: unknown): string {
  if (isAxiosError(error)) {
    const datos = error.response?.data
    if (datos && typeof datos === 'object') {
      const objeto = datos as Record<string, unknown>
      if (typeof objeto.detail === 'string') return objeto.detail
    }
    return `Error ${error.response?.status ?? ''}`.trim()
  }
  return 'No se pudieron cargar los KPIs.'
}

/**
 * Tarjeta de KPI Ejecutiva:
 * Diseño analítico sobrio, tipografía tabular contrastada, bordes neutros limpios,
 * sin barras ni acentos de color artificiales.
 */
function TarjetaKpiCorporativa({
  titulo,
  valor,
  detalle,
  explicacion,
  progreso,
  referencia,
}: {
  titulo: string
  valor: string
  detalle?: string
  explicacion: ExplicacionKpi
  progreso?: number
  referencia?: string
}) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <div className="group relative flex flex-col justify-between rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-colors hover:border-neutral-300">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
              {titulo}
            </span>
            <button
              type="button"
              onClick={() => setAbierto(true)}
              aria-label={`Ver metodología de ${titulo}`}
              className="text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            >
              <Info size={14} weight="bold" />
            </button>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="font-heading text-2xl font-bold tracking-tight text-neutral-900 tabular-nums lg:text-3xl">
              {valor}
            </span>
            {referencia && (
              <span className="text-xs font-medium text-neutral-500 tabular-nums">
                {referencia}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3">
          {progreso !== undefined && (
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-enel-blue transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progreso * 100))}%` }}
              />
            </div>
          )}
          {detalle && (
            <p className="text-xs text-neutral-500 leading-snug">
              {detalle}
            </p>
          )}
        </div>
      </div>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-neutral-900 font-semibold">{titulo}</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">{explicacion.resumen}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs leading-relaxed text-neutral-700">
            <div className="rounded-lg border border-neutral-200/80 bg-neutral-50 p-3">
              <p className="font-semibold text-neutral-900 mb-1">Metodología de cálculo</p>
              <p>{explicacion.calculo}</p>
            </div>
            {explicacion.nota && (
              <p className="text-neutral-500 italic">
                Nota: {explicacion.nota}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" size="sm" variant="outline">
                Cerrar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function EstadoVacio() {
  return (
    <Card className="items-center justify-center py-16 text-center border-neutral-200/80 bg-white">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
        <ChartBar size={22} weight="bold" />
      </div>
      <p className="mt-4 text-sm font-semibold text-neutral-900">
        Sin actividad registrada en este período
      </p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
        Las métricas se consolidan automáticamente conforme las cuentas autenticadas recorren el portal.
      </p>
    </Card>
  )
}

function GraficoSerie({ datos }: { datos: KpiTablero['serie'] }) {
  const filas = datos.map((punto) => ({
    ...punto,
    etiqueta: punto.fecha.slice(5).replace('-', '/'),
  }))
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={filas} margin={{ top: 12, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={COLOR_LINEA_GRIS} strokeDasharray="3 3" />
        <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} fontSize={11} stroke="#64748b" />
        <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} stroke="#64748b" />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${COLOR_BORDE}`,
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            backgroundColor: '#ffffff',
          }}
          labelFormatter={(valor) => `Fecha: ${valor}`}
        />
        <Line
          type="monotone"
          dataKey="visitas"
          name="Visitas totales"
          stroke={COLOR_PRIMARIO}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="completas"
          name="Recorridos completados"
          stroke={COLOR_SECUNDARIO}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function GraficoRecorrido({ datos }: { datos: KpiTablero['recorrido']['histograma'] }) {
  const completo = datos.length ? Math.max(...datos.map((fila) => fila.secciones)) : 11
  const umbralCompletitud = Math.ceil(completo * 0.6)
  const filas = datos.map((fila) => ({
    nombre: `${fila.secciones} sec.`,
    visitas: fila.visitas,
    esCompleta: fila.secciones >= umbralCompletitud,
  }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={filas} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={COLOR_LINEA_GRIS} strokeDasharray="3 3" />
        <XAxis dataKey="nombre" tickLine={false} axisLine={false} fontSize={11} stroke="#64748b" />
        <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} stroke="#64748b" />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: `1px solid ${COLOR_BORDE}`,
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
          labelFormatter={(valor) => `Profundidad alcanzada: ${valor}`}
        />
        <Bar dataKey="visitas" name="Sesiones" radius={[4, 4, 0, 0]}>
          {filas.map((fila, indice) => (
            <Cell
              key={indice}
              fill={fila.esCompleta ? COLOR_PRIMARIO : '#94a3b8'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Visualizador de Secciones de Grado Corporativo:
 * - Sin marcas de colores de bordes ni gradientes decorativos.
 * - Tira ejecutiva con 3 insights estratégicos de rendimiento.
 * - Toggle de visualización: Gráfico de Embudo (Funnel) vs Cuadrícula de Fichas de Auditoría.
 * - Métricas claras con números tabulares de alta precisión.
 */
function VisualizadorSecciones({ datos }: { datos: KpiSeccion[] }) {
  const [criterio, setCriterio] = useState<'recorrido' | 'vistas' | 'tiempo' | 'interaccion'>(
    'recorrido',
  )
  const [vista, setVista] = useState<'grafico' | 'fichas'>('grafico')

  const baseVistas = useMemo(() => {
    const primera = datos.find((d) => d.clave === 'portada')
    return Math.max(1, primera?.vistas || Math.max(...datos.map((d) => d.vistas), 1))
  }, [datos])

  // Insights ejecutivos automáticos
  const { topPermanencia, topInteraccion, seccionMasVista } = useMemo(() => {
    if (!datos.length) return { topPermanencia: null, topInteraccion: null, seccionMasVista: null }
    const porVistas = [...datos].sort((a, b) => b.vistas - a.vistas)[0]
    const porTiempo = [...datos].sort((a, b) => (b.tiempo_medio ?? 0) - (a.tiempo_medio ?? 0))[0]
    const porInteraccion = [...datos].sort((a, b) => b.tasa_interaccion - a.tasa_interaccion)[0]
    return {
      topPermanencia: porTiempo,
      topInteraccion: porInteraccion,
      seccionMasVista: porVistas,
    }
  }, [datos])

  const ordenadas = useMemo(() => {
    const copia = [...datos]
    if (criterio === 'vistas') return copia.sort((a, b) => b.vistas - a.vistas)
    if (criterio === 'tiempo')
      return copia.sort((a, b) => (b.tiempo_medio ?? 0) - (a.tiempo_medio ?? 0))
    if (criterio === 'interaccion')
      return copia.sort((a, b) => b.tasa_interaccion - a.tasa_interaccion)
    // 'recorrido': cronología natural del viaje en SECCIONES_ORDEN
    const ordenMap = new Map<string, number>(SECCIONES_ORDEN.map((k, i) => [k, i]))
    return copia.sort((a, b) => (ordenMap.get(a.clave) ?? 99) - (ordenMap.get(b.clave) ?? 99))
  }, [datos, criterio])

  const datosGrafico = useMemo(() => {
    return ordenadas.map((s) => {
      const idx = SECCIONES_ORDEN.indexOf(s.clave as (typeof SECCIONES_ORDEN)[number])
      const numPaso = idx >= 0 ? String(idx + 1).padStart(2, '0') : ''
      return {
        etapa: numPaso ? `${numPaso}. ${etiqueta(s.clave)}` : etiqueta(s.clave),
        nombre: etiqueta(s.clave),
        clave: s.clave,
        vistas: s.vistas,
        personas: s.personas,
        interacciones: s.interacciones,
        tiempo_medio: s.tiempo_medio ?? 0,
        tasa_interaccion_pct: Math.round(s.tasa_interaccion * 100),
        retencion_pct: Math.round((s.vistas / baseVistas) * 100),
      }
    })
  }, [ordenadas, baseVistas])

  return (
    <div className="space-y-5">
      {/* 1. Tira de Insights Estratégicos de Contenido */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            <Compass size={14} className="text-neutral-500" />
            <span>Mayor tráfico de acceso</span>
          </div>
          <p className="mt-1.5 text-base font-bold text-neutral-900 truncate">
            {seccionMasVista ? etiqueta(seccionMasVista.clave) : '—'}
          </p>
          <p className="text-xs text-neutral-500 tabular-nums">
            {seccionMasVista ? `${numero(seccionMasVista.vistas)} vistas registradas` : '—'}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            <Clock size={14} className="text-neutral-500" />
            <span>Mayor permanencia de lectura</span>
          </div>
          <p className="mt-1.5 text-base font-bold text-neutral-900 truncate">
            {topPermanencia ? etiqueta(topPermanencia.clave) : '—'}
          </p>
          <p className="text-xs text-neutral-500 tabular-nums">
            {topPermanencia ? `${duracion(topPermanencia.tiempo_medio)} de tiempo promedio` : '—'}
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            <Target size={14} className="text-neutral-500" />
            <span>Mayor ratio de interacción activa</span>
          </div>
          <p className="mt-1.5 text-base font-bold text-neutral-900 truncate">
            {topInteraccion ? etiqueta(topInteraccion.clave) : '—'}
          </p>
          <p className="text-xs text-neutral-500 tabular-nums">
            {topInteraccion ? `${Math.round(topInteraccion.tasa_interaccion * 100)}% de lectores activos` : '—'}
          </p>
        </div>
      </div>

      {/* 2. Barra de Control Analítico (Ordenación y Modo de Vista) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1.5">
            <ArrowsDownUp size={14} />
            <span>Criterio:</span>
          </span>
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              size="sm"
              variant={criterio === 'recorrido' ? 'default' : 'ghost'}
              onClick={() => setCriterio('recorrido')}
              className="h-7 text-xs font-medium"
            >
              Secuencia del viaje
            </Button>
            <Button
              type="button"
              size="sm"
              variant={criterio === 'vistas' ? 'default' : 'ghost'}
              onClick={() => setCriterio('vistas')}
              className="h-7 text-xs font-medium"
            >
              Más vistas
            </Button>
            <Button
              type="button"
              size="sm"
              variant={criterio === 'tiempo' ? 'default' : 'ghost'}
              onClick={() => setCriterio('tiempo')}
              className="h-7 text-xs font-medium"
            >
              Mayor permanencia
            </Button>
            <Button
              type="button"
              size="sm"
              variant={criterio === 'interaccion' ? 'default' : 'ghost'}
              onClick={() => setCriterio('interaccion')}
              className="h-7 text-xs font-medium"
            >
              Mayor interacción
            </Button>
          </div>
        </div>

        {/* Selector de tipo de vista */}
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
          <button
            type="button"
            onClick={() => setVista('grafico')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer',
              vista === 'grafico'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900',
            )}
          >
            <ListDashes size={14} />
            <span>Embudo comparativo</span>
          </button>
          <button
            type="button"
            onClick={() => setVista('fichas')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer',
              vista === 'fichas'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900',
            )}
          >
            <SquaresFour size={14} />
            <span>Fichas de auditoría</span>
          </button>
        </div>
      </div>

      {/* 3. Panel Principal de Contenido */}
      {vista === 'grafico' ? (
        <Card className="border-neutral-200/80 bg-white">
          <CardHeader className="border-b border-neutral-100 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-neutral-900">
                Embudo de Retención y Volumen por Sección
              </CardTitle>
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-xs bg-[#006fbb]" />
                  Vistas totales
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-xs bg-[#334155]" />
                  Interacciones activas
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={Math.max(340, datosGrafico.length * 38)}>
              <BarChart
                data={datosGrafico}
                layout="vertical"
                margin={{ top: 8, right: 32, left: 10, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} stroke={COLOR_LINEA_GRIS} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  allowDecimals={false}
                  stroke="#64748b"
                />
                <YAxis
                  type="category"
                  dataKey="etapa"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={140}
                  stroke="#1e293b"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length || !payload[0]) return null
                    const fila = payload[0].payload as {
                      nombre: string
                      vistas: number
                      personas: number
                      interacciones: number
                      tiempo_medio: number
                      tasa_interaccion_pct: number
                      retencion_pct: number
                    }
                    return (
                      <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-md min-w-[200px]">
                        <p className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-1.5">
                          {fila.nombre}
                        </p>
                        <div className="mt-2 space-y-1.5 text-xs text-neutral-600">
                          <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">Vistas:</span>
                            <span className="font-semibold text-neutral-900 tabular-nums">{numero(fila.vistas)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">Retención de flujo:</span>
                            <span className="font-semibold text-neutral-900 tabular-nums">{fila.retencion_pct}%</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">Tiempo promedio:</span>
                            <span className="font-semibold text-neutral-900 tabular-nums">{duracion(fila.tiempo_medio)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">Interacciones:</span>
                            <span className="font-semibold text-neutral-900 tabular-nums">{numero(fila.interacciones)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">Tasa de interacción:</span>
                            <span className="font-semibold text-neutral-900 tabular-nums">{fila.tasa_interaccion_pct}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="vistas"
                  name="Vistas"
                  fill={COLOR_PRIMARIO}
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                />
                <Bar
                  dataKey="interacciones"
                  name="Interacciones"
                  fill={COLOR_SECUNDARIO}
                  radius={[0, 4, 4, 0]}
                  barSize={8}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ordenadas.map((seccion) => {
            const idx = SECCIONES_ORDEN.indexOf(seccion.clave as (typeof SECCIONES_ORDEN)[number])
            const numPaso = idx >= 0 ? String(idx + 1).padStart(2, '0') : '—'
            const pctRetencion = Math.round((seccion.vistas / baseVistas) * 100)

            return (
              <div
                key={seccion.clave}
                className="flex flex-col justify-between rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs transition-colors hover:border-neutral-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold tracking-wider text-neutral-400 uppercase">
                      Etapa {numPaso}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-medium text-neutral-600 bg-neutral-50 border-neutral-200">
                      {pctRetencion}% retención
                    </Badge>
                  </div>
                  <h4 className="mt-1 text-sm font-semibold text-neutral-900">
                    {etiqueta(seccion.clave)}
                  </h4>
                </div>

                <div className="mt-4 space-y-3 pt-3 border-t border-neutral-100">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-500 block text-[11px]">Vistas</span>
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        {numero(seccion.vistas)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[11px]">Permanencia</span>
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        {duracion(seccion.tiempo_medio)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-500">
                      <span>Interacción activa</span>
                      <span className="font-medium text-neutral-700 tabular-nums">
                        {numero(seccion.interacciones)} ({Math.round(seccion.tasa_interaccion * 100)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-slate-700"
                        style={{ width: `${Math.min(100, seccion.tasa_interaccion * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PanelSatisfaccion({ tablero }: { tablero: KpiTablero }) {
  const { distribucion, ultimas, promedio: promedioNota, total } = tablero.satisfaccion
  const maximo = Math.max(1, ...distribucion.map((fila) => fila.cantidad))
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <div className="rounded-xl border border-neutral-200/80 bg-white p-4">
        <div className="flex items-baseline gap-2">
          <p className="font-heading text-3xl font-semibold text-neutral-900 tabular-nums">
            {promedioNota ? promedioNota.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-neutral-500">
            de 5 · {plural(total, 'respuesta', 'respuestas')}
          </p>
        </div>
        <div className="mt-4 space-y-2.5">
          {[...distribucion].reverse().map((fila) => (
            <div key={fila.puntaje} className="flex items-center gap-3 text-xs">
              <span className="w-5 font-mono text-neutral-500 tabular-nums">{fila.puntaje} ★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-enel-blue"
                  style={{ width: `${(fila.cantidad / maximo) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right font-mono text-neutral-700 tabular-nums">{fila.cantidad}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
          Comentarios cualitativos recientes
        </h4>
        {ultimas.length === 0 && (
          <div className="rounded-xl border border-neutral-200/80 bg-white p-8 text-center text-xs text-neutral-500">
            Sin observaciones cualitativas registradas en el período.
          </div>
        )}
        {ultimas.map((opinion, indice) => (
          <div
            key={`${opinion.creada_en}-${indice}`}
            className="rounded-xl border border-neutral-200/80 bg-white p-3.5 shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-800">
                {opinion.puntaje}/5 ★
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                {new Date(opinion.creada_en).toLocaleDateString('es-CL')}
              </span>
            </div>
            {opinion.comentario ? (
              <p className="mt-2 text-xs leading-relaxed text-neutral-700">{opinion.comentario}</p>
            ) : (
              <p className="mt-2 text-xs italic text-neutral-400">Sin comentario escrito</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CmsKpis() {
  const [dias, setDias] = useState('30')
  const [recarga, setRecarga] = useState(0)
  const [tablero, setTablero] = useState<KpiTablero | null>(null)
  const [cargando, setCargando] = useState(true)
  const [exportando, setExportando] = useState(false)
  const rango = useMemo(() => rangoDeDias(Number(dias)), [dias])

  useEffect(() => {
    let vigente = true
    setCargando(true)
    obtenerTablero(rango)
      .then((datos) => {
        if (vigente) setTablero(datos)
      })
      .catch((error) => {
        if (vigente) {
          setTablero(null)
          notificarError(detalleError(error))
        }
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [rango, recarga])

  const exportar = useCallback(async () => {
    setExportando(true)
    try {
      await descargarCsv(rango)
      notificarExito('Reporte CSV descargado con éxito')
    } catch {
      notificarError('No se pudo descargar el archivo CSV')
    } finally {
      setExportando(false)
    }
  }, [rango])

  const resumen = tablero?.resumen

  return (
    <div className="flex min-h-svh flex-col bg-neutral-50/50">
      <CmsPageHeader
        eyebrow="Analítica Corporativa"
        title="Adopción y Rendimiento del Portal"
        description="Métricas consolidadas de engagement, retención por etapa del viaje y retroalimentación institucional."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dias} onValueChange={setDias}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGOS.map((rangoDisponible) => (
                  <SelectItem key={rangoDisponible.valor} value={rangoDisponible.valor}>
                    {rangoDisponible.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRecarga((valor) => valor + 1)}
              className="bg-white"
            >
              <ArrowClockwise size={15} />
              Actualizar
            </Button>
            <Button type="button" size="sm" onClick={exportar} disabled={exportando}>
              <DownloadSimple size={15} />
              {exportando ? 'Exportando…' : 'Exportar CSV'}
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-4 md:p-6 xl:p-8">
        {cargando && !tablero && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, indice) => (
              <Skeleton key={indice} className="h-28 rounded-xl bg-neutral-200/60" />
            ))}
          </div>
        )}

        {!cargando && !tablero && <EstadoVacio />}

        {tablero && resumen && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-neutral-500">
                Ventana temporal: <strong className="font-mono text-neutral-800">{tablero.rango.desde}</strong>{' '}
                al <strong className="font-mono text-neutral-800">{tablero.rango.hasta}</strong>
              </p>
              {resumen.personas > 0 && resumen.personas < 20 && (
                <Badge variant="outline" className="text-xs text-neutral-600 bg-white">
                  Muestra preliminar ({resumen.personas} usuarios)
                </Badge>
              )}
            </div>

            {resumen.visitas === 0 ? (
              <EstadoVacio />
            ) : (
              <>
                {/* 1. Dashboard Ejecutivo de KPIs Principales */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <TarjetaKpiCorporativa
                    titulo="Usuarios únicos"
                    valor={numero(resumen.personas)}
                    detalle={`${promedio(resumen.visitas / Math.max(resumen.personas, 1))} sesiones por usuario`}
                    explicacion={EXPLICACIONES.personas}
                  />
                  <TarjetaKpiCorporativa
                    titulo="Sesiones totales"
                    valor={numero(resumen.visitas)}
                    detalle="Sesiones con actividad efectiva"
                    explicacion={EXPLICACIONES.visitas}
                  />
                  <TarjetaKpiCorporativa
                    titulo="Tasa de completitud"
                    valor={porcentaje(resumen.tasa_completitud)}
                    detalle={`${numero(resumen.personas_completaron)} de ${numero(resumen.personas)} completaron el viaje`}
                    progreso={resumen.tasa_completitud}
                    explicacion={EXPLICACIONES.completitud}
                  />
                  <TarjetaKpiCorporativa
                    titulo="Profundidad media"
                    valor={porcentaje(resumen.profundidad_media)}
                    detalle={`${resumen.secciones_promedio.toFixed(1)} de 11 secciones por visita`}
                    progreso={resumen.profundidad_media}
                    explicacion={EXPLICACIONES.profundidad}
                  />
                  <TarjetaKpiCorporativa
                    titulo="Tiempo a Cierre"
                    valor={duracion(resumen.tiempo_completitud)}
                    detalle="Mediana hasta finalizar el recorrido"
                    explicacion={EXPLICACIONES.tiempoCompletitud}
                  />
                  <TarjetaKpiCorporativa
                    titulo="Permanencia activa"
                    valor={duracion(resumen.permanencia_mediana)}
                    detalle="Mediana de atención activa por sesión"
                    explicacion={EXPLICACIONES.permanencia}
                  />
                  <TarjetaKpiCorporativa
                    titulo="Satisfacción global"
                    valor={resumen.likert_promedio ? `${resumen.likert_promedio} ★` : '—'}
                    detalle={`${porcentaje(resumen.tasa_respuesta)} de participación en encuesta`}
                    progreso={resumen.likert_promedio ? resumen.likert_promedio / 5 : 0}
                    explicacion={EXPLICACIONES.satisfaccion}
                  />
                  <TarjetaKpiCorporativa
                    titulo="Impresiones de página"
                    valor={numero(resumen.page_views)}
                    detalle={`${promedio(resumen.page_views / Math.max(resumen.visitas, 1))} cargas por sesión`}
                    explicacion={EXPLICACIONES.pageViews}
                  />
                </div>

                {/* 2. Navegación por Pestañas Especializadas */}
                <Tabs defaultValue="secciones" className="gap-5">
                  <TabsList className="w-full max-w-full justify-start overflow-x-auto border-b border-neutral-200 bg-transparent p-0 pb-px">
                    <TabsTrigger
                      value="secciones"
                      className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium text-neutral-600 data-[state=active]:border-enel-blue data-[state=active]:text-enel-blue"
                    >
                      <ChartBar size={15} />
                      Auditoría de Secciones & Retención
                    </TabsTrigger>
                    <TabsTrigger
                      value="resumen"
                      className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium text-neutral-600 data-[state=active]:border-enel-blue data-[state=active]:text-enel-blue"
                    >
                      <TrendUp size={15} />
                      Serie Temporal
                    </TabsTrigger>
                    <TabsTrigger
                      value="recorrido"
                      className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium text-neutral-600 data-[state=active]:border-enel-blue data-[state=active]:text-enel-blue"
                    >
                      <BookOpen size={15} />
                      Distribución del Recorrido & Recursos
                    </TabsTrigger>
                    <TabsTrigger
                      value="opiniones"
                      className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 text-xs font-medium text-neutral-600 data-[state=active]:border-enel-blue data-[state=active]:text-enel-blue"
                    >
                      <SmileyMeh size={15} />
                      Satisfacción Cualitativa
                    </TabsTrigger>
                  </TabsList>

                  {/* SECCIONES & RETENCIÓN */}
                  <TabsContent value="secciones" className="pt-2">
                    <VisualizadorSecciones datos={seccionesCompletas(tablero.secciones)} />
                  </TabsContent>

                  {/* TENDENCIA TEMPORAL */}
                  <TabsContent value="resumen" className="pt-2">
                    <Card className="border-neutral-200/80 bg-white">
                      <CardHeader className="border-b border-neutral-100 pb-3">
                        <CardTitle className="text-sm font-semibold text-neutral-900">
                          Evolución Diaria: Sesiones Activas vs Recorridos Completados
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <GraficoSerie datos={tablero.serie} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* RECORRIDO Y RECURSOS */}
                  <TabsContent value="recorrido" className="pt-2">
                    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,22rem)]">
                      <Card className="border-neutral-200/80 bg-white">
                        <CardHeader className="border-b border-neutral-100 pb-3">
                          <CardTitle className="text-sm font-semibold text-neutral-900">
                            Distribución de Profundidad de Navegación
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <GraficoRecorrido datos={tablero.recorrido.histograma} />
                          <p className="mt-3 text-xs text-neutral-500">
                            Las barras en azul institucional corresponden a sesiones que alcanzaron o superaron el 60% del recorrido ({Math.ceil(11 * 0.6)} o más secciones).
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-neutral-200/80 bg-white">
                        <CardHeader className="border-b border-neutral-100 pb-3">
                          <CardTitle className="text-sm font-semibold text-neutral-900">
                            Recursos de Mayor Interés
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          {tablero.recursos.length ? (
                            <ul className="divide-y divide-neutral-100">
                              {tablero.recursos.slice(0, 8).map((recurso, indice) => (
                                <li
                                  key={`${recurso.nombre}-${recurso.recurso}-${indice}`}
                                  className="flex items-center justify-between gap-3 py-2.5 text-xs"
                                >
                                  <span className="font-medium text-neutral-800 truncate">
                                    {recurso.recurso || recurso.nombre}
                                  </span>
                                  <span className="font-mono text-neutral-600 tabular-nums shrink-0">
                                    {numero(recurso.aperturas)} descargas
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="py-8 text-center text-xs text-neutral-500">
                              Sin interacciones registradas con recursos descargables.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* SATISFACCIÓN */}
                  <TabsContent value="opiniones" className="pt-2">
                    <Card className="border-neutral-200/80 bg-white">
                      <CardHeader className="border-b border-neutral-100 pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                          <Star size={16} className="text-neutral-600" />
                          Índice de Valoración y Observaciones de Usuarios
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <PanelSatisfaccion tablero={tablero} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
