export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { listarInsumosConStock } from '../../scr/lib/calcularStock'
import { exigirAppPagina } from '../../scr/lib/appAuth'
import InsumosClient from './InsumosClient'

export default async function InsumosPage() {
  const { client: supabase } = await exigirAppPagina()

  const insumos =
    await listarInsumosConStock(supabase)

  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <InsumosClient
        insumosIniciales={insumos}
      />
    </Suspense>
  )
}
