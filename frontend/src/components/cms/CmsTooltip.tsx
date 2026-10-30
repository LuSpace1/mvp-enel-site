import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'

type Lado = 'top' | 'bottom' | 'left' | 'right'

interface CmsTooltipProps {
  label: ReactNode
  shortcut?: string
  lado?: Lado
  className?: string
  children: ReactNode
}

const POSICION: Record<Lado, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
}

const FLECHA: Record<Lado, string> = {
  top: 'bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2',
  bottom: 'top-0 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2',
  left: 'right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2',
  right: 'left-0 top-1/2 h-2 w-2 -translate-y-1/2 -translate-x-1/2',
}

const DESPLAZAMIENTO: Record<Lado, { x?: number; y?: number }> = {
  top: { y: 4 },
  bottom: { y: -4 },
  left: { x: 4 },
  right: { x: -4 },
}

/** Tooltip de comandos: etiqueta, atajo opcional y entrada con spring. */
export function CmsTooltip({
  label,
  shortcut,
  lado = 'top',
  className,
  children,
}: CmsTooltipProps) {
  const [abierto, setAbierto] = useState(false)
  const retraso = useRef<number | null>(null)
  const reduce = useReducedMotion()
  const desplazamiento = DESPLAZAMIENTO[lado]

  function abrir() {
    if (retraso.current) window.clearTimeout(retraso.current)
    retraso.current = window.setTimeout(() => setAbierto(true), 140)
  }

  function cerrar() {
    if (retraso.current) window.clearTimeout(retraso.current)
    setAbierto(false)
  }

  useEffect(() => {
    return () => {
      if (retraso.current) window.clearTimeout(retraso.current)
    }
  }, [])

  return (
    <span
      className={cn('relative inline-flex', className)}
      onPointerEnter={abrir}
      onPointerLeave={cerrar}
      onFocusCapture={abrir}
      onBlurCapture={cerrar}
    >
      {children}
      <AnimatePresence>
        {abierto && (
          <motion.span
            role="tooltip"
            initial={
              reduce
                ? false
                : { opacity: 0, scale: 0.94, x: desplazamiento.x ?? 0, y: desplazamiento.y ?? 0 }
            }
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.22 }}
            className={cn(
              'bg-enel-navy pointer-events-none absolute z-[80] flex w-max max-w-[16rem] items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] leading-snug font-medium text-white shadow-[0_14px_32px_-14px_rgba(10,25,47,0.7)] ring-1 ring-white/10',
              POSICION[lado],
            )}
          >
            <span className="min-w-0">{label}</span>
            {shortcut && (
              <kbd className="shrink-0 rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-tight text-white/75">
                {shortcut}
              </kbd>
            )}
            <span
              aria-hidden="true"
              className={cn('bg-enel-navy absolute rotate-45', FLECHA[lado])}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
