/**
 * Subestaciones por comuna.
 *
 * Fuente: listado de subestaciones entregado por el negocio (octubre 2026).
 * Ojo: una subestación no es un alimentador; el alimentador es la línea de
 * media tensión que sale de la subestación. Aquí se muestran solo las S/E.
 *
 * Las comunas sin subestación propia se dejan con un arreglo vacío para que
 * la interfaz muestre "Sin S/E propia".
 */
export const SUBESTACIONES_POR_COMUNA: Record<string, string[]> = {
  huechuraba: ['El Salto'],
  // El listado original incluye "Vitacura" dentro de Las Condes; se asigna a
  // la comuna de Vitacura, que no aparecía en la tabla.
  'las-condes': ['Alonso de Córdova', 'Apoquindo', 'El Golf'],
  vitacura: ['Vitacura'],
  santiago: ['Centro', 'Santa Elena', 'Diego de Almagro'],
  quilicura: ['Chacabuco', 'El Cortijo', 'Lo Marcoleta'],
  renca: ['Lo Boza', 'Renca', 'Resbalón'],
  providencia: ['Tobalaba', 'Los Leones'],
  nunoa: ['Ñuñoa', 'Irarrázaval'],
  recoleta: ['San Cristóbal', 'Recoleta'],
  maipu: ['Pajaritos', 'Chañarcillo'],
  pudahuel: ['Pudahuel', 'Enea'],
  lampa: ['Lampa', 'Batuco'],
  'san-joaquin': ['San Joaquín (STM)'],
  conchali: ['Conchalí'],
  independencia: ['Vivaceta'],
  cerrillos: ['Cerrillos'],
  'pa-c': ['Ochagavía'],
  'estacion-central': ['Las Rejas'],
  'la-florida': ['Walker Martínez'],
  penalolen: ['Peñalolén'],
  'la-reina': ['La Reina'],
  'san-miguel': ['San Miguel'],
  'la-cisterna': ['La Cisterna'],
  'lo-barnechea': ['El Arrayán'],
  colina: ['Chicureo'],

  // Comunas sin S/E propia: su demanda se abastece desde comunas vecinas.
  'cerro-navia': [],
  'lo-prado': [],
  'quinta-normal': [],
  macul: [],
  'la-granja': [],
  'san-ramon': [],
  'lo-espejo': [],
  'til-til': [],
}
