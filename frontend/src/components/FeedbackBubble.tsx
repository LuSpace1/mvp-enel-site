import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChatCircleDots, CheckCircle, PaperPlaneTilt, Star, X } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { opinar, opinionEnviada, registrar } from '@/lib/analytics'
import { useViajeStore } from '@/store/useViajeStore'

const CLAVE_DESCARTADA = 'enel.kpi.opinion.descartada'
const ESCALA = [1, 2, 3, 4, 5] as const

function descartadaEnSesion(): boolean {
  try {
    return window.sessionStorage.getItem(CLAVE_DESCARTADA) === '1'
  } catch {
    return false
  }
}

/**
 * Burbuja de opinion al llegar a Cierre.
 *
 * Arranca como pildora discreta a la derecha y se expande al hacer clic, para
 * no interrumpir la lectura ni tapar los recursos.
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
    if (pasoActual !== 'cierre' || opinionEnviada() || descartadaEnSesion()) return
    const temporizador = window.setTimeout(() => setVisible(true), 1200)
    return () => window.clearTimeout(temporizador)
  }, [pasoActual])

  function abrir() {
    setAbierta(true)
    registrar('opinion.abrir', { seccion: 'cierre' })
  }

  function descartar() {
    try {
      window.sessionStorage.setItem(CLAVE_DESCARTADA, '1')
    } catch {
      // Sin almacenamiento, la burbuja reaparece al volver a Cierre.
    }
    registrar('opinion.descartar', { seccion: 'cierre' })
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
    window.setTimeout(() => setVisible(false), 2600)
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
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, x: 32 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="fixed right-4 bottom-4 z-40"
      >
        {!abierta ? (
          <button
            type="button"
            onClick={abrir}
            className="group bg-enel-navy shadow-enel-navy/20 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            <Star size={16} weight="fill" className="text-enel-pink" />
            Danos tu opinión
          </button>
        ) : (
          <form
            onSubmit={enviar}
            className="w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(20,20,19,0.18)] backdrop-blur-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="bg-enel-pink/10 text-enel-pink flex size-9 shrink-0 items-center justify-center rounded-xl">
                <ChatCircleDots size={18} weight="duotone" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-enel-navy text-sm font-semibold">¿Qué tal estuvo el recorrido?</p>
                <p className="mt-0.5 text-xs text-neutral-500">Tu respuesta ayuda a mejorarlo.</p>
              </div>
              <button
                type="button"
                onClick={descartar}
                aria-label="Cerrar"
                className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-600"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-1.5" role="radiogroup" aria-label="Satisfacción">
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
                        ? 'bg-enel-blue flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm'
                        : 'flex size-9 items-center justify-center rounded-full border border-black/10 text-sm font-medium text-neutral-500 transition-colors hover:border-enel-blue/40 hover:text-enel-blue'
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
