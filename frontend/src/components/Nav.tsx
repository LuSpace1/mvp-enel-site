import { useState } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'motion/react'
import { List, X } from '@phosphor-icons/react'

import { track } from '@/lib/analytics'
import { desplazarASeccion } from '@/lib/scroll'
import { clsx } from 'clsx'

import { useViajeStore } from '@/store/useViajeStore'
import { PASOS_VIAJE } from '@/lib/data/viaje'

import logoEnel from '@/assets/icons/Enel_Group_logo.svg'

interface NavItem {
  id: string
  etiqueta: string
}

const ITEMS: NavItem[] = [
  { id: 'portada', etiqueta: 'Inicio' },
  { id: 'mapa-del-viaje', etiqueta: 'Ruta' },
  { id: 'historia', etiqueta: 'Historia' },
  { id: 'cultura', etiqueta: 'Cultura' },
  { id: 'organigrama', etiqueta: 'Equipos' },
  { id: 'concesion-detalle', etiqueta: 'Concesión' },
  { id: 'cadena', etiqueta: 'Cadena' },
  { id: 'politicas', etiqueta: 'Políticas' },
  { id: 'galerias', etiqueta: 'Galerías' },
  { id: 'cierre', etiqueta: 'Cierre' },
]

const INDICE_POR_ID = new Map(PASOS_VIAJE.map((paso, indice) => [paso.id, indice]))

function irA(id: string, abrirRuta: () => void) {
  track('nav.clic', { paso: id })
  if (id === 'mapa-del-viaje') {
    abrirRuta()
    setTimeout(() => {
      desplazarASeccion(id)
    }, 100)
  } else {
    desplazarASeccion(id)
  }
}

export function Nav() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const reduce = useReducedMotion()
  const pasoActual = useViajeStore((estado) => estado.pasoActual)
  const abrirRuta = useViajeStore((estado) => estado.abrirRuta)

  const indiceActual = INDICE_POR_ID.get(pasoActual) ?? 0
  const progreso = Math.max(0, indiceActual / (PASOS_VIAJE.length - 1))

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40 h-16 border-b border-white/60 bg-[#f0eee6]/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl"
      initial={reduce ? false : { y: '-100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <nav className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <button
          type="button"
          onClick={() => {
            track('nav.inicio')
            desplazarASeccion('portada')
          }}
          className="flex items-center gap-2"
          aria-label="Volver al inicio"
        >
          <img src={logoEnel} alt="Logo Enel" className="mr-1 h-8 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="text-enel-navy text-sm font-semibold tracking-tight">
              Enel Distribución
            </span>
            <span className="text-[10px] font-medium tracking-[0.18em] text-neutral-500 uppercase">
              Portal Interactivo
            </span>
          </span>
        </button>

        <ul className="hidden items-center gap-1 lg:flex">
          {ITEMS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => irA(item.id, abrirRuta)}
                className={clsx(
                  'rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                  pasoActual === item.id
                    ? 'bg-enel-blue/10 text-enel-blue'
                    : 'hover:text-enel-navy text-neutral-600',
                )}
                aria-current={pasoActual === item.id ? 'page' : undefined}
              >
                {item.etiqueta}
              </button>
            </li>
          ))}
        </ul>

        {/* Botón menú hamburguesa (móvil/tablet) */}
        <button
          type="button"
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="text-enel-navy rounded-full p-2 transition-colors hover:bg-black/5 lg:hidden"
          aria-label="Alternar menú"
        >
          {menuAbierto ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
        </button>
      </nav>

      {/* Dropdown Móvil */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border-enel-fog/70 absolute top-16 right-0 left-0 z-30 flex max-h-[70vh] flex-col overflow-y-auto border-b bg-[#f0eee6] p-4 shadow-2xl lg:hidden"
          >
            {ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  irA(item.id, abrirRuta)
                  setMenuAbierto(false)
                }}
                className={clsx(
                  'w-full rounded-xl border-b border-black/5 px-5 py-4 text-left text-base font-semibold transition-colors last:border-0',
                  pasoActual === item.id
                    ? 'bg-enel-blue/10 text-enel-blue'
                    : 'text-enel-navy hover:bg-white/50',
                )}
              >
                {item.etiqueta}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!reduce && (
        <motion.div
          className="bg-enel-pink absolute inset-x-0 bottom-0 h-0.5 origin-left"
          initial={false}
          animate={{ scaleX: progreso }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </motion.header>
  )
}
