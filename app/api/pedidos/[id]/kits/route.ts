import { getSupabaseAdminOrError } from '../../../../../scr/lib/supabase-admin'
import { syncPedidoKits } from '../../../../../scr/lib/descontarInventario'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getSupabaseAdminOrError()

    if ('error' in admin) {
      return Response.json(
        { error: admin.error },
        { status: 500 }
      )
    }

    const supabase = admin.client
    const body = await req.json()

    if (!Array.isArray(body.kits)) {
      return Response.json(
        { error: 'Formato de kits inválido' },
        { status: 400 }
      )
    }

    for (const kit of body.kits) {
      if (!kit.kit_id) {
        return Response.json(
          { error: 'Cada kit debe tener kit_id' },
          { status: 400 }
        )
      }

      const cantidad = Number(kit.cantidad)

      if (!cantidad || cantidad < 1) {
        return Response.json(
          { error: 'La cantidad debe ser al menos 1' },
          { status: 400 }
        )
      }
    }

    const result = await syncPedidoKits(
      supabase,
      params.id,
      body.kits.map(
        (kit: { kit_id: string; cantidad: number }) => ({
          kit_id: kit.kit_id,
          cantidad: Number(kit.cantidad)
        })
      )
    )

    if (!result.ok) {
      return Response.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error actualizando kits del pedido' },
      { status: 500 }
    )
  }
}
