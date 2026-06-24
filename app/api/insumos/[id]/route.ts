import { getSupabaseAdminOrError } from '../../../../scr/lib/supabase-admin'

const EDITABLE_FIELDS = [
  'nombre',
  'stock_minimo',
] as const

export async function PATCH(
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

    const update: Record<string, string | number> = {}

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        if (field === 'nombre') {
          update[field] = String(body[field]).trim()
        } else {
          update[field] = Number(body[field]) || 0
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return Response.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('insumos')
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
      { error: 'Error actualizando insumo' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const cantidad = Number(body.cantidad)

    if (!cantidad || cantidad <= 0) {
      return Response.json(
        { error: 'La cantidad debe ser mayor a 0' },
        { status: 400 }
      )
    }

    const { data: insumo, error: fetchError } =
      await supabase
        .from('insumos')
        .select('stock_actual')
        .eq('id', params.id)
        .single()

    if (fetchError || !insumo) {
      return Response.json(
        { error: fetchError?.message || 'Insumo no encontrado' },
        { status: 404 }
      )
    }

    const nuevoStock =
      Number(insumo.stock_actual) + cantidad

    const { error } = await supabase
      .from('insumos')
      .update({ stock_actual: nuevoStock })
      .eq('id', params.id)

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    await supabase
      .from('movimientos_inventario')
      .insert({
        insumo_id: params.id,
        cantidad,
        tipo: 'entrada',
        motivo: 'Compra registrada',
        fecha: new Date().toISOString().split('T')[0]
      })

    return Response.json({
      success: true,
      stock_actual: nuevoStock
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error registrando entrada' },
      { status: 500 }
    )
  }
}
