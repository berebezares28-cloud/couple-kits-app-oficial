export const dynamic = 'force-dynamic'

import { autorizarApp } from '../../../../../scr/lib/appAuth'
import { obtenerEstadisticasComisionPunto } from '../../../../../scr/lib/puntosEntrega'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const acceso = await autorizarApp(_req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  try {
    const estadisticas =
      await obtenerEstadisticasComisionPunto(
        supabase,
        params.id
      )

    return Response.json(estadisticas)
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando estadísticas' },
      { status: 500 }
    )
  }
}
