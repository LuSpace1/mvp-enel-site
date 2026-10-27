import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

import { ETIQUETAS_SECCION, SECCIONES_ORDEN } from '@/lib/cms/registro'

const PortadaDelViaje = lazy(() =>
  import('@/components/PortadaDelViaje').then((modulo) => ({ default: modulo.PortadaDelViaje })),
)
const HistoriaSection = lazy(() =>
  import('@/sections/HistoriaSection').then((modulo) => ({ default: modulo.HistoriaSection })),
)
const CulturaSection = lazy(() =>
  import('@/sections/CulturaSection').then((modulo) => ({ default: modulo.CulturaSection })),
)
const OrganigramaSection = lazy(() =>
  import('@/sections/OrganigramaSection').then((modulo) => ({
    default: modulo.OrganigramaSection,
  })),
)
const VistaConcesionSection = lazy(() =>
  import('@/sections/VistaConcesionSection').then((modulo) => ({
    default: modulo.VistaConcesionSection,
  })),
)
const CadenaValorSection = lazy(() =>
  import('@/sections/CadenaValorSection').then((modulo) => ({
    default: modulo.CadenaValorSection,
  })),
)
const PoliticasISOSection = lazy(() =>
  import('@/sections/PoliticasISOSection').then((modulo) => ({
    default: modulo.PoliticasISOSection,
  })),
)
const GaleriasSection = lazy(() =>
  import('@/sections/GaleriasSection').then((modulo) => ({
    default: modulo.GaleriasSection,
  })),
)
const PersonasSection = lazy(() =>
  import('@/sections/PersonasSection').then((modulo) => ({ default: modulo.PersonasSection })),
)
const EspaciosSection = lazy(() =>
  import('@/sections/EspaciosSection').then((modulo) => ({ default: modulo.EspaciosSection })),
)
const CierreSection = lazy(() =>
  import('@/sections/CierreSection').then((modulo) => ({ default: modulo.CierreSection })),
)

export const COMPONENTES_SECCION: Record<string, LazyExoticComponent<ComponentType>> = {
  portada: PortadaDelViaje,
  historia: HistoriaSection,
  cultura: CulturaSection,
  organigrama: OrganigramaSection,
  'concesion-detalle': VistaConcesionSection,
  cadena: CadenaValorSection,
  politicas: PoliticasISOSection,
  galerias: GaleriasSection,
  personas: PersonasSection,
  espacios: EspaciosSection,
  cierre: CierreSection,
}

export function componenteDeSeccion(clave: string): LazyExoticComponent<ComponentType> | null {
  return COMPONENTES_SECCION[clave] ?? null
}

export function etiquetaDeSeccion(clave: string): string {
  return ETIQUETAS_SECCION[clave] ?? clave
}

export function clavesDeSeccion(): string[] {
  return [...SECCIONES_ORDEN]
}
