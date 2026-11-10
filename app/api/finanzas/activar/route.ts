import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createSupabaseAdmin } from '../../../../scr/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Aprovisionamiento de cuentas autorizadas. No es registro público ni envía correos.
// El secreto solo existe en el servidor y la activación se cierra tras el primer acceso.
export async function POST(req: Request) {
  const expected = process.env.FINANZAS_PROVISION_TOKEN
  const provided = req.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (!expected || !/^[0-9a-f]{64}$/.test(provided) || provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }
  let email: string
  try {
    const body = await req.json()
    if (typeof body.email !== 'string') throw new Error('Correo inválido')
    email = body.email.trim().toLowerCase()
  } catch { return Response.json({ error: 'Correo inválido' }, { status: 400 }) }
  const permitidos = (process.env.FINANZAS_ALLOWED_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  if (!permitidos.includes(email)) return Response.json({ error: 'Correo no autorizado' }, { status: 403 })
  const admin = createSupabaseAdmin()
  if (!admin) return Response.json({ error: 'Acceso administrativo no configurado' }, { status: 503 })
  try {
    const { data: usuarios, error: errorUsuarios } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 })
    if (errorUsuarios) throw errorUsuarios
    let user = usuarios.users.find((u) => u.email?.toLowerCase() === email)
    if (user?.last_sign_in_at) return Response.json({ error: 'La cuenta ya fue activada' }, { status: 409 })
    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email, email_confirm: true, password: randomBytes(48).toString('base64url')
      })
      if (error || !data.user) throw error ?? new Error('No se pudo crear la cuenta')
      user = data.user
    }
    const { error: errorAcceso } = await admin.from('finanzas_accesos').upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true })
    if (errorAcceso) throw errorAcceso
    const { data: link, error: errorLink } = await admin.auth.admin.generateLink({ type: 'recovery', email })
    if (errorLink || !link.properties?.hashed_token) throw errorLink ?? new Error('No se pudo activar')
    return Response.json({ token_hash: link.properties.hashed_token }, {
      headers: { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' }
    })
  } catch {
    return Response.json({ error: 'No se pudo preparar el acceso' }, { status: 500 })
  }
}
