import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useReducedMotion } from 'motion/react'

import { herramientasMeOffice } from '@/lib/data/meOffice'
import { track } from '@/lib/analytics'

const INICIALES: Record<string, string> = {
  'portal-me': 'PM',
  'tell-me': 'TM',
  'me-learning': 'ML',
  'me-office': 'MO',
  'next-move': 'NM',
}

/** Marca tipográfica propia de cada herramienta, sin iconografía genérica. */
function MarcaHerramienta({ id }: { id: string }) {
  return (
    <span className="bg-enel-blue flex h-14 w-14 items-center justify-center rounded-2xl text-[15px] font-bold tracking-[0.02em] text-white">
      {INICIALES[id] ?? 'ME'}
    </span>
  )
}

/**
 * Carrusel horizontal de accesos directos a las herramientas ME. Las flechas
 * viven fuera del riel para no tapar las cards y la barra inferior indica el
 * avance del desplazamiento.
 */
export function MeOfficeHerramientas() {
  const carruselRef = useRef<HTMLDivElement>(null)
  const [puedeAtras, setPuedeAtras] = useState(false)
  const [puedeAdelante, setPuedeAdelante] = useState(true)
  const [indicador, setIndicador] = useState({ ancho: 1, desplazamiento: 0 })
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = carruselRef.current
    if (!el) return

    let raf = 0
    const actualizar = () => {
      raf = 0
      const maximo = el.scrollWidth - el.clientWidth
      const total = el.scrollWidth || 1
      setPuedeAtras(el.scrollLeft > 8)
      setPuedeAdelante(maximo > 8 && el.scrollLeft < maximo - 8)
      setIndicador({
        ancho: Math.min(1, el.clientWidth / total),
        desplazamiento: el.scrollLeft / total,
      })
    }

    const alDesplazar = () => {
      if (!raf) raf = requestAnimationFrame(actualizar)
    }

    actualizar()
    el.addEventListener('scroll', alDesplazar, { passive: true })
    window.addEventListener('resize', alDesplazar)
    return () => {
      el.removeEventListener('scroll', alDesplazar)
      window.removeEventListener('resize', alDesplazar)
      cancelAnimationFrame(raf)
    }
  }, [])

  function desplazar(direccion: -1 | 1) {
    const el = carruselRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const paso = (card?.offsetWidth ?? el.clientWidth / 3) + 20
    el.scrollBy({ left: paso * direccion, behavior: reduce ? 'auto' : 'smooth' })
    track('meoffice.accesos.desplazar', { direccion })
  }

  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-6">
        <div>
          <span className="text-enel-blue text-[11px] font-bold tracking-[0.18em] uppercase">
            Accesos directos
          </span>
          <h3 className="text-enel-navy mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            Explora el ecosistema ME
          </h3>
        </div>
      </div>

      <div className="mt-8">
        <div
          ref={carruselRef}
          className="no-scrollbar flex min-w-0 snap-x snap-mandatory scroll-px-1 gap-5 overflow-x-auto px-1 py-3"
        >
          {herramientasMeOffice.map((herramienta) => (
            <a
              key={herramienta.id}
              href={herramienta.url || '#'}
              target={herramienta.url ? '_blank' : undefined}
              rel={herramienta.url ? 'noreferrer' : undefined}
              onClick={(e) => {
                if (!herramienta.url) {
                  e.preventDefault()
                  return
                }
                track('meoffice.acceso.abrir', { herramienta: herramienta.nombre })
              }}
              className="group border-enel-navy/[0.08] hover:border-enel-blue/30 flex min-h-[17rem] w-[86%] shrink-0 snap-start flex-col rounded-[1.75rem] border bg-white p-7 shadow-[0_14px_40px_-30px_rgba(10,25,47,0.45)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(10,25,47,0.4)] sm:w-[58%] md:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
            >
              <MarcaHerramienta id={herramienta.id} />

              <div className="mt-8 flex flex-1 flex-col">
                <span
                  aria-hidden="true"
                  className="bg-enel-pink mb-4 block h-1 w-10 rounded-full"
                />
                <h4 className="text-enel-navy text-2xl font-bold tracking-tight">
                  {herramienta.nombre}
                </h4>
                <p className="mt-2.5 max-w-[27ch] text-sm leading-relaxed text-neutral-500">
                  {herramienta.descripcion}
                </p>
                <span className="text-enel-blue mt-auto inline-flex items-center gap-2 pt-6 text-[11px] font-bold tracking-[0.16em] uppercase">
                  Abrir herramienta
                  <ArrowUpRight
                    size={15}
                    weight="bold"
                    className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => desplazar(-1)}
          disabled={!puedeAtras}
          aria-label="Ver accesos anteriores"
          className="border-enel-navy/10 text-enel-navy hover:border-enel-blue/30 hover:text-enel-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white shadow-[0_10px_30px_rgba(10,25,47,0.16)] transition-all duration-300 hover:scale-105 disabled:pointer-events-none disabled:opacity-30 md:h-11 md:w-11"
        >
          <CaretLeft size={18} weight="bold" />
        </button>

        <div
          aria-hidden="true"
          className="bg-enel-navy/10 relative h-0.5 flex-1 overflow-hidden rounded-full"
        >
          <div
            className="bg-enel-blue/70 absolute inset-y-0 rounded-full transition-all duration-150 ease-out"
            style={{
              width: `${indicador.ancho * 100}%`,
              left: `${indicador.desplazamiento * 100}%`,
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => desplazar(1)}
          disabled={!puedeAdelante}
          aria-label="Ver más accesos"
          className="border-enel-navy/10 text-enel-navy hover:border-enel-blue/30 hover:text-enel-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white shadow-[0_10px_30px_rgba(10,25,47,0.16)] transition-all duration-300 hover:scale-105 disabled:pointer-events-none disabled:opacity-30 md:h-11 md:w-11"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>
    </div>
  )
}
