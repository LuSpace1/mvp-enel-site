import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/store/useAuthStore'

import logoEnel from '@/assets/icons/Enel_Group_logo.svg'

function VerificandoAcceso() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-background flex min-h-svh flex-col items-center justify-center gap-4"
    >
      <img src={logoEnel} alt="Enel" className="h-8 w-auto opacity-70" />
      <p className="text-muted-foreground text-sm">Verificando acceso…</p>
    </div>
  )
}

/**
 * Puerta del portal: sin sesion valida no se renderiza el recorrido.
 *
 * Verifica el token contra el backend antes de mostrar el sitio, para que un
 * token vencido no deje pasar sin pedir credenciales.
 */
export function RutaPortal({ children }: { children: ReactNode }) {
  const access = useAuthStore((estado) => estado.access)
  const status = useAuthStore((estado) => estado.status)
  const actualizarPerfil = useAuthStore((estado) => estado.actualizarPerfil)
  const [verificando, setVerificando] = useState(Boolean(access))

  useEffect(() => {
    let vigente = true
    if (!access) {
      setVerificando(false)
      return
    }
    setVerificando(true)
    void actualizarPerfil().finally(() => {
      if (vigente) setVerificando(false)
    })
    return () => {
      vigente = false
    }
  }, [access, actualizarPerfil])

  if (!access) return <Navigate to="/acceso" replace />
  if (verificando || status === 'loading') return <VerificandoAcceso />
  if (status === 'error') return <Navigate to="/acceso" replace />
  return <>{children}</>
}
