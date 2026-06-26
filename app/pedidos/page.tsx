import { Suspense } from 'react'
import { supabase } from '../../scr/lib/supabase'
import PedidosClient from './PedidosClient'

export const dynamic = 'force-dynamic'

type PedidoRow = {
  id: string
  nombre: string
  instagram: string
  lugar_entrega: string
  fecha_entrega: string
  hora_entrega: string
  estatus: string
  kits: string[]
}

async function pedidosConKits(
  filtroEliminado: boolean
): Promise<PedidoRow[]> {
  const query = supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: pedidos } = filtroEliminado
    ? await query.eq('eliminado', true)
    : await query.neq('eliminado', true)

  const pedidoIds = pedidos?.map((p) => p.id) ?? []

  let pedidoKits: {
    pedido_id: string
    kits: { nombre: string } | { nombre: string }[] | null
  }[] = []

  if (pedidoIds.length > 0) {
    const { data } = await supabase
      .from('pedido_kits')
      .select(`
        pedido_id,
        kits (
          nombre
        )
      `)
      .in('pedido_id', pedidoIds)

    pedidoKits = data ?? []
  }

  return (
    pedidos?.map((pedido) => ({
      id: pedido.id,
      nombre: pedido.nombre ?? '',
      instagram: pedido.instagram ?? '',
      lugar_entrega: pedido.lugar_entrega ?? '',
      fecha_entrega: pedido.fecha_entrega ?? '',
      hora_entrega: pedido.hora_entrega ?? '',
      estatus: pedido.estatus ?? 'Pendiente',
      kits:
        pedidoKits
          .filter((pk) => pk.pedido_id === pedido.id)
          .map((pk) => {
            const kit = pk.kits
            if (Array.isArray(kit)) {
              return kit[0]?.nombre
            }
            return kit?.nombre
          })
          .filter(Boolean) ?? []
    })) ?? []
  )
}

export default async function PedidosPage() {
  const [pedidosActivos, pedidosEliminados] =
    await Promise.all([
      pedidosConKits(false),
      pedidosConKits(true)
    ])

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
        pedidosIniciales={pedidosActivos}
        pedidosEliminadosIniciales={pedidosEliminados}
      />
    </Suspense>
  )
}
