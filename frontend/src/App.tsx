import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { preconnect, prefetchDNS } from 'react-dom'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'

import { RutaProtegida } from '@/components/cms/RutaProtegida'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/store/useAuthStore'

preconnect('https://www.youtube.com')
preconnect('https://i.ytimg.com')
prefetchDNS('https://picsum.photos')

const Viaje = lazy(() => import('@/pages/Viaje').then((modulo) => ({ default: modulo.Viaje })))
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

function CargandoRuta() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="text-muted-foreground flex min-h-svh items-center justify-center text-sm"
    >
      Cargando…
    </div>
  )
}

function conCarga(elemento: ReactNode) {
  return <Suspense fallback={<CargandoRuta />}>{elemento}</Suspense>
}

const router = createBrowserRouter([
  { path: '/', element: conCarga(<Viaje />) },
  { path: '/cms/login', element: conCarga(<CmsLogin />) },
  {
    path: '/cms/preview',
    element: conCarga(
      <RutaProtegida>
        <CmsPreview />
      </RutaProtegida>,
    ),
  },
  {
    path: '/cms',
    element: conCarga(
      <RutaProtegida>
        <CmsLayout />
      </RutaProtegida>,
    ),
    children: [
      { index: true, element: conCarga(<CmsEditor />) },
      { path: 'orden', element: conCarga(<CmsOrden />) },
      { path: 'revisiones', element: conCarga(<CmsRevisiones />) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function App() {
  const access = useAuthStore((estado) => estado.access)
  const actualizarPerfil = useAuthStore((estado) => estado.actualizarPerfil)

  // Refresca roles/capacidades al abrir la app para reflejar cambios de CompAC
  // sin obligar a cerrar sesión.
  useEffect(() => {
    if (access) void actualizarPerfil()
  }, [access, actualizarPerfil])

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}
