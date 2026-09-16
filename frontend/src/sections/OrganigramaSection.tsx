import { useEffect, useState } from 'react'
import {
  X,
  Play,
  ArrowRight,
  ChartLine,
  Handshake,
  ShieldCheck,
  UsersThree,
  Scales,
  GlobeHemisphereWest,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import type { Variants } from 'motion/react'
import { Reveal } from '@/components/ui/Reveal'
import { SectionShell } from '@/components/ui/SectionShell'
import { VideoEmbed } from '@/components/ui/VideoEmbed'
import { areasStaff, gerenteGeneral, subgerencias } from '@/lib/data/organizacion'
import { videoDeSeccion } from '@/lib/data/videos'

// Aparecer escalonado: cada card entra con blur y un resorte críticamente amortiguado.
const cardsPadre: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.15, staggerChildren: 0.1 } },
}
const cardHija: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.96, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', bounce: 0, duration: 0.55 },
  },
}
const cardsSubgerencias: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

// Primera carga de la sección Staff: entrada con desenfoque, spring críticamente amortiguado
const cardsStaff: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
}
const cardStaff: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.96, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', bounce: 0, duration: 0.55 },
  },
}

const iconosStaff: Record<(typeof areasStaff)[number]['id'], Icon> = {
  finanzas: ChartLine,
  auditoria: ShieldCheck,
  personas: UsersThree,
  legal: Scales,
  comunicaciones: GlobeHemisphereWest,
}

export function OrganigramaSection() {
  const [nodoAbierto, setNodoAbierto] = useState<string | null>(null)
  const [staffActivo, setStaffActivo] = useState<(typeof areasStaff)[number] | null>(null)
  const [ggAbierto, setGgAbierto] = useState(false)
  const [videoActivo, setVideoActivo] = useState<{ url: string; titulo: string } | null>(null)
  const reduce = useReducedMotion()
  // Detalle de subgerencia activo: alimenta el modal centrado en móvil/tablet
  const subAbierta = subgerencias.find((sub) => sub.id === nodoAbierto) ?? null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setGgAbierto(false)
      setStaffActivo(null)
      setNodoAbierto(null)
      setVideoActivo(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SectionShell
      id="organigrama"
      className="bg-[#f0eee6] bg-[radial-gradient(rgba(10,25,47,0.09)_1.5px,transparent_1.5px)] bg-[size:16px_16px] pt-10 md:pt-14"
      innerClassName="py-12"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, clipPath: 'inset(8% 8% 8% 8%)' }}
        whileInView={reduce ? undefined : { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 1.0, ease: [0.23, 1, 0.32, 1] }}
      >
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="text-enel-navy text-3xl leading-[1.1] font-semibold tracking-[-0.02em] md:text-5xl md:tracking-[-0.025em]">
            Equipos y Gerencia
          </h2>
          <p className="mt-4 text-[15px] text-neutral-500">
            Conoce a quienes hacen posible la energía en nuestra red
          </p>
        </Reveal>

        {/* Árbol del Organigrama */}
        <motion.div
          className="flex w-full flex-col items-center pt-4 pb-10"
          variants={cardsPadre}
          initial={reduce ? false : 'hidden'}
          whileInView={reduce ? undefined : 'show'}
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* Nodo Raíz: Gerente General */}
          <motion.div variants={cardHija} className="z-10">
            <div
              onClick={() => {
                setGgAbierto(true)
                setNodoAbierto(null)
                setStaffActivo(null)
              }}
              className="float-subtle group relative w-80 cursor-pointer rounded-[28px] border border-black/[0.06] bg-white/70 p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-8px_rgba(10,25,47,0.12)] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-black/[0.09] hover:shadow-[0_2px_4px_rgba(0,0,0,0.03),0_24px_48px_-12px_rgba(10,25,47,0.16)] active:scale-[0.98] active:duration-100"
              style={{ animationDelay: '0s' }}
            >
              <span className="bg-enel-blue absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-semibold tracking-[0.14em] text-white uppercase shadow-sm">
                Liderazgo
              </span>
              <img
                src={gerenteGeneral.foto}
                alt={`${gerenteGeneral.nombre}, ${gerenteGeneral.cargo}`}
                className="group-hover:ring-enel-blue/30 mx-auto h-28 w-28 rounded-full object-cover shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.08)] ring-4 ring-black/[0.04] transition-all duration-300"
                loading="lazy"
              />
              <p className="text-enel-blue mt-5 text-xs font-semibold tracking-[0.12em] uppercase">
                {gerenteGeneral.cargo}
              </p>
              <h3 className="text-enel-navy mt-1 text-2xl font-semibold tracking-[-0.02em]">
                {gerenteGeneral.nombre}
              </h3>
              <p className="mt-2 text-[11px] font-medium text-neutral-500">
                {gerenteGeneral.empresa}
              </p>
            </div>
          </motion.div>

          {/* Tronco Principal */}
          <div className="bg-enel-fog/80 h-8 w-0.5" />

          {/* Tronco hacia las subgerencias */}
          <div className="bg-enel-fog/80 relative hidden h-10 w-0.5 md:block">
            {/* Línea Horizontal que conecta las subgerencias (ajustada para no desbordar) */}
            <div className="bg-enel-fog/80 absolute bottom-0 left-1/2 h-0.5 w-[calc(100vw-4rem)] max-w-[850px] -translate-x-1/2" />
          </div>

          {/* Ramas de Subgerencias */}
          <motion.div
            variants={cardsSubgerencias}
            className="relative mt-8 flex w-full max-w-[1000px] flex-col items-center justify-between gap-8 md:mt-0 md:flex-row md:gap-2"
          >
            {/* Tronco vertical central para móvil */}
            <div className="bg-enel-fog/80 absolute top-0 bottom-0 left-1/2 -z-10 block w-0.5 -translate-x-1/2 md:hidden" />

            {subgerencias.map((sub, idx) => (
              <motion.div
                key={sub.id}
                variants={cardHija}
                className={`relative flex w-44 flex-col items-center ${nodoAbierto === sub.id ? 'z-50' : 'z-10'}`}
              >
                {/* Tallo Vertical de cada Nodo (Desktop) */}
                <div className="bg-enel-fog/80 hidden h-8 w-0.5 md:block" />

                {/* Nodo Subgerencia */}
                <div
                  onClick={() => {
                    setNodoAbierto(nodoAbierto === sub.id ? null : sub.id)
                    setStaffActivo(null)
                  }}
                  className={`float-subtle relative flex w-full cursor-pointer flex-col items-center rounded-[24px] border bg-white/70 p-5 text-center backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-2 hover:border-black/[0.09] hover:shadow-[0_2px_4px_rgba(0,0,0,0.03),0_24px_48px_-12px_rgba(10,25,47,0.16)] ${
                    nodoAbierto === sub.id
                      ? 'border-enel-blue -translate-y-2 shadow-[0_2px_4px_rgba(0,0,0,0.03),0_24px_48px_-12px_rgba(10,25,47,0.18)]'
                      : 'border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(10,25,47,0.08)]'
                  }`}
                  style={{ animationDelay: `${idx * 0.35}s` }}
                >
                  <img
                    src={sub.foto}
                    alt={sub.subgerente}
                    className={`mx-auto h-20 w-20 rounded-full object-cover shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_4px_rgba(0,0,0,0.06)] ring-4 transition-all duration-300 ${
                      nodoAbierto === sub.id
                        ? 'ring-enel-blue/30'
                        : 'hover:ring-enel-blue/30 ring-black/[0.04]'
                    }`}
                  />
                  <p className="text-enel-navy mt-4 flex min-h-[2.5rem] items-center justify-center text-sm leading-tight font-semibold tracking-[-0.01em]">
                    {sub.subgerente}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                    {sub.sigla}
                  </p>
                </div>

                {/* Detalle de Subgerencia: popover anclado solo en escritorio (lg+) */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  className={`absolute inset-x-auto bottom-[110%] z-[100] mb-4 hidden w-[min(340px,calc(100vw-2rem))] overflow-visible rounded-[24px] border border-black/[0.06] bg-white/95 shadow-[0_-2px_6px_rgba(0,0,0,0.04),0_-24px_60px_-12px_rgba(10,25,47,0.22)] backdrop-blur-2xl transition-[opacity,scale,visibility] duration-300 ease-out lg:block ${
                    idx === 0
                      ? 'left-0'
                      : idx === subgerencias.length - 1
                        ? 'right-0'
                        : 'left-1/2 -translate-x-1/2'
                  } ${
                    nodoAbierto === sub.id
                      ? 'visible scale-100 opacity-100'
                      : 'pointer-events-none invisible scale-95 opacity-0'
                  }`}
                >
                  {/* Encabezado del Popover */}
                  <div className="bg-enel-navy relative flex items-start gap-4 rounded-t-[23px] p-5 text-left">
                    <button
                      onClick={() => setNodoAbierto(null)}
                      className="absolute top-3 right-3 rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                    <img
                      src={sub.foto}
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20"
                      alt=""
                    />
                    <div>
                      <p className="text-enel-blue text-[10px] font-semibold tracking-[0.14em] uppercase">
                        Subgerencia {sub.sigla}
                      </p>
                      <h4 className="mt-1 text-[13px] leading-tight font-semibold tracking-[-0.01em] text-white">
                        {sub.nombre}
                      </h4>
                      <p className="mt-1 text-[11px] font-medium text-neutral-300">
                        Líder: {sub.subgerente}
                      </p>
                    </div>
                  </div>

                  {/* Cuerpo del Hover Modal */}
                  <div className="p-5 text-left">
                    {videoDeSeccion(sub.videoSection) && (
                      <button
                        onClick={() =>
                          setVideoActivo({
                            url: videoDeSeccion(sub.videoSection)!.youtube_url,
                            titulo: videoDeSeccion(sub.videoSection)!.title,
                          })
                        }
                        className="group/btn bg-enel-blue hover:bg-enel-blue-dark mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-semibold tracking-wide text-white shadow-sm transition-[background-color,box-shadow,transform] duration-300 ease-out hover:shadow-md active:scale-[0.98] active:duration-100"
                      >
                        <Play
                          size={14}
                          weight="fill"
                          className="text-white transition-transform duration-300 group-hover/btn:scale-115"
                        />
                        Ver Video de Bienvenida
                      </button>
                    )}
                    <p className="text-xs leading-relaxed text-neutral-600">{sub.proposito}</p>

                    <div className="mt-5">
                      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                        <span className="bg-enel-blue h-1.5 w-1.5 rounded-full" />
                        Principales procesos
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sub.procesos.map((proc) => (
                          <span
                            key={proc}
                            className="rounded-full border border-black/[0.06] bg-black/[0.03] px-2.5 py-1 text-[10px] font-medium text-neutral-600"
                          >
                            {proc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ─── Áreas Staff: Sección aparte, fuera del organigrama ─── */}
        <div className="mx-auto mb-14 flex w-full max-w-5xl items-center gap-5 px-4">
          <motion.div
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={reduce ? undefined : { scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ originX: 1 }}
            className="h-px flex-1 bg-gradient-to-l from-neutral-300 to-transparent"
          />
          <motion.div
            initial={reduce ? false : { scale: 0.92, opacity: 0 }}
            whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(10,25,47,0.10)] backdrop-blur-md"
          >
            <Handshake size={20} weight="duotone" className="text-enel-blue" aria-hidden="true" />
          </motion.div>
          <motion.div
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={reduce ? undefined : { scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ originX: 0 }}
            className="h-px flex-1 bg-gradient-to-r from-neutral-300 to-transparent"
          />
        </div>

        <Reveal className="mx-auto mb-12 max-w-2xl px-4 text-center">
          <span className="text-enel-blue bg-enel-blue/[0.08] inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase">
            Áreas Staff
          </span>
          <h3 className="text-enel-navy mt-5 text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.02em] md:text-4xl md:tracking-[-0.025em]">
            Especialistas que impulsan a toda la organización
          </h3>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-neutral-500">
            Pertenecen a Enel Chile y entregan apoyo transversal a las líneas de negocio, sin
            integrar las gerencias.
          </p>
        </Reveal>

        <motion.div
          variants={cardsStaff}
          initial={reduce ? false : 'hidden'}
          whileInView={reduce ? undefined : 'show'}
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {areasStaff.map((area, idx) => {
            const Icono = iconosStaff[area.id] ?? ChartLine
            return (
              <motion.div key={area.id} variants={cardStaff} className="flex">
                <button
                  onClick={() => {
                    setStaffActivo(area)
                    setNodoAbierto(null)
                  }}
                  className="float-subtle group relative flex h-full w-full cursor-pointer flex-col items-start overflow-hidden rounded-[24px] border border-black/[0.06] bg-white/70 p-6 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(10,25,47,0.10)] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:border-black/[0.09] hover:shadow-[0_2px_4px_rgba(0,0,0,0.03),0_24px_48px_-12px_rgba(10,25,47,0.16)] active:scale-[0.98] active:duration-100"
                  style={{ animationDelay: `${idx * 0.35}s` }}
                >
                  <div className="mb-6 flex size-12 items-center justify-center rounded-[14px] bg-gradient-to-b from-white to-neutral-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
                    <Icono
                      size={22}
                      weight="duotone"
                      className="text-enel-navy group-hover:text-enel-blue transition-colors duration-300"
                    />
                  </div>

                  <h4 className="text-enel-navy text-[17px] leading-snug font-semibold tracking-[-0.01em]">
                    {area.nombre}
                  </h4>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-neutral-500">
                    {area.detalle}
                  </p>

                  <span className="text-enel-blue/80 group-hover:text-enel-blue mt-auto inline-flex items-center gap-1 pt-5 text-[13px] font-medium transition-colors duration-300">
                    Conocer área
                    <ArrowRight
                      size={13}
                      weight="bold"
                      className="transition-transform duration-300 ease-out group-hover:translate-x-0.5"
                    />
                  </span>
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

      {/* Modal de Detalle de Subgerencia: centrado en móvil/tablet (en lg+ se usa el popover anclado) */}
      <AnimatePresence>
        {subAbierta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 py-10 backdrop-blur-sm lg:hidden"
            onClick={() => setNodoAbierto(null)}
          >
            <motion.div
              initial={reduce ? { opacity: 0 } : { scale: 0.95, y: 20 }}
              animate={reduce ? { opacity: 1 } : { scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
              className="relative w-full max-w-md shrink-0 overflow-hidden rounded-[28px] border border-white/60 bg-white/95 shadow-2xl backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Encabezado */}
              <div className="bg-enel-navy relative flex items-start gap-4 p-5 text-left">
                <button
                  onClick={() => setNodoAbierto(null)}
                  className="absolute top-3 right-3 rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar detalle"
                >
                  <X size={18} />
                </button>
                <img
                  src={subAbierta.foto}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20"
                  alt=""
                />
                <div>
                  <p className="text-enel-blue text-[10px] font-semibold tracking-[0.14em] uppercase">
                    Subgerencia {subAbierta.sigla}
                  </p>
                  <h4 className="mt-1 text-[13px] leading-tight font-semibold tracking-[-0.01em] text-white">
                    {subAbierta.nombre}
                  </h4>
                  <p className="mt-1 text-[11px] font-medium text-neutral-300">
                    Líder: {subAbierta.subgerente}
                  </p>
                </div>
              </div>

              {/* Cuerpo */}
              <div className="p-5 text-left">
                {videoDeSeccion(subAbierta.videoSection) && (
                  <button
                    onClick={() =>
                      setVideoActivo({
                        url: videoDeSeccion(subAbierta.videoSection)!.youtube_url,
                        titulo: videoDeSeccion(subAbierta.videoSection)!.title,
                      })
                    }
                    className="group/btn bg-enel-blue hover:bg-enel-blue-dark mb-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-semibold tracking-wide text-white shadow-sm transition-[background-color,box-shadow,transform] duration-300 ease-out hover:shadow-md active:scale-[0.98] active:duration-100"
                  >
                    <Play
                      size={14}
                      weight="fill"
                      className="text-white transition-transform duration-300 group-hover/btn:scale-115"
                    />
                    Ver Video de Bienvenida
                  </button>
                )}
                <p className="text-xs leading-relaxed text-neutral-600">{subAbierta.proposito}</p>

                <div className="mt-5">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                    <span className="bg-enel-blue h-1.5 w-1.5 rounded-full" />
                    Principales procesos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {subAbierta.procesos.map((proc) => (
                      <span
                        key={proc}
                        className="rounded-full border border-black/[0.06] bg-black/[0.03] px-2.5 py-1 text-[10px] font-medium text-neutral-600"
                      >
                        {proc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Video (Pop-up) */}
      <AnimatePresence>
        {videoActivo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/85 p-4 py-10 backdrop-blur-sm"
            onClick={() => setVideoActivo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
              className="relative w-full max-w-3xl shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950/90 p-3 shadow-2xl backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón Cerrar */}
              <button
                onClick={() => setVideoActivo(null)}
                className="absolute top-4 right-4 z-50 rounded-full bg-black/60 p-2 text-white/70 transition hover:bg-black/80 hover:text-white"
                aria-label="Cerrar video"
              >
                <X size={20} weight="bold" />
              </button>

              <div className="p-3 text-left">
                <h3 className="mb-3 truncate pr-12 text-base font-semibold text-white">
                  {videoActivo.titulo}
                </h3>
                <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-black">
                  <VideoEmbed youtubeUrl={videoActivo.url} titulo={videoActivo.titulo} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalle: Gerencia General */}
      <AnimatePresence>
        {ggAbierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 py-10 backdrop-blur-sm"
            onClick={() => setGgAbierto(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
              className="relative w-full max-w-md shrink-0 overflow-hidden rounded-[28px] border border-white/60 bg-white/85 p-6 text-center shadow-2xl backdrop-blur-2xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setGgAbierto(false)}
                className="absolute top-4 right-4 z-50 rounded-full bg-black/[0.04] p-2 text-neutral-500 transition hover:bg-black/[0.08] hover:text-neutral-800"
                aria-label="Cerrar detalle"
              >
                <X size={18} weight="bold" />
              </button>

              <img
                src={gerenteGeneral.foto}
                alt={`${gerenteGeneral.nombre}, ${gerenteGeneral.cargo}`}
                className="mx-auto h-24 w-24 rounded-full object-cover shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.08)] ring-4 ring-black/[0.04]"
                loading="lazy"
              />
              <span className="bg-enel-blue mt-5 inline-flex items-center rounded-full px-3.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-white uppercase shadow-sm">
                Liderazgo
              </span>
              <p className="text-enel-blue mt-4 text-xs font-semibold tracking-[0.12em] uppercase">
                {gerenteGeneral.cargo}
              </p>
              <h3 className="text-enel-navy mt-1 text-2xl font-semibold tracking-[-0.02em] sm:text-[1.7rem]">
                {gerenteGeneral.nombre}
              </h3>
              <p className="mt-1 text-sm font-medium text-neutral-500">{gerenteGeneral.empresa}</p>
              <div className="mt-6 rounded-2xl border border-black/[0.04] bg-white/60 p-5 shadow-xs">
                <p className="text-sm leading-relaxed font-medium text-neutral-600">
                  Desde la Gerencia General se conducen las cinco subgerencias y se articula el
                  soporte transversal de las áreas staff de la compañía.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalle de Área Staff (Pop-up) */}
      <AnimatePresence>
        {staffActivo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 py-10 backdrop-blur-sm"
            onClick={() => setStaffActivo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
              className="relative w-full max-w-lg shrink-0 overflow-hidden rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón Cerrar */}
              <button
                onClick={() => setStaffActivo(null)}
                className="absolute top-4 right-4 z-50 rounded-full bg-black/[0.04] p-2 text-neutral-500 transition hover:bg-black/[0.08] hover:text-neutral-800"
                aria-label="Cerrar detalle"
              >
                <X size={18} weight="bold" />
              </button>

              <div className="mt-2 text-left">
                <span className="text-enel-blue bg-enel-blue/[0.08] inline-flex items-center rounded-full px-3.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  {staffActivo.etiqueta}
                </span>
                <h3 className="text-enel-navy mt-3 mb-4 text-2xl font-semibold tracking-[-0.02em]">
                  {staffActivo.nombre}
                </h3>
                <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-5 shadow-xs">
                  <p className="text-sm leading-relaxed font-medium text-neutral-600">
                    {staffActivo.detalle}
                  </p>
                </div>
                <p className="mt-4 text-center text-[11px] font-medium text-neutral-400">
                  Pertenece a Enel Chile y entrega apoyo transversal a las líneas de negocio.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionShell>
  )
}
