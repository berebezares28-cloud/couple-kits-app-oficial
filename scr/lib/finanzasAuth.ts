import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from './supabaseConfig'

export function crearSupabaseServidor() {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Los Server Components no escriben cookies; middleware renueva la sesión.
        }
      }
    }
  })
}

export const obtenerAccesoFinanzas = cache(async () => {
  const client = crearSupabaseServidor()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return { ok: false as const, status: 401 as const }
  const { data: acceso, error: errorAcceso } = await client.from('finanzas_accesos')
    .select('user_id').eq('user_id', user.id).maybeSingle()
  if (errorAcceso || !acceso) return { ok: false as const, status: 403 as const }
  return { ok: true as const, client, user }
})

export async function exigirFinanzasPagina(destino: '/finanzas' | '/dashboard' = '/finanzas') {
  const acceso = await obtenerAccesoFinanzas()
  if (!acceso.ok) redirect(`/finanzas/acceso?volver=${encodeURIComponent(destino)}${acceso.status === 403 ? '&sin_acceso=1' : ''}`)
  return acceso
}

export async function autorizarFinanzas(req: Request) {
  const origin = req.headers.get('origin')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin && origin !== new URL(req.url).origin) {
    return { response: Response.json({ error: 'Origen no permitido' }, { status: 403 }) }
  }
  const acceso = await obtenerAccesoFinanzas()
  if (!acceso.ok) return { response: Response.json({ error: acceso.status === 401 ? 'Inicia sesión para acceder a Finanzas' : 'Tu cuenta no tiene acceso a Finanzas' }, { status: acceso.status }) }
  return { client: acceso.client }
}
