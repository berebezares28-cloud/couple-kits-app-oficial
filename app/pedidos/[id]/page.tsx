import { supabase } from '../../../scr/lib/supabase'
import PedidoDetalle from './PedidoDetalle'
import { notFound } from 'next/navigation'

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
      cantidad,
      kits (
        nombre
      )
    `)
    .eq('pedido_id', params.id)

  const kits =
    pedidoKits?.map((item: any) => ({
      nombre: item.kits?.nombre,
      cantidad: item.cantidad
    })) ?? []

  return (
    <PedidoDetalle
      pedido={pedido}
      kits={kits}
    />
  )
}