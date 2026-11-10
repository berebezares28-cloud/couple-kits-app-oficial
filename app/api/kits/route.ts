export const dynamic = 'force-dynamic'

import { autorizarApp } from '../../../scr/lib/appAuth'
import {
  crearKit,
  listarKitsConVentas
} from '../../../scr/lib/kitsData'

export async function GET(req: Request) {
  const acceso = await autorizarApp(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  try {
    const kits = await listarKitsConVentas(supabase)
    return Response.json(kits)
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando kits' },
      { status: 500 }
    )
  }
}

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

    const precio =
      body.precio_venta != null && body.precio_venta !== ''
        ? Number(body.precio_venta)
        : null

    if (
      precio != null &&
      (Number.isNaN(precio) || precio < 0)
    ) {
      return Response.json(
        { error: 'Precio inválido' },
        { status: 400 }
      )
    }

    const receta = Array.isArray(body.receta)
      ? body.receta
      : []

    for (const linea of receta) {
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

    const resultado = await crearKit(supabase, {
      nombre: body.nombre,
      precio_venta: precio,
      receta: receta.map(
        (linea: { insumo_id: string; cantidad: number }) => ({
          insumo_id: linea.insumo_id,
          cantidad: Number(linea.cantidad)
        })
      )
    })

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      kitId: resultado.kitId
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error creando kit' },
      { status: 500 }
    )
  }
}
