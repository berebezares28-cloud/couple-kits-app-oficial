export const dynamic = 'force-dynamic'

import {
  listarGastos,
  normalizarFinanzasResumen,
  obtenerFinanzasResumen
} from '../../scr/lib/finanzasData'
import { supabase } from '../../scr/lib/supabase'
import FinanzasClient from './FinanzasClient'

export default async function FinanzasPage() {
  const mes = new Date().toISOString().slice(0, 7)

  const [resumen, gastos] = await Promise.all([
    obtenerFinanzasResumen(supabase, mes),
    listarGastos(supabase, { mes })
  ])

  return (
    <FinanzasClient
      resumenInicial={normalizarFinanzasResumen(resumen)}
      gastosIniciales={gastos}
    />
  )
}
