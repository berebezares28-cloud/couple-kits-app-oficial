import { SupabaseClient } from '@supabase/supabase-js'

export type AsignacionRecetaKit = {
  kit_id: string
  cantidad: number
}

type ConsumoLinea = {
  insumoId: string
  nombre: string
  cantidad: number
}

export async function agregarInsumoARecetasKits(
  supabase: SupabaseClient,
  insumoId: string,
  asignaciones: AsignacionRecetaKit[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const asignacion of asignaciones) {
    if (!asignacion.kit_id || asignacion.cantidad <= 0) {
      continue
    }

    const { data: existente } = await supabase
      .from('recetas_kit')
      .select('id')
      .eq('kit_id', asignacion.kit_id)
      .eq('insumo_id', insumoId)
      .maybeSingle()

    if (existente) {
      const { error } = await supabase
        .from('recetas_kit')
        .update({ cantidad: asignacion.cantidad })
        .eq('id', existente.id)

      if (error) {
        return { ok: false, error: error.message }
      }
      continue
    }

    const { error } = await supabase
      .from('recetas_kit')
      .insert({
        kit_id: asignacion.kit_id,
        insumo_id: insumoId,
        cantidad: asignacion.cantidad
      })

    if (error) {
      return { ok: false, error: error.message }
    }
  }

  return { ok: true }
}

async function copiarRecetaSnapshot(
  supabase: SupabaseClient,
  pedidoKitId: string,
  kitId: string
) {
  const { data: recetas } = await supabase
    .from('recetas_kit')
    .select('insumo_id, cantidad')
    .eq('kit_id', kitId)

  if (!recetas?.length) return

  const filas = recetas
    .filter((r) => r.insumo_id)
    .map((r) => ({
      pedido_kit_id: pedidoKitId,
      insumo_id: r.insumo_id!,
      cantidad: Number(r.cantidad) || 0
    }))

  if (filas.length === 0) return

  await supabase.from('pedido_kit_receta').insert(filas)
}

export async function insertarPedidoKitsConSnapshot(
  supabase: SupabaseClient,
  pedidoId: string,
  kits: { kit_id: string; cantidad: number }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (kits.length === 0) {
    return { ok: true }
  }

  const kitIds = kits.map((k) => k.kit_id)

  const { data: kitsDb, error: kitsError } =
    await supabase
      .from('kits')
      .select('id, precio_venta')
      .in('id', kitIds)

  if (kitsError) {
    return { ok: false, error: kitsError.message }
  }

  const precios = new Map(
    kitsDb?.map((k) => [
      k.id,
      Number(k.precio_venta) || 0
    ]) ?? []
  )

  const rows = kits.map((kit) => {
    const precio = precios.get(kit.kit_id) ?? 0
    const cantidad = Number(kit.cantidad) || 1

    return {
      pedido_id: pedidoId,
      kit_id: kit.kit_id,
      cantidad,
      precio_unitario: precio,
      subtotal: precio * cantidad
    }
  })

  const { data: insertados, error: insertError } =
    await supabase
      .from('pedido_kits')
      .insert(rows)
      .select('id, kit_id')

  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  for (const pedidoKit of insertados ?? []) {
    await copiarRecetaSnapshot(
      supabase,
      pedidoKit.id,
      pedidoKit.kit_id
    )
  }

  return { ok: true }
}

export async function calcularConsumoDesdeSnapshots(
  supabase: SupabaseClient,
  pedidoKits: {
    id?: string
    kit_id: string
    cantidad: number
  }[]
): Promise<
  | { ok: true; lineas: ConsumoLinea[] }
  | { ok: false; error: string }
> {
  if (!pedidoKits.length) {
    return { ok: true, lineas: [] }
  }

  const pedidoKitIds = pedidoKits
    .map((pk) => pk.id)
    .filter(Boolean) as string[]

  const consumoPorInsumo = new Map<string, number>()

  if (pedidoKitIds.length > 0) {
    const { data: snapshots } = await supabase
      .from('pedido_kit_receta')
      .select('pedido_kit_id, insumo_id, cantidad')
      .in('pedido_kit_id', pedidoKitIds)

    const cantidadPorPedidoKit = new Map(
      pedidoKits
        .filter((pk) => pk.id)
        .map((pk) => [pk.id!, Number(pk.cantidad) || 1])
    )

    for (const snap of snapshots ?? []) {
      const kitCantidad =
        cantidadPorPedidoKit.get(snap.pedido_kit_id) ?? 1
      const total =
        Number(snap.cantidad) * kitCantidad

      consumoPorInsumo.set(
        snap.insumo_id,
        (consumoPorInsumo.get(snap.insumo_id) ?? 0) +
          total
      )
    }
  }

  const kitsSinSnapshot = pedidoKits.filter(
    (pk) => !pk.id
  )

  if (kitsSinSnapshot.length > 0) {
    const kitIds = kitsSinSnapshot.map((k) => k.kit_id)

    const { data: recetas } = await supabase
      .from('recetas_kit')
      .select('kit_id, insumo_id, cantidad')
      .in('kit_id', kitIds)

    for (const pedidoKit of kitsSinSnapshot) {
      const recetasDelKit =
        recetas?.filter(
          (r) => r.kit_id === pedidoKit.kit_id
        ) ?? []

      for (const receta of recetasDelKit) {
        if (!receta.insumo_id) continue

        const cantidad =
          Number(receta.cantidad) *
          (Number(pedidoKit.cantidad) || 1)

        consumoPorInsumo.set(
          receta.insumo_id,
          (consumoPorInsumo.get(receta.insumo_id) ??
            0) + cantidad
        )
      }
    }
  }

  if (consumoPorInsumo.size === 0) {
    return {
      ok: false,
      error:
        'Este pedido no tiene receta de insumos para sus kits'
    }
  }

  const insumoIds = Array.from(consumoPorInsumo.keys())

  const { data: insumos } = await supabase
    .from('insumos')
    .select('id, nombre')
    .in('id', insumoIds)

  const nombres = new Map(
    insumos?.map((i) => [i.id, i.nombre]) ?? []
  )

  const lineas: ConsumoLinea[] = []

  for (const [insumoId, cantidad] of Array.from(
    consumoPorInsumo.entries()
  )) {
    lineas.push({
      insumoId,
      nombre: nombres.get(insumoId) ?? 'Insumo',
      cantidad
    })
  }

  lineas.sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  )

  return { ok: true, lineas }
}

export async function consumoInsumosPorPedido(
  supabase: SupabaseClient,
  pedidoId: string
): Promise<Map<string, number>> {
  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select('id, kit_id, cantidad')
    .eq('pedido_id', pedidoId)

  const consumo = new Map<string, number>()

  if (!pedidoKits?.length) return consumo

  const resultado = await calcularConsumoDesdeSnapshots(
    supabase,
    pedidoKits
  )

  if (!resultado.ok) return consumo

  for (const linea of resultado.lineas) {
    consumo.set(linea.insumoId, linea.cantidad)
  }

  return consumo
}

export function precioLineaPedidoKit(
  pk: {
    precio_unitario?: number | null
    subtotal?: number | null
    cantidad?: number | null
    kits?:
      | { precio_venta: number | null }
      | { precio_venta: number | null }[]
      | null
  }
): number {
  if (pk.subtotal != null) {
    return Number(pk.subtotal)
  }

  const cantidad = Number(pk.cantidad) || 1

  if (pk.precio_unitario != null) {
    return Number(pk.precio_unitario) * cantidad
  }

  const kits = pk.kits
  if (!kits) return 0

  const datos = Array.isArray(kits) ? kits[0] : kits
  return (Number(datos?.precio_venta) || 0) * cantidad
}

export function pedidoActivo(
  pedido: { eliminado?: boolean | null }
): boolean {
  return pedido.eliminado !== true
}
