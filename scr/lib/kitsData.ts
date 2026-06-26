import { SupabaseClient } from '@supabase/supabase-js'
import { esEntregaEnLocal } from './puntosEntrega'
import { pedidoActivo } from './pedidoSnapshots'

export type KitBase = {
  id: string
  nombre: string
  precio_venta: number | null
  activo: boolean
}

export type KitConVentas = KitBase & {
  ventasTotal: number
}

export type RecetaLinea = {
  id: string
  insumo_id: string
  cantidad: number
  insumo_nombre: string
  insumo_unidad: string
  insumo_categoria: string
}

export type VentaPedido = {
  pedidoId: string
  nombre: string
  instagram: string
  fecha: string
  estatus: string
  cantidad: number
}

function fechaPedido(pedido: {
  fecha_entrega: string | null
  created_at: string | null
}): string {
  if (pedido.fecha_entrega) {
    return pedido.fecha_entrega
  }

  if (pedido.created_at) {
    return pedido.created_at.split('T')[0]
  }

  return ''
}

function pedidoEnRango(
  pedido: {
    fecha_entrega: string | null
    created_at: string | null
  },
  desde?: string,
  hasta?: string
): boolean {
  const fecha = fechaPedido(pedido)

  if (!fecha) return !desde && !hasta

  if (desde && fecha < desde) return false
  if (hasta && fecha > hasta) return false

  return true
}

export async function contarVentasKits(
  supabase: SupabaseClient,
  filtros?: {
    desde?: string
    hasta?: string
    kitId?: string
  }
): Promise<Map<string, number>> {
  const ventas = new Map<string, number>()

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(
      'id, estatus, fecha_entrega, created_at, punto_entrega_id, eliminado'
    )
    .eq('estatus', 'Entregado')
    .neq('eliminado', true)

  if (pedidos?.length) {
    const pedidosDirectos = pedidos.filter(
      (p) => !esEntregaEnLocal(p) && pedidoActivo(p)
    )

    const pedidosValidos = pedidosDirectos.filter((p) =>
      pedidoEnRango(p, filtros?.desde, filtros?.hasta)
    )

    if (pedidosValidos.length) {
      const pedidoIds = pedidosValidos.map((p) => p.id)

      let query = supabase
        .from('pedido_kits')
        .select('kit_id, cantidad')
        .in('pedido_id', pedidoIds)

      if (filtros?.kitId) {
        query = query.eq('kit_id', filtros.kitId)
      }

      const { data: pedidoKits } = await query

      for (const pk of pedidoKits ?? []) {
        if (!pk.kit_id) continue

        const actual = ventas.get(pk.kit_id) ?? 0
        ventas.set(
          pk.kit_id,
          actual + Number(pk.cantidad || 1)
        )
      }
    }
  }

  let ventasBulkQuery = supabase
    .from('ventas_local_kits')
    .select('kit_id, cantidad, ventas_local ( fecha )')

  if (filtros?.kitId) {
    ventasBulkQuery = ventasBulkQuery.eq(
      'kit_id',
      filtros.kitId
    )
  }

  const { data: ventasBulk } = await ventasBulkQuery

  for (const linea of ventasBulk ?? []) {
    if (!linea.kit_id) continue

    const venta = linea.ventas_local as
      | { fecha: string }
      | { fecha: string }[]
      | null
    const fecha = Array.isArray(venta)
      ? venta[0]?.fecha
      : venta?.fecha

    if (!fecha) continue
    if (filtros?.desde && fecha < filtros.desde) continue
    if (filtros?.hasta && fecha > filtros.hasta) continue

    const actual = ventas.get(linea.kit_id) ?? 0
    ventas.set(
      linea.kit_id,
      actual + Number(linea.cantidad || 1)
    )
  }

  return ventas
}

export async function listarKitsConVentas(
  supabase: SupabaseClient
): Promise<KitConVentas[]> {
  const { data: kits } = await supabase
    .from('kits')
    .select('id, nombre, precio_venta, activo')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (!kits?.length) {
    return []
  }

  const ventas = await contarVentasKits(supabase)

  const kitsConVentas = kits.map((kit) => ({
    id: kit.id,
    nombre: kit.nombre ?? 'Kit',
    precio_venta:
      kit.precio_venta != null
        ? Number(kit.precio_venta)
        : null,
    activo: kit.activo ?? true,
    ventasTotal: ventas.get(kit.id) ?? 0
  }))

  kitsConVentas.sort((a, b) => {
    if (b.ventasTotal !== a.ventasTotal) {
      return b.ventasTotal - a.ventasTotal
    }

    return a.nombre.localeCompare(b.nombre, 'es')
  })

  return kitsConVentas
}

export async function obtenerKit(
  supabase: SupabaseClient,
  kitId: string
): Promise<KitBase | null> {
  const { data } = await supabase
    .from('kits')
    .select('id, nombre, precio_venta, activo')
    .eq('id', kitId)
    .single()

  if (!data) return null

  return {
    id: data.id,
    nombre: data.nombre ?? 'Kit',
    precio_venta:
      data.precio_venta != null
        ? Number(data.precio_venta)
        : null,
    activo: data.activo ?? true
  }
}

export async function obtenerRecetaKit(
  supabase: SupabaseClient,
  kitId: string
): Promise<RecetaLinea[]> {
  const { data } = await supabase
    .from('recetas_kit')
    .select(`
      id,
      insumo_id,
      cantidad,
      insumos (
        nombre,
        unidad,
        categoria
      )
    `)
    .eq('kit_id', kitId)

  if (!data?.length) {
    return []
  }

  return data
    .filter((linea) => linea.insumo_id)
    .map((linea) => {
      const insumo = linea.insumos as
        | {
            nombre: string
            unidad: string | null
            categoria: string | null
          }
        | {
            nombre: string
            unidad: string | null
            categoria: string | null
          }[]
        | null

      const datos = Array.isArray(insumo)
        ? insumo[0]
        : insumo

      return {
        id: linea.id,
        insumo_id: linea.insumo_id!,
        cantidad: Number(linea.cantidad) || 0,
        insumo_nombre: datos?.nombre ?? 'Insumo',
        insumo_unidad: datos?.unidad ?? 'pieza',
        insumo_categoria: datos?.categoria ?? 'otro'
      }
    })
    .sort((a, b) =>
      a.insumo_nombre.localeCompare(b.insumo_nombre, 'es')
    )
}

export async function obtenerVentasDetalleKit(
  supabase: SupabaseClient,
  kitId: string,
  filtros?: { desde?: string; hasta?: string }
): Promise<{
  total: number
  pedidos: VentaPedido[]
}> {
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(
      'id, nombre, instagram, estatus, fecha_entrega, created_at, punto_entrega_id, eliminado'
    )
    .eq('estatus', 'Entregado')
    .neq('eliminado', true)
    .order('fecha_entrega', { ascending: false })

  if (!pedidos?.length) {
    return { total: 0, pedidos: [] }
  }

  const pedidosValidos = pedidos.filter(
    (p) =>
      !esEntregaEnLocal(p) &&
      pedidoActivo(p) &&
      pedidoEnRango(p, filtros?.desde, filtros?.hasta)
  )

  if (!pedidosValidos.length) {
    return { total: 0, pedidos: [] }
  }

  const pedidoIds = pedidosValidos.map((p) => p.id)

  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select('pedido_id, cantidad')
    .eq('kit_id', kitId)
    .in('pedido_id', pedidoIds)

  if (!pedidoKits?.length) {
    return { total: 0, pedidos: [] }
  }

  const cantidadPorPedido = new Map<string, number>()

  for (const pk of pedidoKits) {
    const actual =
      cantidadPorPedido.get(pk.pedido_id) ?? 0
    cantidadPorPedido.set(
      pk.pedido_id,
      actual + Number(pk.cantidad || 1)
    )
  }

  const pedidosMap = new Map(
    pedidosValidos.map((p) => [p.id, p])
  )

  const detalle: VentaPedido[] = []

  for (const [pedidoId, cantidad] of Array.from(
    cantidadPorPedido.entries()
  )) {
    const pedido = pedidosMap.get(pedidoId)

    if (!pedido) continue

    detalle.push({
      pedidoId,
      nombre: pedido.nombre ?? 'Pedido',
      instagram: pedido.instagram ?? '',
      fecha: fechaPedido(pedido),
      estatus: pedido.estatus ?? 'Pendiente',
      cantidad
    })
  }

  detalle.sort((a, b) => b.fecha.localeCompare(a.fecha))

  const total = detalle.reduce(
    (suma, p) => suma + p.cantidad,
    0
  )

  return { total, pedidos: detalle }
}

export async function sincronizarRecetaKit(
  supabase: SupabaseClient,
  kitId: string,
  lineas: { insumo_id: string; cantidad: number }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error: deleteError } = await supabase
    .from('recetas_kit')
    .delete()
    .eq('kit_id', kitId)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  if (lineas.length === 0) {
    return { ok: true }
  }

  const filas = lineas.map((linea) => ({
    kit_id: kitId,
    insumo_id: linea.insumo_id,
    cantidad: linea.cantidad
  }))

  const { error: insertError } = await supabase
    .from('recetas_kit')
    .insert(filas)

  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  return { ok: true }
}

export async function crearKit(
  supabase: SupabaseClient,
  params: {
    nombre: string
    precio_venta?: number | null
    receta: { insumo_id: string; cantidad: number }[]
  }
): Promise<
  | { ok: true; kitId: string }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from('kits')
    .insert({
      nombre: params.nombre.trim(),
      precio_venta: params.precio_venta ?? null,
      activo: true
    })
    .select('id')
    .single()

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'No se pudo crear el kit'
    }
  }

  const receta = await sincronizarRecetaKit(
    supabase,
    data.id,
    params.receta
  )

  if (!receta.ok) {
    await supabase.from('kits').delete().eq('id', data.id)
    return receta
  }

  return { ok: true, kitId: data.id }
}

export async function eliminarKit(
  supabase: SupabaseClient,
  kitId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('kits')
    .update({ activo: false })
    .eq('id', kitId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
