import { notFound } from 'next/navigation'
import {
  listarPuntosEntrega,
  obtenerVentaLocalBulk
} from '../../../../scr/lib/puntosEntrega'
import { supabase } from '../../../../scr/lib/supabase'
import VentaBulkClient from '../VentaBulkClient'

export const dynamic = 'force-dynamic'

export default async function EditarVentaBulkPage({
  params
}: {
  params: { id: string }
}) {
  const venta = await obtenerVentaLocalBulk(
    supabase,
    params.id
  )

  if (!venta) {
    notFound()
  }

  const [puntos, kitsResult] = await Promise.all([
    listarPuntosEntrega(supabase),
    supabase
      .from('kits')
      .select('id, nombre, precio_venta')
      .eq('activo', true)
      .order('nombre', { ascending: true })
  ])

  const kits =
    kitsResult.data?.map((k) => ({
      id: k.id,
      nombre: k.nombre ?? 'Kit',
      precio_venta:
        k.precio_venta != null
          ? Number(k.precio_venta)
          : null
    })) ?? []

  return (
    <VentaBulkClient
      puntos={puntos.map((p) => ({
        id: p.id,
        nombre: p.nombre
      }))}
      kits={kits}
      ventaId={venta.id}
      ventaInicial={{
        punto_entrega_id: venta.punto_entrega_id,
        fecha: venta.fecha,
        comision_monto: venta.comision_monto,
        metodo_pago: venta.metodo_pago,
        notas: venta.notas,
        kits: venta.kits.map((k) => ({
          kit_id: k.kit_id,
          cantidad: k.cantidad
        }))
      }}
    />
  )
}
