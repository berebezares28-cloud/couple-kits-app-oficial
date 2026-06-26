import {
  actualizarCompraInsumo,
  calcularCostoPromedioSimple,
  calcularStockPorInsumo,
  eliminarCompraInsumo,
  obtenerHistorialCompras
} from '../../../../../scr/lib/calcularStock'
import { supabase } from '../../../../../scr/lib/supabase'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const cantidad = Number(body.cantidad)

    if (!body.insumoId) {
      return Response.json(
        { error: 'Falta el insumo' },
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

    if (
      monto != null &&
      (Number.isNaN(monto) || monto < 0)
    ) {
      return Response.json(
        { error: 'Ingresa un monto válido' },
        { status: 400 }
      )
    }

    const resultado =
      await actualizarCompraInsumo(
        supabase,
        params.id,
        body.insumoId,
        { cantidad, monto }
      )

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 500 }
      )
    }

    const [stock, compras] = await Promise.all([
      calcularStockPorInsumo(supabase, body.insumoId),
      obtenerHistorialCompras(supabase, body.insumoId)
    ])

    return Response.json({
      success: true,
      stock,
      costoPromedio: calcularCostoPromedioSimple(compras)
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error actualizando compra' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url)
    const insumoId = url.searchParams.get('insumoId')

    if (!insumoId) {
      return Response.json(
        { error: 'Falta el insumo' },
        { status: 400 }
      )
    }

    const resultado = await eliminarCompraInsumo(
      supabase,
      params.id,
      insumoId
    )

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 500 }
      )
    }

    const [stock, compras] = await Promise.all([
      calcularStockPorInsumo(supabase, insumoId),
      obtenerHistorialCompras(supabase, insumoId)
    ])

    return Response.json({
      success: true,
      stock,
      costoPromedio: calcularCostoPromedioSimple(compras)
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error eliminando compra' },
      { status: 500 }
    )
  }
}
