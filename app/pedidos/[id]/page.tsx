import { supabase } from '../../../scr/lib/supabase'
import PedidoDetalle from './PedidoDetalle'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PedidoPage({
  params
}: {
  params: {
    id: string
  }
}) {
  const { data: pedido } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!pedido) {
    notFound()
  }

  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select(`
      kit_id,
      cantidad,
      kits (
        nombre
      )
    `)
    .eq('pedido_id', params.id)

  const kits =
    pedidoKits?.map((item: any) => ({
      kit_id: item.kit_id,
      nombre: item.kits?.nombre ?? 'Kit',
      cantidad: item.cantidad
    })) ?? []

  const { data: kitsDisponibles } = await supabase
    .from('kits')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  return (
    <PedidoDetalle
      pedido={pedido}
      kits={kits}
      kitsDisponibles={kitsDisponibles ?? []}
    />
  )
}