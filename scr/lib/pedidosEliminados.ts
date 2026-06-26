import { SupabaseClient } from '@supabase/supabase-js'

export const DIAS_RETENCION_PEDIDOS_ELIMINADOS = 7

export function fechaLimiteRetencion(
  dias = DIAS_RETENCION_PEDIDOS_ELIMINADOS
): string {
  const limite = new Date()
  limite.setDate(limite.getDate() - dias)
  return limite.toISOString()
}

export function diasRestantesParaPurga(
  eliminadoAt: string | null | undefined,
  dias = DIAS_RETENCION_PEDIDOS_ELIMINADOS
): number | null {
  if (!eliminadoAt) return null

  const expira = new Date(eliminadoAt)
  expira.setDate(expira.getDate() + dias)

  const diffMs = expira.getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

async function eliminarPedidoPermanentemente(
  supabase: SupabaseClient,
  pedidoId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select('id')
    .eq('pedido_id', pedidoId)

  const pedidoKitIds =
    pedidoKits?.map((pk) => pk.id) ?? []

  if (pedidoKitIds.length > 0) {
    const { error: recetaError } = await supabase
      .from('pedido_kit_receta')
      .delete()
      .in('pedido_kit_id', pedidoKitIds)

    if (recetaError) {
      return { ok: false, error: recetaError.message }
    }

    const { error: kitsError } = await supabase
      .from('pedido_kits')
      .delete()
      .eq('pedido_id', pedidoId)

    if (kitsError) {
      return { ok: false, error: kitsError.message }
    }
  }

  await supabase
    .from('movimientos_inventario')
    .delete()
    .eq('pedido_id', pedidoId)

  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', pedidoId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export async function purgarPedidosEliminadosExpirados(
  supabase: SupabaseClient,
  dias = DIAS_RETENCION_PEDIDOS_ELIMINADOS
): Promise<
  | {
      ok: true
      purgados: number
      ids: string[]
      errores: string[]
    }
  | { ok: false; error: string }
> {
  const limite = fechaLimiteRetencion(dias)

  const { data: expirados, error } = await supabase
    .from('pedidos')
    .select('id')
    .eq('eliminado', true)
    .not('eliminado_at', 'is', null)
    .lt('eliminado_at', limite)

  if (error) {
    return { ok: false, error: error.message }
  }

  if (!expirados?.length) {
    return {
      ok: true,
      purgados: 0,
      ids: [],
      errores: []
    }
  }

  const ids: string[] = []
  const errores: string[] = []

  for (const pedido of expirados) {
    const resultado = await eliminarPedidoPermanentemente(
      supabase,
      pedido.id
    )

    if (resultado.ok) {
      ids.push(pedido.id)
    } else {
      errores.push(`${pedido.id}: ${resultado.error}`)
    }
  }

  return {
    ok: true,
    purgados: ids.length,
    ids,
    errores
  }
}
