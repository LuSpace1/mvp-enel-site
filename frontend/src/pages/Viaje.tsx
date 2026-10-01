import { lazy, memo, Suspense, useEffect, useRef } from 'react'
import { Nav } from '@/components/Nav'
import { Indice } from '@/components/Indice'
import { PasoHeader } from '@/components/PasoPantalla'
import { useAuthStore } from '@/store/useAuthStore'
import { useVideosStore } from '@/store/useVideosStore'
import { useViajeStore } from '@/store/useViajeStore'
import { PASOS_VIAJE } from '@/lib/data/viaje'

const StormIntro = lazy(() =>
  import('@/components/StormIntro').then((modulo) => ({ default: modulo.StormIntro })),
)
const PortadaDelViaje = lazy(() =>
  import('@/components/PortadaDelViaje').then((modulo) => ({ default: modulo.PortadaDelViaje })),
)
const HistoriaSection = lazy(() =>
  import('@/sections/HistoriaSection').then((modulo) => ({ default: modulo.HistoriaSection })),
)
const CulturaSection = lazy(() =>
  import('@/sections/CulturaSection').then((modulo) => ({ default: modulo.CulturaSection })),
)
const OrganigramaSection = lazy(() =>
  import('@/sections/OrganigramaSection').then((modulo) => ({
    default: modulo.OrganigramaSection,
  })),
)
const VistaConcesionSection = lazy(() =>
  import('@/sections/VistaConcesionSection').then((modulo) => ({
    default: modulo.VistaConcesionSection,
  })),
)
const CadenaValorSection = lazy(() =>
  import('@/sections/CadenaValorSection').then((modulo) => ({
    default: modulo.CadenaValorSection,
  })),
)
const PoliticasISOSection = lazy(() =>
  import('@/sections/PoliticasISOSection').then((modulo) => ({
    default: modulo.PoliticasISOSection,
  })),
)
const GaleriasSection = lazy(() =>
  import('@/sections/GaleriasSection').then((modulo) => ({
    default: modulo.GaleriasSection,
  })),
)
const PreguntasFrecuentesSection = lazy(() =>
  import('@/sections/PreguntasFrecuentesSection').then((modulo) => ({
    default: modulo.PreguntasFrecuentesSection,
  })),
)
const CierreSection = lazy(() =>
  import('@/sections/CierreSection').then((modulo) => ({ default: modulo.CierreSection })),
)
const Footer = lazy(() =>
  import('@/sections/CierreSection').then((modulo) => ({ default: modulo.Footer })),
)

const PASO_POR_ID = new Map(PASOS_VIAJE.map((paso) => [paso.id, paso]))

const Secciones = memo(function Secciones() {
  const navegar = useViajeStore((estado) => estado.navegar)
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return

    const nodos = contenedor.querySelectorAll<HTMLElement>('[data-seccion]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.seccion
            if (id) navegar(id)
          }
        })
      },
      { root: null, rootMargin: '-40% 0px -60% 0px' },
    )

    nodos.forEach((nodo) => observer.observe(nodo))
    return () => observer.disconnect()
  }, [navegar])

  return (
    <div ref={contenedorRef}>
      <div data-seccion="portada" className="scroll-mt-32">
        <PortadaDelViaje />
      </div>

      <div data-seccion="historia" className="scroll-mt-32">
        <HistoriaSection />
      </div>

      <div data-seccion="cultura" className="scroll-mt-32">
        <CulturaSection />
      </div>

      <div data-seccion="organigrama" className="scroll-mt-32">
        <OrganigramaSection />
      </div>

      <div data-seccion="concesion-detalle" className="scroll-mt-32">
        <VistaConcesionSection />
      </div>

      <div data-seccion="cadena" className="scroll-mt-32">
        <CadenaValorSection />
      </div>

      <div data-seccion="politicas" className="scroll-mt-32">
        <PoliticasISOSection />
      </div>

      <div data-seccion="galerias" className="scroll-mt-32">
        <GaleriasSection />
      </div>

      <div data-seccion="cierre" className="scroll-mt-32">
        <CierreSection />
      </div>

      <div data-seccion="faq" className="scroll-mt-32">
        <PreguntasFrecuentesSection />
        <Footer />
      </div>
    </div>
  )
})

export function Viaje() {
  const pasoActual = useViajeStore((estado) => estado.pasoActual)
  const initAnonymous = useAuthStore((estado) => estado.initAnonymous)
  const cargarVideos = useVideosStore((estado) => estado.cargar)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    void initAnonymous()
    void cargarVideos()
  }, [initAnonymous, cargarVideos])

  const paso = PASO_POR_ID.get(pasoActual)

  return (
    <div className="text-enel-navy min-h-svh bg-white font-sans">
      <Nav />
      <Indice />
      <Suspense fallback={null}>
        <StormIntro />
      </Suspense>
      <main className="min-h-dvh pt-16">
        {paso && <PasoHeader paso={paso} />}
        <Suspense fallback={null}>
          <Secciones />
        </Suspense>
      </main>
    </div>
  )
}
