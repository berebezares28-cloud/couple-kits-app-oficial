import { notFound } from 'next/navigation'
import {
  calcularCostoPromedioSimple,
  calcularStockPorInsumo,
  obtenerHistorialCompras,
  obtenerHistorialConsumoPedidos
} from '../../../scr/lib/calcularStock'
import { supabase } from '../../../scr/lib/supabase'
import InsumoDetalle from './InsumoDetalle'

export const dynamic = 'force-dynamic'

export default async function InsumoPage({
  params
}: {
  params: { id: string }
}) {
  const { data: insumo } = await supabase
    .from('insumos')
    .select(
      'id, nombre, categoria, unidad, stock_minimo, costo_promedio'
    )
    .eq('id', params.id)
    .single()

  if (!insumo) {
    notFound()
  }

  const [stock_actual, compras, consumoPedidos] =
    await Promise.all([
      calcularStockPorInsumo(supabase, insumo.id),
      obtenerHistorialCompras(supabase, insumo.id),
      obtenerHistorialConsumoPedidos(
        supabase,
        insumo.id
      )
    ])

  const costoPromedio =
    calcularCostoPromedioSimple(compras)

  return (
    <InsumoDetalle
      insumo={{
        id: insumo.id,
        nombre: insumo.nombre,
        categoria: insumo.categoria ?? 'otro',
        unidad: insumo.unidad ?? 'pieza',
        stock_minimo: Number(insumo.stock_minimo) || 0,
        stock_actual,
        costo_promedio:
          insumo.costo_promedio != null
            ? Number(insumo.costo_promedio)
            : null
      }}
      compras={compras}
      costoPromedio={costoPromedio}
      consumoPedidos={consumoPedidos}
    />
  )
}
