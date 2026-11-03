import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowClockwise,
  ChartBar,
  DownloadSimple,
  Info,
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

type ExplicacionKpi = {
  resumen: string
  calculo: string
  nota?: string
}

/** Cómo se arma cada número hoy. Se muestra al abrir la tarjeta. */
const EXPLICACIONES = {
  personas: {
    resumen: 'Personas distintas que entraron al portal en el rango.',
    calculo:
      'Sale de las cuentas que abrieron el portal al menos una vez. Como se exige iniciar sesión, cada persona queda con una sola ficha aunque entre desde el notebook y el celular.',
    nota: 'Una misma persona puede sumar varias visitas; aquí se cuenta una sola vez.',
  },
  visitas: {
    resumen: 'Cuántas veces se abrió el portal.',
    calculo:
      'Cada visita es una sesión: se abre al entrar y se cierra a los 30 minutos sin actividad. Recargar dentro de esa ventana no suma otra visita; volver después, sí.',
    nota: 'Una persona puede tener varias visitas. Por eso visitas y personas se muestran por separado.',
  },
  pageViews: {
    resumen: 'Cuántas veces se cargó la página del portal.',
    calculo:
      'Se cuenta cada carga real, incluidas las recargas. Sirve para detectar recargas y compararlo con las visitas.',
    nota: 'Una misma visita puede tener varios page views.',
  },
  completitud: {
    resumen: 'Personas que llegaron a Cierre habiendo recorrido el portal.',
    calculo:
      'Cuenta como completa la visita que llegó a Cierre y antes vio al menos el 60% de las secciones. El porcentaje se saca sobre las personas: si entraron 10 y 4 completaron, se muestra 40%.',
    nota: 'Entrar directo a Cierre no suma, aunque la visita llegue al final.',
  },
  profundidad: {
    resumen: 'Cuánto del portal alcanza a ver una visita, en promedio.',
    calculo:
      'En cada visita contamos las secciones distintas que se abrieron sobre las 11 del portal, y después promediamos esas visitas. Repetir una sección no suma.',
    nota: 'Si el número es 45%, abajo aparece 5 de 11: es el mismo dato, pero en secciones.',
  },
  tiempoCompletitud: {
    resumen: 'Cuánto tarda alguien en llegar a Cierre.',
    calculo:
      'Tomamos el tiempo activo acumulado hasta que la visita entra a Cierre por primera vez. Usamos la mediana: una visita muy larga no arrastra el número.',
    nota: 'Solo considera visitas que completaron el recorrido.',
  },
  permanencia: {
    resumen: 'Cuánto dura una visita, en el medio.',
    calculo:
      'Sumamos los ratos con la pestaña a la vista y con actividad reciente. Una pausa de más de un minuto deja de contar. Después tomamos la mediana de todas las visitas.',
    nota: 'No es el tiempo con la pestaña abierta de fondo.',
  },
  satisfaccion: {
    resumen: 'Cómo evalúan el portal quienes dejan su nota al final.',
    calculo:
      'Promedio simple de las notas de 1 a 5 que se dejan en Cierre. Cada visita puede responder una vez.',
    nota: 'El porcentaje de abajo dice cuántas visitas dejaron nota: si hubo 50 visitas y 10 respondieron, son 20%.',
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
  if (minutos < 60) return resto ? `${minutos} min ${resto} s` : `${minutos} min`
  const horas = Math.floor(minutos / 60)
  return `${horas} h ${minutos % 60} min`
}

function etiqueta(clave: string): string {
  return ETIQUETAS_SECCION[clave] ?? clave
}

/** Completa las 11 secciones para que las que no tuvieron uso aparezcan en cero. */
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

function TarjetaKpi({
  titulo,
  valor,
  detalle,
  acento,
  explicacion,
}: {
  titulo: string
  valor: string
  detalle?: string
  acento?: 'azul' | 'rosa'
  explicacion: ExplicacionKpi
}) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        className="group/kpi cursor-pointer text-left focus-visible:outline-none"
      >
        <Card
          size="sm"
          className="group-hover/kpi:ring-enel-blue/25 group-focus-visible/kpi:ring-enel-blue/60 h-full gap-2 transition duration-150 group-hover/kpi:-translate-y-0.5 group-hover/kpi:shadow-md group-focus-visible/kpi:ring-2"
        >
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium tracking-wide uppercase">
              <span>{titulo}</span>
              <Info
                size={14}
                weight="duotone"
                aria-hidden="true"
                className="text-muted-foreground/40 group-hover/kpi:text-enel-blue shrink-0 transition"
              />
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
        <span className="sr-only">Ver cómo se calcula</span>
      </button>

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">{titulo}</DialogTitle>
            <DialogDescription>{explicacion.resumen}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-enel-navy text-sm leading-relaxed">{explicacion.calculo}</p>
            {explicacion.nota && (
              <p className="text-muted-foreground rounded-lg bg-black/[0.03] p-3 text-xs leading-relaxed">
                {explicacion.nota}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" size="sm">
                Entendido
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
    <Card className="items-center justify-center py-16 text-center">
      <div className="bg-enel-blue/8 text-enel-blue mx-auto flex size-12 items-center justify-center rounded-2xl">
        <ChartBar size={22} weight="duotone" />
      </div>
      <p className="text-enel-navy mt-4 text-sm font-semibold">
        Todavía no hay datos en este rango
      </p>
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
  const filas = [...datos]
    .sort((a, b) => b.vistas - a.vistas)
    .slice(0, 8)
    .map((fila) => ({
      nombre: etiqueta(fila.clave),
      vistas: fila.vistas,
    }))
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, filas.length * 38)}>
      <BarChart data={filas} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
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
                {promedio(fila.tasa_interaccion)}×
              </td>
              <td className="py-2.5 text-right tabular-nums">{duracion(fila.tiempo_medio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TablaPersonas({ rango, recarga }: { rango: RangoKpi; recarga: number }) {
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
        {cargando && !tablero && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, indice) => (
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <TarjetaKpi
                    titulo="Personas"
                    valor={numero(resumen.personas)}
                    detalle={`${promedio(resumen.visitas / Math.max(resumen.personas, 1))} visitas por persona`}
                    acento="azul"
                    explicacion={EXPLICACIONES.personas}
                  />
                  <TarjetaKpi
                    titulo="Visitas"
                    valor={numero(resumen.visitas)}
                    detalle="Sesiones cerradas a los 30 min sin actividad"
                    explicacion={EXPLICACIONES.visitas}
                  />
                  <TarjetaKpi
                    titulo="Page views"
                    valor={numero(resumen.page_views)}
                    detalle="Cargas de página"
                    explicacion={EXPLICACIONES.pageViews}
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
                    explicacion={EXPLICACIONES.completitud}
                  />
                  <TarjetaKpi
                    titulo="Profundidad media"
                    valor={porcentaje(resumen.profundidad_media)}
                    detalle={`${resumen.secciones_promedio.toFixed(1)} de 11 secciones`}
                    explicacion={EXPLICACIONES.profundidad}
                  />
                  <TarjetaKpi
                    titulo="Tiempo de completitud"
                    valor={duracion(resumen.tiempo_completitud)}
                    detalle="Mediana, no promedio"
                    explicacion={EXPLICACIONES.tiempoCompletitud}
                  />
                  <TarjetaKpi
                    titulo="Permanencia"
                    valor={duracion(resumen.permanencia_mediana)}
                    detalle="Mediana por visita"
                    explicacion={EXPLICACIONES.permanencia}
                  />
                  <TarjetaKpi
                    titulo="Satisfacción"
                    valor={resumen.likert_promedio ? `${resumen.likert_promedio}/5` : '—'}
                    detalle={`${porcentaje(resumen.tasa_respuesta)} respondió`}
                    explicacion={EXPLICACIONES.satisfaccion}
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
                          <GraficoSecciones datos={seccionesCompletas(tablero.secciones)} />
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
                        <TablaSecciones datos={seccionesCompletas(tablero.secciones)} />
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
                            Las barras rosadas superan el 60% del recorrido y cuentan como completas
                            si además llegaron a Recursos.
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
