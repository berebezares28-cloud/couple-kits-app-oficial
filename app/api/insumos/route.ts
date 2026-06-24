import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminOrError } from '../../../scr/lib/supabase-admin'

export async function POST(req: Request) {
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

    if (!body.nombre?.trim()) {
      return Response.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('insumos')
      .insert({
        nombre: body.nombre.trim(),
        stock_actual: Number(body.stock_actual) || 0,
        stock_minimo: Number(body.stock_minimo) || 0
      })
      .select()
      .single()

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json({ success: true, insumo: data })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error creando insumo' },
      { status: 500 }
    )
  }
}
