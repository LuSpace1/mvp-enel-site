import { lazy, memo, Suspense, useEffect } from 'react'
import { Toaster } from 'sonner'
import { Nav } from '@/components/Nav'
import { Indice } from '@/components/Indice'
import { PasoHeader } from '@/components/PasoPantalla'
import { useAuthStore } from '@/store/useAuthStore'
import { useVideosStore } from '@/store/useVideosStore'
import { useViajeStore } from '@/store/useViajeStore'
import { PASOS_VIAJE } from '@/lib/data/viaje'
import { STORM_INTRO_CLAVE } from '@/lib/intro'

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

let introVistoCache: boolean | null = null

function introYaVisto(): boolean {
  if (introVistoCache === null) {
    try {
      introVistoCache = sessionStorage.getItem(STORM_INTRO_CLAVE) !== null
    } catch {
      introVistoCache = false
    }
  }
  return introVistoCache
}

const SectionObserver = memo(function SectionObserver({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  const navegar = useViajeStore((estado) => estado.navegar)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navegar(id)
          }
        })
      },
      { root: null, rootMargin: '-40% 0px -60% 0px' },
    )

    const nodo = document.getElementById(id)
    if (nodo) observer.observe(nodo)
    return () => observer.disconnect()
  }, [id, navegar])

  return <div className="scroll-mt-32">{children}</div>
})

const Secciones = memo(function Secciones() {
  return (
    <>
      <SectionObserver id="portada">
        <PortadaDelViaje />
      </SectionObserver>

      <SectionObserver id="historia">
        <HistoriaSection />
      </SectionObserver>

      <SectionObserver id="cultura">
        <CulturaSection />
      </SectionObserver>

      <SectionObserver id="organigrama">
        <OrganigramaSection />
      </SectionObserver>

      <SectionObserver id="concesion-detalle">
        <VistaConcesionSection />
      </SectionObserver>

      <SectionObserver id="cadena">
        <CadenaValorSection />
      </SectionObserver>

      <SectionObserver id="politicas">
        <PoliticasISOSection />
      </SectionObserver>

      <SectionObserver id="galerias">
        <GaleriasSection />
      </SectionObserver>

      <SectionObserver id="cierre">
        <CierreSection />
      </SectionObserver>

      <SectionObserver id="faq">
        <PreguntasFrecuentesSection />
        <Footer />
      </SectionObserver>
    </>
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
    <div className="text-enel-navy min-h-svh bg-[#f0eee6] font-sans">
      <Nav />
      <Indice />
      {(!import.meta.env.PROD || !introYaVisto()) && (
        <Suspense fallback={null}>
          <StormIntro />
        </Suspense>
      )}
      <main className="min-h-dvh pt-16">
        {paso && <PasoHeader paso={paso} />}
        <Suspense fallback={null}>
          <Secciones />
        </Suspense>
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  )
}
