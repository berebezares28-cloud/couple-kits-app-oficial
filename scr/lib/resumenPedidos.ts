import type { SupabaseClient } from '@supabase/supabase-js'

export type ResumenLugar = {
  lugar: string
  pedidos: number
  sinKits: number
  kits: { id: string; nombre: string; cantidad: number }[]
  cantidad: number
}

export async function obtenerResumenPedidos(
  supabase: SupabaseClient,
  fecha: string
): Promise<ResumenLugar[]> {
  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('id, lugar_entrega')
    .eq('fecha_entrega', fecha)
    .in('estatus', ['Pendiente', 'Confirmado'])
    .neq('eliminado', true)

  if (error) throw new Error('No se pudieron cargar los pedidos. Intenta de nuevo.')
  if (!pedidos?.length) return []

  const { data: lineas, error: errorKits } = await supabase
    .from('pedido_kits')
    .select('pedido_id, kit_id, cantidad, kits ( nombre )')
    .in('pedido_id', pedidos.map((p) => p.id))

  if (errorKits) throw new Error('No se pudieron cargar los kits. Intenta de nuevo.')

  const grupos = new Map<string, ResumenLugar>()

  for (const pedido of pedidos) {
    const lugar = pedido.lugar_entrega?.trim() || 'Sin lugar de entrega'
    const grupo: ResumenLugar = grupos.get(lugar) ?? {
      lugar, pedidos: 0, sinKits: 0, kits: [], cantidad: 0
    }
    grupo.pedidos++
    let cantidadPedido = 0

    for (const linea of (lineas ?? []).filter((l) => l.pedido_id === pedido.id)) {
      const cantidad = Number(linea.cantidad) || 0
      if (cantidad <= 0) continue
      const kit = Array.isArray(linea.kits) ? linea.kits[0] : linea.kits
      const existente = grupo.kits.find((k) => k.id === linea.kit_id)
      if (existente) existente.cantidad += cantidad
      else grupo.kits.push({
        id: linea.kit_id,
        nombre: kit?.nombre || 'Kit sin nombre',
        cantidad
      })
      grupo.cantidad += cantidad
      cantidadPedido += cantidad
    }

    if (!cantidadPedido) grupo.sinKits++
    grupos.set(lugar, grupo)
  }

  return Array.from(grupos.values())
    .sort((a, b) => a.lugar.localeCompare(b.lugar, 'es'))
    .map((grupo) => ({
      ...grupo,
      kits: grupo.kits.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    }))
}
