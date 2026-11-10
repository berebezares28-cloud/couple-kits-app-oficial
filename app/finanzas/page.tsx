export const dynamic = 'force-dynamic'

import {
  listarGastos,
  normalizarFinanzasResumen,
  obtenerFinanzasResumen
} from '../../scr/lib/finanzasData'
import { exigirFinanzasPagina } from '../../scr/lib/finanzasAuth'
import { listarIngresosExtra, rangoMes } from '../../scr/lib/ingresosExtra'
import FinanzasClient from './FinanzasClient'

export default async function FinanzasPage() {
  const { client: supabase } = await exigirFinanzasPagina()
  const mes = new Date().toISOString().slice(0, 7)

  const [resumen, gastos, ingresos] = await Promise.all([
    obtenerFinanzasResumen(supabase, mes),
    listarGastos(supabase, { mes }),
    listarIngresosExtra(supabase, rangoMes(mes) ?? undefined)
  ])

  return (
    <FinanzasClient
      resumenInicial={normalizarFinanzasResumen(resumen)}
      gastosIniciales={gastos}
      ingresosIniciales={ingresos}
    />
  )
}
