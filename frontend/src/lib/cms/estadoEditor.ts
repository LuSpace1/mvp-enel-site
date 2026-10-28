import { create } from 'zustand'

interface EstadoEditor {
  dirty: boolean
  setDirty: (dirty: boolean) => void
}

/** Estado mínimo para avisar de cambios sin guardar al navegar dentro del CMS. */
export const useEstadoEditor = create<EstadoEditor>((set) => ({
  dirty: false,
  setDirty: (dirty) => set({ dirty }),
}))
