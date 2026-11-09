import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChatCircleDots, CheckCircle, PaperPlaneTilt, X } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { estadoOpinion, opinar, registrar } from '@/lib/analytics'
import { useViajeStore } from '@/store/useViajeStore'

const ESCALA = [1, 2, 3, 4, 5] as const
const SEGUNDOS_AUTO_EXPANDIR = 8

/**
 * Solicitud de opinión al llegar a Cierre.
 *
 * Utiliza el rojo oficial de Enel (#eb0053). Permite cerrarse y volver
 * a abrirse en cualquier momento si la persona desea responder después.
 */
export function FeedbackBubble() {
  const reduce = useReducedMotion()
  const pasoActual = useViajeStore((estado) => estado.pasoActual)
  const [visible, setVisible] = useState(false)
  const [abierta, setAbierta] = useState(false)
  const [yaIntentadoAuto, setYaIntentadoAuto] = useState(false)
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

  // Auto-expansión sutil una sola vez si no se interactúa
  useEffect(() => {
    if (!visible || abierta || reduce || estado !== 'inicial' || yaIntentadoAuto) return
    const temporizador = window.setTimeout(() => {
      setYaIntentadoAuto(true)
      abrir(true)
    }, SEGUNDOS_AUTO_EXPANDIR * 1000)
    return () => window.clearTimeout(temporizador)
  }, [visible, abierta, reduce, estado, yaIntentadoAuto, abrir])

  const cerrarFormulario = useCallback(() => {
    registrar('opinion.cerrar', { seccion: 'cierre' })
    setAbierta(false)
    setYaIntentadoAuto(true)
  }, [])

  // Cierre con Escape
  useEffect(() => {
    if (!abierta) return
    function alPresionarEscape(evento: KeyboardEvent) {
      if (evento.key === 'Escape') cerrarFormulario()
    }
    window.addEventListener('keydown', alPresionarEscape)
    return () => window.removeEventListener('keydown', alPresionarEscape)
  }, [abierta, cerrarFormulario])

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
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="fixed right-4 bottom-5 z-50 flex items-center gap-2.5 rounded-full border border-emerald-600/20 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 shadow-xl sm:right-8 sm:bottom-8"
      >
        <CheckCircle size={20} weight="fill" className="text-emerald-600" />
        ¡Gracias por tu opinión!
      </motion.aside>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={abierta ? 'form' : 'boton'}
        aria-live="polite"
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
        transition={
          reduce
            ? { duration: 0.2 }
            : { type: 'spring', stiffness: 340, damping: 26, mass: 0.8 }
        }
        className="fixed right-4 bottom-5 z-50 sm:right-8 sm:bottom-8"
      >
        {!abierta ? (
          <motion.button
            type="button"
            onClick={() => {
              setYaIntentadoAuto(true)
              abrir(false)
            }}
            whileHover={reduce ? undefined : { scale: 1.03 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className="group bg-enel-pink hover:bg-[#d6004b] flex h-12 cursor-pointer items-center gap-3 rounded-full border border-white/20 px-4 text-white shadow-[0_10px_25px_rgba(235,0,83,0.32)] transition-colors hover:shadow-[0_14px_32px_rgba(235,0,83,0.42)] active:scale-[0.97]"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-200 group-hover:scale-110">
              <ChatCircleDots size={16} weight="bold" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">
              Danos tu opinión
            </span>
          </motion.button>
        ) : (
          <form
            onSubmit={enviar}
            className="w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-black/[0.08] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.03]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-enel-pink/10 text-enel-pink flex size-10 shrink-0 items-center justify-center rounded-2xl">
                  <ChatCircleDots size={22} weight="bold" />
                </div>
                <div>
                  <p className="text-enel-navy text-sm font-semibold">
                    ¿Qué tal estuvo el recorrido?
                  </p>
                  <p className="text-xs text-neutral-500">
                    Tu respuesta ayuda a mejorar el portal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarFormulario}
                aria-label="Cerrar formulario"
                className="text-neutral-400 hover:text-neutral-700 -mr-1 -mt-1 rounded-full p-1.5 transition-colors hover:bg-neutral-100"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div
              className="mt-4 flex items-center justify-between gap-1.5"
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
                        ? 'bg-enel-pink flex size-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm transition-transform active:scale-95'
                        : 'border border-neutral-200 text-neutral-700 hover:border-enel-pink/50 hover:text-enel-pink flex size-10 items-center justify-center rounded-xl text-sm font-medium transition-colors hover:bg-enel-pink/[0.04] active:scale-95'
                    }
                  >
                    {valor}
                  </button>
                )
              })}
            </div>
            <div className="mt-1.5 flex justify-between px-1 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
              <span>Malo</span>
              <span>Excelente</span>
            </div>

            <Textarea
              value={comentario}
              onChange={(evento) => setComentario(evento.target.value)}
              placeholder="¿Qué te gustaría mejorar? (opcional)"
              aria-label="Comentario"
              maxLength={2000}
              className="mt-3.5 min-h-20 rounded-xl border-neutral-200 bg-neutral-50/50 text-sm focus-visible:ring-enel-pink/30"
            />

            {estado === 'error' && (
              <p role="alert" className="text-destructive mt-2 text-xs font-medium">
                No se pudo enviar. Inténtalo otra vez.
              </p>
            )}

            <Button
              type="submit"
              size="default"
              className="bg-enel-pink hover:bg-[#d6004b] mt-4 h-11 w-full rounded-xl text-sm font-semibold text-white shadow-sm transition-colors"
              disabled={!puntaje || estado === 'enviando'}
            >
              <PaperPlaneTilt size={16} weight="bold" />
              {estado === 'enviando' ? 'Enviando…' : 'Enviar opinión'}
            </Button>
          </form>
        )}
      </motion.aside>
    </AnimatePresence>
  )
}
