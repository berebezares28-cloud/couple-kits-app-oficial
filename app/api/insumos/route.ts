export const dynamic = 'force-dynamic'

import { autorizarApp } from '../../../scr/lib/appAuth'

export async function POST(req: Request) {
  const acceso = await autorizarApp(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  try {
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
