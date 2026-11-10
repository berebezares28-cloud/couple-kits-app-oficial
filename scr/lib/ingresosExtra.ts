import type { SupabaseClient } from '@supabase/supabase-js'
import { METODOS_PAGO, type MetodoPago } from './fifoCosteo'

export type IngresoExtra = {
  id: string
  concepto: string
  fecha: string
  monto: number
  metodo_pago: MetodoPago
  notas: string | null
}

export type NuevoIngresoExtra = Omit<IngresoExtra, 'id'>

export function fechaValida(fecha: unknown): fecha is string {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false
  const date = new Date(`${fecha}T12:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === fecha
}

export function validarIngresoExtra(body: unknown):
  | { ok: true; ingreso: NuevoIngresoExtra }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Datos inválidos' }
  const datos = body as Record<string, unknown>
  if (typeof datos.concepto !== 'string' || !datos.concepto.trim() || datos.concepto.trim().length > 200) {
    return { ok: false, error: 'Escribe un concepto de hasta 200 caracteres' }
  }
  if (!fechaValida(datos.fecha)) return { ok: false, error: 'Fecha inválida' }
  const monto = typeof datos.monto === 'number' || typeof datos.monto === 'string' ? Number(datos.monto) : NaN
  if (!Number.isFinite(monto) || monto <= 0 || monto > 9999999999.99 || Math.abs(monto * 100 - Math.round(monto * 100)) > 0.0001) {
    return { ok: false, error: 'Escribe un monto mayor a cero con hasta dos decimales' }
  }
  if (!METODOS_PAGO.includes(datos.metodo_pago as MetodoPago)) {
    return { ok: false, error: 'Selecciona una cuenta válida' }
  }
  if (datos.notas != null && (typeof datos.notas !== 'string' || datos.notas.length > 2000)) {
    return { ok: false, error: 'Las notas deben tener hasta 2000 caracteres' }
  }
  return { ok: true, ingreso: {
    concepto: datos.concepto.trim(),
    fecha: datos.fecha,
    monto: Math.round(monto * 100) / 100,
    metodo_pago: datos.metodo_pago as MetodoPago,
    notas: typeof datos.notas === 'string' ? datos.notas.trim() || null : null
  } }
}

export async function listarIngresosExtra(
  supabase: SupabaseClient,
  filtros?: { desde?: string; hasta?: string }
): Promise<IngresoExtra[]> {
  const ingresos: IngresoExtra[] = []
  for (let desde = 0; ; desde += 1000) {
    let query = supabase.from('ingresos_extra')
      .select('id, concepto, fecha, monto, metodo_pago, notas')
      .order('fecha', { ascending: false }).order('id')
      .range(desde, desde + 999)
    if (filtros?.desde) query = query.gte('fecha', filtros.desde)
    if (filtros?.hasta) query = query.lte('fecha', filtros.hasta)
    const { data, error } = await query
    if (error) throw new Error('No se pudieron cargar los ingresos extra')
    ingresos.push(...(data ?? []).map((i) => ({ ...i, monto: Number(i.monto) })))
    if (!data || data.length < 1000) return ingresos
  }
}

export function rangoMes(mes: string): { desde: string; hasta: string } | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return null
  const [year, month] = mes.split('-').map(Number)
  const ultimoDia = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { desde: `${mes}-01`, hasta: `${mes}-${ultimoDia}` }
}
