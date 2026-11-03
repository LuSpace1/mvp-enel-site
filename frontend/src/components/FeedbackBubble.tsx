import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChatCircleDots, CheckCircle, PaperPlaneTilt, Star, X } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  estadoOpinion,
  marcarOpinionDescartada,
  opinar,
  registrar,
} from '@/lib/analytics'
import { useViajeStore } from '@/store/useViajeStore'

const ESCALA = [1, 2, 3, 4, 5] as const
const SEGUNDOS_AUTO_EXPANDIR = 5

/**
 * Solicitud de opinion al llegar a Cierre.
 *
 * Se pide una vez por visita. Aparece como pildora con pulso y, si la persona
 * no la toca, se expande sola para que la solicitud sea inconfundible.
 */
export function FeedbackBubble() {
  const reduce = useReducedMotion()
  const pasoActual = useViajeStore((estado) => estado.pasoActual)
  const [visible, setVisible] = useState(false)
  const [abierta, setAbierta] = useState(false)
  const [puntaje, setPuntaje] = useState<number | null>(null)
  const [comentario, setComentario] = useState('')
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'listo' | 'error'>('inicial')

  useEffect(() => {
    if (pasoActual !== 'cierre') return
    if (estadoOpinion() !== 'pendiente') return
    const temporizador = window.setTimeout(() => setVisible(true), 1200)
    return () => window.clearTimeout(temporizador)
  }, [pasoActual])

  useEffect(() => {
    if (pasoActual !== 'cierre' && !abierta) setVisible(false)
  }, [pasoActual, abierta])

  const abrir = useCallback((auto = false) => {
    setAbierta(true)
    registrar('opinion.abrir', { seccion: 'cierre', datos: { auto } })
  }, [])

  // Si nadie toca la pildora, se abre sola una vez por visita.
  useEffect(() => {
    if (!visible || abierta || reduce || estado !== 'inicial') return
    const temporizador = window.setTimeout(
      () => abrir(true),
      SEGUNDOS_AUTO_EXPANDIR * 1000,
    )
    return () => window.clearTimeout(temporizador)
  }, [visible, abierta, reduce, estado, abrir])

  function descartar() {
    registrar('opinion.descartar', { seccion: 'cierre' })
    marcarOpinionDescartada()
    setVisible(false)
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!puntaje) return
    setEstado('enviando')
    const ok = await opinar(puntaje, comentario)
    if (!ok) {
      setEstado('error')
      return
    }
    setEstado('listo')
    window.setTimeout(() => setVisible(false), 2800)
  }

  if (!visible) return null

  if (estado === 'listo') {
    return (
      <motion.aside
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg ring-1 ring-emerald-600/20 backdrop-blur-xl"
      >
        <CheckCircle size={18} weight="fill" />
        Gracias por tu opinión
      </motion.aside>
    )
  }

  return (
    <AnimatePresence>
      <motion.aside
        key="feedback"
        aria-live="polite"
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 48, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: 32, scale: 0.96 }}
        transition={
          reduce
            ? { duration: 0.2 }
            : { type: 'spring', stiffness: 340, damping: 24, mass: 0.9 }
        }
        className="fixed right-4 bottom-4 z-40"
      >
        {!abierta ? (
          <div className="relative">
            {!reduce && (
              <>
                <motion.span
                  aria-hidden="true"
                  className="bg-enel-pink/40 absolute inset-0 rounded-full"
                  initial={{ scale: 1, opacity: 0.55 }}
                  animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.2, ease: 'easeOut' }}
                />
                <motion.span
                  aria-hidden="true"
                  className="bg-enel-pink/25 absolute inset-0 rounded-full"
                  initial={{ scale: 1, opacity: 0.35 }}
                  animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                  transition={{
                    duration: 1.5,
                    delay: 0.5,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                    ease: 'easeOut',
                  }}
                />
              </>
            )}

            <motion.button
              type="button"
              onClick={() => abrir(false)}
              whileHover={reduce ? undefined : { scale: 1.04 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              animate={reduce ? undefined : { scale: [1, 1.035, 1] }}
              transition={
                reduce
                  ? undefined
                  : { duration: 1.1, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }
              }
              className="bg-enel-navy shadow-enel-navy/30 relative flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl"
            >
              <Star size={17} weight="fill" className="text-enel-pink" />
              Danos tu opinión
              {!reduce && (
                <span className="bg-enel-pink absolute -top-0.5 -right-0.5 flex size-2.5">
                  <span className="bg-enel-pink absolute inline-flex size-full animate-ping rounded-full opacity-75" />
                  <span className="bg-enel-pink relative inline-flex size-2.5 rounded-full" />
                </span>
              )}
            </motion.button>
          </div>
        ) : (
          <form
            onSubmit={enviar}
            className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[0_20px_60px_rgba(20,20,19,0.22)] ring-1 ring-black/5 backdrop-blur-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="bg-enel-pink/10 text-enel-pink flex size-9 shrink-0 items-center justify-center rounded-xl">
                <ChatCircleDots size={18} weight="duotone" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-enel-navy text-sm font-semibold">¿Qué tal estuvo el recorrido?</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Tu respuesta ayuda a mejorar el portal.
                </p>
              </div>
              <button
                type="button"
                onClick={descartar}
                aria-label="Cerrar y no responder"
                className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-600"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div
              className="mt-3 flex items-center justify-between gap-1.5"
              role="radiogroup"
              aria-label="Satisfacción"
            >
              {ESCALA.map((valor) => {
                const activo = puntaje === valor
                return (
                  <button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    aria-label={`${valor} de 5`}
                    onClick={() => setPuntaje(valor)}
                    className={
                      activo
                        ? 'bg-enel-blue flex size-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm'
                        : 'hover:border-enel-blue/40 hover:text-enel-blue flex size-10 items-center justify-center rounded-full border border-black/10 text-sm font-medium text-neutral-500 transition-colors'
                    }
                  >
                    {valor}
                  </button>
                )
              })}
            </div>
            <div className="mt-1 flex justify-between text-[10px] font-medium tracking-wide text-neutral-400 uppercase">
              <span>Malo</span>
              <span>Excelente</span>
            </div>

            <Textarea
              value={comentario}
              onChange={(evento) => setComentario(evento.target.value)}
              placeholder="¿Qué te gustaría mejorar? (opcional)"
              aria-label="Comentario"
              maxLength={2000}
              className="mt-3 min-h-16 bg-white/70 text-sm"
            />

            {estado === 'error' && (
              <p role="alert" className="text-destructive mt-2 text-xs">
                No se pudo enviar. Inténtalo otra vez.
              </p>
            )}

            <Button
              type="submit"
              size="sm"
              className="mt-3 w-full"
              disabled={!puntaje || estado === 'enviando'}
            >
              <PaperPlaneTilt size={16} weight="duotone" />
              {estado === 'enviando' ? 'Enviando…' : 'Enviar opinión'}
            </Button>
          </form>
        )}
      </motion.aside>
    </AnimatePresence>
  )
}
