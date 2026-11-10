export const dynamic = 'force-dynamic'

import { autorizarApp } from '../../../../../scr/lib/appAuth'
import { restaurarPedido } from '../../../../../scr/lib/descontarInventario'

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const acceso = await autorizarApp(_req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

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
