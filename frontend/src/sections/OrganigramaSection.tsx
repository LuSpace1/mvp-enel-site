import { useEffect, useState } from 'react'
import { X, Play, Handshake } from '@phosphor-icons/react'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import type { Variants } from 'motion/react'
import { Reveal } from '@/components/ui/Reveal'
import { RevealTexto } from '@/components/ui/RevealTexto'
import { useCampo, useLista } from '@/lib/cms/contenido'
import { SectionShell } from '@/components/ui/SectionShell'
import { VideoEmbed } from '@/components/ui/VideoEmbed'
import fotoHombre from '@/assets/images/placeholder_hombre.webp'
import {
  areasStaff as areasStaffPorDefecto,
  gerenteGeneral as gerentePorDefecto,
  subgerencias as subgerenciasPorDefecto,
} from '@/lib/data/organizacion'
import type { AreaStaff, Subgerencia } from '@/types/api'

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

/** Conserva las fotos actuales cuando el CMS aún no tiene una imagen subida. */
function fotoDeSubgerencia(subgerencia: Subgerencia, indice: number): string {
  return (
    subgerencia.foto ||
    subgerenciasPorDefecto.find((item) => item.sigla === subgerencia.sigla)?.foto ||
    subgerenciasPorDefecto[indice]?.foto ||
    fotoHombre
  )
}

function fotoDeAreaStaff(area: AreaStaff, indice: number): string {
  return (
    area.foto ||
    areasStaffPorDefecto.find((item) => item.nombre === area.nombre)?.foto ||
    areasStaffPorDefecto[indice]?.foto ||
    fotoHombre
  )
}

interface TarjetaAreaProps {
  titulo: string
  responsable: string
  foto: string
  onClick: () => void
  delay?: number
  sigla?: string
}

function TarjetaArea({ titulo, responsable, foto, onClick, delay = 0, sigla }: TarjetaAreaProps) {
  return (
    <button
      onClick={onClick}
      className="float-subtle group relative flex h-full w-full cursor-pointer flex-col items-center overflow-hidden rounded-[24px] border border-black/[0.06] bg-white/70 p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(10,25,47,0.10)] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:border-black/[0.09] hover:shadow-[0_2px_4px_rgba(0,0,0,0.03),0_24px_48px_-12px_rgba(10,25,47,0.16)] active:scale-[0.98] active:duration-100"
      style={{ animationDelay: `${delay}s` }}
    >
      <img
        src={foto}
        alt={`${responsable}, ${titulo}`}
        loading="lazy"
        decoding="async"
        className="group-hover:ring-enel-blue/30 h-20 w-20 rounded-full object-cover shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_4px_rgba(0,0,0,0.06)] ring-4 ring-black/[0.04] transition-all duration-300"
      />
      <h4
        className={`text-enel-navy mt-5 flex min-h-[4.5rem] items-center justify-center text-[17px] leading-snug ${
          sigla ? 'font-bold' : ''
        }`}
      >
        {sigla ?? titulo}
      </h4>
      <p className="mt-1 text-[13px] font-medium text-neutral-500">{responsable}</p>
      <span className="text-enel-blue group-hover:text-enel-blue-dark mt-auto inline-flex items-center pt-5 text-[13px] font-medium transition-colors duration-300">
        Conocer área
      </span>
    </button>
  )
}

interface ModalLiderProps {
  onCerrar: () => void
  badge: string
  cargo: string
  nombre: string
  organizacion: string
  foto: string
  proposito: string
  areas?: string[]
  videoUrl?: string
  videoTitulo?: string
  onVideo: (video: { url: string; titulo: string }) => void
}

function ModalLider({
  onCerrar,
  badge,
  cargo,
  nombre,
  organizacion,
  foto,
  proposito,
  areas,
  videoUrl,
  videoTitulo,
  onVideo,
}: ModalLiderProps) {
  const reduce = useReducedMotion()
  const video = videoUrl
    ? { url: videoUrl, titulo: videoTitulo || 'Video de bienvenida' }
    : undefined

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-lenis-prevent
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 py-10 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <motion.div
        initial={reduce ? { opacity: 0 } : { scale: 0.95, y: 20 }}
        animate={reduce ? { opacity: 1 } : { scale: 1, y: 0 }}
        exit={reduce ? { opacity: 0 } : { scale: 0.95, y: 20 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
        className="relative w-full max-w-md shrink-0 overflow-hidden rounded-[28px] border border-white/60 bg-white/85 p-6 text-center shadow-2xl backdrop-blur-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onCerrar}
          className="absolute top-4 right-4 z-50 rounded-full bg-black/[0.04] p-2 text-neutral-500 transition hover:bg-black/[0.08] hover:text-neutral-800"
          aria-label="Cerrar detalle"
        >
          <X size={18} weight="bold" />
        </button>

        <img
          src={foto}
          alt={`${nombre}, ${cargo}`}
          className="mx-auto h-24 w-24 rounded-full object-cover shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.08)] ring-4 ring-black/[0.04]"
          loading="lazy"
        />
        <span className="bg-enel-blue mt-5 inline-flex items-center rounded-full px-3.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-white uppercase shadow-sm">
          {badge}
        </span>
        <p className="text-enel-blue mt-4 text-xs font-semibold tracking-[0.12em] uppercase">
          {cargo}
        </p>
        <h3 className="text-enel-navy mt-1 text-2xl sm:text-[1.7rem]">{nombre}</h3>
        <p className="mt-1 text-sm font-medium text-neutral-500">{organizacion}</p>
        <div className="mt-6 rounded-2xl border border-black/[0.04] bg-white/60 p-5 shadow-xs">
          <p className="text-sm leading-relaxed font-medium text-neutral-600">{proposito}</p>
          {areas && areas.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">
                <span className="bg-enel-blue h-1.5 w-1.5 rounded-full" />
                Áreas
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {areas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-black/[0.06] bg-black/[0.03] px-2.5 py-1 text-[10px] font-medium text-neutral-600"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {video && (
          <button
            onClick={() => {
              onVideo({ url: video.url, titulo: video.titulo })
              onCerrar()
            }}
            className="group/btn bg-enel-blue hover:bg-enel-blue-dark mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-semibold tracking-wide text-white shadow-sm transition-[background-color,box-shadow,transform] duration-300 ease-out hover:shadow-md active:scale-[0.98] active:duration-100"
          >
            <Play
              size={14}
              weight="fill"
              className="text-white transition-transform duration-300 group-hover/btn:scale-115"
            />
            Ver Video de Bienvenida
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}

export function OrganigramaSection() {
  const [nodoAbierto, setNodoAbierto] = useState<number | null>(null)
  const [staffActivo, setStaffActivo] = useState<number | null>(null)
  const [ggAbierto, setGgAbierto] = useState(false)
  const [videoActivo, setVideoActivo] = useState<{ url: string; titulo: string } | null>(null)
  const reduce = useReducedMotion()
  const titulo = useCampo('organigrama', 'titulo', 'Estructura organizacional')
  const intro = useCampo(
    'organigrama',
    'intro',
    'Descubre cómo se estructura Enel Distribución, sus principales gerencias, líderes y áreas de apoyo transversal que contribuyen al funcionamiento del negocio.',
  )
  const staffTitulo = useCampo('organigrama', 'staff_titulo', 'Áreas Staff')
  const staffIntro = useCampo(
    'organigrama',
    'staff_intro',
    'Conoce las áreas de Enel Chile que brindan apoyo transversal a las distintas líneas de negocio.',
  )
  const gerente = useLista('organigrama', 'gerente', [gerentePorDefecto])[0] ?? gerentePorDefecto
  const subgerencias = useLista('organigrama', 'subgerencias', subgerenciasPorDefecto)
  const areasStaff = useLista('organigrama', 'areas_staff', areasStaffPorDefecto)
  const subAbierta = nodoAbierto !== null ? subgerencias[nodoAbierto] : null
  const areaActiva = staffActivo !== null ? areasStaff[staffActivo] : null

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
    <SectionShell id="organigrama" className="bg-white pt-10 md:pt-14" innerClassName="py-12">
      <motion.div
        initial={reduce ? false : { opacity: 0, clipPath: 'inset(8% 8% 8% 8%)' }}
        whileInView={reduce ? undefined : { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 1.0, ease: [0.23, 1, 0.32, 1] }}
      >
        <Reveal y={0} className="mx-auto mb-16 max-w-2xl text-center">
          <RevealTexto as="h2" className="text-enel-navy text-4xl md:text-6xl">
            {titulo}
          </RevealTexto>
          <RevealTexto
            as="p"
            variante="parrafo"
            className="mt-4 text-base leading-relaxed font-medium text-neutral-600 md:text-lg"
          >
            {intro}
          </RevealTexto>
        </Reveal>

        <motion.div
          className="flex w-full flex-col items-center pt-4 pb-10"
          variants={cardsPadre}
          initial={reduce ? false : 'hidden'}
          whileInView={reduce ? undefined : 'show'}
          viewport={{ once: true, amount: 0.15 }}
        >
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
              <img
                src={gerente.foto || gerentePorDefecto.foto}
                alt={`${gerente.nombre}, ${gerente.cargo}`}
                className="group-hover:ring-enel-blue/30 mx-auto h-28 w-28 rounded-full object-cover shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.08)] ring-4 ring-black/[0.04] transition-all duration-300"
                loading="lazy"
              />
              <p className="text-enel-navy mt-5 text-xs font-bold tracking-[0.12em] uppercase">
                {gerente.cargo}
              </p>
              <h3 className="mt-1 text-[13px] font-medium text-neutral-500">{gerente.nombre}</h3>
              <p className="text-enel-blue mt-3 text-[13px] font-semibold">Saber más</p>
            </div>
          </motion.div>

          <div className="bg-enel-fog/80 h-8 w-0.5" />
          <div className="bg-enel-fog/80 hidden h-10 w-0.5 lg:block" />

          <motion.div
            variants={cardsSubgerencias}
            className="relative mt-8 grid w-full max-w-5xl grid-cols-1 justify-items-center gap-4 px-4 sm:grid-cols-2 lg:mt-0 lg:grid-cols-4"
          >
            <div className="bg-enel-fog/80 absolute top-0 bottom-0 left-1/2 -z-10 block w-0.5 -translate-x-1/2 sm:hidden" />
            <div
              aria-hidden="true"
              className="bg-enel-fog/80 absolute top-0 right-[calc(12.5%_+_0.375rem)] left-[calc(12.5%_+_0.375rem)] hidden h-0.5 lg:block"
            />

            {subgerencias.map((sub, idx) => (
              <motion.div
                key={`${sub.sigla}-${idx}`}
                variants={cardHija}
                className="relative flex w-full flex-col items-center"
              >
                <div className="bg-enel-fog/80 hidden h-8 w-0.5 lg:block" />
                <TarjetaArea
                  titulo={sub.nombre}
                  sigla={sub.sigla}
                  responsable={sub.subgerente}
                  foto={fotoDeSubgerencia(sub, idx)}
                  delay={idx * 0.35}
                  onClick={() => {
                    setNodoAbierto(idx)
                    setStaffActivo(null)
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

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
          <p className="text-enel-blue text-sm font-bold tracking-[0.2em] uppercase">
            {staffTitulo}
          </p>
          <RevealTexto
            as="p"
            variante="parrafo"
            className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed font-medium text-neutral-500"
          >
            {staffIntro}
          </RevealTexto>
        </Reveal>

        <motion.div
          variants={cardsStaff}
          initial={reduce ? false : 'hidden'}
          whileInView={reduce ? undefined : 'show'}
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {areasStaff.map((area, idx) => (
            <motion.div key={`${area.nombre}-${idx}`} variants={cardStaff} className="flex">
              <TarjetaArea
                titulo={area.nombre}
                responsable={area.lider}
                foto={fotoDeAreaStaff(area, idx)}
                delay={idx * 0.35}
                onClick={() => {
                  setStaffActivo(idx)
                  setNodoAbierto(null)
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {subAbierta && (
          <ModalLider
            onCerrar={() => setNodoAbierto(null)}
            badge="Subgerencia"
            cargo={`Subgerencia ${subAbierta.sigla}`}
            nombre={subAbierta.subgerente}
            organizacion={subAbierta.nombre}
            foto={fotoDeSubgerencia(subAbierta, nodoAbierto ?? 0)}
            proposito={subAbierta.proposito}
            areas={(subAbierta.areas ?? []).map((area) => area.nombre)}
            videoUrl={subAbierta.video_youtube_url}
            videoTitulo={subAbierta.video_titulo}
            onVideo={setVideoActivo}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoActivo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-lenis-prevent
            className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/85 p-4 py-10 backdrop-blur-sm"
            onClick={() => setVideoActivo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
              className="relative w-full max-w-4xl shrink-0 overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950/90 p-3 shadow-2xl backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setVideoActivo(null)}
                className="absolute top-4 right-4 z-50 rounded-full bg-black/60 p-2 text-white/70 transition hover:bg-black/80 hover:text-white"
                aria-label="Cerrar video"
              >
                <X size={20} weight="bold" />
              </button>

              <div className="p-3 text-left">
                <h3 className="mb-3 truncate pr-12 text-base text-white">{videoActivo.titulo}</h3>
                <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-black">
                  <VideoEmbed youtubeUrl={videoActivo.url} titulo={videoActivo.titulo} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ggAbierto && (
          <ModalLider
            onCerrar={() => setGgAbierto(false)}
            badge="Liderazgo"
            cargo={gerente.cargo}
            nombre={gerente.nombre}
            organizacion={gerente.empresa}
            foto={gerente.foto || gerentePorDefecto.foto}
            proposito={gerente.proposito}
            videoUrl={gerente.video_youtube_url}
            videoTitulo={gerente.video_titulo}
            onVideo={setVideoActivo}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {areaActiva && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-lenis-prevent
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4 py-10 backdrop-blur-sm"
            onClick={() => setStaffActivo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
              className="relative w-full max-w-xl shrink-0 overflow-hidden rounded-[28px] border border-white/60 bg-white/85 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setStaffActivo(null)}
                className="absolute top-4 right-4 z-50 rounded-full bg-black/[0.04] p-2 text-neutral-500 transition hover:bg-black/[0.08] hover:text-neutral-800"
                aria-label="Cerrar detalle"
              >
                <X size={18} weight="bold" />
              </button>

              <div className="mt-2 text-left">
                <div className="flex items-center gap-4 pr-10">
                  <img
                    src={fotoDeAreaStaff(areaActiva, staffActivo ?? 0)}
                    alt={`${areaActiva.lider}, ${areaActiva.nombre}`}
                    className="h-16 w-16 shrink-0 rounded-full object-cover shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_4px_rgba(0,0,0,0.06)] ring-4 ring-black/[0.04]"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <span className="text-enel-blue bg-enel-blue/[0.08] inline-flex items-center rounded-full px-3.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase">
                      Área Staff
                    </span>
                    <h3 className="text-enel-navy mt-2 text-2xl leading-tight">
                      {areaActiva.nombre}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-neutral-500">{areaActiva.lider}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl border border-black/[0.04] bg-white/60 p-5 shadow-xs">
                  <ul className="space-y-3">
                    {(areaActiva.detalle ?? []).map((parrafo, indice) => (
                      <li
                        key={`${indice}-${parrafo.texto}`}
                        className="flex gap-2.5 text-sm leading-relaxed font-medium text-neutral-600"
                      >
                        <span className="bg-enel-blue mt-[0.55rem] size-1.5 shrink-0 rounded-full" />
                        <span>{parrafo.texto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionShell>
  )
}
