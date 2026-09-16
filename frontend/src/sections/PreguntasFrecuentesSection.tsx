import { useState, useCallback } from 'react'
import {
  ArrowRight,
  Question,
  IdentificationBadge,
  Laptop,
  ShieldCheck,
  CalendarCheck,
  Buildings,
  type Icon,
} from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { clsx } from 'clsx'

interface PreguntaFrecuente {
  id: string
  titulo: string
  resumen: string
  detalle: string
  icono: Icon
  estilo: { icono: string; dot: string }
  etiquetas: string[]
}

const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  {
    id: 'onboarding-primeros-pasos',
    titulo: '¿Cuáles son mis primeros pasos al integrarme a Enel?',
    resumen: 'Proceso inicial de inducción, accesos y coordinación con tu jefatura.',
    detalle:
      'Durante tu primera semana completarás la inducción institucional, la entrega y configuración de tus credenciales de acceso, y una reunión de alineamiento con tu equipo de trabajo. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    icono: IdentificationBadge,
    estilo: {
      icono: 'bg-enel-rojo/10 text-enel-rojo group-hover:bg-enel-rojo group-hover:text-white',
      dot: 'bg-enel-rojo',
    },
    etiquetas: ['Inducción', 'Credenciales', 'Equipo'],
  },
  {
    id: 'herramientas-sistemas',
    titulo: '¿Cómo accedo a las plataformas y herramientas corporativas?',
    resumen: 'VPN, correo institucional, intranet y software de gestión.',
    detalle:
      'Tus accesos a SAP, Salesforce, Microsoft 365 y la VPN corporativa se configuran a través del portal de TI y autenticación multifactor. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
    icono: Laptop,
    estilo: {
      icono: 'bg-enel-naranja/10 text-enel-naranja group-hover:bg-enel-naranja group-hover:text-white',
      dot: 'bg-enel-naranja',
    },
    etiquetas: ['Sistemas', 'TI', 'Accesos'],
  },
  {
    id: 'seguridad-sostenibilidad',
    titulo: '¿Cuáles son los protocolos de seguridad y prevención de riesgos?',
    resumen: 'Normativas HSEQ, uso de EPP y políticas de autocuidado.',
    detalle:
      'La seguridad es nuestro valor intransable. Todos los colaboradores deben conocer los protocolos de seguridad en instalaciones operativas y oficinas corporativas. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
    icono: ShieldCheck,
    estilo: {
      icono: 'bg-enel-verde/10 text-enel-verde group-hover:bg-enel-verde group-hover:text-white',
      dot: 'bg-enel-verde',
    },
    etiquetas: ['HSEQ', 'Prevención', 'Seguridad'],
  },
  {
    id: 'beneficios-jornada',
    titulo: '¿Cómo funciona la modalidad de trabajo y los beneficios?',
    resumen: 'Políticas de flexibilidad laboral, vacaciones y bienestar.',
    detalle:
      'Contamos con esquemas híbridos según el rol, seguro complementario de salud, convenios y programas continuos de bienestar. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada.',
    icono: CalendarCheck,
    estilo: {
      icono: 'bg-enel-celeste/10 text-enel-celeste group-hover:bg-enel-celeste group-hover:text-white',
      dot: 'bg-enel-celeste',
    },
    etiquetas: ['Bienestar', 'Flexibilidad', 'Beneficios'],
  },
  {
    id: 'infraestructura-sedes',
    titulo: '¿Dónde están ubicadas nuestras sedes y centros de operaciones?',
    resumen: 'Edificio corporativo MUT, bases técnicas y subestaciones.',
    detalle:
      'Nuestras oficinas centrales se encuentran en el Mercado Urbano Tobalaba (MUT) junto a una amplia red de bases de operación técnica en toda el área de concesión. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.',
    icono: Buildings,
    estilo: {
      icono: 'bg-enel-blue/10 text-enel-blue group-hover:bg-enel-blue group-hover:text-white',
      dot: 'bg-enel-blue',
    },
    etiquetas: ['Sedes', 'MUT', 'Operaciones'],
  },
]

function PreguntaFila({
  item,
  indice,
  abierta,
  ultima,
  onToggle,
}: {
  item: PreguntaFrecuente
  indice: number
  abierta: boolean
  ultima: boolean
  onToggle: () => void
}) {
  const Icono = item.icono ?? Question
  const estilo = item.estilo

  return (
    <article
      className={clsx(
        'group rounded-xl px-3 transition-colors duration-300 ease-out md:px-4',
        !ultima && 'border-enel-navy/10 border-b',
        abierta ? 'bg-white' : 'hover:bg-white/60',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierta}
        aria-controls={`faq-detalle-${item.id}`}
        data-analytics-component="faq"
        data-analytics-faq={item.id}
        className="grid w-full cursor-pointer grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 py-4 text-left md:grid-cols-[2.5rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] md:gap-x-6 md:py-5"
      >
        <span className="text-xs font-mono font-medium tracking-tight text-neutral-400 tabular-nums">
          {String(indice + 1).padStart(2, '0')}
        </span>

        <span className="min-w-0">
          <h3 className="text-enel-navy text-base font-semibold tracking-tight md:text-lg">
            {item.titulo}
          </h3>
          <p className="mt-0.5 text-xs leading-snug text-neutral-500 md:hidden">
            {item.resumen}
          </p>
        </span>

        <p className="hidden max-w-sm text-xs md:text-sm leading-snug text-neutral-500 md:block">
          {item.resumen}
        </p>

        <span
          className={clsx(
            'border-enel-navy/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white transition-transform duration-300 ease-out group-hover:translate-x-0.5',
            abierta && 'rotate-90',
          )}
        >
          <ArrowRight size={14} weight="bold" className="text-enel-navy" />
        </span>
      </button>

      <div
        id={`faq-detalle-${item.id}`}
        className={clsx(
          'grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          abierta ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden" aria-hidden={!abierta}>
          <div className="pr-2 pb-6 pl-8 md:pb-8 md:pl-12">
            <div className="flex items-start gap-3.5">
              <span
                className={clsx(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                  estilo.icono,
                )}
              >
                <Icono size={16} weight="regular" />
              </span>
              <div>
                <p className="max-w-2xl text-xs md:text-sm leading-relaxed text-neutral-600">
                  {item.detalle}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {item.etiquetas.map((etiqueta) => (
                    <li
                      key={etiqueta}
                      className="border-enel-navy/10 flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-medium text-neutral-600"
                    >
                      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', estilo.dot)} />
                      {etiqueta}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function PreguntasFrecuentesSection() {
  const reduce = useReducedMotion()
  const [activa, setActiva] = useState<string | null>(null)

  const toggle = useCallback((id: string) => {
    setActiva((prev) => (prev === id ? null : id))
  }, [])

  return (
    <section id="faq" className="relative overflow-hidden bg-[#f0eee6] py-12 md:py-20">
      <motion.div
        className="relative z-10 mx-auto w-full max-w-5xl px-5 md:px-8"
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-10">
          <div className="max-w-2xl">
            <h2 className="text-enel-navy text-2xl font-semibold tracking-tight md:text-4xl">
              Preguntas Frecuentes
            </h2>
            <p className="mt-2 max-w-[65ch] text-xs md:text-sm leading-relaxed text-neutral-600">
              Respuestas directas a las consultas habituales sobre tu integración y el funcionamiento de la compañía.
            </p>
          </div>
        </div>

        <div className="mt-4 md:mt-6">
          {PREGUNTAS_FRECUENTES.map((item, indice) => (
            <motion.div
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: indice * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <PreguntaFila
                item={item}
                indice={indice}
                abierta={activa === item.id}
                ultima={indice === PREGUNTAS_FRECUENTES.length - 1}
                onToggle={() => toggle(item.id)}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
