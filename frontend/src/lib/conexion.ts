/** True si el navegador pide ahorrar datos (modo ahorro o red muy limitada). */
export function prefiereAhorrarDatos(): boolean {
  const conexion = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection
  if (!conexion) return false
  return Boolean(conexion.saveData) || conexion.effectiveType === 'slow-2g'
}
