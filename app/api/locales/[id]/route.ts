import {
  actualizarPuntoEntrega,
  eliminarPuntoEntrega,
  obtenerHistorialPunto,
  obtenerPuntoEntrega
} from '../../../../scr/lib/puntosEntrega'
import { supabase } from '../../../../scr/lib/supabase'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url)
    const desde = url.searchParams.get('desde') ?? undefined
    const hasta = url.searchParams.get('hasta') ?? undefined

    const punto = await obtenerPuntoEntrega(
      supabase,
      params.id
    )

    if (!punto) {
      return Response.json(
        { error: 'Local no encontrado' },
        { status: 404 }
      )
    }

    const historial = await obtenerHistorialPunto(
      supabase,
      params.id,
      { desde, hasta }
    )

    return Response.json({ punto, ...historial })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando local' },
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

    const resultado = await actualizarPuntoEntrega(
      supabase,
      params.id,
      {
        nombre: body.nombre,
        tiene_comision: body.tiene_comision,
        porcentaje_comision: body.porcentaje_comision
      }
    )

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 500 }
      )
    }

    const punto = await obtenerPuntoEntrega(
      supabase,
      params.id
    )

    return Response.json({ success: true, punto })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error actualizando local' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const punto = await obtenerPuntoEntrega(
      supabase,
      params.id
    )

    if (!punto) {
      return Response.json(
        { error: 'Local no encontrado' },
        { status: 404 }
      )
    }

    const resultado = await eliminarPuntoEntrega(
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
      { error: 'Error eliminando local' },
      { status: 500 }
    )
  }
}
