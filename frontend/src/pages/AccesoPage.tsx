import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'

import { CmsAlert } from '@/components/cms/CmsAlert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldSeparator } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/useAuthStore'

import logoEnel from '@/assets/icons/Enel_Group_logo.svg'

export function AccesoPage() {
  const access = useAuthStore((estado) => estado.access)
  const login = useAuthStore((estado) => estado.login)
  const registrar = useAuthStore((estado) => estado.registrar)
  const status = useAuthStore((estado) => estado.status)
  const error = useAuthStore((estado) => estado.error)
  const limpiarError = useAuthStore((estado) => estado.limpiarError)

  const [tab, setTab] = useState('ingresar')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [nuevoPassword, setNuevoPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')

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
    } catch {
      // El store expone el mensaje.
    }
  }

  async function crearCuenta(evento: FormEvent) {
    evento.preventDefault()
    try {
      await registrar({
        email: email.trim().toLowerCase(),
        first_name: nombre.trim(),
        last_name: apellido.trim(),
        password: nuevoPassword,
        password_confirm: confirmar,
      })
      window.location.assign('/')
    } catch {
      // El store expone el mensaje.
    }
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

                <Tabs
                  value={tab}
                  onValueChange={(valor) => {
                    setTab(valor)
                    limpiarError()
                  }}
                  className="mt-6 gap-5"
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="ingresar" className="flex-1">
                      Ingresar
                    </TabsTrigger>
                    <TabsTrigger value="crear" className="flex-1">
                      Crear cuenta
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="ingresar">
                    <form onSubmit={(evento) => void ingresar(evento)}>
                      <FieldGroup className="w-full">
                        <Field>
                          <FieldLabel htmlFor="acceso-usuario">Correo o ID Enel</FieldLabel>
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

                        {error && tab === 'ingresar' && (
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
                  </TabsContent>

                  <TabsContent value="crear">
                    <form onSubmit={(evento) => void crearCuenta(evento)}>
                      <FieldGroup className="w-full">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field>
                            <FieldLabel htmlFor="acceso-nombre">Nombre</FieldLabel>
                            <Input
                              id="acceso-nombre"
                              autoComplete="given-name"
                              value={nombre}
                              onChange={(evento) => setNombre(evento.target.value)}
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="acceso-apellido">Apellido</FieldLabel>
                            <Input
                              id="acceso-apellido"
                              autoComplete="family-name"
                              value={apellido}
                              onChange={(evento) => setApellido(evento.target.value)}
                            />
                          </Field>
                        </div>

                        <Field>
                          <FieldLabel htmlFor="acceso-email">Correo corporativo</FieldLabel>
                          <Input
                            id="acceso-email"
                            type="email"
                            autoComplete="email"
                            placeholder="nombre.apellido@enel.com"
                            value={email}
                            onChange={(evento) => setEmail(evento.target.value)}
                            required
                          />
                        </Field>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field>
                            <FieldLabel htmlFor="acceso-nuevo-password">Contraseña</FieldLabel>
                            <Input
                              id="acceso-nuevo-password"
                              type="password"
                              autoComplete="new-password"
                              placeholder="Mínimo 8 caracteres"
                              value={nuevoPassword}
                              onChange={(evento) => setNuevoPassword(evento.target.value)}
                              required
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="acceso-confirmar">Repetir contraseña</FieldLabel>
                            <Input
                              id="acceso-confirmar"
                              type="password"
                              autoComplete="new-password"
                              placeholder="••••••••"
                              value={confirmar}
                              onChange={(evento) => setConfirmar(evento.target.value)}
                              required
                            />
                          </Field>
                        </div>

                        {error && tab === 'crear' && (
                          <CmsAlert
                            variant="danger"
                            title="No se pudo crear la cuenta"
                            description={error}
                          />
                        )}

                        <Field>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={
                              cargando || !email || !nuevoPassword || !confirmar
                            }
                          >
                            {cargando ? 'Creando cuenta…' : 'Crear cuenta y entrar'}
                            <ArrowRight size={16} weight="bold" />
                          </Button>
                        </Field>
                      </FieldGroup>
                    </form>
                  </TabsContent>
                </Tabs>

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
