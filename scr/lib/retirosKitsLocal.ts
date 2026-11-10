export type RetiroKitLocal = {
  operacion_id: string
  kit_id: string
  cantidad: number
  fecha: string
  motivo: string
}

export function esUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor)
}

export function validarRetiroKitLocal(body: unknown):
  | { ok: true; retiro: RetiroKitLocal }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Datos inválidos' }
  const datos = body as Record<string, unknown>
  if (!esUuid(datos.operacion_id) || !esUuid(datos.kit_id)) return { ok: false, error: 'Kit o retiro inválido' }
  if (typeof datos.cantidad !== 'number' || !Number.isInteger(datos.cantidad) || datos.cantidad < 1 || datos.cantidad > 2147483647) {
    return { ok: false, error: 'Escribe una cantidad entera mayor a cero' }
  }
  if (typeof datos.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha)) return { ok: false, error: 'Fecha inválida' }
  const fecha = new Date(`${datos.fecha}T12:00:00Z`)
  if (!Number.isFinite(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== datos.fecha) return { ok: false, error: 'Fecha inválida' }
  if (typeof datos.motivo !== 'string' || !datos.motivo.trim() || datos.motivo.trim().length > 1000) {
    return { ok: false, error: 'Escribe el motivo del retiro (hasta 1000 caracteres)' }
  }
  return { ok: true, retiro: {
    operacion_id: datos.operacion_id,
    kit_id: datos.kit_id,
    cantidad: datos.cantidad,
    fecha: datos.fecha,
    motivo: datos.motivo.trim()
  } }
}
