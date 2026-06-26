import { listarPuntosEntrega } from '../../../scr/lib/puntosEntrega'
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

  if (!pedido || pedido.eliminado) {
    notFound()
  }

  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select(`
      kit_id,
      cantidad,
      precio_unitario,
      kits (
        nombre,
        precio_venta
      )
    `)
    .eq('pedido_id', params.id)

  const kits =
    pedidoKits?.map((item: {
      kit_id: string
      cantidad: number
      precio_unitario: number | null
      kits: {
        nombre: string
        precio_venta: number | null
      } | {
        nombre: string
        precio_venta: number | null
      }[] | null
    }) => {
      const kitData = item.kits
      const datos = Array.isArray(kitData)
        ? kitData[0]
        : kitData

      return {
        kit_id: item.kit_id,
        nombre: datos?.nombre ?? 'Kit',
        cantidad: Number(item.cantidad) || 1,
        precio_venta:
          item.precio_unitario != null
            ? Number(item.precio_unitario)
            : datos?.precio_venta != null
              ? Number(datos.precio_venta)
              : null
      }
    }) ?? []

  const [kitsDisponiblesResult, puntosEntrega] =
    await Promise.all([
      supabase
        .from('kits')
        .select('id, nombre, precio_venta')
        .eq('activo', true)
        .order('nombre', { ascending: true }),
      listarPuntosEntrega(supabase)
    ])

  const kitsDisponibles =
    kitsDisponiblesResult.data?.map((k) => ({
      id: k.id,
      nombre: k.nombre ?? 'Kit',
      precio_venta:
        k.precio_venta != null
          ? Number(k.precio_venta)
          : null
    })) ?? []

  return (
    <PedidoDetalle
      pedido={{
        id: pedido.id,
        nombre: pedido.nombre ?? '',
        instagram: pedido.instagram ?? '',
        estatus: pedido.estatus ?? 'Pendiente',
        fecha_entrega: pedido.fecha_entrega,
        hora_entrega: pedido.hora_entrega,
        lugar_entrega: pedido.lugar_entrega,
        metodo_pago: pedido.metodo_pago,
        ocasion: pedido.ocasion,
        semillas: pedido.semillas,
        nota: pedido.nota,
        recibe_comision: pedido.recibe_comision ?? false,
        porcentaje_comision:
          pedido.porcentaje_comision != null
            ? Number(pedido.porcentaje_comision)
            : null,
        punto_entrega_id: pedido.punto_entrega_id ?? null
      }}
      kits={kits}
      kitsDisponibles={kitsDisponibles}
      puntosEntrega={puntosEntrega}
    />
  )
}
