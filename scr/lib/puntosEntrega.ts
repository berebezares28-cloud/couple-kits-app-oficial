import { SupabaseClient } from '@supabase/supabase-js'
import {
  descontarInventarioPorVentaLocal,
  devolverInventarioPorVentaLocal
} from './inventarioKitsLocal'

export type PuntoEntrega = {
  id: string
  nombre: string
  tiene_comision: boolean
  porcentaje_comision: number | null
  activo: boolean
}

export type VentaLocalKit = {
  id: string
  kit_id: string
  kit_nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export type VentaLocal = {
  id: string
  fecha: string
  ingreso_total: number
  comision_monto: number
  notas: string | null
  kits: VentaLocalKit[]
  tipo: 'bulk' | 'pedido'
  pedido_id?: string
  cliente?: string
}

export const PORCENTAJES_COMISION = [10, 15, 20, 25] as const

export function esEntregaEnLocal(pedido: {
  punto_entrega_id?: string | null
}): boolean {
  return Boolean(pedido.punto_entrega_id)
}

function normalizarNombreLugar(
  valor: string | null | undefined
): string | null {
  const normalizado = valor?.trim().toLocaleLowerCase('es')
  return normalizado ? normalizado : null
}

export function buscarPuntoEntregaPorLugar(
  lugar: string | null | undefined,
  puntos: Pick<PuntoEntrega, 'id' | 'nombre'>[]
): Pick<PuntoEntrega, 'id' | 'nombre'> | null {
  const lugarNormalizado = normalizarNombreLugar(lugar)
  if (!lugarNormalizado) return null

  return (
    puntos.find(
      (punto) =>
        normalizarNombreLugar(punto.nombre) ===
        lugarNormalizado
    ) ?? null
  )
}

export function inferirEntregaDesdePedido(
  pedido: {
    punto_entrega_id?: string | null
    lugar_entrega?: string | null
  },
  puntos: Pick<PuntoEntrega, 'id' | 'nombre'>[]
): {
  tipo: 'directa' | 'local'
  punto_entrega_id: string | null
} {
  if (pedido.punto_entrega_id) {
    return {
      tipo: 'local',
      punto_entrega_id: pedido.punto_entrega_id
    }
  }

  const punto = buscarPuntoEntregaPorLugar(
    pedido.lugar_entrega,
    puntos
  )

  if (punto) {
    return {
      tipo: 'local',
      punto_entrega_id: punto.id
    }
  }

  return {
    tipo: 'directa',
    punto_entrega_id: null
  }
}

export type EstadisticasComision = {
  totalIngresos: number
  totalComision: number
  totalKits: number
  comisionPromedioPorKit: number | null
  porcentajePromedio: number | null
}

export function calcularEstadisticasComision(data: {
  totalIngresos: number
  totalComision: number
  totalKits: number
}): EstadisticasComision {
  return {
    totalIngresos: data.totalIngresos,
    totalComision: data.totalComision,
    totalKits: data.totalKits,
    comisionPromedioPorKit:
      data.totalKits > 0
        ? data.totalComision / data.totalKits
        : null,
    porcentajePromedio:
      data.totalIngresos > 0
        ? (data.totalComision / data.totalIngresos) * 100
        : null
  }
}

export async function listarPuntosEntrega(
  supabase: SupabaseClient
): Promise<PuntoEntrega[]> {
  const { data } = await supabase
    .from('puntos_entrega')
    .select(
      'id, nombre, tiene_comision, porcentaje_comision, activo'
    )
    .eq('activo', true)
    .order('nombre', { ascending: true })

  return (data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    tiene_comision: p.tiene_comision ?? false,
    porcentaje_comision:
      p.porcentaje_comision != null
        ? Number(p.porcentaje_comision)
        : null,
    activo: p.activo ?? true
  }))
}

export async function obtenerPuntoEntrega(
  supabase: SupabaseClient,
  id: string
): Promise<PuntoEntrega | null> {
  const { data } = await supabase
    .from('puntos_entrega')
    .select(
      'id, nombre, tiene_comision, porcentaje_comision, activo'
    )
    .eq('id', id)
    .eq('activo', true)
    .single()

  if (!data) return null

  return {
    id: data.id,
    nombre: data.nombre,
    tiene_comision: data.tiene_comision ?? false,
    porcentaje_comision:
      data.porcentaje_comision != null
        ? Number(data.porcentaje_comision)
        : null,
    activo: data.activo ?? true
  }
}

export async function crearPuntoEntrega(
  supabase: SupabaseClient,
  params: {
    nombre: string
    tiene_comision: boolean
    porcentaje_comision?: number | null
  }
): Promise<
  | { ok: true; id: string }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from('puntos_entrega')
    .insert({
      nombre: params.nombre.trim(),
      tiene_comision: params.tiene_comision,
      porcentaje_comision: params.tiene_comision
        ? params.porcentaje_comision ?? null
        : null,
      activo: true
    })
    .select('id')
    .single()

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'No se pudo crear'
    }
  }

  return { ok: true, id: data.id }
}

export async function actualizarPuntoEntrega(
  supabase: SupabaseClient,
  id: string,
  params: {
    nombre?: string
    tiene_comision?: boolean
    porcentaje_comision?: number | null
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const update: Record<string, unknown> = {}

  if (params.nombre != null) {
    update.nombre = params.nombre.trim()
  }

  if (params.tiene_comision != null) {
    update.tiene_comision = params.tiene_comision
  }

  if ('porcentaje_comision' in params) {
    update.porcentaje_comision =
      params.porcentaje_comision ?? null
  }

  const { error } = await supabase
    .from('puntos_entrega')
    .update(update)
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export async function eliminarPuntoEntrega(
  supabase: SupabaseClient,
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('puntos_entrega')
    .update({ activo: false })
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

function enRango(
  fecha: string,
  desde?: string,
  hasta?: string
): boolean {
  if (desde && fecha < desde) return false
  if (hasta && fecha > hasta) return false
  return true
}

export async function obtenerHistorialPunto(
  supabase: SupabaseClient,
  puntoId: string,
  filtros?: { desde?: string; hasta?: string }
): Promise<{
  ventas: VentaLocal[]
  totalIngresos: number
  totalComision: number
  totalKits: number
}> {
  const ventas: VentaLocal[] = []

  const { data: ventasBulk } = await supabase
    .from('ventas_local')
    .select(
      'id, fecha, ingreso_total, comision_monto, notas'
    )
    .eq('punto_entrega_id', puntoId)
    .order('fecha', { ascending: false })

  const ventaIds =
    ventasBulk?.map((v) => v.id) ?? []

  let kitsBulk: {
    venta_local_id: string
    kit_id: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    kits: { nombre: string } | { nombre: string }[] | null
  }[] = []

  if (ventaIds.length > 0) {
    const { data } = await supabase
      .from('ventas_local_kits')
      .select(`
        venta_local_id,
        kit_id,
        cantidad,
        precio_unitario,
        subtotal,
        kits ( nombre )
      `)
      .in('venta_local_id', ventaIds)

    kitsBulk = data ?? []
  }

  for (const venta of ventasBulk ?? []) {
    const fecha = venta.fecha

    if (!enRango(fecha, filtros?.desde, filtros?.hasta)) {
      continue
    }

    const lineas = kitsBulk
      .filter((k) => k.venta_local_id === venta.id)
      .map((k) => {
        const kit = k.kits as
          | { nombre: string }
          | { nombre: string }[]
          | null
        const nombre = Array.isArray(kit)
          ? kit[0]?.nombre
          : kit?.nombre

        return {
          id: k.kit_id,
          kit_id: k.kit_id,
          kit_nombre: nombre ?? 'Kit',
          cantidad: Number(k.cantidad),
          precio_unitario: Number(k.precio_unitario),
          subtotal: Number(k.subtotal)
        }
      })

    ventas.push({
      id: venta.id,
      fecha,
      ingreso_total: Number(venta.ingreso_total),
      comision_monto: Number(venta.comision_monto),
      notas: venta.notas,
      kits: lineas,
      tipo: 'bulk'
    })
  }

  ventas.sort((a, b) => b.fecha.localeCompare(a.fecha))

  const totalIngresos = ventas.reduce(
    (s, v) => s + v.ingreso_total,
    0
  )
  const totalComision = ventas.reduce(
    (s, v) => s + v.comision_monto,
    0
  )
  const totalKits = ventas.reduce(
    (s, v) =>
      s + v.kits.reduce((ks, k) => ks + k.cantidad, 0),
    0
  )

  return {
    ventas,
    totalIngresos,
    totalComision,
    totalKits
  }
}

export async function obtenerEstadisticasComisionPunto(
  supabase: SupabaseClient,
  puntoId: string
): Promise<EstadisticasComision> {
  const historial = await obtenerHistorialPunto(
    supabase,
    puntoId
  )

  return calcularEstadisticasComision(historial)
}

export async function registrarVentaLocalBulk(
  supabase: SupabaseClient,
  params: {
    punto_entrega_id: string
    fecha: string
    comision_monto: number
    metodo_pago?: string | null
    notas?: string
    kits: { kit_id: string; cantidad: number }[]
  }
): Promise<
  | { ok: true; ventaId: string }
  | { ok: false; error: string }
> {
  if (!params.kits.length) {
    return {
      ok: false,
      error: 'Agrega al menos un kit'
    }
  }

  const kitIds = params.kits.map((k) => k.kit_id)

  const { data: precios } = await supabase
    .from('kits')
    .select('id, precio_venta')
    .in('id', kitIds)

  const precioMap = new Map(
    precios?.map((k) => [
      k.id,
      Number(k.precio_venta) || 0
    ]) ?? []
  )

  const lineas = params.kits.map((k) => {
    const precio = precioMap.get(k.kit_id) ?? 0
    const cantidad = Number(k.cantidad) || 1

    return {
      kit_id: k.kit_id,
      cantidad,
      precio_unitario: precio,
      subtotal: precio * cantidad
    }
  })

  const ingreso_total = lineas.reduce(
    (s, l) => s + l.subtotal,
    0
  )

  const { data: venta, error: ventaError } =
    await supabase
      .from('ventas_local')
      .insert({
        punto_entrega_id: params.punto_entrega_id,
        fecha: params.fecha,
        ingreso_total,
        comision_monto: params.comision_monto,
        metodo_pago: params.metodo_pago ?? null,
        notas: params.notas ?? null
      })
      .select('id')
      .single()

  if (ventaError || !venta) {
    return {
      ok: false,
      error:
        ventaError?.message ??
        'No se pudo registrar la venta'
    }
  }

  const filas = lineas.map((l) => ({
    venta_local_id: venta.id,
    ...l
  }))

  const { error: kitsError } = await supabase
    .from('ventas_local_kits')
    .insert(filas)

  if (kitsError) {
    await supabase
      .from('ventas_local')
      .delete()
      .eq('id', venta.id)

    return { ok: false, error: kitsError.message }
  }

  const descuento = await descontarInventarioPorVentaLocal(
    supabase,
    {
      punto_entrega_id: params.punto_entrega_id,
      venta_local_id: venta.id,
      fecha: params.fecha,
      kits: lineas.map((l) => ({
        kit_id: l.kit_id,
        cantidad: l.cantidad
      }))
    }
  )

  if (!descuento.ok) {
    await supabase
      .from('ventas_local')
      .delete()
      .eq('id', venta.id)

    return { ok: false, error: descuento.error }
  }

  return { ok: true, ventaId: venta.id }
}

export async function obtenerVentaLocalBulk(
  supabase: SupabaseClient,
  ventaId: string
) {
  const { data: venta } = await supabase
    .from('ventas_local')
    .select(
      'id, punto_entrega_id, fecha, ingreso_total, comision_monto, metodo_pago, notas'
    )
    .eq('id', ventaId)
    .single()

  if (!venta) return null

  const { data: lineas } = await supabase
    .from('ventas_local_kits')
    .select('kit_id, cantidad, precio_unitario, subtotal')
    .eq('venta_local_id', ventaId)

  return {
    id: venta.id,
    punto_entrega_id: venta.punto_entrega_id,
    fecha: venta.fecha,
    ingreso_total: Number(venta.ingreso_total),
    comision_monto: Number(venta.comision_monto),
    metodo_pago: venta.metodo_pago ?? null,
    notas: venta.notas,
    kits:
      lineas?.map((l) => ({
        kit_id: l.kit_id,
        cantidad: Number(l.cantidad),
        precio_unitario: Number(l.precio_unitario),
        subtotal: Number(l.subtotal)
      })) ?? []
  }
}

export async function actualizarVentaLocalBulk(
  supabase: SupabaseClient,
  ventaId: string,
  params: {
    fecha: string
    comision_monto: number
    metodo_pago?: string | null
    notas?: string
    kits: { kit_id: string; cantidad: number }[]
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!params.kits.length) {
    return {
      ok: false,
      error: 'Agrega al menos un kit'
    }
  }

  const ventaActual = await obtenerVentaLocalBulk(
    supabase,
    ventaId
  )

  if (!ventaActual) {
    return { ok: false, error: 'Venta no encontrada' }
  }

  const devolucion = await devolverInventarioPorVentaLocal(
    supabase,
    ventaId
  )

  if (!devolucion.ok) {
    return devolucion
  }

  const precheck = await descontarInventarioPorVentaLocal(
    supabase,
    {
      punto_entrega_id: ventaActual.punto_entrega_id,
      venta_local_id: ventaId,
      fecha: params.fecha,
      kits: params.kits
    }
  )

  if (!precheck.ok) {
    await descontarInventarioPorVentaLocal(supabase, {
      punto_entrega_id: ventaActual.punto_entrega_id,
      venta_local_id: ventaId,
      fecha: ventaActual.fecha,
      kits: ventaActual.kits.map((k) => ({
        kit_id: k.kit_id,
        cantidad: k.cantidad
      }))
    })

    return { ok: false, error: precheck.error }
  }

  const kitIds = params.kits.map((k) => k.kit_id)

  const { data: precios } = await supabase
    .from('kits')
    .select('id, precio_venta')
    .in('id', kitIds)

  const precioMap = new Map(
    precios?.map((k) => [
      k.id,
      Number(k.precio_venta) || 0
    ]) ?? []
  )

  const lineas = params.kits.map((k) => {
    const precio = precioMap.get(k.kit_id) ?? 0
    const cantidad = Number(k.cantidad) || 1

    return {
      kit_id: k.kit_id,
      cantidad,
      precio_unitario: precio,
      subtotal: precio * cantidad
    }
  })

  const ingreso_total = lineas.reduce(
    (s, l) => s + l.subtotal,
    0
  )

  const { error: ventaError } = await supabase
    .from('ventas_local')
    .update({
      fecha: params.fecha,
      ingreso_total,
      comision_monto: params.comision_monto,
      metodo_pago: params.metodo_pago ?? null,
      notas: params.notas ?? null
    })
    .eq('id', ventaId)

  if (ventaError) {
    return { ok: false, error: ventaError.message }
  }

  const { error: deleteError } = await supabase
    .from('ventas_local_kits')
    .delete()
    .eq('venta_local_id', ventaId)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  const filas = lineas.map((l) => ({
    venta_local_id: ventaId,
    ...l
  }))

  const { error: kitsError } = await supabase
    .from('ventas_local_kits')
    .insert(filas)

  if (kitsError) {
    return { ok: false, error: kitsError.message }
  }

  return { ok: true }
}

export async function eliminarVentaLocalBulk(
  supabase: SupabaseClient,
  ventaId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const devolucion = await devolverInventarioPorVentaLocal(
    supabase,
    ventaId
  )

  if (!devolucion.ok) {
    return devolucion
  }

  const { error } = await supabase
    .from('ventas_local')
    .delete()
    .eq('id', ventaId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
