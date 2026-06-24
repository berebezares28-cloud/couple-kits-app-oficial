import { listarInsumosConStock } from '../../../../scr/lib/calcularStock'
import { supabase } from '../../../../scr/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const insumos =
      await listarInsumosConStock(supabase)

    return Response.json(insumos)
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'No se pudo cargar insumos' },
      { status: 500 }
    )
  }
}
