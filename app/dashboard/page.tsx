export const dynamic = 'force-dynamic'

import { obtenerDashboardData } from '../../scr/lib/dashboardData'
import { exigirFinanzasPagina } from '../../scr/lib/finanzasAuth'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const { client: supabase } = await exigirFinanzasPagina('/dashboard')
  const data = await obtenerDashboardData(supabase)

  return <DashboardClient data={data} />
}
