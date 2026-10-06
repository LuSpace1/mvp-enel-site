import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { MapPin } from '@phosphor-icons/react'

import { Reveal } from '@/components/ui/Reveal'
import { RevealTexto } from '@/components/ui/RevealTexto'
import { MapaConcesion } from '@/components/mapa/MapaConcesion'
import { ProveedorMapa } from '@/components/mapa/ProveedorMapa'
import { useMapaConcesion } from '@/components/mapa/contexto'
import { COMUNAS_SVG } from '@/lib/data/comunas-svg'
import { ZONA_POR_ID } from '@/lib/data/zonas'

function ChipEstado() {
  const { zonaActiva, zonaHover, comunaActiva, modoRayosX } = useMapaConcesion()
  const comuna = comunaActiva ? COMUNAS_SVG.find((c) => c.id === comunaActiva) : undefined
  const zona = zonaActiva
    ? ZONA_POR_ID.get(zonaActiva)
    : zonaHover
      ? ZONA_POR_ID.get(zonaHover)
      : undefined
  const clave = modoRayosX
    ? `rayos-${zonaActiva ?? zonaHover ?? 'global'}`
    : (comuna?.nombreCorto ?? zonaHover ?? zonaActiva ?? 'inicial')

  return (
    <div className="text-enel-navy mx-auto mt-8 flex max-w-xs items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white/70 px-4 py-3 text-sm shadow-sm backdrop-blur-sm">
      <MapPin size={18} className="text-enel-blue shrink-0" weight="fill" />
      <AnimatePresence mode="wait">
        <motion.span
          key={clave}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {modoRayosX ? (
            <span className="text-enel-navy font-bold">
              {zonaActiva && zona ? `Rayos X · Zona ${zona.nombre}` : 'Vista infográfica · Rayos X'}
            </span>
          ) : comuna ? (
            <span className="text-enel-navy font-bold">{comuna.nombreCorto}</span>
          ) : zona ? (
            <span className="text-enel-navy flex items-center gap-2 font-bold">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: zona.color }}
              />
              Zona {zona.nombre}
              {zonaActiva ? <> · {zona.comunas.length} comunas</> : null}
            </span>
          ) : (
            <span className="font-serif text-neutral-500 italic">
              Pasa el cursor para descubrir…
            </span>
          )}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export function VistaConcesionSection() {
  const reduce = useReducedMotion() ?? false

  return (
    <section id="concesion-detalle" className="relative overflow-hidden bg-white py-14 md:py-20">
      <ProveedorMapa>
        <motion.div
          className="relative z-10 mx-auto w-full max-w-5xl px-5 md:px-8 lg:max-w-6xl"
          initial={reduce ? false : { opacity: 0, y: -100 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ type: 'spring', stiffness: 35, damping: 14, mass: 1.4 }}
        >
          <div className="flex flex-col items-center text-center">
            <Reveal y={0} className="mb-10 max-w-2xl">
              <p className="text-enel-blue text-sm font-bold tracking-[0.2em] uppercase">
                Concesión en detalle
              </p>
              <RevealTexto
                as="h2"
                className="text-enel-navy mt-4 text-3xl font-bold tracking-tight md:text-5xl"
              >
                Nuestro territorio,{' '}
                <span className="text-enel-blue font-serif italic">trazo a trazo</span>
              </RevealTexto>
              <RevealTexto
                as="p"
                variante="parrafo"
                className="mt-5 text-base leading-relaxed font-medium text-neutral-600"
              >
                Organizamos nuestra red en 4 secciones de concesión —Chacabuco, Cordillera, Pacífico
                y Florida— que cubren gran parte de la Región Metropolitana. Toca una zona para
                explorar sus comunas y activa el Modo Rayos X para ver las cifras clave de un
                vistazo.
              </RevealTexto>

              <ChipEstado />
            </Reveal>

            <Reveal delay={0.1} className="mx-auto w-full max-w-3xl lg:max-w-4xl">
              <div className="relative overflow-hidden rounded-3xl border border-neutral-300 bg-[#faf8f1] shadow-[0_24px_70px_-24px_rgba(10,25,47,0.45)]">
                <MapaConcesion />
              </div>
            </Reveal>
          </div>
        </motion.div>
      </ProveedorMapa>
    </section>
  )
}
