import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

export function CmsPageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
  className,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  back?: { to: string; label: string }
  className?: string
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur-xl supports-backdrop-filter:bg-white/70',
        className,
      )}
    >
      <div className="flex w-full flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 xl:px-8">
        <div className="min-w-0">
          {back && (
            <Link
              to={back.to}
              className="text-muted-foreground hover:text-enel-navy group mb-1 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              {back.label}
            </Link>
          )}
          {eyebrow && (
            <p className="text-muted-foreground/80 text-[10px] font-semibold tracking-[0.18em] uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="text-enel-navy mt-0.5 text-xl leading-tight font-semibold tracking-tight md:text-[22px]">
            {title}
          </h1>
          {description && <div className="mt-1 text-sm">{description}</div>}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
