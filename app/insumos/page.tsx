export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { listarInsumosConStock } from '../../scr/lib/calcularStock'
import { supabase } from '../../scr/lib/supabase'
import InsumosClient from './InsumosClient'

export default async function InsumosPage() {
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
