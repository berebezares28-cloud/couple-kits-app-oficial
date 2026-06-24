import { SupabaseClient } from '@supabase/supabase-js'
import { calcularConsumoDesdeKits } from './descontarInventario'

export type InsumoConStock = {
  id: string
  nombre: string
  categoria: string
  stock_minimo: number
  stock_actual: number
}

export type CompraInsumo = {
  id: string
  fecha: string
  cantidad: number
  costo_total: number | null
  costo_unitario: number | null
  notas: string | null
}

export type ConsumoPedidoEntregado = {
  pedidoId: string
  nombre: string
  instagram: string
  fechaEntrega: string
  cantidad: number
  detalleKits: {
    kitNombre: string
    kitCantidad: number
    consumo: number
  }[]
}

export function calcularCostoPromedioSimple(
  compras: CompraInsumo[]
): number | null {
  let totalCosto = 0
  let totalUnidades = 0

  for (const compra of compras) {
    if (compra.costo_total == null) continue

    totalCosto += Number(compra.costo_total)
    totalUnidades += Number(compra.cantidad)
  }

  if (totalUnidades === 0) return null

  return totalCosto / totalUnidades
}

export async function obtenerHistorialCompras(
  supabase: SupabaseClient,
  insumoId: string
): Promise<CompraInsumo[]> {
  const { data, error } = await supabase
    .from('compras_insumos')
    .select(
      'id, fecha, cantidad, costo_total, costo_unitario, notas'
    )
    .eq('insumo_id', insumoId)
    .order('fecha', { ascending: false })

  if (error || !data?.length) {
    return []
  }

  return data.map((compra) => ({
    id: compra.id,
    fecha: compra.fecha,
    cantidad: Number(compra.cantidad),
    costo_total:
      compra.costo_total != null
        ? Number(compra.costo_total)
        : null,
    costo_unitario:
      compra.costo_unitario != null
        ? Number(compra.costo_unitario)
        : null,
    notas: compra.notas
  }))
}

async function sumarEntradas(
  supabase: SupabaseClient
): Promise<Map<string, number>> {
  const entradas = new Map<string, number>()

  const { data: movimientos } = await supabase
    .from('movimientos_inventario')
    .select('insumo_id, cantidad')
    .eq('tipo_movimiento', 'entrada')

  for (const mov of movimientos ?? []) {
    if (!mov.insumo_id) continue

    const actual =
      entradas.get(mov.insumo_id) ?? 0

    entradas.set(
      mov.insumo_id,
      actual + Number(mov.cantidad)
    )
  }

  const { data: compras, error } =
    await supabase
      .from('compras_insumos')
      .select('insumo_id, cantidad')

  if (!error) {
    for (const compra of compras ?? []) {
      if (!compra.insumo_id) continue

      const actual =
        entradas.get(compra.insumo_id) ?? 0

      entradas.set(
        compra.insumo_id,
        actual + Number(compra.cantidad)
      )
    }
  }

  return entradas
}

async function sumarConsumoEntregados(
  supabase: SupabaseClient
): Promise<Map<string, number>> {
  const consumo = new Map<string, number>()

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id')
    .eq('estatus', 'Entregado')

  if (!pedidos?.length) {
    return consumo
  }

  const pedidoIds = pedidos.map((p) => p.id)

  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select('kit_id, cantidad')
    .in('pedido_id', pedidoIds)

  if (!pedidoKits?.length) {
    return consumo
  }

  const resultado =
    await calcularConsumoDesdeKits(
      supabase,
      pedidoKits
    )

  if (!resultado.ok) {
    return consumo
  }

  for (const linea of resultado.lineas) {
    consumo.set(linea.insumoId, linea.cantidad)
  }

  return consumo
}

export async function calcularStockPorInsumo(
  supabase: SupabaseClient,
  insumoId: string
): Promise<number> {
  let entradas = 0

  const { data: movimientos } = await supabase
    .from('movimientos_inventario')
    .select('cantidad')
    .eq('insumo_id', insumoId)
    .eq('tipo_movimiento', 'entrada')

  for (const mov of movimientos ?? []) {
    entradas += Number(mov.cantidad)
  }

  const { data: compras } = await supabase
    .from('compras_insumos')
    .select('cantidad')
    .eq('insumo_id', insumoId)

  for (const compra of compras ?? []) {
    entradas += Number(compra.cantidad)
  }

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id')
    .eq('estatus', 'Entregado')

  if (!pedidos?.length) {
    return entradas
  }

  const pedidoIds = pedidos.map((p) => p.id)

  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select('kit_id, cantidad')
    .in('pedido_id', pedidoIds)

  if (!pedidoKits?.length) {
    return entradas
  }

  const resultado = await calcularConsumoDesdeKits(
    supabase,
    pedidoKits
  )

  if (!resultado.ok) {
    return entradas
  }

  const consumido =
    resultado.lineas.find(
      (linea) => linea.insumoId === insumoId
    )?.cantidad ?? 0

  return entradas - consumido
}

export async function calcularStockTodos(
  supabase: SupabaseClient
): Promise<Map<string, number>> {
  const stock = new Map<string, number>()

  const { data: insumos } = await supabase
    .from('insumos')
    .select('id, stock_actual')

  for (const insumo of insumos ?? []) {
    stock.set(insumo.id, 0)
  }

  const entradas = await sumarEntradas(supabase)
  const consumo =
    await sumarConsumoEntregados(supabase)

  for (const insumo of insumos ?? []) {
    const entradasLedger =
      entradas.get(insumo.id) ?? 0
    const consumido =
      consumo.get(insumo.id) ?? 0

    let totalEntradas = entradasLedger

    stock.set(
      insumo.id,
      totalEntradas - consumido
    )
  }

  return stock
}

export async function listarInsumosConStock(
  supabase: SupabaseClient
): Promise<InsumoConStock[]> {
  const { data: insumos } = await supabase
    .from('insumos')
    .select('id, nombre, categoria, stock_minimo')
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true })

  if (!insumos?.length) {
    return []
  }

  const stockMap =
    await calcularStockTodos(supabase)

  return insumos.map((insumo) => ({
    id: insumo.id,
    nombre: insumo.nombre,
    categoria: insumo.categoria ?? 'otro',
    stock_minimo: Number(insumo.stock_minimo) || 0,
    stock_actual:
      stockMap.get(insumo.id) ?? 0
  }))
}

export async function registrarEntradaInsumo(
  supabase: SupabaseClient,
  params: {
    insumoId: string
    cantidad: number
    monto?: number | null
    motivo?: string
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hoy = new Date().toISOString().split('T')[0]
  const motivo =
    params.motivo ?? 'Compra registrada'
  const costoTotal = params.monto ?? null
  const costoUnitario =
    costoTotal != null && params.cantidad > 0
      ? costoTotal / params.cantidad
      : null

  const { error: compraError } = await supabase
    .from('compras_insumos')
    .insert({
      insumo_id: params.insumoId,
      cantidad: params.cantidad,
      costo_total: costoTotal,
      costo_unitario: costoUnitario,
      fecha: new Date().toISOString(),
      notas: motivo
    })

  if (!compraError) {
    await sincronizarCostoPromedioInsumo(
      supabase,
      params.insumoId
    )

    return { ok: true }
  }

  const intentos = [
    {
      insumo_id: params.insumoId,
      cantidad: params.cantidad,
      tipo_movimiento: 'entrada',
      motivo:
        costoTotal != null
          ? `${motivo} ($${costoTotal})`
          : motivo,
      fecha: hoy
    }
  ]

  for (const fila of intentos) {
    const { error } = await supabase
      .from('movimientos_inventario')
      .insert(fila)

    if (!error) {
      return { ok: true }
    }
  }

  return {
    ok: false,
    error:
      compraError.message ||
      'No se pudo registrar la compra'
  }
}

async function sincronizarCostoPromedioInsumo(
  supabase: SupabaseClient,
  insumoId: string
) {
  const historial =
    await obtenerHistorialCompras(
      supabase,
      insumoId
    )
  const promedio =
    calcularCostoPromedioSimple(historial)

  await supabase
    .from('insumos')
    .update({ costo_promedio: promedio })
    .eq('id', insumoId)
}

export async function actualizarCompraInsumo(
  supabase: SupabaseClient,
  compraId: string,
  insumoId: string,
  params: {
    cantidad: number
    monto?: number | null
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!params.cantidad || params.cantidad <= 0) {
    return {
      ok: false,
      error: 'La cantidad debe ser mayor a 0'
    }
  }

  const costoTotal = params.monto ?? null
  const costoUnitario =
    costoTotal != null && params.cantidad > 0
      ? costoTotal / params.cantidad
      : null

  const { error } = await supabase
    .from('compras_insumos')
    .update({
      cantidad: params.cantidad,
      costo_total: costoTotal,
      costo_unitario: costoUnitario
    })
    .eq('id', compraId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await sincronizarCostoPromedioInsumo(
    supabase,
    insumoId
  )

  return { ok: true }
}

export async function obtenerHistorialConsumoPedidos(
  supabase: SupabaseClient,
  insumoId: string
): Promise<ConsumoPedidoEntregado[]> {
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('id, nombre, instagram, fecha_entrega')
    .eq('estatus', 'Entregado')
    .order('fecha_entrega', { ascending: false })

  if (!pedidos?.length) {
    return []
  }

  const pedidoIds = pedidos.map((p) => p.id)

  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select(`
      pedido_id,
      kit_id,
      cantidad,
      kits (
        nombre
      )
    `)
    .in('pedido_id', pedidoIds)

  if (!pedidoKits?.length) {
    return []
  }

  const kitIds = Array.from(
    new Set(
      pedidoKits.map((pk) => pk.kit_id).filter(Boolean)
    )
  )

  const { data: recetas } = await supabase
    .from('recetas_kit')
    .select('kit_id, cantidad')
    .eq('insumo_id', insumoId)
    .in('kit_id', kitIds)

  if (!recetas?.length) {
    return []
  }

  const recetaPorKit = new Map(
    recetas.map((r) => [
      r.kit_id,
      Number(r.cantidad)
    ])
  )

  const historial: ConsumoPedidoEntregado[] = []

  for (const pedido of pedidos) {
    const kitsDelPedido = pedidoKits.filter(
      (pk) => pk.pedido_id === pedido.id
    )

    const detalleKits: ConsumoPedidoEntregado['detalleKits'] =
      []
    let cantidadTotal = 0

    for (const pk of kitsDelPedido) {
      const porUnidad = recetaPorKit.get(pk.kit_id)

      if (!porUnidad) continue

      const kitCantidad = Number(pk.cantidad) || 1
      const consumo = porUnidad * kitCantidad

      const kitData = pk.kits as
        | { nombre: string }
        | { nombre: string }[]
        | null

      const kitNombre = Array.isArray(kitData)
        ? kitData[0]?.nombre
        : kitData?.nombre

      detalleKits.push({
        kitNombre: kitNombre ?? 'Kit',
        kitCantidad,
        consumo
      })

      cantidadTotal += consumo
    }

    if (cantidadTotal <= 0) continue

    historial.push({
      pedidoId: pedido.id,
      nombre: pedido.nombre,
      instagram: pedido.instagram ?? '',
      fechaEntrega: pedido.fecha_entrega,
      cantidad: cantidadTotal,
      detalleKits
    })
  }

  return historial
}
