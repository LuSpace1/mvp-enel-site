import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CheckCircle, EnvelopeSimple, X } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { identidadGuardada, identificar } from '@/lib/analytics'
import { useViajeStore } from '@/store/useViajeStore'

const CLAVE_OMITIDA = 'enel.kpi.identidad.omitida'
const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000

function omitidaHacePoco(): boolean {
  try {
    const valor = window.localStorage.getItem(CLAVE_OMITIDA)
    if (!valor) return false
    return Date.now() - Number(valor) < SIETE_DIAS
  } catch {
    return false
  }
}

/**
 * Aviso liviano para vincular la visita con la persona.
 *
 * No bloquea el recorrido ni pide contraseña: el portal ya está detras de la
 * VPN y el correo solo sirve para medir adopcion en la fase piloto.
 */
export function IdentificacionBubble() {
  const reduce = useReducedMotion()
  const introTerminada = useViajeStore((estado) => estado.introTerminada)
  const pasoActual = useViajeStore((estado) => estado.pasoActual)
  const [visible, setVisible] = useState(false)
  const [salioDeIntro, setSalioDeIntro] = useState(false)
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'listo' | 'error'>('inicial')
  const pasoRef = useRef(pasoActual)

  useEffect(() => {
    pasoRef.current = pasoActual
  }, [pasoActual])

  // El intro ocupa la primera pantalla con un z-index mayor: el aviso solo
  // aparece cuando la persona ya entro al recorrido.
  useEffect(() => {
    function revisar() {
      if (window.scrollY > window.innerHeight * 0.8) setSalioDeIntro(true)
    }
    revisar()
    window.addEventListener('scroll', revisar, { passive: true })
    return () => window.removeEventListener('scroll', revisar)
  }, [])

  useEffect(() => {
    if (!introTerminada || !salioDeIntro) return
    if (identidadGuardada() || omitidaHacePoco()) return
    const temporizador = window.setTimeout(() => {
      const movil = window.matchMedia('(max-width: 767px)').matches
      if (movil && pasoRef.current === 'cierre') return
      setVisible(true)
    }, 1500)
    return () => window.clearTimeout(temporizador)
  }, [introTerminada, salioDeIntro])

  // En movil, Cierre ya muestra la encuesta y dos burbujas se tapan.
  useEffect(() => {
    if (pasoActual !== 'cierre') return
    if (window.matchMedia('(max-width: 767px)').matches) setVisible(false)
  }, [pasoActual])

  function omitir() {
    try {
      window.localStorage.setItem(CLAVE_OMITIDA, String(Date.now()))
    } catch {
      // Sin almacenamiento, el aviso se vuelve a mostrar en la proxima visita.
    }
    setVisible(false)
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setEstado('enviando')
    const ok = await identificar(email)
    if (!ok) {
      setEstado('error')
      return
    }
    setEstado('listo')
    window.setTimeout(() => setVisible(false), 2200)
  }

  if (estado === 'listo') {
    return (
      <AnimatePresence>
        {visible && (
          <motion.aside
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg ring-1 ring-emerald-600/20 backdrop-blur-xl"
          >
            <CheckCircle size={18} weight="fill" />
            Visita registrada
          </motion.aside>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="complementary"
          aria-label="Identificación de la visita"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_48px_rgba(20,20,19,0.14)] backdrop-blur-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="bg-enel-blue/10 text-enel-blue flex size-9 shrink-0 items-center justify-center rounded-xl">
              <EnvelopeSimple size={18} weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-enel-navy text-sm font-semibold">
                Identifícate para medir la adopción
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                Tu correo corporativo solo sirve para contar quién usó el portal.
              </p>
            </div>
            <button
              type="button"
              onClick={omitir}
              aria-label="Cerrar"
              className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-600"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <form onSubmit={enviar} className="mt-3 flex gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="nombre@enel.com"
              aria-label="Correo corporativo"
              className="h-9 bg-white/70"
            />
            <Button type="submit" size="sm" disabled={estado === 'enviando'} className="shrink-0">
              {estado === 'enviando' ? 'Guardando…' : 'Registrar'}
            </Button>
          </form>

          {estado === 'error' && (
            <p role="alert" className="text-destructive mt-2 text-xs">
              No se pudo registrar el correo. Revisa el formato e inténtalo otra vez.
            </p>
          )}

          <button
            type="button"
            onClick={omitir}
            className="mt-2 text-[11px] font-medium text-neutral-400 underline-offset-2 hover:underline"
          >
            Continuar sin identificarme
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
