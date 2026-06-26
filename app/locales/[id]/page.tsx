import { notFound } from 'next/navigation'
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

  const historial = await obtenerHistorialPunto(
    supabase,
    params.id
  )

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
    />
  )
}
