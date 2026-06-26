import {
  eliminarKit,
  obtenerKit,
  obtenerRecetaKit,
  obtenerVentasDetalleKit
} from '../../../../scr/lib/kitsData'
import { supabase } from '../../../../scr/lib/supabase'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url)
    const desde = url.searchParams.get('desde') ?? undefined
    const hasta = url.searchParams.get('hasta') ?? undefined

    const kit = await obtenerKit(supabase, params.id)

    if (!kit) {
      return Response.json(
        { error: 'Kit no encontrado' },
        { status: 404 }
      )
    }

    const [receta, ventasRango, ventasHistorico] =
      await Promise.all([
        obtenerRecetaKit(supabase, params.id),
        obtenerVentasDetalleKit(supabase, params.id, {
          desde,
          hasta
        }),
        obtenerVentasDetalleKit(supabase, params.id)
      ])

    return Response.json({
      kit,
      receta,
      ventasRango,
      ventasHistorico: ventasHistorico.total
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando kit' },
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
    const update: Record<string, string | number | boolean | null> =
      {}

    if ('nombre' in body) {
      if (!body.nombre?.trim()) {
        return Response.json(
          { error: 'El nombre no puede estar vacío' },
          { status: 400 }
        )
      }

      update.nombre = body.nombre.trim()
    }

    if ('precio_venta' in body) {
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

      update.precio_venta = precio
    }

    if ('activo' in body) {
      update.activo = Boolean(body.activo)
    }

    if (Object.keys(update).length === 0) {
      return Response.json(
        { error: 'Nada que actualizar' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('kits')
      .update(update)
      .eq('id', params.id)

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const kit = await obtenerKit(supabase, params.id)

    return Response.json({ success: true, kit })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error actualizando kit' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const kit = await obtenerKit(supabase, params.id)

    if (!kit) {
      return Response.json(
        { error: 'Kit no encontrado' },
        { status: 404 }
      )
    }

    const resultado = await eliminarKit(supabase, params.id)

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
      { error: 'Error eliminando kit' },
      { status: 500 }
    )
  }
}
