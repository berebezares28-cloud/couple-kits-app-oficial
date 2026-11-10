export const dynamic = 'force-dynamic'

import {
  obtenerBloqueRango,
  rangoPorDefecto,
  validarRangoFechas
} from '../../../../scr/lib/dashboardData'
import { autorizarFinanzas } from '../../../../scr/lib/finanzasAuth'

export async function GET(req: Request) {
  const acceso = await autorizarFinanzas(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  try {
    const url = new URL(req.url)
    const desdeParam = url.searchParams.get('desde')
    const hastaParam = url.searchParams.get('hasta')

    const defecto = rangoPorDefecto()
    const desde = desdeParam ?? defecto.desde
    const hasta = hastaParam ?? defecto.hasta

    const errorRango = validarRangoFechas(desde, hasta)
    if (errorRango) {
      return Response.json({ error: errorRango }, { status: 400 })
    }

    const bloque = await obtenerBloqueRango(
      supabase,
      desde,
      hasta
    )

    return Response.json(bloque)
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando KPIs' },
      { status: 500 }
    )
  }
}
