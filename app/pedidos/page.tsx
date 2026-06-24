import { Suspense } from 'react'
import { supabase } from '../../scr/lib/supabase'
import PedidosClient from './PedidosClient'

export const dynamic = 'force-dynamic'

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
    <Suspense
      fallback={
        <main className="min-h-screen bg-white">
          <div className="max-w-md mx-auto px-5 pt-8 pb-24">
            <p className="text-gray-500">Cargando pedidos...</p>
          </div>
        </main>
      }
    >
      <PedidosClient
        pedidosIniciales={pedidosConKits}
      />
    </Suspense>
  )
}