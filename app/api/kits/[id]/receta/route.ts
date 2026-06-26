import { sincronizarRecetaKit } from '../../../../../scr/lib/kitsData'
import { supabase } from '../../../../../scr/lib/supabase'

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    if (!Array.isArray(body.receta)) {
      return Response.json(
        { error: 'Formato de receta inválido' },
        { status: 400 }
      )
    }

    for (const linea of body.receta) {
      if (!linea.insumo_id) {
        return Response.json(
          { error: 'Cada línea debe tener insumo' },
          { status: 400 }
        )
      }

      const cantidad = Number(linea.cantidad)

      if (!cantidad || cantidad <= 0) {
        return Response.json(
          { error: 'Cantidades deben ser mayores a 0' },
          { status: 400 }
        )
      }
    }

    const resultado = await sincronizarRecetaKit(
      supabase,
      params.id,
      body.receta.map(
        (linea: { insumo_id: string; cantidad: number }) => ({
          insumo_id: linea.insumo_id,
          cantidad: Number(linea.cantidad)
        })
      )
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
      { error: 'Error actualizando receta' },
      { status: 500 }
    )
  }
}
