import { Suspense } from 'react'
import { listarPuntosEntrega } from '../../../scr/lib/puntosEntrega'
import { exigirAppPagina } from '../../../scr/lib/appAuth'
import VentaBulkClient from './VentaBulkClient'

export const dynamic = 'force-dynamic'

export default async function VentaBulkPage() {
  const { client: supabase } = await exigirAppPagina()

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
    <Suspense>
      <VentaBulkClient
        puntos={puntos.map((p) => ({
          id: p.id,
          nombre: p.nombre
        }))}
        kits={kits}
      />
    </Suspense>
  )
}
