import type { SupabaseClient } from '@supabase/supabase-js'

export type InsumosLocales = {
  insumo_id: string
  reservado_locales: number
  consumido_bulk: number
  total_no_disponible: number
}

// Una consulta mantiene reservas y ventas en la misma lectura de la base.
// Se incluyen todos los locales y las ventas históricas, sin filtro de fecha.
export async function obtenerInsumosLocales(supabase: SupabaseClient, insumoId?: string): Promise<InsumosLocales[]> {
  const { data, error } = await supabase.rpc('resumen_insumos_locales', { p_insumo_id: insumoId ?? null })
  if (error || !Array.isArray(data)) throw new Error('No se pudo calcular el inventario reservado en locales.')
  return data.map((fila) => {
    const reservado = Number(fila.reservado_locales)
    const vendido = Number(fila.consumido_bulk)
    if (![reservado, vendido].every((n) => Number.isFinite(n) && n >= 0)) {
      throw new Error('Revisa las cantidades de inventario y recetas de los locales.')
    }
    return { insumo_id: fila.insumo_id, reservado_locales: reservado,
      consumido_bulk: vendido, total_no_disponible: reservado + vendido }
  })
}
