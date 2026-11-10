export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { listarInsumosConStock } from '../../../scr/lib/calcularStock'
import { exigirAppPagina } from '../../../scr/lib/appAuth'
import CompraClient from './CompraClient'

export default async function CompraPage() {
  const { client: supabase } = await exigirAppPagina()

  const [insumos, kitsResult] = await Promise.all([
    listarInsumosConStock(supabase),
    supabase
      .from('kits')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true })
  ])

  const kits =
    kitsResult.data?.map((k) => ({
      id: k.id,
      nombre: k.nombre ?? 'Kit'
    })) ?? []

  return (
    <Suspense>
      <CompraClient insumos={insumos} kits={kits} />
    </Suspense>
  )
}
