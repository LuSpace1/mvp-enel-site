import { create } from 'zustand'

import { PASO_INICIAL } from '@/lib/data/viaje'

interface EstadoViaje {
  pasoActual: string
  navegar: (paso: string) => void
}

export const useViajeStore = create<EstadoViaje>()((set) => ({
  pasoActual: PASO_INICIAL,
  navegar: (paso) => set({ pasoActual: paso }),
}))
