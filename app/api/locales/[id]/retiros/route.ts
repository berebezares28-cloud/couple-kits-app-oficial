export const dynamic = 'force-dynamic'

import { autorizarApp } from '../../../../../scr/lib/appAuth'
import { esUuid, validarRetiroKitLocal } from '../../../../../scr/lib/retirosKitsLocal'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const acceso = await autorizarApp(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  if (!esUuid(params.id)) return Response.json({ error: 'Local inválido' }, { status: 400 })
  let body: unknown
  try { body = await req.json() } catch {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const validacion = validarRetiroKitLocal(body)
  if (!validacion.ok) return Response.json({ error: validacion.error }, { status: 400 })
  const retiro = validacion.retiro
  try {
    const { data, error } = await supabase.rpc('retirar_kit_local_sin_venta', {
      p_operacion_id: retiro.operacion_id,
      p_punto_id: params.id,
      p_kit_id: retiro.kit_id,
      p_cantidad: retiro.cantidad,
      p_fecha: retiro.fecha,
      p_motivo: retiro.motivo
    })
    if (error) {
      const status = error.code === '42501' ? 403 : error.code === '23505' ? 409 : ['22023', 'P0001', '22P02', '22007', '22008'].includes(error.code) ? 400 : 500
      return Response.json({ error: status < 500 ? error.message : 'No se pudo confirmar el retiro. Reintenta con los mismos datos.' }, { status })
    }
    return Response.json({ success: true, ...data })
  } catch {
    return Response.json({ error: 'No se pudo confirmar el retiro. Reintenta con los mismos datos.' }, { status: 500 })
  }
}
