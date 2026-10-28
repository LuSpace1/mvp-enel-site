import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/useAuthStore'

export function RutaProtegida({ children }: { children: ReactNode }) {
  const access = useAuthStore((estado) => estado.access)
  const user = useAuthStore((estado) => estado.user)
  const location = useLocation()

  const puedeGestionar = Boolean(
    user?.capabilities.can_manage_cms || user?.capabilities.can_edit_cms,
  )

  if (!access || !puedeGestionar) {
    return (
      <Navigate
        to="/cms/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <>{children}</>
}
