export const dynamic = 'force-dynamic'

import { obtenerConsolidacionVentas } from '../../scr/lib/consolidacionVentas'
import { listarKitsConVentas } from '../../scr/lib/kitsData'
import { supabase } from '../../scr/lib/supabase'
import KitsClient from './KitsClient'

export default async function KitsPage() {
  const [kits, insumosResult, consolidacion] =
    await Promise.all([
      listarKitsConVentas(supabase),
      supabase
        .from('insumos')
        .select('id, nombre, categoria, unidad')
        .eq('activo', true)
        .order('nombre', { ascending: true }),
      obtenerConsolidacionVentas(supabase)
    ])

  const insumos =
    insumosResult.data?.map((insumo) => ({
      id: insumo.id,
      nombre: insumo.nombre,
      categoria: insumo.categoria ?? 'otro',
      unidad: insumo.unidad ?? 'pieza'
    })) ?? []

  return (
    <KitsClient
      kitsIniciales={kits}
      insumos={insumos}
      consolidacion={consolidacion}
    />
  )
}
