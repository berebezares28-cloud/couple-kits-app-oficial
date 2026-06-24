import { createClient, SupabaseClient } from '@supabase/supabase-js'

const PUBLIC_SUPABASE_URL =
  'https://lzengtvqlolcevgbtizt.supabase.co'

export function createSupabaseAdmin():
  | SupabaseClient
  | null {
  const url =
    process.env.SUPABASE_URL ?? PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!key) return null

  return createClient(url, key)
}

export function getSupabaseAdminOrError():
  | { client: SupabaseClient }
  | { error: string } {
  const client = createSupabaseAdmin()

  if (!client) {
    return {
      error:
        'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor'
    }
  }

  return { client }
}
