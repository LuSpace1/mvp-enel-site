import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKey, User } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/useAuthStore'

import logoEnel from '@/assets/icons/Enel_Group_logo.svg'

export function CmsLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const access = useAuthStore((estado) => estado.access)
  const user = useAuthStore((estado) => estado.user)
  const login = useAuthStore((estado) => estado.login)
  const status = useAuthStore((estado) => estado.status)
  const error = useAuthStore((estado) => estado.error)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [sinPermiso, setSinPermiso] = useState(false)

  if (access && user?.capabilities.can_edit_cms) {
    const destino = (location.state as { from?: string } | null)?.from ?? '/cms'
    return <Navigate to={destino} replace />
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setSinPermiso(false)
    try {
      await login(username.trim(), password)
      const actualizado = useAuthStore.getState().user
      if (!actualizado?.capabilities.can_edit_cms) {
        setSinPermiso(true)
        return
      }
      navigate('/cms', { replace: true })
    } catch {
      // El store ya expone el mensaje de error.
    }
  }

  return (
    <div className="bg-enel-mist/60 flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={logoEnel} alt="Enel" className="h-9 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="text-enel-navy text-sm font-semibold">Enel Distribución</span>
            <span className="text-[10px] font-medium tracking-[0.18em] text-neutral-500 uppercase">
              CMS del portal
            </span>
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
            <CardDescription>
              Accede con tu cuenta corporativa provisionada para editar el contenido del portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void enviar(e)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">Usuario</FieldLabel>
                  <div className="relative">
                    <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      id="username"
                      autoComplete="username"
                      className="pl-9"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enel ID o usuario"
                      required
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <div className="relative">
                    <LockKey className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </Field>

                {(error || sinPermiso) && (
                  <p className="text-destructive text-sm">
                    {sinPermiso ? 'Tu cuenta no tiene un rol habilitado para el CMS.' : error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Ingresando…' : 'Ingresar'}
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          En producción, las identidades y roles los aprovisiona CompAC por SCIM.
        </p>
      </div>
    </div>
  )
}
