import { listarIngresosExtra, rangoMes, validarIngresoExtra } from '../../../../scr/lib/ingresosExtra'
import { autorizarFinanzas } from '../../../../scr/lib/finanzasAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const acceso = await autorizarFinanzas(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  const mes = new URL(req.url).searchParams.get('mes')
  const rango = mes ? rangoMes(mes) : undefined
  if (mes && !rango) return Response.json({ error: 'Periodo inválido' }, { status: 400 })
  try {
    const ingresos = await listarIngresosExtra(supabase, rango ?? undefined)
    return Response.json({ ingresos })
  } catch {
    return Response.json({ error: 'Error cargando ingresos extra' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const acceso = await autorizarFinanzas(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  let body: unknown
  try { body = await req.json() } catch {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const resultado = validarIngresoExtra(body)
  if (!resultado.ok) return Response.json({ error: resultado.error }, { status: 400 })
  try {
    const { data, error } = await supabase.from('ingresos_extra')
      .insert(resultado.ingreso).select('id').single()
    if (error || !data) throw new Error('No se pudo registrar')
    return Response.json({ success: true, id: data.id }, { status: 201 })
  } catch {
    return Response.json({ error: 'No se pudo guardar el ingreso extra. Intenta de nuevo.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const acceso = await autorizarFinanzas(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  const id = new URL(req.url).searchParams.get('id')
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return Response.json({ error: 'ID inválido' }, { status: 400 })
  }
  try {
    const { data, error } = await supabase.from('ingresos_extra').delete().eq('id', id).select('id')
    if (error) throw new Error('No se pudo eliminar')
    if (!data?.length) return Response.json({ error: 'El ingreso ya no existe' }, { status: 404 })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'No se pudo eliminar el ingreso extra' }, { status: 500 })
  }
}
