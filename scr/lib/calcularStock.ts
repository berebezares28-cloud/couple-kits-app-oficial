import { SupabaseClient } from '@supabase/supabase-js'
import { esEntregaEnLocal } from './puntosEntrega'
import { pedidoActivo } from './pedidoSnapshots'

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

  const [movimientosResult, comprasResult] = await Promise.all([
    supabase.from('movimientos_inventario').select('insumo_id, cantidad').eq('tipo_movimiento', 'entrada'),
    supabase.from('compras_insumos').select('insumo_id, cantidad')
  ])
  const movimientos = movimientosResult.data
  const { data: compras, error } = comprasResult

  for (const mov of movimientos ?? []) {
    if (!mov.insumo_id) continue

    const actual =
      entradas.get(mov.insumo_id) ?? 0

    entradas.set(
      mov.insumo_id,
      actual + Number(mov.cantidad)
    )
  }

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
    .select('id, punto_entrega_id, eliminado')
    .eq('estatus', 'Entregado')
    .neq('eliminado', true)

  const pedidosDirectos =
    pedidos?.filter(
      (p) => !esEntregaEnLocal(p) && pedidoActivo(p)
    ) ?? []

  if (!pedidosDirectos.length) {
    return consumo
  }

  const pedidoIds = pedidosDirectos.map((p) => p.id)
  // Leer por lotes evita volver a pedir líneas, recetas y nombres por cada pedido.
  for (let inicio = 0; inicio < pedidoIds.length; inicio += 100) {
    const lineas: { id: string; cantidad: number }[] = []
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await supabase
        .from('pedido_kits').select('id, cantidad')
        .in('pedido_id', pedidoIds.slice(inicio, inicio + 100)).order('id').range(desde, desde + 999)
      if (error) throw new Error('No se pudo calcular el consumo de inventario.')
      lineas.push(...(data ?? []))
      if (!data || data.length < 1000) break
    }
    if (!lineas.length) continue
    const cantidades = new Map(lineas.map((l) => [l.id, Number(l.cantidad) || 1]))
    const ids = lineas.map((l) => l.id)
    for (let j = 0; j < ids.length; j += 100) {
      for (let desde = 0; ; desde += 1000) {
        const { data: recetas, error: errorRecetas } = await supabase
          .from('pedido_kit_receta').select('pedido_kit_id, insumo_id, cantidad')
          .in('pedido_kit_id', ids.slice(j, j + 100)).order('id').range(desde, desde + 999)
        if (errorRecetas) throw new Error('No se pudieron leer las recetas del inventario.')
        for (const r of recetas ?? []) {
          const cantidad = Number(r.cantidad) * (cantidades.get(r.pedido_kit_id) ?? 1)
          consumo.set(r.insumo_id, (consumo.get(r.insumo_id) ?? 0) + cantidad)
        }
        if (!recetas || recetas.length < 1000) break
      }
    }
  }

  return consumo
}

export async function calcularStockPorInsumo(
  supabase: SupabaseClient,
  insumoId: string
): Promise<number> {
  const [movimientosResult, comprasResult, consumo] = await Promise.all([
    supabase.from('movimientos_inventario').select('cantidad').eq('insumo_id', insumoId).eq('tipo_movimiento', 'entrada'),
    supabase.from('compras_insumos').select('cantidad').eq('insumo_id', insumoId),
    sumarConsumoEntregados(supabase)
  ])
  const entradas = [...(movimientosResult.data ?? []), ...(comprasResult.data ?? [])]
    .reduce((total, fila) => total + Number(fila.cantidad), 0)
  return entradas - (consumo.get(insumoId) ?? 0)
}

export async function calcularStockTodos(
  supabase: SupabaseClient
): Promise<Map<string, number>> {
  const stock = new Map<string, number>()

  const [insumosResult, entradas, consumo] = await Promise.all([
    supabase.from('insumos').select('id, stock_actual'),
    sumarEntradas(supabase),
    sumarConsumoEntregados(supabase)
  ])
  const insumos = insumosResult.data

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

export async function eliminarCompraInsumo(
  supabase: SupabaseClient,
  compraId: string,
  insumoId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: compra, error: fetchError } =
    await supabase
      .from('compras_insumos')
      .select('id, insumo_id')
      .eq('id', compraId)
      .single()

  if (fetchError || !compra) {
    return {
      ok: false,
      error: fetchError?.message ?? 'Compra no encontrada'
    }
  }

  if (compra.insumo_id !== insumoId) {
    return {
      ok: false,
      error: 'La compra no pertenece a este insumo'
    }
  }

  const { error } = await supabase
    .from('compras_insumos')
    .delete()
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
    .select(
      'id, nombre, instagram, fecha_entrega, punto_entrega_id, eliminado'
    )
    .eq('estatus', 'Entregado')
    .neq('eliminado', true)
    .order('fecha_entrega', { ascending: false })

  const pedidosDirectos =
    pedidos?.filter(
      (p) => !esEntregaEnLocal(p) && pedidoActivo(p)
    ) ?? []

  if (!pedidosDirectos.length) {
    return []
  }

  const pedidoIds = pedidosDirectos.map((p) => p.id)

  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select(`
      id,
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

  const pedidoKitIds = pedidoKits.map((pk) => pk.id)

  const { data: snapshots } = await supabase
    .from('pedido_kit_receta')
    .select('pedido_kit_id, cantidad')
    .eq('insumo_id', insumoId)
    .in('pedido_kit_id', pedidoKitIds)

  if (!snapshots?.length) {
    return []
  }

  const recetaPorPedidoKit = new Map(
    snapshots.map((s) => [
      s.pedido_kit_id,
      Number(s.cantidad)
    ])
  )

  const historial: ConsumoPedidoEntregado[] = []

  for (const pedido of pedidosDirectos) {
    const kitsDelPedido = pedidoKits.filter(
      (pk) => pk.pedido_id === pedido.id
    )

    const detalleKits: ConsumoPedidoEntregado['detalleKits'] =
      []
    let cantidadTotal = 0

    for (const pk of kitsDelPedido) {
      const porUnidad = recetaPorPedidoKit.get(pk.id)

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
