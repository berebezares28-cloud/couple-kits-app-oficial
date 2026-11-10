import { createBrowserClient } from '@supabase/ssr'
import { supabaseUrl, supabaseAnonKey } from './supabaseConfig'

export function crearSupabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
