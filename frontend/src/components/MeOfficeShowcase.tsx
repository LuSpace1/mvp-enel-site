import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { PlayCircle } from '@phosphor-icons/react'
import { clsx } from 'clsx'

import { presentacionesMeOffice } from '@/lib/data/meOffice'
import type { PresentacionMeOffice } from '@/lib/data/meOffice'

function MediaPantalla({ presentacion }: { presentacion: PresentacionMeOffice }) {
  const { media, titulo } = presentacion

  if (!media.src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(120%_120%_at_50%_0%,#1b1c22_0%,#08080a_62%)] px-6 text-center">
        <PlayCircle size={46} weight="duotone" className="text-white/25" />
        <p className="text-sm font-medium text-white/65 md:text-base">{titulo}</p>
        <p className="text-xs text-white/30">Video en preparación · se reproducirá aquí</p>
      </div>
    )
  }

  if (media.tipo === 'video') {
    return (
      <video
        key={media.src}
        src={media.src}
        poster={media.poster}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        className="h-full w-full bg-black object-contain"
      />
    )
  }

  return (
    <img
      src={media.src}
      alt=""
      aria-hidden="true"
      className="h-full w-full bg-black object-contain"
    />
  )
}

export function MeOfficeShowcase() {
  const reduce = useReducedMotion()
  const [activo, setActivo] = useState(0)
  const [pausado, setPausado] = useState(false)
  const [autoplay, setAutoplay] = useState(true)
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([])

  const presentacion = presentacionesMeOffice[activo] ?? presentacionesMeOffice[0]!

  const avanzar = () => setActivo((i) => (i + 1) % presentacionesMeOffice.length)

  const seleccionar = (i: number) => {
    setAutoplay(false)
    setActivo(i)
  }

  const alPresionarTecla = (evento: KeyboardEvent<HTMLDivElement>) => {
    const total = presentacionesMeOffice.length
    let destino: number | null = null
    if (evento.key === 'ArrowRight') destino = (activo + 1) % total
    else if (evento.key === 'ArrowLeft') destino = (activo - 1 + total) % total
    else if (evento.key === 'Home') destino = 0
    else if (evento.key === 'End') destino = total - 1
    if (destino === null) return
    evento.preventDefault()
    seleccionar(destino)
    tabsRef.current[destino]?.focus()
  }

  const alEntrar = () => setPausado(true)
  const alSalir = () => setPausado(false)

  return (
    <div className="w-full">
      {/* Pestañas */}
      <div
        className="mb-4 flex justify-center px-1 md:mb-6"
        onMouseEnter={alEntrar}
        onMouseLeave={alSalir}
      >
        <div className="no-scrollbar max-w-full overflow-x-auto">
          <div
            role="tablist"
            aria-label="Presentaciones de la herramienta Me Office"
            onKeyDown={alPresionarTecla}
            className="border-enel-fog bg-enel-mist/80 relative inline-flex min-w-max items-center gap-0.5 overflow-hidden rounded-xl border p-1 shadow-[inset_0_1px_2px_rgba(10,25,47,0.05)] backdrop-blur-sm"
          >
            {presentacionesMeOffice.map((item, i) => {
              const activa = i === activo
              return (
                <button
                  key={item.id}
                  ref={(nodo) => {
                    tabsRef.current[i] = nodo
                  }}
                  type="button"
                  role="tab"
                  id={`meoffice-tab-${item.id}`}
                  aria-selected={activa}
                  aria-controls={`meoffice-panel-${item.id}`}
                  tabIndex={activa ? 0 : -1}
                  onClick={() => seleccionar(i)}
                  className={clsx(
                    'relative inline-flex h-8 shrink-0 items-center rounded-lg px-3.5 text-[13px] font-medium tracking-[-0.01em] whitespace-nowrap transition-colors duration-200 select-none md:h-9 md:px-4',
                    activa
                      ? 'text-enel-navy'
                      : 'text-enel-navy/45 hover:text-enel-navy/70 hover:bg-white/70',
                  )}
                >
                  {activa && (
                    <motion.span
                      layoutId="meoffice-indicador"
                      transition={{ type: 'spring', bounce: 0.18, duration: 0.5 }}
                      className="absolute inset-0 rounded-lg bg-white shadow-[0_1px_3px_rgba(10,25,47,0.16)]"
                    />
                  )}
                  <span className="relative z-10">{item.etiqueta}</span>
                </button>
              )
            })}

            {/* Progreso de la presentación */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
            >
              <span className="bg-enel-navy/10 absolute inset-0" />
              {!reduce && autoplay && (
                <span
                  key={`progreso-meoffice-${activo}`}
                  className="barra-meoffice bg-enel-blue/70 absolute inset-0"
                  style={{ animationPlayState: pausado ? 'paused' : 'running' }}
                  onAnimationEnd={avanzar}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Escenario MacBook */}
      <div
        role="tabpanel"
        id={`meoffice-panel-${presentacion.id}`}
        aria-labelledby={`meoffice-tab-${presentacion.id}`}
        onMouseEnter={alEntrar}
        onMouseLeave={alSalir}
        className="3xl:max-w-5xl relative mx-auto w-full max-w-4xl"
      >
        {/* Tapa y pantalla */}
        <div className="relative rounded-[16px] border border-[#101013] bg-gradient-to-b from-[#2b2b30] via-[#1b1b1f] to-[#141416] p-3 shadow-[0_40px_90px_-32px_rgba(10,25,47,0.6),0_10px_30px_-18px_rgba(10,25,47,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div
            aria-hidden="true"
            className="absolute top-[4px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#0c0d10] ring-1 ring-white/[0.12]"
          />

          <div className="relative aspect-video overflow-hidden rounded-[9px] bg-black">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={presentacion.id}
                initial={reduce ? false : { opacity: 0, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.995 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <MediaPantalla presentacion={presentacion} />
              </motion.div>
            </AnimatePresence>

            {/* Reflejo del cristal */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent"
            />
          </div>
        </div>

        {/* Base */}
        <div className="relative -mt-px h-4">
          <div className="absolute inset-x-[-2%] top-0 h-full rounded-b-[14px] bg-gradient-to-b from-[#b7b7c0] via-[#67676f] to-[#33333a] shadow-[0_26px_50px_-24px_rgba(10,25,47,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] md:inset-x-[-3.5%]">
            <div
              aria-hidden="true"
              className="absolute bottom-0 left-1/2 h-[7px] w-[15%] -translate-x-1/2 rounded-t-[6px] bg-[#0b0b0e]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
