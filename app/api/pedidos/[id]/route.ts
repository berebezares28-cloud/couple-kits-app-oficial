import { eliminarPedido } from '../../../../scr/lib/descontarInventario'
import { supabase } from '../../../../scr/lib/supabase'

const EDITABLE_FIELDS = [
  'estatus',
  'fecha_entrega',
  'hora_entrega',
  'lugar_entrega',
  'metodo_pago',
  'ocasion',
  'semillas',
  'nota',
  'recibe_comision',
  'porcentaje_comision',
  'punto_entrega_id',
] as const

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const update: Record<string, string | number | boolean | null> = {}

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        update[field] = body[field] ?? null
      }
    }

    if (Object.keys(update).length === 0) {
      return Response.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('pedidos')
      .update(update)
      .eq('id', params.id)

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error actualizando pedido' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resultado = await eliminarPedido(
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
      { error: 'Error eliminando pedido' },
      { status: 500 }
    )
  }
}
