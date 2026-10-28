import { lazy, Suspense, useEffect } from 'react'
import { preconnect, prefetchDNS } from 'react-dom'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { RutaProtegida } from '@/components/cms/RutaProtegida'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/store/useAuthStore'
import { Viaje } from '@/pages/Viaje'

preconnect('https://www.youtube.com')
preconnect('https://i.ytimg.com')
prefetchDNS('https://picsum.photos')

const CmsLogin = lazy(() =>
  import('@/pages/cms/CmsLogin').then((modulo) => ({ default: modulo.CmsLogin })),
)
const CmsLayout = lazy(() =>
  import('@/components/cms/CmsLayout').then((modulo) => ({ default: modulo.CmsLayout })),
)
const CmsEditor = lazy(() =>
  import('@/pages/cms/CmsEditor').then((modulo) => ({ default: modulo.CmsEditor })),
)
const CmsOrden = lazy(() =>
  import('@/pages/cms/CmsOrden').then((modulo) => ({ default: modulo.CmsOrden })),
)
const CmsRevisiones = lazy(() =>
  import('@/pages/cms/CmsRevisiones').then((modulo) => ({
    default: modulo.CmsRevisiones,
  })),
)
const CmsPreview = lazy(() =>
  import('@/pages/cms/CmsPreview').then((modulo) => ({ default: modulo.CmsPreview })),
)

export function App() {
  const access = useAuthStore((estado) => estado.access)
  const actualizarPerfil = useAuthStore((estado) => estado.actualizarPerfil)

  // Refresca roles/capacidades al abrir la app para reflejar cambios de CompAC
  // sin obligar a cerrar sesión.
  useEffect(() => {
    if (access) void actualizarPerfil()
  }, [access, actualizarPerfil])

  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Viaje />} />
          <Route path="/cms/login" element={<CmsLogin />} />
          <Route
            path="/cms/preview"
            element={
              <RutaProtegida>
                <CmsPreview />
              </RutaProtegida>
            }
          />
          <Route
            path="/cms"
            element={
              <RutaProtegida>
                <CmsLayout />
              </RutaProtegida>
            }
          >
            <Route index element={<CmsEditor />} />
            <Route path="orden" element={<CmsOrden />} />
            <Route path="revisiones" element={<CmsRevisiones />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  )
}
