import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  ArrowSquareOut,
  ClockCounterClockwise,
  Files,
  ListNumbers,
  SignOut,
} from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

import logoEnel from '@/assets/icons/Enel_Group_logo.svg'

const ENLACES = [
  { to: '/cms', label: 'Contenido', icon: Files, end: true },
  { to: '/cms/orden', label: 'Orden de secciones', icon: ListNumbers, end: false },
  { to: '/cms/revisiones', label: 'Historial', icon: ClockCounterClockwise, end: false },
]

export function CmsLayout() {
  const user = useAuthStore((estado) => estado.user)
  const logout = useAuthStore((estado) => estado.logout)
  const navigate = useNavigate()
  const puedePublicar = Boolean(user?.capabilities.can_publish_cms)
  const rol = puedePublicar ? 'Publicador' : 'Editor'

  function cerrarSesion() {
    logout()
    navigate('/cms/login', { replace: true })
  }

  return (
    <div className="bg-enel-mist/40 flex min-h-svh flex-col lg:flex-row">
      <aside className="bg-background flex w-full shrink-0 flex-col gap-5 border-b p-4 lg:min-h-svh lg:w-64 lg:border-r lg:border-b-0 lg:p-5">
        <div className="flex items-center gap-2.5">
          <img src={logoEnel} alt="Enel" className="h-8 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="text-enel-navy text-sm font-semibold">Enel Distribución</span>
            <span className="text-[10px] font-medium tracking-[0.16em] text-neutral-500 uppercase">
              CMS del portal
            </span>
          </span>
        </div>

        <div className="bg-muted/60 rounded-lg p-3">
          <p className="truncate text-sm font-semibold">{user?.full_name || user?.username}</p>
          <p className="text-muted-foreground truncate text-xs">{user?.username}</p>
          <Badge variant={puedePublicar ? 'default' : 'secondary'} className="mt-2">
            {rol}
          </Badge>
        </div>

        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {ENLACES.map((enlace) => {
            const Icono = enlace.icon
            return (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.end}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-enel-blue/10 text-enel-blue'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icono className="size-4" />
                {enlace.label}
              </NavLink>
            )
          })}
        </nav>

        <Separator className="lg:mt-auto" />

        <div className="flex flex-row gap-2 lg:flex-col">
          <Button asChild variant="outline" size="sm">
            <a href="/" target="_blank" rel="noreferrer">
              <ArrowSquareOut data-icon="inline-start" />
              Ver sitio
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={cerrarSesion}>
            <SignOut data-icon="inline-start" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
