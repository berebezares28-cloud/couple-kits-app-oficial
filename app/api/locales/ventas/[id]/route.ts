import {
  actualizarVentaLocalBulk,
  eliminarVentaLocalBulk,
  obtenerVentaLocalBulk
} from '../../../../../scr/lib/puntosEntrega'
import { supabase } from '../../../../../scr/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const venta = await obtenerVentaLocalBulk(
      supabase,
      params.id
    )

    if (!venta) {
      return Response.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    return Response.json(venta)
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando venta' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const comision = Number(body.comision_monto)

    if (Number.isNaN(comision) || comision < 0) {
      return Response.json(
        { error: 'Comisión inválida' },
        { status: 400 }
      )
    }

    const resultado = await actualizarVentaLocalBulk(
      supabase,
      params.id,
      {
        fecha:
          body.fecha ??
          new Date().toISOString().split('T')[0],
        comision_monto: comision,
        metodo_pago: body.metodo_pago,
        notas: body.notas,
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
      { error: 'Error actualizando venta' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resultado = await eliminarVentaLocalBulk(
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
      { error: 'Error eliminando venta' },
      { status: 500 }
    )
  }
}
