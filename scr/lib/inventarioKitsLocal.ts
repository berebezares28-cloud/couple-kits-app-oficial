import { SupabaseClient } from '@supabase/supabase-js'

export type InventarioKitLocal = {
  kit_id: string
  kit_nombre: string
  cantidad: number
}

export type MovimientoKitLocal = {
  id: string
  kit_id: string
  kit_nombre: string
  tipo: 'entrada' | 'salida'
  cantidad: number
  fecha: string
  motivo: string | null
  notas: string | null
}

type Resultado =
  | { ok: true }
  | { ok: false; error: string }

async function ajustarCantidadInventario(
  supabase: SupabaseClient,
  puntoId: string,
  kitId: string,
  delta: number
): Promise<Resultado> {
  const { data: actual } = await supabase
    .from('inventario_kits_local')
    .select('id, cantidad')
    .eq('punto_entrega_id', puntoId)
    .eq('kit_id', kitId)
    .maybeSingle()

  const cantidadActual = Number(actual?.cantidad) || 0
  const nueva = cantidadActual + delta

  if (nueva < 0) {
    return {
      ok: false,
      error: 'No hay suficiente inventario en el local'
    }
  }

  if (actual) {
    const { error } = await supabase
      .from('inventario_kits_local')
      .update({
        cantidad: nueva,
        updated_at: new Date().toISOString()
      })
      .eq('id', actual.id)

    if (error) {
      return { ok: false, error: error.message }
    }

    return { ok: true }
  }

  if (delta < 0) {
    return {
      ok: false,
      error: 'No hay suficiente inventario en el local'
    }
  }

  const { error } = await supabase
    .from('inventario_kits_local')
    .insert({
      punto_entrega_id: puntoId,
      kit_id: kitId,
      cantidad: delta
    })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export async function listarInventarioKitsLocal(
  supabase: SupabaseClient,
  puntoId: string
): Promise<InventarioKitLocal[]> {
  const { data } = await supabase
    .from('inventario_kits_local')
    .select(
      `
      kit_id,
      cantidad,
      kits ( nombre )
    `
    )
    .eq('punto_entrega_id', puntoId)
    .order('updated_at', { ascending: false })

  return (
    data?.map((row) => {
      const kit = row.kits as
        | { nombre: string }
        | { nombre: string }[]
        | null
      const nombre = Array.isArray(kit)
        ? kit[0]?.nombre
        : kit?.nombre

      return {
        kit_id: row.kit_id,
        kit_nombre: nombre ?? 'Kit',
        cantidad: Number(row.cantidad) || 0
      }
    }) ?? []
  ).filter((row) => row.cantidad > 0)
}

export async function listarMovimientosKitsLocal(
  supabase: SupabaseClient,
  puntoId: string,
  limite = 20
): Promise<MovimientoKitLocal[]> {
  const { data } = await supabase
    .from('movimientos_kits_local')
    .select(
      `
      id,
      kit_id,
      tipo,
      cantidad,
      fecha,
      motivo,
      notas,
      kits ( nombre )
    `
    )
    .eq('punto_entrega_id', puntoId)
    .order('created_at', { ascending: false })
    .limit(limite)

  return (
    data?.map((row) => {
      const kit = row.kits as
        | { nombre: string }
        | { nombre: string }[]
        | null
      const nombre = Array.isArray(kit)
        ? kit[0]?.nombre
        : kit?.nombre

      return {
        id: row.id,
        kit_id: row.kit_id,
        kit_nombre: nombre ?? 'Kit',
        tipo: row.tipo as 'entrada' | 'salida',
        cantidad: Number(row.cantidad) || 0,
        fecha: row.fecha,
        motivo: row.motivo,
        notas: row.notas
      }
    }) ?? []
  )
}

export async function registrarEntradaKitsLocal(
  supabase: SupabaseClient,
  params: {
    punto_entrega_id: string
    fecha: string
    notas?: string | null
    kits: { kit_id: string; cantidad: number }[]
  }
): Promise<Resultado> {
  if (!params.kits.length) {
    return { ok: false, error: 'Agrega al menos un kit' }
  }

  for (const linea of params.kits) {
    const cantidad = Number(linea.cantidad)

    if (!linea.kit_id || !cantidad || cantidad <= 0) {
      return { ok: false, error: 'Cantidad o kit inválido' }
    }

    const ajuste = await ajustarCantidadInventario(
      supabase,
      params.punto_entrega_id,
      linea.kit_id,
      cantidad
    )

    if (!ajuste.ok) return ajuste

    const { error } = await supabase
      .from('movimientos_kits_local')
      .insert({
        punto_entrega_id: params.punto_entrega_id,
        kit_id: linea.kit_id,
        tipo: 'entrada',
        cantidad,
        fecha: params.fecha,
        motivo: 'Carga de kits al local',
        notas: params.notas ?? null
      })

    if (error) {
      return { ok: false, error: error.message }
    }
  }

  return { ok: true }
}

export async function descontarInventarioPorVentaLocal(
  supabase: SupabaseClient,
  params: {
    punto_entrega_id: string
    venta_local_id: string
    fecha: string
    kits: { kit_id: string; cantidad: number }[]
  }
): Promise<Resultado> {
  for (const linea of params.kits) {
    const cantidad = Number(linea.cantidad) || 0
    if (!linea.kit_id || cantidad <= 0) continue

    const { data: stock } = await supabase
      .from('inventario_kits_local')
      .select('cantidad')
      .eq('punto_entrega_id', params.punto_entrega_id)
      .eq('kit_id', linea.kit_id)
      .maybeSingle()

    const disponible = Number(stock?.cantidad) || 0

    if (disponible < cantidad) {
      const { data: kit } = await supabase
        .from('kits')
        .select('nombre')
        .eq('id', linea.kit_id)
        .maybeSingle()

      const nombre = kit?.nombre ?? 'kit'

      return {
        ok: false,
        error: `Stock insuficiente de ${nombre} en el local (hay ${disponible}, se necesitan ${cantidad}). Carga inventario primero.`
      }
    }
  }

  for (const linea of params.kits) {
    const cantidad = Number(linea.cantidad) || 0
    if (!linea.kit_id || cantidad <= 0) continue

    const ajuste = await ajustarCantidadInventario(
      supabase,
      params.punto_entrega_id,
      linea.kit_id,
      -cantidad
    )

    if (!ajuste.ok) return ajuste

    const { error } = await supabase
      .from('movimientos_kits_local')
      .insert({
        punto_entrega_id: params.punto_entrega_id,
        kit_id: linea.kit_id,
        tipo: 'salida',
        cantidad,
        fecha: params.fecha,
        motivo: 'Venta bulk',
        venta_local_id: params.venta_local_id
      })

    if (error) {
      return { ok: false, error: error.message }
    }
  }

  return { ok: true }
}

export async function devolverInventarioPorVentaLocal(
  supabase: SupabaseClient,
  ventaLocalId: string
): Promise<Resultado> {
  const { data: movimientos } = await supabase
    .from('movimientos_kits_local')
    .select(
      'id, punto_entrega_id, kit_id, cantidad, tipo'
    )
    .eq('venta_local_id', ventaLocalId)
    .eq('tipo', 'salida')

  if (!movimientos?.length) {
    return { ok: true }
  }

  for (const mov of movimientos) {
    const ajuste = await ajustarCantidadInventario(
      supabase,
      mov.punto_entrega_id,
      mov.kit_id,
      Number(mov.cantidad) || 0
    )

    if (!ajuste.ok) return ajuste
  }

  const { error } = await supabase
    .from('movimientos_kits_local')
    .delete()
    .eq('venta_local_id', ventaLocalId)
    .eq('tipo', 'salida')

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
