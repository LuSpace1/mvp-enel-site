import { ArrowUpRight } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'

import { RevealTexto } from '@/components/ui/RevealTexto'
import { SectionShell } from '@/components/ui/SectionShell'
import { useCampo } from '@/lib/cms/contenido'
import { track } from '@/lib/analytics'

import portalMe from '@/assets/images/portal-me.png'

export function PersonasSection() {
  const reduce = useReducedMotion()
  const titulo = useCampo('personas', 'titulo', 'Mantente al día')
  const intro = useCampo(
    'personas',
    'intro',
    'La energía que mueve a Chile también vive en nuestra intranet: novedades, personas y recursos para tu día a día.',
  )
  const ctaTexto = useCampo('personas', 'cta_texto', 'Accede a nuestra intranet')
  const ctaUrl = useCampo(
    'personas',
    'cta_url',
    'https://enelcom.sharepoint.com/sites/globalintranet/SitePages/es/Home.aspx',
  )
  const imagen = useCampo('personas', 'imagen', '')
  const imagenAlt = useCampo('personas', 'imagen_alt', 'Vista del portal ME de Enel')
  const imagenPie = useCampo('personas', 'imagen_pie', 'Intranet')

  return (
    <SectionShell id="personas" className="relative overflow-hidden bg-white">
      <div className="grid items-center gap-10 px-2 md:grid-cols-2 md:gap-16 md:px-6">
        <motion.figure
          className="group relative mx-auto w-full max-w-lg rounded-md border border-neutral-200 bg-white p-3 pb-12 shadow-[0_28px_60px_rgba(0,0,0,0.16)]"
          initial={reduce ? false : { opacity: 0, y: 32, rotate: -3 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0, rotate: -1.5 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          whileHover={reduce ? {} : { rotate: 0, y: -8 }}
        >
          <div className="bg-enel-mist relative aspect-[800/398] overflow-hidden rounded-sm shadow-inner">
            <img
              src={imagen || portalMe}
              alt={imagenAlt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
            />
          </div>
          <figcaption className="text-enel-navy absolute right-0 bottom-4 left-0 flex items-baseline justify-center px-3">
            <span className="text-lg font-semibold">{imagenPie}</span>
          </figcaption>
        </motion.figure>

        <div className="max-w-xl">
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
          {ctaTexto && ctaUrl && (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => track('personas.intranet')}
              className="group bg-enel-navy hover:bg-enel-blue 3xl:mt-10 mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3.5 text-sm font-bold tracking-wide text-white uppercase shadow-[0_12px_28px_rgba(10,25,47,0.25)] transition-all duration-300 hover:-translate-y-0.5"
            >
              {ctaTexto}
              <ArrowUpRight
                size={18}
                weight="bold"
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
          )}
        </div>
      </div>
    </SectionShell>
  )
}
