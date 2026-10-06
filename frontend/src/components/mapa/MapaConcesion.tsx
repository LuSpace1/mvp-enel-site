import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { ArrowLeft, Scan, X } from '@phosphor-icons/react'

import { COMUNAS_SVG, FUENTE_BASE, VIEWBOX, ZONAS_SVG } from '@/lib/data/comunas-svg'
import type { ComunaSvg } from '@/lib/data/comunas-svg'
import { ZONA_POR_ID } from '@/lib/data/zonas'
import { useMapaConcesion } from './contexto'
import { CapaRayosX } from './CapaRayosX'
import { TooltipComuna } from './TooltipComuna'
import {
  FACTOR_ZONA,
  FACTOR_ZONA_XRAY,
  mapeoContenedor,
  vistaGeneral,
  vistaZona,
  type Vista,
} from './geometria'
import { useTamano } from './useTamano'

const INDICE_COMUNA = new Map<string, number>()
let contadorGlobal = 0
for (const zonaSvg of ZONAS_SVG) {
  const zona = ZONA_POR_ID.get(zonaSvg.id)
  if (!zona) continue
  for (const id of zona.comunas) INDICE_COMUNA.set(id, contadorGlobal++)
}

interface EstadoComuna {
  fill: string
  fo: number
  sw: number
  glow: boolean
  labelO: number
  labelC: string
}

function estadoComuna(
  zonaId: string,
  comunaId: string,
  zonaActiva: string | null,
  zonaHover: string | null,
  comunaActiva: string | null,
): EstadoComuna {
  const zona = ZONA_POR_ID.get(zonaId)
  if (!zona) {
    return { fill: '#b0aca2', fo: 0.5, sw: 1.3, glow: false, labelO: 0, labelC: '#57534e' }
  }

  const enActiva = zonaActiva === zonaId

  if (comunaActiva === comunaId && enActiva) {
    return { fill: zona.colorClaro, fo: 1, sw: 2.6, glow: true, labelO: 1, labelC: '#ffffff' }
  }
  if (enActiva) {
    return { fill: zona.color, fo: 0.85, sw: 1.8, glow: false, labelO: 0.9, labelC: '#ffffff' }
  }
  if (zonaActiva !== null) {
    return { fill: zona.color, fo: 0.9, sw: 1.2, glow: false, labelO: 0, labelC: '#9ca3af' }
  }

  const iluminada = zonaHover === zonaId
  return {
    fill: zona.color,
    fo: iluminada ? 0.95 : 0.5,
    sw: iluminada ? 2.4 : 1.3,
    glow: false,
    labelO: 0,
    labelC: '#57534e',
  }
}

function ComunaMapa({
  comuna,
  zonaId,
  indice,
}: {
  comuna: ComunaSvg
  zonaId: string
  indice: number
}) {
  const {
    zonaActiva,
    zonaHover,
    comunaActiva,
    modoRayosX,
    setZonaHover,
    setComunaActiva,
    abrirZona,
  } = useMapaConcesion()

  const zona = ZONA_POR_ID.get(zonaId)
  if (!zona) return null

  const enActiva = zonaActiva === zonaId
  const puedeClic = zonaActiva === null
  const puedeHover = !modoRayosX && (zonaActiva === null || enActiva)
  const interactiva = puedeClic || puedeHover
  const estado = estadoComuna(zonaId, comuna.id, zonaActiva, zonaHover, comunaActiva)
  const fontSize = comuna.label.fontSize ?? FUENTE_BASE

  return (
    <g
      className={interactiva ? 'cursor-pointer' : 'pointer-events-none'}
      onMouseEnter={() => {
        if (!puedeHover) return
        if (zonaActiva === null) setZonaHover(zonaId)
        else setComunaActiva(comuna.id)
      }}
      onMouseLeave={() => {
        setComunaActiva(null)
        setZonaHover(null)
      }}
      onClick={() => {
        if (puedeClic) abrirZona(zonaId)
      }}
    >
      <path
        d={comuna.d}
        pathLength={1}
        fill="none"
        stroke={estado.glow ? '#ffffff' : zona.color}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="comuna-trazo"
        style={
          {
            '--d': `${0.18 + indice * 0.03}s`,
            '--sw': estado.sw,
            '--so': estado.glow ? 1 : 0.85,
          } as CSSProperties
        }
      />
      <path
        d={comuna.d}
        fill={estado.fill}
        fillRule="evenodd"
        className="comuna-relleno"
        style={
          {
            '--d2': `${0.4 + indice * 0.02}s`,
            '--fo': estado.fo,
            filter: estado.glow ? 'drop-shadow(0 0 9px rgba(255,255,255,0.95))' : 'none',
          } as CSSProperties
        }
      />
      <text
        x={comuna.label.x}
        y={comuna.label.y}
        textAnchor="middle"
        className="comuna-label-svg"
        transform={
          comuna.label.rot ? `rotate(-90 ${comuna.label.rx} ${comuna.label.ry})` : undefined
        }
        style={
          {
            '--d3': `${0.65 + indice * 0.018}s`,
            '--lo': estado.labelO,
            '--lc': estado.labelC,
            fontSize,
          } as CSSProperties
        }
      >
        {comuna.label.lineas
          ? comuna.label.lineas.map((linea, i) => (
              <tspan key={i} x={comuna.label.x} dy={i === 0 ? undefined : fontSize * 1.18}>
                {linea}
              </tspan>
            ))
          : comuna.nombreCorto}
      </text>
    </g>
  )
}

export function MapaConcesion() {
  const {
    zonaActiva,
    zonaHover,
    modoRayosX,
    comunaActiva,
    cerrarZona,
    alternarRayosX,
    setComunaActiva,
    setZonaHover,
  } = useMapaConcesion()

  const [cajaRef, tam] = useTamano<HTMLDivElement>()
  const mapeo = useMemo(() => mapeoContenedor(tam), [tam])
  const reduce = useReducedMotion() ?? false

  const mvX = useMotionValue(0)
  const mvY = useMotionValue(0)
  const mvEscala = useMotionValue(1)

  const objetivo = useMemo<Vista>(() => {
    if (tam.w < 1 || tam.h < 1) return vistaGeneral()
    if (!zonaActiva) return vistaGeneral()
    return vistaZona(zonaActiva, mapeo, modoRayosX ? FACTOR_ZONA_XRAY : FACTOR_ZONA)
  }, [zonaActiva, modoRayosX, mapeo, tam.w, tam.h])

  const controles = useRef<{ stop: () => void }[]>([])
  const detener = useCallback(() => {
    controles.current.forEach((c) => c.stop())
    controles.current = []
  }, [])

  useEffect(() => {
    detener()
    if (reduce) {
      mvX.set(objetivo.x)
      mvY.set(objetivo.y)
      mvEscala.set(objetivo.escala)
      return
    }
    const spring = { type: 'spring' as const, stiffness: 100, damping: 20, mass: 0.9 }
    controles.current = [
      animate(mvX, objetivo.x, spring),
      animate(mvY, objetivo.y, spring),
      animate(mvEscala, objetivo.escala, spring),
    ]
    return detener
  }, [objetivo, reduce, mvX, mvY, mvEscala, detener])

  const arrastrable = !reduce && zonaActiva !== null && !modoRayosX
  const constraints = useMemo(() => {
    const s = Math.max(objetivo.escala, 1)
    const margen = 0.4
    const ex = (tam.w * (s - 1)) / 2 + tam.w * margen
    const ey = (tam.h * (s - 1)) / 2 + tam.h * margen
    return { left: -ex, right: ex, top: -ey, bottom: ey }
  }, [objetivo.escala, tam.w, tam.h])

  const [animar, setAnimar] = useState(false)
  useEffect(() => {
    const el = cajaRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas[0]?.isIntersecting) {
          setAnimar(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [cajaRef])

  const zonaActivaData = zonaActiva ? ZONA_POR_ID.get(zonaActiva) : undefined

  return (
    <div
      ref={cajaRef}
      className={`relative w-full overflow-hidden ${animar ? 'animar' : ''}`}
      style={{ aspectRatio: `${VIEWBOX.w} / ${VIEWBOX.h}` }}
    >
      <motion.div
        className={`absolute inset-0 select-none ${arrastrable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        drag={arrastrable}
        dragConstraints={constraints}
        dragElastic={0.06}
        dragMomentum
        onDragStart={detener}
        style={{
          x: mvX,
          y: mvY,
          scale: mvEscala,
          transformOrigin: '50% 50%',
          touchAction: arrastrable ? 'none' : 'auto',
        }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          role="img"
          aria-label="Mapa de la concesión de Enel en la Región Metropolitana, dividido en cuatro zonas"
        >
          <g>
            <rect
              x={12}
              y={12}
              width={VIEWBOX.w - 24}
              height={VIEWBOX.h - 24}
              rx={20}
              fill="none"
              stroke="#cfc9bd"
              strokeWidth={2.5}
              strokeDasharray="2 8"
              strokeLinecap="round"
              opacity={0.55}
            />
            {ZONAS_SVG.map((zonaSvg, indiceZona) => {
              const zona = ZONA_POR_ID.get(zonaSvg.id)
              if (!zona) return null
              const atenuada = zonaActiva !== null && zonaActiva !== zonaSvg.id
              return (
                <g
                  key={zonaSvg.id}
                  className={
                    zonaHover === zonaSvg.id && zonaActiva === null
                      ? 'zona-grupo zona-hover'
                      : 'zona-grupo'
                  }
                  style={
                    {
                      opacity: atenuada ? 0.3 : 1,
                      transition: 'opacity 0.45s ease',
                      pointerEvents: atenuada ? 'none' : undefined,
                      '--dz': `${0.1 + indiceZona * 0.12}s`,
                      '--ozx': `${zonaSvg.cx}px`,
                      '--ozy': `${zonaSvg.cy}px`,
                    } as CSSProperties
                  }
                >
                  {COMUNAS_SVG.filter((c) => zona.comunas.includes(c.id)).map((comuna) => (
                    <ComunaMapa
                      key={comuna.id}
                      comuna={comuna}
                      zonaId={zonaSvg.id}
                      indice={INDICE_COMUNA.get(comuna.id) ?? 0}
                    />
                  ))}
                  <text
                    x={zonaSvg.cx}
                    y={zonaSvg.cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="zona-label-svg"
                    style={
                      {
                        '--zo': zonaActiva === null ? 1 : 0,
                        '--zc': zona.color,
                        fontSize: 36,
                      } as CSSProperties
                    }
                  >
                    {zona.nombre}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </motion.div>

      <AnimatePresence>
        {zonaActivaData && !modoRayosX && (
          <motion.div
            key={zonaActivaData.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-neutral-950/60 px-4 py-1.5 text-sm font-bold text-white shadow-lg backdrop-blur-md">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: zonaActivaData.color }}
              />
              Zona {zonaActivaData.nombre}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zonaActiva && comunaActiva && !modoRayosX && (
          <TooltipComuna key={comunaActiva} mapeo={mapeo} mvX={mvX} mvY={mvY} mvEscala={mvEscala} />
        )}
      </AnimatePresence>

      <CapaRayosX
        mapeo={mapeo}
        tam={tam}
        escenaRef={cajaRef}
        mvX={mvX}
        mvY={mvY}
        mvEscala={mvEscala}
      />

      <div className="pointer-events-none absolute inset-0 z-50">
        <AnimatePresence>
          {zonaActiva && !modoRayosX && (
            <motion.button
              key="restablecer"
              type="button"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
              onClick={cerrarZona}
              onMouseEnter={() => setComunaActiva(null)}
              className="pointer-events-auto absolute top-4 left-4 flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-4 py-2 text-sm font-bold text-neutral-800 shadow-lg backdrop-blur-md transition-colors hover:bg-white"
            >
              <ArrowLeft size={16} weight="bold" />
              Volver
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!modoRayosX ? (
            <motion.button
              key="abrir-rayos"
              type="button"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22 }}
              onClick={alternarRayosX}
              aria-pressed={false}
              onMouseEnter={() => setZonaHover(null)}
              className="pointer-events-auto absolute top-4 right-4 flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-neutral-950/70 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-colors hover:bg-neutral-900/80"
            >
              <Scan size={16} weight="bold" />
              Modo Rayos X
            </motion.button>
          ) : (
            <motion.button
              key="cerrar-rayos"
              type="button"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.22 }}
              onClick={alternarRayosX}
              aria-pressed
              className="pointer-events-auto absolute top-4 right-4 flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-bold text-neutral-900 shadow-xl transition-colors hover:bg-neutral-100"
            >
              <X size={16} weight="bold" />
              Cerrar Rayos X
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
