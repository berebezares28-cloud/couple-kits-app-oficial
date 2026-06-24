export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { listarInsumosConStock } from '../../../scr/lib/calcularStock'
import { supabase } from '../../../scr/lib/supabase'
import CompraClient from './CompraClient'

export default async function CompraPage() {
  const insumos =
    await listarInsumosConStock(supabase)

  return (
    <Suspense>
      <CompraClient insumos={insumos} />
    </Suspense>
  )
}
