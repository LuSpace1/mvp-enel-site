import type { PasoViaje } from '@/lib/data/viaje'

export function PasoHeader({ paso }: { paso: PasoViaje }) {
  return (
    <div className="sticky top-16 z-20 border-b border-white/60 bg-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-3 md:px-8">
        <span className="bg-enel-blue/10 text-enel-blue shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-[0.14em] uppercase">
          Capítulo
        </span>
        <h1 className="text-enel-navy truncate text-sm font-semibold tracking-tight md:text-base">
          {paso.nombre}
        </h1>
      </div>
    </div>
  )
}
