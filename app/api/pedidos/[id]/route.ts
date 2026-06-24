import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminOrError } from '../../../../scr/lib/supabase-admin'

const EDITABLE_FIELDS = [
  'estatus',
  'fecha_entrega',
  'hora_entrega',
  'lugar_entrega',
  'metodo_pago',
  'ocasion',
  'semillas',
  'nota',
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

    const update: Record<string, string | null> = {}

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
