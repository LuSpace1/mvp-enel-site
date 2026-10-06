import { obtenerLenis } from '@/lib/smoothScroll'

const ALTURA_HEADER = 128

export function desplazarASeccion(id: string, duracion = 1.3) {
  const elemento = document.getElementById(id)
  if (!elemento) return
  const top = elemento.getBoundingClientRect().top + window.scrollY
  const espacioVisible = window.innerHeight - ALTURA_HEADER
  const extraCentrado = Math.max(0, (espacioVisible - elemento.offsetHeight) / 2)
  const destino = Math.max(0, top - ALTURA_HEADER - extraCentrado)

  const lenis = obtenerLenis()
  if (lenis) {
    lenis.scrollTo(destino, { duration: duracion, easing: (t) => 1 - Math.pow(1 - t, 3) })
    return
  }
  window.scrollTo({ top: destino, behavior: 'smooth' })
}
