import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowClockwise,
  ChartBar,
  DownloadSimple,
  SmileyMeh,
  UsersThree,
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

import { CmsAlert } from '@/components/cms/CmsAlert'
import { CmsPageHeader } from '@/components/cms/CmsPageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ETIQUETAS_SECCION } from '@/lib/cms/registro'
import { notificarError, notificarExito } from '@/lib/cms/notificaciones'
import { cn } from '@/lib/utils'
import { descargarCsv, obtenerPersonas, obtenerTablero, type RangoKpi } from '@/services/kpis'
import type { KpiPersona, KpiSeccion, KpiTablero } from '@/types/kpis'

const RANGOS = [
  { valor: '7', etiqueta: 'Últimos 7 días' },
  { valor: '30', etiqueta: 'Últimos 30 días' },
  { valor: '90', etiqueta: 'Últimos 90 días' },
]

const AZUL = '#006fbb'
const ROSA = '#eb0053'
const GRIS = '#d9dfe8'

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

function duracion(segundos: number | null | undefined): string {
  if (segundos === null || segundos === undefined) return '—'
  if (segundos <= 0) return '0 s'
  if (segundos < 60) return `${Math.round(segundos)} s`
  const minutos = Math.floor(segundos / 60)
  const resto = Math.round(segundos % 60)
  if (minutos < 60) return resto ? `${minutos} min ${resto} s` : `${minutos} min`
  const horas = Math.floor(minutos / 60)
  return `${horas} h ${minutos % 60} min`
}

function etiqueta(clave: string): string {
  return ETIQUETAS_SECCION[clave] ?? clave
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

function TarjetaKpi({
  titulo,
  valor,
  detalle,
  acento,
}: {
  titulo: string
  valor: string
  detalle?: string
  acento?: 'azul' | 'rosa'
}) {
  return (
    <Card size="sm" className="gap-2">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            'text-enel-navy font-heading text-2xl leading-none font-semibold',
            acento === 'azul' && 'text-enel-blue',
            acento === 'rosa' && 'text-enel-pink',
          )}
        >
          {valor}
        </p>
        {detalle && <p className="text-muted-foreground mt-1.5 text-xs">{detalle}</p>}
      </CardContent>
    </Card>
  )
}

function EstadoVacio() {
  return (
    <Card className="items-center justify-center py-16 text-center">
      <div className="bg-enel-blue/8 text-enel-blue mx-auto flex size-12 items-center justify-center rounded-2xl">
        <ChartBar size={22} weight="duotone" />
      </div>
      <p className="text-enel-navy mt-4 text-sm font-semibold">Todavía no hay datos en este rango</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">
        Los KPIs se completan a medida que las personas recorren el portal. Comparte el enlace y
        vuelve a revisar en unas horas.
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
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={filas} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRIS} strokeDasharray="3 3" />
        <XAxis dataKey="etiqueta" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', fontSize: 12 }}
          labelFormatter={(valor) => `Día ${valor}`}
        />
        <Line
          type="monotone"
          dataKey="visitas"
          name="Visitas"
          stroke={AZUL}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="completas"
          name="Completas"
          stroke={ROSA}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function GraficoSecciones({ datos }: { datos: KpiSeccion[] }) {
  const filas = datos.slice(0, 8).map((fila) => ({
    nombre: etiqueta(fila.clave),
    vistas: fila.vistas,
    interacciones: fila.interacciones,
  }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, filas.length * 38)}>
      <BarChart
        data={filas}
        layout="vertical"
        margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke={GRIS} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="nombre"
          tickLine={false}
          axisLine={false}
          fontSize={11}
          width={110}
        />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', fontSize: 12 }}
          cursor={{ fill: 'rgba(0,111,187,0.06)' }}
        />
        <Bar dataKey="vistas" name="Vistas" fill={AZUL} radius={[0, 6, 6, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function GraficoRecorrido({ datos }: { datos: KpiTablero['recorrido']['histograma'] }) {
  const completo = datos.length ? Math.max(...datos.map((fila) => fila.secciones)) : 11
  const filas = datos.map((fila) => ({
    nombre: `${fila.secciones}`,
    visitas: fila.visitas,
    ultimo: fila.secciones >= Math.ceil(completo * 0.6),
  }))
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={filas} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRIS} strokeDasharray="3 3" />
        <XAxis dataKey="nombre" tickLine={false} axisLine={false} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', fontSize: 12 }}
          labelFormatter={(valor) => `${valor} secciones vistas`}
          cursor={{ fill: 'rgba(0,111,187,0.06)' }}
        />
        <Bar dataKey="visitas" name="Visitas" radius={[6, 6, 0, 0]}>
          {filas.map((fila, indice) => (
            <Cell key={indice} fill={fila.ultimo ? ROSA : AZUL} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function TablaSecciones({ datos }: { datos: KpiSeccion[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-black/5 text-xs uppercase">
            <th className="py-2 pr-3 font-medium">Sección</th>
            <th className="py-2 pr-3 text-right font-medium">Vistas</th>
            <th className="py-2 pr-3 text-right font-medium">Personas</th>
            <th className="py-2 pr-3 text-right font-medium">Interacciones</th>
            <th className="py-2 pr-3 text-right font-medium">
              <span title="Interacciones divididas por las veces que se mostró la sección">
                Interac./vista
              </span>
            </th>
            <th className="py-2 text-right font-medium">Tiempo medio</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((fila) => (
            <tr key={fila.clave} className="border-b border-black/5 last:border-0">
              <td className="text-enel-navy py-2.5 pr-3 font-medium">{etiqueta(fila.clave)}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{numero(fila.vistas)}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{numero(fila.personas)}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">{numero(fila.interacciones)}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">
                {porcentaje(fila.tasa_interaccion)}
              </td>
              <td className="py-2.5 text-right tabular-nums">{duracion(fila.tiempo_medio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TablaPersonas({
  rango,
  recarga,
}: {
  rango: RangoKpi
  recarga: number
}) {
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState<{
    total: number
    tamano: number
    resultados: KpiPersona[]
  } | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setPagina(1)
  }, [rango.desde, rango.hasta, recarga])

  useEffect(() => {
    let vigente = true
    setCargando(true)
    obtenerPersonas({ ...rango, pagina, tamano: 25 })
      .then((respuesta) => {
        if (vigente) setDatos(respuesta)
      })
      .catch(() => {
        if (vigente) setDatos(null)
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [rango, pagina, recarga])

  const paginas = datos ? Math.max(1, Math.ceil(datos.total / datos.tamano)) : 1

  if (cargando && !datos) {
    return <Skeleton className="h-64 w-full rounded-xl" />
  }

  if (!datos || datos.total === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        Ninguna persona identificada en este rango.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted-foreground border-b border-black/5 text-xs uppercase">
              <th className="py-2 pr-3 font-medium">Persona</th>
              <th className="py-2 pr-3 text-right font-medium">Primer acceso</th>
              <th className="py-2 pr-3 text-right font-medium">Visitas</th>
              <th className="py-2 pr-3 text-right font-medium">Tiempo activo</th>
              <th className="py-2 pr-3 text-right font-medium">Profundidad</th>
              <th className="py-2 pr-3 text-center font-medium">Completó</th>
              <th className="py-2 pr-3 text-right font-medium">Likert</th>
              <th className="py-2 text-right font-medium">Última actividad</th>
            </tr>
          </thead>
          <tbody>
            {datos.resultados.map((persona) => (
              <tr key={persona.id} className="border-b border-black/5 last:border-0">
                <td className="text-enel-navy py-2.5 pr-3 font-medium">
                  {persona.email || 'Sin identificar'}
                </td>
                <td className="text-muted-foreground py-2.5 pr-3 text-right text-xs">
                  {new Date(persona.primera_vez).toLocaleDateString('es-CL')}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">{numero(persona.visitas)}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {duracion(persona.tiempo_activo)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {porcentaje(persona.profundidad_maxima)}
                </td>
                <td className="py-2.5 pr-3 text-center">
                  <Badge variant={persona.completo ? 'default' : 'secondary'}>
                    {persona.completo ? 'Sí' : 'No'}
                  </Badge>
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {persona.likert ? `${persona.likert}/5` : '—'}
                </td>
                <td className="text-muted-foreground py-2.5 text-right text-xs">
                  {new Date(persona.ultima_vez).toLocaleDateString('es-CL')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {plural(datos.total, 'persona', 'personas')} · página {pagina} de {paginas}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagina <= 1}
            onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagina >= paginas}
            onClick={() => setPagina((valor) => valor + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}

function PanelSatisfaccion({ tablero }: { tablero: KpiTablero }) {
  const { distribucion, ultimas, promedio, total } = tablero.satisfaccion
  const maximo = Math.max(1, ...distribucion.map((fila) => fila.cantidad))
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <div>
        <div className="flex items-end gap-2">
          <p className="text-enel-navy font-heading text-3xl font-semibold">
            {promedio ? promedio.toFixed(1) : '—'}
          </p>
          <p className="text-muted-foreground pb-1 text-xs">
            de 5 · {plural(total, 'respuesta', 'respuestas')}
          </p>
        </div>
        <div className="mt-4 space-y-2">
          {[...distribucion].reverse().map((fila) => (
            <div key={fila.puntaje} className="flex items-center gap-3">
              <span className="text-muted-foreground w-6 text-xs tabular-nums">{fila.puntaje}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                <div
                  className="bg-enel-pink h-full rounded-full"
                  style={{ width: `${(fila.cantidad / maximo) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs tabular-nums">{fila.cantidad}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {ultimas.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">Sin comentarios todavía.</p>
        )}
        {ultimas.map((opinion, indice) => (
          <div
            key={`${opinion.creada_en}-${indice}`}
            className="rounded-xl bg-black/[0.02] p-3 ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline">{opinion.puntaje}/5</Badge>
              <span className="text-muted-foreground text-[11px]">
                {new Date(opinion.creada_en).toLocaleDateString('es-CL')}
              </span>
            </div>
            {opinion.comentario ? (
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{opinion.comentario}</p>
            ) : (
              <p className="text-muted-foreground mt-2 text-xs italic">Sin comentario</p>
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
      notificarExito('CSV descargado')
    } catch {
      notificarError('No se pudo descargar el CSV')
    } finally {
      setExportando(false)
    }
  }, [rango])

  const resumen = tablero?.resumen

  return (
    <div className="flex min-h-svh flex-col">
      <CmsPageHeader
        eyebrow="KPIs"
        title="Adopción del portal"
        description="Visitas, recorrido, recursos críticos y satisfacción del portal interactivo."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dias} onValueChange={setDias}>
              <SelectTrigger className="w-40">
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
            >
              <ArrowClockwise size={16} weight="duotone" />
              Actualizar
            </Button>
            <Button type="button" size="sm" onClick={exportar} disabled={exportando}>
              <DownloadSimple size={16} weight="duotone" />
              {exportando ? 'Exportando…' : 'Exportar CSV'}
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-4 md:p-6 xl:p-8">
        <CmsAlert variant="info" title="Cómo se leen estos datos">
          Las métricas se calculan sobre visitas cerradas cada 30 minutos de inactividad. Con menos
          de 20 personas conviene leer números absolutos, no porcentajes.
        </CmsAlert>

        {cargando && !tablero && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, indice) => (
              <Skeleton key={indice} className="h-28 rounded-xl" />
            ))}
          </div>
        )}

        {!cargando && !tablero && <EstadoVacio />}

        {tablero && resumen && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">
                {tablero.rango.desde} → {tablero.rango.hasta}
              </p>
              {resumen.personas > 0 && resumen.personas < 20 && (
                <Badge variant="secondary">Muestra pequeña: leer números absolutos</Badge>
              )}
            </div>

            {resumen.visitas === 0 ? (
              <EstadoVacio />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <TarjetaKpi
                    titulo="Personas"
                    valor={numero(resumen.personas)}
                    detalle={plural(resumen.visitas, 'visita', 'visitas')}
                    acento="azul"
                  />
                  <TarjetaKpi
                    titulo="Completitud"
                    valor={porcentaje(resumen.tasa_completitud)}
                    detalle={
                      resumen.personas_completaron === 1
                        ? '1 persona completó el recorrido'
                        : `${numero(resumen.personas_completaron)} personas completaron el recorrido`
                    }
                    acento="rosa"
                  />
                  <TarjetaKpi
                    titulo="Profundidad media"
                    valor={porcentaje(resumen.profundidad_media)}
                    detalle={`${resumen.secciones_promedio.toFixed(1)} de 11 secciones`}
                  />
                  <TarjetaKpi
                    titulo="Tiempo de completitud"
                    valor={duracion(resumen.tiempo_completitud)}
                    detalle="Mediana, no promedio"
                  />
                  <TarjetaKpi
                    titulo="Permanencia"
                    valor={duracion(resumen.permanencia_mediana)}
                    detalle="Mediana por visita"
                  />
                  <TarjetaKpi
                    titulo="Satisfacción"
                    valor={resumen.likert_promedio ? `${resumen.likert_promedio}/5` : '—'}
                    detalle={`${porcentaje(resumen.tasa_respuesta)} respondió`}
                  />
                </div>

                <p className="text-muted-foreground -mt-1 text-xs leading-relaxed">
                  <strong className="text-enel-navy font-semibold">Completitud</strong>: llegó a
                  Cierre habiendo visto al menos el 60% de las secciones.{' '}
                  <strong className="text-enel-navy font-semibold">Profundidad</strong>: secciones
                  distintas vistas sobre el total.{' '}
                  <strong className="text-enel-navy font-semibold">Interac./vista</strong>:
                  aperturas por cada vez que se mostró la sección.
                </p>

                <Tabs defaultValue="resumen" className="gap-4">
                  <TabsList className="w-full max-w-full justify-start overflow-x-auto">
                    <TabsTrigger value="resumen">Resumen</TabsTrigger>
                    <TabsTrigger value="secciones">Secciones</TabsTrigger>
                    <TabsTrigger value="recorrido">Recorrido</TabsTrigger>
                    <TabsTrigger value="personas">Personas</TabsTrigger>
                    <TabsTrigger value="opiniones">Opiniones</TabsTrigger>
                  </TabsList>

                  <TabsContent value="resumen">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Visitas por día</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <GraficoSerie datos={tablero.serie} />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Secciones más vistas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <GraficoSecciones datos={tablero.secciones} />
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="secciones">
                    <Card>
                      <CardHeader>
                        <CardTitle>Uso por sección</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {tablero.secciones.length ? (
                          <TablaSecciones datos={tablero.secciones} />
                        ) : (
                          <p className="text-muted-foreground py-8 text-center text-sm">
                            Sin secciones registradas.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="recorrido">
                    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,20rem)]">
                      <Card>
                        <CardHeader>
                          <CardTitle>Cuántas secciones vio cada visita</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <GraficoRecorrido datos={tablero.recorrido.histograma} />
                          <p className="text-muted-foreground mt-2 text-xs">
                            Las barras rosadas superan el 60% del recorrido y cuentan como
                            completas si además llegaron a Recursos.
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Recursos críticos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {tablero.recursos.length ? (
                            <ul className="space-y-3">
                              {tablero.recursos.slice(0, 8).map((recurso, indice) => (
                                <li
                                  key={`${recurso.nombre}-${recurso.recurso}-${indice}`}
                                  className="flex items-center justify-between gap-3 text-sm"
                                >
                                  <span className="text-enel-navy truncate">
                                    {recurso.recurso || recurso.nombre}
                                  </span>
                                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                                    {numero(recurso.aperturas)} aperturas
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground py-6 text-center text-sm">
                              Sin aperturas registradas.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="personas">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UsersThree size={18} weight="duotone" />
                          Personas identificadas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TablaPersonas rango={rango} recarga={recarga} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="opiniones">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <SmileyMeh size={18} weight="duotone" />
                          Satisfacción y reseñas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
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
