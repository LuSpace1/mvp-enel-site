import Lenis from 'lenis'

let instancia: Lenis | null = null

export function obtenerLenis() {
  return instancia
}

export function crearLenis() {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  })
  instancia = lenis
  return lenis
}

export function destruirLenis() {
  instancia?.destroy()
  instancia = null
}
