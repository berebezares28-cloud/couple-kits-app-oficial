import {
  obtenerBloqueRango,
  rangoPorDefecto,
  validarRangoFechas
} from '../../../scr/lib/dashboardData'
import { supabase } from '../../../scr/lib/supabase'

export async function GET(req: Request) {
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
