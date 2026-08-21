import { registrarEntradaKitsLocal } from '../../../../../scr/lib/inventarioKitsLocal'
import { supabase } from '../../../../../scr/lib/supabase'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    if (!Array.isArray(body.kits) || body.kits.length === 0) {
      return Response.json(
        { error: 'Agrega al menos un kit' },
        { status: 400 }
      )
    }

    for (const kit of body.kits) {
      if (!kit.kit_id) {
        return Response.json(
          { error: 'Kit inválido' },
          { status: 400 }
        )
      }

      const cantidad = Number(kit.cantidad)
      if (!cantidad || cantidad <= 0) {
        return Response.json(
          { error: 'Cantidad inválida' },
          { status: 400 }
        )
      }
    }

    const fecha =
      body.fecha ??
      new Date().toISOString().split('T')[0]

    const resultado = await registrarEntradaKitsLocal(
      supabase,
      {
        punto_entrega_id: params.id,
        fecha,
        notas: body.notas ?? null,
        kits: body.kits.map(
          (k: { kit_id: string; cantidad: number }) => ({
            kit_id: k.kit_id,
            cantidad: Number(k.cantidad)
          })
        )
      }
    )

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 400 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando inventario' },
      { status: 500 }
    )
  }
}
