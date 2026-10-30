import { create } from 'zustand'

import type { CmsRevision, CmsRevisionDetail } from '@/types/cms'

export interface ResumenCms {
  draft: CmsRevisionDetail | null
  published: CmsRevision | null
  hasUnpublishedChanges: boolean
}

interface EstadoEditor {
  dirty: boolean
  resumen: ResumenCms | null
  setDirty: (dirty: boolean) => void
  setResumen: (resumen: ResumenCms) => void
  actualizarDraft: (draft: CmsRevisionDetail | null, hasUnpublishedChanges?: boolean) => void
  limpiarResumen: () => void
}

/** Estado mínimo compartido entre las pantallas y la barra lateral del CMS. */
export const useEstadoEditor = create<EstadoEditor>((set) => ({
  dirty: false,
  resumen: null,
  setDirty: (dirty) => set({ dirty }),
  setResumen: (resumen) => set({ resumen }),
  actualizarDraft: (draft, hasUnpublishedChanges) =>
    set((estado) => ({
      resumen: estado.resumen
        ? {
            ...estado.resumen,
            draft,
            hasUnpublishedChanges: hasUnpublishedChanges ?? estado.resumen.hasUnpublishedChanges,
          }
        : estado.resumen,
    })),
  limpiarResumen: () => set({ resumen: null }),
}))
