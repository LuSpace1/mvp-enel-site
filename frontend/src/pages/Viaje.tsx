import { lazy, memo, Suspense, useEffect, useRef } from 'react'

import { Nav } from '@/components/Nav'
import { SmoothScroll } from '@/components/SmoothScroll'
import { Indice } from '@/components/Indice'
import { StormIntro } from '@/components/StormIntro'
import { IdentificacionBubble } from '@/components/IdentificacionBubble'
import { FeedbackBubble } from '@/components/FeedbackBubble'
import {
  cerrarSeccion,
  configurarSecciones,
  detenerAnalitica,
  establecerSeccion,
  iniciarAnalitica,
  marcarCompletado,
  paginaVista,
  seccionVista,
} from '@/lib/analytics'
import { useContenidoStore, useNavegacion } from '@/lib/cms/contenido'
import { componenteDeSeccion } from '@/lib/cms/secciones'
import { useViajeStore } from '@/store/useViajeStore'

const Footer = lazy(() =>
  import('@/sections/CierreSection').then((modulo) => ({ default: modulo.Footer })),
)

const Secciones = memo(function Secciones() {
  const navegar = useViajeStore((estado) => estado.navegar)
  const navegacion = useNavegacion()
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    configurarSecciones(navegacion.length)
  }, [navegacion.length])

  useEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor) return

    const nodos = contenedor.querySelectorAll<HTMLElement>('[data-seccion]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.seccion
            if (id) {
              navegar(id)
              establecerSeccion(id)
              seccionVista(id)
              if (id === 'cierre') marcarCompletado()
            }
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
  const marcarIntroTerminada = useViajeStore((estado) => estado.marcarIntroTerminada)
  const pasoActual = useViajeStore((estado) => estado.pasoActual)
  const seccionAnterior = useRef<{ id: string; desde: number } | null>(null)

  useEffect(() => {
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    void cargarContenido()
  }, [cargarContenido])

  // La vista previa del CMS no debe contaminar las metricas del portal.
  useEffect(() => {
    if (preview) return
    iniciarAnalitica()
    paginaVista()
    return () => detenerAnalitica()
  }, [preview])

  // Tiempo por seccion: se cierra al pasar a la siguiente.
  useEffect(() => {
    if (preview) return
    const ahora = performance.now()
    const anterior = seccionAnterior.current
    if (anterior && anterior.id !== pasoActual) {
      cerrarSeccion(anterior.id, Math.round(ahora - anterior.desde))
    }
    seccionAnterior.current = { id: pasoActual, desde: ahora }
    return () => {
      const abierta = seccionAnterior.current
      if (abierta) {
        cerrarSeccion(abierta.id, Math.round(performance.now() - abierta.desde))
        seccionAnterior.current = null
      }
    }
  }, [pasoActual, preview])

  // En la vista previa no existe la intro animada, así que la portada debe
  // revelarse de inmediato en lugar de esperar al final del intro.
  useEffect(() => {
    if (!preview) return
    marcarIntroTerminada()
    return () => useViajeStore.setState({ introTerminada: false })
  }, [preview, marcarIntroTerminada])

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
      {!preview && (
        <>
          <IdentificacionBubble />
          <FeedbackBubble />
        </>
      )}
    </div>
  )
}
