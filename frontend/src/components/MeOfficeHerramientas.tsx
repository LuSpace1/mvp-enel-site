import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useReducedMotion } from 'motion/react'

import { MarcaMe } from '@/components/MarcasMe'
import { useLista } from '@/lib/cms/contenido'
import { herramientasMeOffice } from '@/lib/data/meOffice'
import { track } from '@/lib/analytics'

interface HerramientaCms {
  clave: string
  nombre: string
  nota?: string
  descripcion: string
  url: string
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
  const herramientasCms = useLista<HerramientaCms>('galerias', 'herramientas', [])
  const herramientas = herramientasCms.length
    ? herramientasCms.map((herramienta) => ({
        id: herramienta.clave,
        nombre: herramienta.nombre,
        nota: herramienta.nota || undefined,
        descripcion: herramienta.descripcion,
        url: herramienta.url,
      }))
    : herramientasMeOffice

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
      <div
        ref={carruselRef}
        className="no-scrollbar flex min-w-0 snap-x snap-mandatory scroll-px-1 gap-5 overflow-x-auto px-1 py-3"
      >
        {herramientas.map((herramienta) => (
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
            className="group block w-[86%] shrink-0 snap-start sm:w-[58%] md:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <div className="bg-enel-navy/[0.05] ring-enel-navy/10 group-hover:ring-enel-blue/25 h-full rounded-[1.75rem] p-1.5 ring-1 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1">
              <div className="bg-enel-navy flex h-full min-h-[17rem] flex-col rounded-[calc(1.75rem-0.375rem)] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors duration-500 group-hover:bg-[#1d1d1b]">
                <MarcaMe
                  id={herramienta.id}
                  size={46}
                  className="group-hover:text-enel-blue-light text-white/90 transition-colors duration-500"
                />

                <div className="mt-7">
                  <h4 className="text-[1.35rem] leading-tight text-white">{herramienta.nombre}</h4>
                  {herramienta.nota && (
                    <p className="text-enel-blue-light/80 mt-1.5 text-[10px] font-semibold tracking-[0.14em] uppercase">
                      {herramienta.nota}
                    </p>
                  )}
                  <p className="mt-2.5 max-w-[27ch] text-sm leading-relaxed text-white/55">
                    {herramienta.descripcion}
                  </p>
                </div>
                <div className="mt-auto pt-8">
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.06] py-1.5 pr-1.5 pl-4 text-[11px] font-bold tracking-[0.14em] text-white/75 uppercase transition-colors duration-300 group-hover:bg-white/10 group-hover:text-white">
                    Acceder
                    <span className="bg-enel-blue flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight size={13} weight="bold" />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
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
