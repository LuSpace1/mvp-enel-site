import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { CmsAlert } from '@/components/cms/CmsAlert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
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

  if (access && (user?.capabilities.can_manage_cms || user?.capabilities.can_edit_cms)) {
    const destino = (location.state as { from?: string } | null)?.from ?? '/cms'
    return <Navigate to={destino} replace />
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setSinPermiso(false)
    try {
      await login(username.trim(), password)
      const actualizado = useAuthStore.getState().user
      if (!actualizado?.capabilities.can_manage_cms && !actualizado?.capabilities.can_edit_cms) {
        setSinPermiso(true)
        return
      }
      navigate('/cms', { replace: true })
    } catch {
      // El store ya expone el mensaje de error.
    }
  }

  const cargando = status === 'loading'
  const mensajeError = sinPermiso ? 'Tu cuenta no tiene un rol habilitado para el CMS.' : error

  return (
    <div className="bg-background flex min-h-svh w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid min-h-[28rem] p-0 md:grid-cols-2">
            <form
              onSubmit={(e) => void enviar(e)}
              className="flex items-center p-6 md:p-10 lg:p-14"
            >
              <FieldGroup className="w-full">
                <div className="flex flex-col items-start gap-2 text-left">
                  <span className="text-muted-foreground inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] uppercase">
                    <span className="size-1.5 rounded-full bg-[#e4002b]" />
                    Acceso interno
                  </span>
                  <h1 className="text-enel-navy text-3xl font-black tracking-tight">
                    Portal Experiencia DX
                  </h1>
                  <p className="text-muted-foreground text-sm">Enel Distribución Chile</p>
                </div>

                <Field>
                  <FieldLabel htmlFor="username">Correo o ID Enel</FieldLabel>
                  <Input
                    id="username"
                    type="text"
                    autoComplete="username"
                    placeholder="nombre.apellido@enel.com o A123456"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>

                {mensajeError && (
                  <CmsAlert
                    variant="danger"
                    title="No se pudo iniciar sesión"
                    description={mensajeError}
                  />
                )}

                <Field>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={cargando || !username || !password}
                  >
                    {cargando ? 'Iniciando sesión…' : 'Ingresar'}
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Gestión de contenido
                </FieldSeparator>
              </FieldGroup>
            </form>

            <div className="paper-sheet relative hidden items-center justify-center overflow-hidden p-10 md:flex lg:p-14">
              <div className="relative flex flex-col items-center gap-6 text-center">
                <img src={logoEnel} alt="Enel Group" className="h-auto w-52 object-contain" />
                <p className="text-[10px] tracking-[0.24em] text-[#8a8378] uppercase">
                  Registro editorial · Portal Experiencia DX
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
