export const dynamic = 'force-dynamic'

import { autorizarApp } from '../../../scr/lib/appAuth'
import {
  crearPuntoEntrega,
  listarPuntosEntrega
} from '../../../scr/lib/puntosEntrega'

export async function GET(req: Request) {
  const acceso = await autorizarApp(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  try {
    const puntos = await listarPuntosEntrega(supabase)
    return Response.json(puntos)
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando locales' },
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

    const tieneComision = Boolean(body.tiene_comision)
    const porcentaje =
      body.porcentaje_comision != null &&
      body.porcentaje_comision !== ''
        ? Number(body.porcentaje_comision)
        : null

    const resultado = await crearPuntoEntrega(supabase, {
      nombre: body.nombre,
      tiene_comision: tieneComision,
      porcentaje_comision: tieneComision
        ? porcentaje
        : null
    })

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      id: resultado.id
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error creando local' },
      { status: 500 }
    )
  }
}
