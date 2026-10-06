import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from '@phosphor-icons/react'

import { Reveal } from '@/components/ui/Reveal'
import { RevealTexto } from '@/components/ui/RevealTexto'
import { Parallax } from '@/components/ui/Parallax'
import { SectionShell } from '@/components/ui/SectionShell'
import { CHILE_MARKER, CHILE_PATH, CHILE_VIEWBOX } from '@/lib/data/chile-svg'

import fotoHistoria from '@/assets/images/enel_oficinas.jpg'

const lineasDeNegocio = [
  'Enel Green Power Chile',
  'Enel Generación Chile',
  'Enel Distribución',
  'Enel X Chile',
]

const statCards = [
  {
    statVal: '14,5',
    statUnit: 'TWh',
    statDesc: 'Energía distribuida al año',
    color: 'text-[#d64200]',
  },
  {
    statVal: '18.248',
    statUnit: 'km',
    statDesc: 'Red de distribución eléctrica',
    color: 'text-[#0555fa]',
  },
  {
    statVal: '33',
    statUnit: '',
    statDesc: 'Comunas en nuestra zona de concesión',
    color: 'text-[#008556]',
  },
  {
    statVal: '2',
    statUnit: 'M',
    statDesc: 'Clientes en la Región Metropolitana',
    color: 'text-[#eb0052]',
  },
]

export function HistoriaSection() {
  const reduce = useReducedMotion()

  return (
    <SectionShell id="historia" className="relative overflow-hidden bg-white">
      <motion.div
        className="relative overflow-hidden rounded-[2rem] shadow-[0_30px_90px_rgba(74,32,8,0.28)] md:rounded-[2.5rem]"
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.98 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ type: 'spring', stiffness: 40, damping: 16, mass: 1.2 }}
      >
        <img
          src={fotoHistoria}
          alt="Oficinas de Enel"
          loading="lazy"
          decoding="async"
          className="h-[540px] w-full object-cover object-center md:h-[600px]"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#2a0f03]/85 via-[#6d2c10]/45 to-[#a8461b]/15"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#2a0f03]/40 via-transparent to-transparent"
        />

        <div className="absolute inset-y-0 left-0 flex w-full items-center bg-[#8f3a16]/72 md:w-[56%]">
          <div className="w-full max-w-[560px] px-7 py-12 md:px-14 md:py-16">
            <span className="text-[11px] font-bold tracking-[0.28em] text-white/75 uppercase">
              Memoria Anual 2025
            </span>

            <RevealTexto
              as="h2"
              className="mt-4 text-4xl leading-[1.02] font-semibold tracking-tight text-white md:text-6xl"
            >
              Grupo Enel
            </RevealTexto>

            <Reveal delay={0.15} y={18}>
              <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/85 md:text-[15px]">
                <RevealTexto as="p" variante="parrafo">
                  Enel es una empresa multinacional de energía y uno de los principales operadores
                  integrados globales en los sectores de la energía y el gas.
                </RevealTexto>
                <RevealTexto as="p" variante="parrafo" delay={0.1}>
                  Está presente en 27 países de los 5 continentes, con una capacidad instalada de
                  91,8 GW y más de 69 millones de consumidores finales en todo el mundo.
                </RevealTexto>
                <RevealTexto as="p" variante="parrafo" delay={0.2}>
                  En Chile, el Grupo opera a través de sus filiales Enel Green Power, Enel
                  Generación, Enel Distribución y Enel X, impulsando la transición energética del
                  país.
                </RevealTexto>
              </div>

              <a
                href="https://www.enel.cl/es/conoce-enel/grupo-enel.html"
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-white px-6 text-sm font-semibold text-[#8f3a16] shadow-lg transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
              >
                Si quieres saber más, haz clic aquí
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8f3a16]/10 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#8f3a16]/15">
                  <ArrowUpRight size={13} weight="bold" />
                </span>
              </a>
            </Reveal>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="mt-12 overflow-hidden rounded-[2rem] px-6 py-10 shadow-[0_24px_70px_rgba(74,32,8,0.14)] md:mt-16 md:rounded-[2.5rem] md:px-14 md:py-16"
        style={{
          backgroundImage:
            'radial-gradient(125% 135% at 85% 6%, #fdeee2 0%, #f7cfb3 44%, #ef9f70 100%)',
        }}
        initial={reduce ? false : { opacity: 0, y: 40 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ type: 'spring', stiffness: 36, damping: 16, mass: 1.3 }}
      >
        <span className="text-[11px] font-bold tracking-[0.28em] text-[#8f3a16] uppercase">
          Enel Distribución Chile en cifras
        </span>

        <div className="mt-6 grid grid-cols-2 gap-y-8 md:mt-8 md:grid-cols-4">
          {statCards.map((stat, indice) => (
            <motion.div
              key={stat.statDesc}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: indice * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={
                indice > 0 ? 'border-l border-[#141413]/15 px-4 md:px-6' : 'px-4 md:px-6 md:pr-6'
              }
            >
              <p
                className={`text-3xl leading-none font-extrabold tracking-tight md:text-4xl ${stat.color}`}
              >
                {stat.statVal}
                {stat.statUnit ? (
                  <span className="ml-1 text-xl md:text-2xl">{stat.statUnit}</span>
                ) : null}
              </p>
              <p className="text-enel-navy mt-2 text-[11px] font-bold tracking-wider uppercase">
                {stat.statDesc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid items-center gap-10 md:mt-16 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-8">
          <div className="hidden md:block" />

          <div className="flex justify-center">
            <Parallax distancia={18}>
              <motion.div
                className="relative"
                initial={reduce ? false : { opacity: 0, scale: 0.94 }}
                whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <svg
                  viewBox={CHILE_VIEWBOX}
                  role="img"
                  aria-label="Mapa de Chile"
                  className="block h-[400px] w-auto drop-shadow-[0_18px_30px_rgba(143,58,22,0.35)] sm:h-[480px] md:h-[540px]"
                >
                  <path d={CHILE_PATH} fill="#ffffff" />
                </svg>

                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${(CHILE_MARKER.x / 174.81) * 100}%`,
                    top: `${(CHILE_MARKER.y / 1000) * 100}%`,
                  }}
                >
                  {!reduce && (
                    <motion.span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-[#e2231a]"
                      animate={{ scale: [1, 3.2], opacity: [0.55, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <span className="relative block h-3 w-3 rounded-full bg-[#e2231a] ring-2 ring-white" />

                  <span className="text-enel-navy absolute top-1/2 right-full mr-3 -translate-y-1/2 rounded-full bg-white/85 px-3 py-1 text-[10px] font-bold tracking-wide whitespace-nowrap uppercase shadow-sm backdrop-blur-sm">
                    Región Metropolitana
                  </span>
                </div>
              </motion.div>
            </Parallax>
          </div>

          <div className="max-w-sm md:pl-4">
            <RevealTexto
              as="p"
              variante="parrafo"
              className="text-enel-navy text-lg leading-snug font-semibold md:text-xl"
            >
              Una empresa impulsada por la generación de valor, líder en electrificación energética
              en Chile.
            </RevealTexto>

            <div className="mt-6">
              <span className="text-[10px] font-bold tracking-[0.24em] text-[#8f3a16] uppercase">
                Líneas de negocio
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {lineasDeNegocio.map((filial) => (
                  <span
                    key={filial}
                    className="text-enel-navy rounded-full border border-[#141413]/10 bg-white/70 px-3.5 py-1.5 text-xs font-medium shadow-sm"
                  >
                    {filial}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </SectionShell>
  )
}
