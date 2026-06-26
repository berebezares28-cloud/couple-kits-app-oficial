export const dynamic = 'force-dynamic'

import { obtenerDashboardData } from '../../scr/lib/dashboardData'
import { supabase } from '../../scr/lib/supabase'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const data = await obtenerDashboardData(supabase)

  return <DashboardClient data={data} />
}
