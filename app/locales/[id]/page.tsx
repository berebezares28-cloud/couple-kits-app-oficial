import { notFound } from 'next/navigation'
import {
  listarInventarioKitsLocal,
  listarMovimientosKitsLocal
} from '../../../scr/lib/inventarioKitsLocal'
import {
  calcularEstadisticasComision,
  obtenerHistorialPunto,
  obtenerPuntoEntrega
} from '../../../scr/lib/puntosEntrega'
import { supabase } from '../../../scr/lib/supabase'
import LocalDetalle from './LocalDetalle'
export const dynamic = 'force-dynamic'

export default async function LocalPage({
  params
}: {
  params: { id: string }
}) {
  const punto = await obtenerPuntoEntrega(
    supabase,
    params.id
  )

  if (!punto) {
    notFound()
  }

  const [historial, inventario, movimientos, kitsResult] =
    await Promise.all([
      obtenerHistorialPunto(supabase, params.id),
      listarInventarioKitsLocal(supabase, params.id),
      listarMovimientosKitsLocal(supabase, params.id, 15),
      supabase
        .from('kits')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre')
    ])

  const estadisticasComision = calcularEstadisticasComision(
    historial
  )

  return (
    <LocalDetalle
      punto={punto}
      ventasIniciales={historial.ventas}
      totalIngresos={historial.totalIngresos}
      totalComision={historial.totalComision}
      totalKits={historial.totalKits}
      estadisticasComision={estadisticasComision}
      inventarioInicial={inventario}
      movimientosIniciales={movimientos}
      kitsDisponibles={kitsResult.data ?? []}
    />
  )
}
