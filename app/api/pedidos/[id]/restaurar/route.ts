import { restaurarPedido } from '../../../../../scr/lib/descontarInventario'
import { supabase } from '../../../../../scr/lib/supabase'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resultado = await restaurarPedido(
      supabase,
      params.id
    )

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error restaurando pedido' },
      { status: 500 }
    )
  }
}
