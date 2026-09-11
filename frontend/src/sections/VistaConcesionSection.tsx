import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ArrowLeft, MapPin } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Reveal } from '@/components/ui/Reveal'
import { COMUNAS_SVG, VIEWBOX, ZONAS_SVG } from '@/lib/data/comunas-svg'
import type { ComunaSvg } from '@/lib/data/comunas-svg'
import { ZONAS_CONCESION, ZONA_POR_ID } from '@/lib/data/zonas'
import { track } from '@/lib/analytics'

const FONT_BASE = 10
// Label de zona en modo zoom: tamaño en px de pantalla y franja superior donde vive
const TAM_ZONA_ZOOM = 20
const FRANJA_ZONA = 38

interface Vista {
  vb: { x: number; y: number; w: number; h: number }
  k: number
}

function vistaDe(bbox: { x: number; y: number; w: number; h: number }): Vista {
  const cx = bbox.x + bbox.w / 2
  const cy = bbox.y + bbox.h / 2
  const escala = Math.min(VIEWBOX.w / bbox.w, VIEWBOX.h / bbox.h) * 0.95
  const vb = {
    x: cx - VIEWBOX.w / escala / 2,
    y: cy - VIEWBOX.h / escala / 2,
    w: VIEWBOX.w / escala,
    h: VIEWBOX.h / escala,
  }
  return { vb, k: VIEWBOX.w / vb.w }
}

const VISTA_GENERAL: Vista = {
  vb: { x: 0, y: 0, w: VIEWBOX.w, h: VIEWBOX.h },
  k: 1,
}

const VISTA_POR_ZONA: Record<string, Vista> = Object.fromEntries(
  ZONAS_SVG.map((z) => [z.id, vistaDe(z.bbox)]),
)

const OFFSET_POR_ZONA: Record<string, number> = {}
let acumulado = 0
for (const z of ZONAS_SVG) {
  OFFSET_POR_ZONA[z.id] = acumulado
  acumulado += ZONA_POR_ID.get(z.id)?.comunas.length ?? 0
}

interface EstadoComuna {
  fill: string
  fo: number
  stroke: string
  sw: number
  glow: boolean
  labelO: number
  labelC: string
}

function estadoDe(
  zonaId: string,
  comunaId: string,
  zonaAbierta: string | null,
  zonaHover: string | null,
  comunaHover: string | null,
): EstadoComuna {
  const zona = ZONA_POR_ID.get(zonaId)
  if (!zona)
    return {
      fill: '#b0aca2',
      fo: 0.5,
      stroke: '#b0aca2',
      sw: 1.3,
      glow: false,
      labelO: 0,
      labelC: '#57534e',
    }

  const abierta = zonaAbierta !== null
  const enZonaAbierta = abierta && zonaAbierta === zonaId
  const resaltada = comunaHover === comunaId && enZonaAbierta

  if (resaltada) {
    return {
      fill: zona.colorClaro,
      fo: 1,
      stroke: zona.color,
      sw: 2.4,
      glow: true,
      labelO: 1,
      labelC: '#ffffff',
    }
  }
  if (abierta) {
    return enZonaAbierta
      ? {
          fill: zona.color,
          fo: 0.9,
          stroke: zona.color,
          sw: 1.8,
          glow: false,
          labelO: 0.85,
          labelC: '#374151',
        }
      : {
          fill: zona.color,
          fo: 0.06,
          stroke: zona.color,
          sw: 0.7,
          glow: false,
          labelO: 0.1,
          labelC: '#9ca3af',
        }
  }
  const iluminada = zonaHover === zonaId
  return {
    fill: zona.color,
    fo: iluminada ? 0.95 : 0.5,
    stroke: zona.color,
    sw: iluminada ? 2.4 : 1.3,
    glow: false,
    labelO: 0,
    labelC: '#57534e',
  }
}

function ComunaSvg({
  comuna,
  zonaId,
  indice,
  zonaAbierta,
  zonaHover,
  comunaHover,
  onZonaHover,
  onComunaHover,
  onAbrirZona,
}: {
  comuna: ComunaSvg
  zonaId: string
  indice: number
  zonaAbierta: string | null
  zonaHover: string | null
  comunaHover: string | null
  onZonaHover: (zonaId: string | null) => void
  onComunaHover: (comunaId: string | null) => void
  onAbrirZona: (zonaId: string) => void
}) {
  const zona = ZONA_POR_ID.get(zonaId)
  const vista = VISTA_POR_ZONA[zonaId]
  if (!zona || !vista) return null

  const estado = estadoDe(zonaId, comuna.id, zonaAbierta, zonaHover, comunaHover)
  const fontSize = comuna.label.fontSize ?? FONT_BASE

  return (
    <g
      className={zonaAbierta && zonaId !== zonaAbierta ? 'pointer-events-none' : 'cursor-pointer'}
      onMouseEnter={() => {
        if (zonaAbierta) {
          if (zonaId === zonaAbierta) {
            onComunaHover(comuna.id)
            track('mapa2.comuna.hover', { comuna: comuna.id })
          }
        } else {
          onZonaHover(zonaId)
          track('mapa2.zona.hover', { zona: zonaId })
        }
      }}
      onMouseLeave={() => {
        onComunaHover(null)
        onZonaHover(null)
      }}
      onClick={() => {
        if (!zonaAbierta) onAbrirZona(zonaId)
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
          ? comuna.label.lineas.map((ln, i) => (
              <tspan key={i} x={comuna.label.x} dy={i === 0 ? undefined : FONT_BASE * 1.18}>
                {ln}
              </tspan>
            ))
          : comuna.nombreCorto}
      </text>
    </g>
  )
}

export function VistaConcesionSection() {
  const [zonaAbierta, setZonaAbierta] = useState<string | null>(null)
  const [zonaHover, setZonaHover] = useState<string | null>(null)
  const [comunaHover, setComunaHover] = useState<string | null>(null)
  const [animar, setAnimar] = useState(false)
  const [vb, setVb] = useState(VISTA_GENERAL.vb)
  const reduce = useReducedMotion() ?? false
  const svgRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const vbRef = useRef(vb)
  vbRef.current = vb
  const kVista = VIEWBOX.w / vb.w

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const animarVista = useCallback(
    (destino: Vista) => {
      cancelAnimationFrame(rafRef.current)
      if (reduce) {
        setVb(destino.vb)
        return
      }
      const origen = vbRef.current
      const t0 = performance.now()
      const dur = 900
      const paso = (ahora: number) => {
        const t = Math.min((ahora - t0) / dur, 1)
        const e = 1 - Math.pow(1 - t, 3)
        setVb({
          x: origen.x + (destino.vb.x - origen.x) * e,
          y: origen.y + (destino.vb.y - origen.y) * e,
          w: origen.w + (destino.vb.w - origen.w) * e,
          h: origen.h + (destino.vb.h - origen.h) * e,
        })
        if (t < 1) rafRef.current = requestAnimationFrame(paso)
      }
      rafRef.current = requestAnimationFrame(paso)
    },
    [reduce],
  )

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setAnimar(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const zonaAbiertaData = zonaAbierta ? ZONA_POR_ID.get(zonaAbierta) : undefined
  const comunaHoverNombre = comunaHover
    ? COMUNAS_SVG.find((c) => c.id === comunaHover)?.nombreCorto
    : null
  const comunaHoverFullName = comunaHover
    ? COMUNAS_SVG.find((c) => c.id === comunaHover)?.nombre
    : null
  const zonaHoverData = zonaHover ? ZONA_POR_ID.get(zonaHover) : undefined
  const zonaChip = zonaHoverData ?? zonaAbiertaData

  const chipKey = comunaHoverNombre ?? zonaHover ?? zonaAbierta ?? 'inicial'

  const abrirZona = useCallback(
    (zonaId: string) => {
      const vista = VISTA_POR_ZONA[zonaId]
      if (!vista) return
      animarVista(vista)
      setZonaAbierta(zonaId)
      setComunaHover(null)
      setZonaHover(null)
      track('mapa2.zona.abrir', { zona: zonaId })
    },
    [animarVista],
  )

  const cerrarZona = useCallback(() => {
    animarVista(VISTA_GENERAL)
    setZonaAbierta(null)
    setComunaHover(null)
    setZonaHover(null)
    track('mapa2.zona.cerrar')
  }, [animarVista])

  const handleZonaHover = useCallback((zonaId: string | null) => setZonaHover(zonaId), [])
  const handleComunaHover = useCallback((comunaId: string | null) => setComunaHover(comunaId), [])
  const handleAbrirZona = useCallback((zonaId: string) => abrirZona(zonaId), [abrirZona])

  const mapaSvg = useMemo(
    () =>
      ZONAS_SVG.map((zonaSvg) => {
        const zona = ZONA_POR_ID.get(zonaSvg.id)
        if (!zona) return null
        const offset = OFFSET_POR_ZONA[zonaSvg.id] ?? 0
        return (
          <g
            key={zonaSvg.id}
            className={
              zonaHover === zonaSvg.id && !zonaAbierta ? 'zona-grupo zona-hover' : 'zona-grupo'
            }
            style={
              {
                '--dz': `${0.12 * (offset / 9) + 0.1}s`,
                '--ozx': `${zonaSvg.cx}px`,
                '--ozy': `${zonaSvg.cy}px`,
              } as CSSProperties
            }
          >
            {COMUNAS_SVG.filter((c) => zona.comunas.includes(c.id)).map((comuna, i) => (
              <ComunaSvg
                key={comuna.id}
                comuna={comuna}
                zonaId={zonaSvg.id}
                indice={offset + i}
                zonaAbierta={zonaAbierta}
                zonaHover={zonaHover}
                comunaHover={comunaHover}
                onZonaHover={handleZonaHover}
                onComunaHover={handleComunaHover}
                onAbrirZona={handleAbrirZona}
              />
            ))}
            <text
              x={zonaSvg.cx}
              y={zonaSvg.cy}
              textAnchor="middle"
              dominantBaseline="central"
              className="zona-label-svg"
              transform={
                zonaAbierta === zonaSvg.id
                  ? `translate(${vb.x + VIEWBOX.w / (2 * kVista) - zonaSvg.cx} ${
                      vb.y + FRANJA_ZONA / kVista - zonaSvg.cy
                    })`
                  : undefined
              }
              style={
                {
                  '--zo': zonaAbierta === null || zonaAbierta === zonaSvg.id ? 1 : 0,
                  '--zc': zona.color,
                  fontSize: zonaAbierta === zonaSvg.id ? TAM_ZONA_ZOOM / kVista : 36,
                } as CSSProperties
              }
            >
              {zona.nombre}
            </text>
          </g>
        )
      }),
    [
      zonaAbierta,
      zonaHover,
      comunaHover,
      vb,
      kVista,
      handleZonaHover,
      handleComunaHover,
      handleAbrirZona,
    ],
  )

  return (
    <section
      id="concesion-detalle"
      className="relative overflow-hidden bg-[#ece8dd] py-14 md:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(rgba(10, 25, 47, 0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />

      <motion.div
        className="relative z-10 mx-auto w-full max-w-5xl px-5 md:px-8"
        initial={reduce ? false : { opacity: 0, y: -100 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ type: 'spring', stiffness: 35, damping: 14, mass: 1.4 }}
      >
        <div className="flex flex-col items-center text-center">
          <Reveal className="mb-12 max-w-2xl">
            <p className="text-enel-blue text-sm font-bold tracking-[0.2em] uppercase">
              Concesión en detalle
            </p>
            <h2 className="text-enel-navy mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Nuestro territorio,{' '}
              <span className="text-enel-blue font-serif italic">trazo a trazo</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed font-medium text-neutral-600">
              Organizamos nuestra red en 4 secciones de concesión —Chacabuco, Cordillera, Pacífico y
              Florida— que cubren gran parte de la Región Metropolitana. Toca una zona para explorar
              sus comunas.
            </p>

            <div className="text-enel-navy mx-auto mt-8 flex max-w-xs items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur-sm">
              <MapPin size={18} className="text-enel-blue shrink-0" weight="fill" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={chipKey}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  data-testid="chip-concesion"
                >
                  {comunaHoverNombre ? (
                    <span className="text-enel-navy font-bold">{comunaHoverNombre}</span>
                  ) : zonaChip ? (
                    <span className="text-enel-navy flex items-center gap-2 font-bold">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: zonaChip.color }}
                      />
                      Zona {zonaChip.nombre}
                      {zonaAbiertaData && <> · {zonaAbiertaData.comunas.length} comunas</>}
                    </span>
                  ) : (
                    <span className="font-serif text-neutral-500 italic">
                      Pasa el cursor para descubrir…
                    </span>
                  )}
                </motion.span>
              </AnimatePresence>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="w-full">
            <div className="relative overflow-hidden rounded-3xl border border-neutral-300 bg-[#faf8f1] shadow-[0_24px_70px_-24px_rgba(10,25,47,0.45)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(10, 25, 47, 0.3) 1.5px, transparent 1.5px)',
                  backgroundSize: '16px 16px',
                }}
              />

              <div
                ref={svgRef}
                className={`relative h-[520px] sm:h-[660px] md:h-[740px] ${animar ? 'animar' : ''}`}
              >
                <svg
                  viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
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
                    {mapaSvg}
                  </g>
                </svg>
              </div>

              <AnimatePresence>
                {zonaAbierta && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                    onClick={cerrarZona}
                    className="absolute top-4 left-4 z-[1001] flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 text-sm font-bold shadow-lg backdrop-blur transition-colors hover:bg-white"
                  >
                    <ArrowLeft size={16} weight="bold" />
                    Volver a las zonas
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!zonaAbierta && (
                  <motion.div
                    initial={{ opacity: 0, rotate: -12 }}
                    animate={{ opacity: 1, rotate: 6 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="absolute top-4 right-4 z-[1001] hidden h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-dashed border-neutral-400/70 bg-white/70 text-center shadow-sm backdrop-blur sm:flex"
                    aria-hidden="true"
                  >
                    <span className="text-enel-navy text-lg leading-none font-black">33</span>
                    <span className="mt-1 text-[9px] font-bold tracking-[0.18em] text-neutral-500 uppercase">
                      comunas
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!zonaAbierta && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 14 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-[1001] px-4 pb-4"
                  >
                    <div className="mx-auto flex w-fit max-w-full flex-wrap justify-center gap-1.5 rounded-2xl border border-neutral-200 bg-white/90 p-1.5 shadow-lg backdrop-blur">
                      {ZONAS_CONCESION.map((zona) => (
                        <button
                          key={zona.id}
                          type="button"
                          onMouseEnter={() => setZonaHover(zona.id)}
                          onMouseLeave={() =>
                            setZonaHover((actual) => (actual === zona.id ? null : actual))
                          }
                          onClick={() => abrirZona(zona.id)}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-all hover:bg-neutral-100 ${
                            zonaHover === zona.id ? 'bg-neutral-100' : ''
                          }`}
                        >
                          <span
                            className="h-3 w-3 rounded-full shadow-sm"
                            style={{ backgroundColor: zona.color }}
                          />
                          {zona.nombre}
                          <span className="text-xs font-semibold text-neutral-400">
                            {zona.comunas.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {zonaAbierta && comunaHoverFullName && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 14 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-4 left-0 right-0 z-[1001] px-4 pointer-events-none"
                  >
                    <div className="mx-auto flex w-fit max-w-full justify-center rounded-2xl border border-neutral-200 bg-white/95 p-1.5 shadow-lg backdrop-blur">
                      <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 text-sm font-bold text-enel-navy shadow-sm">
                        {zonaAbiertaData && (
                          <span
                            className="h-3 w-3 rounded-full shadow-sm"
                            style={{ backgroundColor: zonaAbiertaData.color }}
                          />
                        )}
                        {comunaHoverFullName}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </motion.div>
    </section>
  )
}
