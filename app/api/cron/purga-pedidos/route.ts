import { purgarPedidosEliminadosExpirados } from '../../../../scr/lib/pedidosEliminados'
import { getSupabaseAdminOrError } from '../../../../scr/lib/supabase-admin'

export const dynamic = 'force-dynamic'

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET

  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  const admin = getSupabaseAdminOrError()

  if ('error' in admin) {
    return Response.json({ error: admin.error }, { status: 500 })
  }

  const resultado = await purgarPedidosEliminadosExpirados(
    admin.client
  )

  if (!resultado.ok) {
    return Response.json(
      { error: resultado.error },
      { status: 500 }
    )
  }

  return Response.json({
    success: true,
    purgados: resultado.purgados,
    ids: resultado.ids,
    errores: resultado.errores
  })
}
