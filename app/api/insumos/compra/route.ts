import { registrarEntradaInsumo } from '../../../../scr/lib/calcularStock'
import { supabase } from '../../../../scr/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const cantidad = Number(body.cantidad)

    if (!body.insumoId) {
      return Response.json(
        { error: 'Selecciona un insumo' },
        { status: 400 }
      )
    }

    if (!cantidad || cantidad <= 0) {
      return Response.json(
        { error: 'Ingresa una cantidad válida' },
        { status: 400 }
      )
    }

    const monto =
      body.monto != null && body.monto !== ''
        ? Number(body.monto)
        : null

    const resultado =
      await registrarEntradaInsumo(supabase, {
        insumoId: body.insumoId,
        cantidad,
        monto
      })

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
      { error: 'Error registrando compra' },
      { status: 500 }
    )
  }
}
