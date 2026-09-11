import {
  ArrowUp,
  ArrowUpRight,
  BookOpenText,
  HardHat,
  UsersThree,
  Lightbulb,
  Lifebuoy,
  Compass,
} from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'

import { Reveal } from '@/components/ui/Reveal'
import { track } from '@/lib/analytics'

import fotoMUT from '@/assets/images/MUT-02.jpg'

const RECURSOS = [
  {
    icono: BookOpenText,
    titulo: 'Manual del Empleado',
    descripcion: 'Políticas, beneficios y procedimientos para nuevos ingresados.',
    url: 'https://enelchile.sharepoint.com/sites/manual-empleado',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icono: HardHat,
    titulo: 'Normas de Seguridad',
    descripcion: 'Protocolos de seguridad industrial y prevención de riesgos.',
    url: 'https://enelchile.sharepoint.com/sites/normas-seguridad',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icono: UsersThree,
    titulo: 'Directorio de Equipos',
    descripcion: 'Contactos clave de cada área y gerencia.',
    url: 'https://enelchile.sharepoint.com/sites/directorio',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icono: Lightbulb,
    titulo: 'Capacitaciones',
    descripcion: 'Cursos obligatorios, certificaciones y desarrollo.',
    url: 'https://enelchile.sharepoint.com/sites/capacitaciones',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icono: Lifebuoy,
    titulo: 'Centro de Ayuda',
    descripcion: 'FAQs, soporte técnico y canales de atención.',
    url: 'https://enelchile.sharepoint.com/sites/ayuda',
    color: 'from-enel-pink to-rose-500',
  },
  {
    icono: Compass,
    titulo: 'Innovación',
    descripcion: 'Proyectos estratégicos y transformación digital.',
    url: 'https://enelchile.sharepoint.com/sites/innovacion',
    color: 'from-enel-blue to-red-600',
  },
]

export function CierreSection() {
  const reduce = useReducedMotion()

  return (
    <section id="cierre" className="relative overflow-hidden bg-[#f0eee6] py-24 md:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage: 'radial-gradient(rgba(10, 25, 47, 0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-enel-blue/8 absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full blur-[120px]" />
        <div className="bg-enel-pink/8 absolute -right-40 -bottom-40 h-[30rem] w-[30rem] rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="relative z-10 mx-auto w-full max-w-6xl px-5 md:px-8"
        initial={reduce ? false : { opacity: 0, y: 40 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
      >
        <Reveal>
          <div className="max-w-3xl">
            <span className="text-enel-blue border-enel-blue/20 bg-enel-blue/5 rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-[0.2em] uppercase">
              Sigue explorando
            </span>
            <h2 className="text-enel-navy mt-6 text-4xl leading-[1.05] font-semibold tracking-tight md:text-6xl">
              Bienvenido al equipo <span className="texto-gradiente-azul">Enel</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-500 md:text-lg">
              Si es tu primer día, aquí tienes todo lo que necesitas para arrancar con el pie
              derecho. Si ya eres parte de la familia, usa estos recursos para reforzar lo que sabes
              y seguir creciendo.
            </p>
          </div>
        </Reveal>

        <div className="mt-20 flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="w-full lg:w-[42%]">
            <div className="flex justify-center">
              <motion.div
                className="relative w-full max-w-lg"
                initial={reduce ? false : { opacity: 0, y: 40 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1, margin: '0px 0px -50px 0px' }}
                transition={{ type: 'spring', stiffness: 40, damping: 14, mass: 1.5 }}
              >
                <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(10,25,47,0.18)]">
                  <img
                    src={fotoMUT}
                    alt="Enel Distribución"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="from-enel-navy/15 absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />
                </div>

                <div
                  aria-hidden="true"
                  className="bg-enel-navy/10 mx-auto mt-5 h-4 w-[60%] rounded-full blur-lg"
                />
              </motion.div>
            </div>
          </div>

          <div className="w-full lg:w-[58%]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {RECURSOS.map((recurso, indice) => (
                <motion.a
                  key={recurso.titulo}
                  href={recurso.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track('cierre.recurso', { recurso: recurso.titulo })}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.45,
                    delay: 0.15 + indice * 0.06,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                  className="group hover:ring-enel-blue/20 relative flex flex-col rounded-2xl bg-black/[0.03] p-[2px] ring-1 ring-black/5 transition-all duration-300 hover:shadow-[0_16px_48px_rgba(235,0,83,0.08)]"
                  style={{
                    animation: 'float-subtle 4s ease-in-out infinite',
                    animationDelay: `${indice * 0.4}s`,
                  }}
                >
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1rem-2px)] bg-white p-5">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
                      style={{
                        backgroundImage:
                          'radial-gradient(rgba(10, 25, 47, 0.35) 1px, transparent 1px)',
                        backgroundSize: '12px 12px',
                      }}
                    />

                    <div className="relative z-10 flex flex-1 items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${recurso.color} text-white shadow-md`}
                      >
                        <recurso.icono size={20} weight="duotone" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-enel-navy text-sm font-semibold tracking-tight">
                          {recurso.titulo}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                          {recurso.descripcion}
                        </p>
                      </div>
                    </div>

                    <span className="text-enel-blue relative z-10 mt-auto inline-flex items-center gap-1 pt-3 text-[10px] font-bold tracking-[0.15em] uppercase opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      Abrir
                      <ArrowUpRight
                        size={12}
                        weight="bold"
                        className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        <Reveal delay={0.2}>
          <div className="mt-24 flex flex-col items-center gap-8">
            <p className="text-sm text-neutral-400 italic">
              "La energía de un equipo se multiplica cuando todos trabajan con el mismo propósito."
            </p>
            <a
              href="#portada"
              onClick={() => track('cierre.volver')}
              className="group bg-enel-navy hover:bg-enel-blue inline-flex h-12 items-center gap-3 rounded-full px-7 text-sm font-semibold text-white shadow-lg transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
            >
              <ArrowUp size={16} weight="bold" />
              Volver al inicio
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-white/15">
                <ArrowUpRight size={13} weight="bold" />
              </span>
            </a>
          </div>
        </Reveal>
      </motion.div>
    </section>
  )
}

const REDES_SOCIALES = [
  {
    nombre: 'X (Twitter)',
    url: 'https://x.com/EnelChile',
    icono: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    nombre: 'Facebook',
    url: 'https://www.facebook.com/EnelChile',
    icono: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    nombre: 'YouTube',
    url: 'https://www.youtube.com/channel/UC61CgI8IXFMqjGtXwlUGGaA',
    icono: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    nombre: 'LinkedIn',
    url: 'https://www.linkedin.com/company/enelchile/',
    icono: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    nombre: 'Instagram',
    url: 'https://www.instagram.com/enelchile/',
    icono: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
      </svg>
    ),
  },
]

export function Footer() {
  return (
    <footer className="bg-enel-navy border-t border-white/[0.06] py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-5 text-center md:flex-row md:px-8 md:text-left">
        <p className="text-xs font-medium text-white/70">Enel Distribución Chile</p>

        <div className="flex items-center gap-3">
          {REDES_SOCIALES.map((red) => (
            <a
              key={red.nombre}
              href={red.url}
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/40 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-white/[0.12] hover:text-white"
              aria-label={red.nombre}
            >
              {red.icono}
            </a>
          ))}
        </div>

        <p className="text-[10px] tracking-wide text-white/30 uppercase">Prototipo MVP</p>
      </div>
    </footer>
  )
}
