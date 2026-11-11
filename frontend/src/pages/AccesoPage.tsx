import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'

import { CmsAlert } from '@/components/cms/CmsAlert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/useAuthStore'

import logoEnel from '@/assets/icons/Enel_Group_logo.svg'

export function AccesoPage() {
  const access = useAuthStore((estado) => estado.access)
  const login = useAuthStore((estado) => estado.login)
  const status = useAuthStore((estado) => estado.status)
  const error = useAuthStore((estado) => estado.error)
  const limpiarError = useAuthStore((estado) => estado.limpiarError)

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    limpiarError()
  }, [limpiarError])

  if (access) return <Navigate to="/" replace />

  const cargando = status === 'loading'

  async function ingresar(evento: FormEvent) {
    evento.preventDefault()
    try {
      await login(usuario.trim(), password)
      // Recarga completa: el portal arranca limpio y ya autenticado.
      window.location.assign('/')
    } catch {}
  }

  return (
    <div className="bg-background flex min-h-svh w-full items-center justify-center p-6 sm:p-10">
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid min-h-[34rem] p-0 md:grid-cols-2">
            <div className="flex items-center p-6 md:p-10 lg:p-12">
              <div className="w-full">
                <div className="flex flex-col items-start gap-2 text-left">
                  <span className="text-muted-foreground inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] uppercase">
                    <span className="size-1.5 rounded-full bg-[#e4002b]" />
                    Acceso al portal
                  </span>
                  <h1 className="text-enel-navy text-3xl font-black tracking-tight">
                    Portal Interactivo
                  </h1>
                  <p className="text-muted-foreground text-sm">Enel Distribución Chile</p>
                </div>

                <div className="mt-6">
                  <form onSubmit={(evento) => void ingresar(evento)}>
                    <FieldGroup className="w-full">
                      <Field>
                        <FieldLabel htmlFor="acceso-usuario">Correo corporativo o ID Enel</FieldLabel>
                        <Input
                          id="acceso-usuario"
                          type="text"
                          autoComplete="username"
                          placeholder="nombre.apellido@enel.com o A123456"
                          value={usuario}
                          onChange={(evento) => setUsuario(evento.target.value)}
                          required
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="acceso-password">Contraseña</FieldLabel>
                        <Input
                          id="acceso-password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(evento) => setPassword(evento.target.value)}
                          required
                        />
                      </Field>

                      {error && (
                        <CmsAlert
                          variant="danger"
                          title="No se pudo iniciar sesión"
                          description={error}
                        />
                      )}

                      <Field>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={cargando || !usuario || !password}
                        >
                          {cargando ? 'Ingresando…' : 'Entrar al portal'}
                          <ArrowRight size={16} weight="bold" />
                        </Button>
                      </Field>
                    </FieldGroup>
                  </form>
                </div>

                <FieldSeparator className="mt-5 *:data-[slot=field-separator-content]:bg-card">
                  Solo para colaboradores de Enel
                </FieldSeparator>
                <p className="text-muted-foreground mt-3 text-[11px] leading-relaxed">
                  Usamos tu correo para medir cómo se usa el portal. No guardamos tu IP. Tu cuenta
                  local se reemplazará automáticamente cuando se active el SSO corporativo.
                </p>
              </div>
            </div>

            <div className="paper-sheet relative hidden items-center justify-center overflow-hidden p-10 md:flex lg:p-14">
              <div className="relative flex flex-col items-center gap-6 text-center">
                <img src={logoEnel} alt="Enel Group" className="h-auto w-52 object-contain" />
                <p className="text-[10px] tracking-[0.24em] text-[#8a8378] uppercase">
                  Experiencia interactiva · Enel Distribución Chile
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
