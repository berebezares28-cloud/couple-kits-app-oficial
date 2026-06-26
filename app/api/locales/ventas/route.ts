import { registrarVentaLocalBulk } from '../../../../scr/lib/puntosEntrega'
import { supabase } from '../../../../scr/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.punto_entrega_id) {
      return Response.json(
        { error: 'Selecciona un local' },
        { status: 400 }
      )
    }

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

    const resultado = await registrarVentaLocalBulk(
      supabase,
      {
        punto_entrega_id: body.punto_entrega_id,
        fecha,
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
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      ventaId: resultado.ventaId
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error registrando venta' },
      { status: 500 }
    )
  }
}
