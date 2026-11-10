export const dynamic = 'force-dynamic'

import {
  actualizarSaldosIniciales,
  normalizarFinanzasResumen,
  obtenerFinanzasResumen
} from '../../../scr/lib/finanzasData'
import { autorizarFinanzas } from '../../../scr/lib/finanzasAuth'

export async function GET(req: Request) {
  const acceso = await autorizarFinanzas(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  try {
    const url = new URL(req.url)
    const mes =
      url.searchParams.get('mes') ??
      new Date().toISOString().slice(0, 7)

    const resumen = await obtenerFinanzasResumen(
      supabase,
      mes
    )

    return Response.json(
      normalizarFinanzasResumen(resumen)
    )
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando finanzas' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  const acceso = await autorizarFinanzas(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  try {
    const body = await req.json()

    if (!Array.isArray(body.saldos)) {
      return Response.json(
        { error: 'Saldos inválidos' },
        { status: 400 }
      )
    }

    const resultado = await actualizarSaldosIniciales(
      supabase,
      body.saldos
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
      { error: 'Error actualizando saldos' },
      { status: 500 }
    )
  }
}
