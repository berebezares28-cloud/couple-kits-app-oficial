import { obtenerEstadisticasComisionPunto } from '../../../../../scr/lib/puntosEntrega'
import { supabase } from '../../../../../scr/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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
