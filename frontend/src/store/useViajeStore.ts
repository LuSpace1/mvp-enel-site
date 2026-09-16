import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { PASO_INICIAL, PASOS_VIAJE } from '@/lib/data/viaje'

interface EstadoViaje {
  pasoActual: string
  navegar: (paso: string) => void
}

const IDS_VALIDOS = new Set<string>([PASO_INICIAL, ...PASOS_VIAJE.map((paso) => paso.id)])

export const useViajeStore = create<EstadoViaje>()(
  persist(
    (set) => ({
      pasoActual: PASO_INICIAL,
      navegar: (paso) => set({ pasoActual: paso }),
    }),
    {
      name: 'enel-viaje',
      version: 3,
      merge: (persistido, estadoActual) => {
        const datos = persistido as Partial<EstadoViaje> | undefined
        return {
          ...estadoActual,
          pasoActual:
            datos && datos.pasoActual && IDS_VALIDOS.has(datos.pasoActual)
              ? datos.pasoActual
              : PASO_INICIAL,
        }
      },
    },
  ),
)
