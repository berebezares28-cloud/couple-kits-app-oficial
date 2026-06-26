import { notFound } from 'next/navigation'
import {
  obtenerKit,
  obtenerRecetaKit,
  obtenerVentasDetalleKit
} from '../../../scr/lib/kitsData'
import { supabase } from '../../../scr/lib/supabase'
import KitDetalle from './KitDetalle'

export const dynamic = 'force-dynamic'

export default async function KitPage({
  params
}: {
  params: { id: string }
}) {
  const kit = await obtenerKit(supabase, params.id)

  if (!kit) {
    notFound()
  }

  const [receta, ventasHistorico, ventasRango, insumosResult] =
    await Promise.all([
      obtenerRecetaKit(supabase, params.id),
      obtenerVentasDetalleKit(supabase, params.id),
      obtenerVentasDetalleKit(supabase, params.id),
      supabase
        .from('insumos')
        .select('id, nombre, categoria')
        .eq('activo', true)
        .order('nombre', { ascending: true })
    ])

  const insumos =
    insumosResult.data?.map((insumo) => ({
      id: insumo.id,
      nombre: insumo.nombre,
      categoria: insumo.categoria ?? 'otro'
    })) ?? []

  return (
    <KitDetalle
      kit={kit}
      receta={receta}
      ventasHistorico={ventasHistorico.total}
      ventasRangoInicial={ventasRango}
      insumos={insumos}
    />
  )
}
