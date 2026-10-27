import { lazy, memo, Suspense, useEffect, useRef } from 'react'

import { Nav } from '@/components/Nav'
import { SmoothScroll } from '@/components/SmoothScroll'
import { Indice } from '@/components/Indice'
import { StormIntro } from '@/components/StormIntro'
import { useContenidoStore, useNavegacion } from '@/lib/cms/contenido'
import { componenteDeSeccion } from '@/lib/cms/secciones'
import { useVideosStore } from '@/store/useVideosStore'
import { useViajeStore } from '@/store/useViajeStore'

const Footer = lazy(() =>
  import('@/sections/CierreSection').then((modulo) => ({ default: modulo.Footer })),
)

const Secciones = memo(function Secciones() {
  const navegar = useViajeStore((estado) => estado.navegar)
  const navegacion = useNavegacion()
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
  }, [navegar, navegacion])

  return (
    <div ref={contenedorRef}>
      {navegacion.map(({ id }) => {
        const Componente = componenteDeSeccion(id)
        if (!Componente) return null
        return (
          <div key={id} data-seccion={id} className="scroll-mt-32">
            <Componente />
          </div>
        )
      })}
      <Footer />
    </div>
  )
})

export function Viaje({ preview = false }: { preview?: boolean }) {
  const cargarContenido = useContenidoStore((estado) => estado.cargar)
  const cargarVideos = useVideosStore((estado) => estado.cargar)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    void cargarContenido()
    void cargarVideos()
  }, [cargarContenido, cargarVideos])

  return (
    <div className="text-enel-navy font-body min-h-svh bg-white">
      <SmoothScroll />
      <Nav />
      <Indice />
      {!preview && <StormIntro />}
      <main className={preview ? 'min-h-dvh' : 'min-h-dvh pt-16'}>
        <Suspense fallback={null}>
          <Secciones />
        </Suspense>
      </main>
    </div>
  )
}
