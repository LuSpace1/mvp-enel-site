import type { ComponentProps, ReactNode } from 'react'
import { CheckCircle, Info, WarningCircle, XCircle, type Icon } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CmsAlertVariant = 'info' | 'success' | 'warning' | 'danger'

const ESTILOS: Record<
  CmsAlertVariant,
  {
    icono: Icon
    iconoFondo: string
    iconoColor: string
    borde: string
    fondo: string
    titulo: string
    texto: string
    boton: string
    halo: string
  }
> = {
  info: {
    icono: Info,
    iconoFondo: 'bg-sky-500/10 ring-sky-500/15',
    iconoColor: 'text-sky-600',
    borde: 'border-sky-200/70',
    fondo: 'from-sky-50/90 via-white to-white',
    titulo: 'text-sky-950',
    texto: 'text-sky-900/70',
    boton: 'border-sky-200 bg-white text-sky-700 hover:bg-sky-50 hover:text-sky-800',
    halo: 'bg-sky-400/30',
  },
  success: {
    icono: CheckCircle,
    iconoFondo: 'bg-emerald-500/10 ring-emerald-500/15',
    iconoColor: 'text-emerald-600',
    borde: 'border-emerald-200/70',
    fondo: 'from-emerald-50/90 via-white to-white',
    titulo: 'text-emerald-950',
    texto: 'text-emerald-900/70',
    boton:
      'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800',
    halo: 'bg-emerald-400/30',
  },
  warning: {
    icono: WarningCircle,
    iconoFondo: 'bg-amber-500/10 ring-amber-500/15',
    iconoColor: 'text-amber-600',
    borde: 'border-amber-200/80',
    fondo: 'from-amber-50/90 via-white to-white',
    titulo: 'text-amber-950',
    texto: 'text-amber-900/75',
    boton: 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50 hover:text-amber-900',
    halo: 'bg-amber-400/30',
  },
  danger: {
    icono: XCircle,
    iconoFondo: 'bg-red-500/10 ring-red-500/15',
    iconoColor: 'text-red-600',
    borde: 'border-red-200/80',
    fondo: 'from-red-50/90 via-white to-white',
    titulo: 'text-red-950',
    texto: 'text-red-900/75',
    boton: 'border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800',
    halo: 'bg-red-400/30',
  },
}

interface CmsAlertProps {
  variant?: CmsAlertVariant
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  children?: ReactNode
  compact?: boolean
  className?: string
}

export function CmsAlert({
  variant = 'info',
  title,
  description,
  action,
  children,
  compact = false,
  className,
}: CmsAlertProps) {
  const reduce = useReducedMotion()
  const estilo = ESTILOS[variant]
  const Icono = estilo.icono
  const urgente = variant === 'danger' || variant === 'warning'

  return (
    <motion.div
      layout
      role={urgente ? 'alert' : 'status'}
      aria-live={urgente ? 'assertive' : 'polite'}
      initial={reduce ? false : { opacity: 0, y: -10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.985 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-[0_18px_50px_-28px_rgba(10,25,47,0.45)] backdrop-blur-sm',
        estilo.borde,
        estilo.fondo,
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5',
        className,
      )}
    >
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'relative flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
              estilo.iconoFondo,
              estilo.iconoColor,
              compact ? 'size-7 rounded-lg' : 'size-10',
            )}
          >
            {urgente && !reduce && (
              <motion.span
                aria-hidden="true"
                className={cn('absolute inset-0 rounded-[inherit]', estilo.halo)}
                animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <Icono size={compact ? 15 : 20} weight="duotone" className="relative" />
          </span>

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'font-semibold tracking-tight',
                estilo.titulo,
                compact ? 'text-[13px]' : 'text-sm',
              )}
            >
              {title}
            </p>
            {description && (
              <div
                className={cn(
                  'mt-0.5 leading-relaxed',
                  estilo.texto,
                  compact ? 'text-xs' : 'text-[13px]',
                )}
              >
                {description}
              </div>
            )}
            {children}
          </div>
        </div>

        {action && (
          <div
            className={cn(
              'flex w-full shrink-0 items-center gap-2 sm:w-auto sm:pl-3',
              compact ? 'pl-10' : 'pl-[3.25rem]',
            )}
          >
            {action}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function CmsAlertAction({
  tono = 'info',
  className,
  asChild,
  ...props
}: ComponentProps<typeof Button> & { tono?: CmsAlertVariant }) {
  return (
    <Button
      asChild={asChild}
      type={asChild ? undefined : 'button'}
      size="sm"
      variant="outline"
      className={cn('w-full shrink-0 sm:w-auto', ESTILOS[tono].boton, className)}
      {...props}
    />
  )
}
