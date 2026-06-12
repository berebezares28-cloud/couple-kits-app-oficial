import { supabase } from '../../scr/lib/supabase'
import PedidosClient from './PedidosClient'

export default async function PedidosPage() {
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false })

  const pedidoIds =
    pedidos?.map((p) => p.id) ?? []

  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select(`
      pedido_id,
      kits (
        nombre
      )
    `)
    .in('pedido_id', pedidoIds)

  const pedidosConKits =
    pedidos?.map((pedido) => ({
      ...pedido,
      kits:
        pedidoKits
          ?.filter(
            (pk: any) =>
              pk.pedido_id === pedido.id
          )
          .map(
            (pk: any) =>
              (pk.kits as any)?.nombre
          )
          .filter(Boolean) ?? []
    })) ?? []
 
  return (
    <PedidosClient
      pedidosIniciales={pedidosConKits}
    />
  )
}