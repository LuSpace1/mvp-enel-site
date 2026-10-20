import { create } from 'zustand'

import { PASO_INICIAL } from '@/lib/data/viaje'

interface EstadoViaje {
  pasoActual: string
  introTerminada: boolean
  navegar: (paso: string) => void
  marcarIntroTerminada: () => void
}

export const useViajeStore = create<EstadoViaje>()((set) => ({
  pasoActual: PASO_INICIAL,
  introTerminada: false,
  navegar: (paso) => set({ pasoActual: paso }),
  marcarIntroTerminada: () => set({ introTerminada: true }),
}))
