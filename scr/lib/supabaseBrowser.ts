import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from './supabaseConfig'

export function crearSupabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', path: '/' },
    auth: { persistSession: true, autoRefreshToken: true }
  })
}
