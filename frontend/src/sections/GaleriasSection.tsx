import { motion, useReducedMotion } from 'motion/react'

import { Reveal } from '@/components/ui/Reveal'
import { RevealTexto } from '@/components/ui/RevealTexto'
import { SectionShell } from '@/components/ui/SectionShell'
import { MeOfficeHerramientas } from '@/components/MeOfficeHerramientas'
import { useCampo } from '@/lib/cms/contenido'

import meOfficeLogo from '@/assets/images/me_office_logo.png'

export function GaleriasSection() {
  const reduce = useReducedMotion()
  const titulo = useCampo('galerias', 'titulo', 'Herramientas ME')
  const intro = useCampo(
    'galerias',
    'intro',
    'Explora las herramientas y plataformas que facilitan tu día a día, accede a información, servicios y oportunidades para tu desarrollo.',
  )

  return (
    <SectionShell id="galerias" className="relative overflow-hidden bg-white">
      <motion.div
        className="relative z-10 w-full"
        initial={reduce ? false : { opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
        whileInView={reduce ? undefined : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1] }}
      >
        <Reveal y={0} className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <img
            src={meOfficeLogo}
            alt="Logo ME"
            className="3xl:h-16 h-14 w-auto drop-shadow-sm"
            width={112}
            height={123}
            loading="lazy"
            decoding="async"
          />
          <RevealTexto as="h2" className="text-enel-navy mt-4 text-4xl md:text-6xl">
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

        <Reveal delay={0.1} className="3xl:mt-16 mt-12">
          <MeOfficeHerramientas />
        </Reveal>
      </motion.div>
    </SectionShell>
  )
}
