import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useBlocker, useNavigate } from 'react-router-dom'
import {
  ArrowSquareOut,
  ClockCounterClockwise,
  Files,
  Info,
  ListNumbers,
  SidebarSimple,
  SignOut,
  WarningCircle,
} from '@phosphor-icons/react'

import { CmsComoFunciona } from '@/components/cms/CmsComoFunciona'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useEstadoEditor } from '@/lib/cms/estadoEditor'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

import logoEnel from '@/assets/icons/Enel_Group_logo.svg'

const ENLACES = [
  { to: '/cms', label: 'Contenido', icon: Files, end: true },
  { to: '/cms/orden', label: 'Orden', icon: ListNumbers, end: false },
  { to: '/cms/revisiones', label: 'Versiones', icon: ClockCounterClockwise, end: false },
]

const CLAVE_COLAPSADO = 'cms:sidebar-colapsado'

function iniciales(nombre: string | undefined): string {
  if (!nombre) return 'EN'
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

export function CmsLayout() {
  const user = useAuthStore((estado) => estado.user)
  const logout = useAuthStore((estado) => estado.logout)
  const navigate = useNavigate()
  const nombre = user?.full_name || user?.username || 'Usuario'
  const rol = user?.capabilities.can_manage_cms ? 'Administrador' : 'Editor'
  const dirty = useEstadoEditor((estado) => estado.dirty)
  const limpiarResumen = useEstadoEditor((estado) => estado.limpiarResumen)
  const [colapsado, setColapsado] = useState(() => {
    try {
      return window.localStorage.getItem(CLAVE_COLAPSADO) === '1'
    } catch {
      return false
    }
  })
  const [ayudaAbierta, setAyudaAbierta] = useState(false)
  const [logoutPendiente, setLogoutPendiente] = useState(false)
  const [permitirSalida, setPermitirSalida] = useState(false)
  const blocker = useBlocker(dirty && !permitirSalida)

  useEffect(() => {
    try {
      window.localStorage.setItem(CLAVE_COLAPSADO, colapsado ? '1' : '0')
    } catch {
      // La preferencia es cosmética; si el navegador bloquea el storage, seguimos.
    }
  }, [colapsado])

  // Evita cerrar o recargar la pestaña perdiendo cambios sin avisar.
  useEffect(() => {
    if (!dirty) return
    function avisar(evento: BeforeUnloadEvent) {
      evento.preventDefault()
      evento.returnValue = ''
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [dirty])

  useEffect(() => {
    if (!permitirSalida) return
    limpiarResumen()
    logout()
    navigate('/cms/login', { replace: true })
  }, [limpiarResumen, permitirSalida, logout, navigate])

  function abrirGuia() {
    setAyudaAbierta(true)
  }

  function pedirCerrarSesion() {
    if (dirty) {
      setLogoutPendiente(true)
      return
    }
    limpiarResumen()
    logout()
    navigate('/cms/login', { replace: true })
  }

  function confirmarLogout() {
    setLogoutPendiente(false)
    setPermitirSalida(true)
  }

  return (
    <div className="bg-background flex min-h-svh flex-col lg:flex-row">
      <a
        href="#contenido-cms"
        className="focus:bg-background focus:ring-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2"
      >
        Saltar al contenido
      </a>

      <aside
        aria-label="Barra lateral del CMS"
        className={cn(
          'bg-sidebar text-sidebar-foreground border-sidebar-border relative w-full shrink-0 border-b lg:sticky lg:top-0 lg:z-30 lg:flex lg:h-svh lg:flex-col lg:border-r lg:border-b-0 lg:transition-[width] lg:duration-200 lg:ease-out motion-reduce:lg:transition-none',
          colapsado ? 'lg:w-[76px]' : 'lg:w-[268px]',
        )}
      >
        <div className="from-primary/[0.04] pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b to-transparent" />

        <div
          className={cn(
            'relative flex items-center justify-between gap-3 px-4 py-4 lg:px-5 lg:py-5',
            colapsado && 'lg:justify-center lg:px-2',
          )}
        >
          <Link
            to="/cms"
            aria-label="Ir al inicio del CMS"
            className="focus-visible:ring-ring flex min-w-0 items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:outline-none"
          >
            <img
              src={logoEnel}
              alt="Enel"
              className={cn('w-auto shrink-0', colapsado ? 'h-6 lg:h-5' : 'h-6')}
            />
            <span
              className={cn(
                'flex min-w-0 flex-col leading-tight transition-opacity duration-150',
                colapsado && 'lg:hidden',
              )}
            >
              <span className="text-enel-navy truncate text-sm font-semibold tracking-tight">
                Portal Experiencia DX
              </span>
              <span className="text-muted-foreground truncate text-[9px] font-medium tracking-[0.16em] uppercase">
                Gestión de contenido
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-1 lg:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={abrirGuia}
              aria-label="Cómo funciona el CMS"
              title="Cómo funciona el CMS"
            >
              <Info className="size-[18px]" />
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <a href="/" target="_blank" rel="noreferrer" aria-label="Ver sitio publicado">
                <ArrowSquareOut className="size-[18px]" />
              </a>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={pedirCerrarSesion}
              aria-label="Cerrar sesión"
            >
              <SignOut className="size-[18px]" />
            </Button>
          </div>
        </div>

        <nav
          id="cms-nav"
          aria-label="Navegación del CMS"
          className="relative flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-3 lg:pb-0"
        >
          <div
            className={cn(
              'hidden items-center justify-between gap-2 px-3 pt-1 pb-2 lg:flex',
              colapsado && 'justify-center px-0',
            )}
          >
            {!colapsado && (
              <p className="text-muted-foreground/70 text-[10px] font-semibold tracking-[0.2em] uppercase">
                Espacio de trabajo
              </p>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setColapsado((valor) => !valor)}
              aria-label={colapsado ? 'Expandir menú lateral' : 'Contraer menú lateral'}
              aria-expanded={!colapsado}
              aria-controls="cms-nav"
              title={colapsado ? 'Expandir menú' : 'Contraer menú'}
            >
              <SidebarSimple className="size-[18px]" />
            </Button>
          </div>

          {ENLACES.map((enlace) => {
            const Icono = enlace.icon
            return (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.end}
                className={({ isActive }) =>
                  cn(
                    'group focus-visible:ring-ring relative flex h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none lg:h-10',
                    colapsado && 'lg:justify-center lg:px-0',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="bg-primary absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-full"
                      />
                    )}
                    <Icono
                      aria-hidden="true"
                      className="size-[18px] shrink-0"
                      weight={isActive ? 'duotone' : 'regular'}
                    />
                    <span className={cn('truncate', colapsado && 'lg:sr-only')}>
                      {enlace.label}
                    </span>
                    {colapsado && (
                      <span
                        role="tooltip"
                        aria-hidden="true"
                        className="bg-enel-navy pointer-events-none absolute top-1/2 left-full z-50 ml-2 hidden -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-[0_14px_32px_-14px_rgba(10,25,47,0.7)] ring-1 ring-white/10 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:block"
                      >
                        {enlace.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div
          className={cn(
            'relative mt-auto hidden px-4 pb-5 lg:block',
            colapsado && 'lg:px-2 lg:pb-3',
          )}
        >
          {colapsado ? (
            <div className="flex flex-col items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={abrirGuia}
                aria-label="Cómo funciona el CMS"
                title="Cómo funciona el CMS"
              >
                <Info className="size-[18px]" />
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Ver el sitio publicado"
                  title="Ver el sitio publicado"
                >
                  <ArrowSquareOut className="size-[18px]" />
                </a>
              </Button>
              <span
                className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full text-[11px] font-semibold"
                title={`${nombre} · ${rol}`}
                aria-hidden="true"
              >
                {iniciales(nombre)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={pedirCerrarSesion}
                aria-label={`Cerrar sesión de ${nombre}`}
                title="Cerrar sesión"
              >
                <SignOut className="size-[18px]" />
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground mb-3 w-full justify-start gap-2 px-3"
                onClick={abrirGuia}
              >
                <Info className="size-4" />
                ¿Cómo funciona?
              </Button>

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="border-border bg-muted/40 hover:bg-muted/70 focus-visible:ring-ring group flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-foreground text-xs font-medium">Portal público</span>
                  <span className="text-muted-foreground truncate text-[11px]">
                    Ver el sitio publicado
                  </span>
                </span>
                <ArrowSquareOut
                  aria-hidden="true"
                  className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors"
                />
              </a>

              <div className="border-border bg-card mt-3 flex items-center gap-2.5 rounded-lg border p-2.5 shadow-xs">
                <span
                  aria-hidden="true"
                  className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                >
                  {iniciales(nombre)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground truncate text-xs font-medium" title={nombre}>
                    {nombre}
                  </p>
                  <p className="text-muted-foreground truncate text-[11px]">{rol}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  onClick={pedirCerrarSesion}
                  aria-label={`Cerrar sesión de ${nombre}`}
                  title="Cerrar sesión"
                >
                  <SignOut className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>

      <main id="contenido-cms" tabIndex={-1} className="bg-muted/25 min-w-0 flex-1 outline-none">
        <Outlet />
      </main>

      <AlertDialog open={blocker.state === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <WarningCircle />
            </AlertDialogMedia>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Si sales ahora, se perderá lo último que editaste. Guarda los cambios o descártalos
              antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Volver al editor
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={logoutPendiente} onOpenChange={setLogoutPendiente}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <WarningCircle />
            </AlertDialogMedia>
            <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
            <AlertDialogDescription>
              Si cierras sesión ahora, se perderá lo último que editaste. Guarda los cambios antes
              de salir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver al editor</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmarLogout}>
              Cerrar sesión sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CmsComoFunciona open={ayudaAbierta} onOpenChange={setAyudaAbierta} />
    </div>
  )
}
