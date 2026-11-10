import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey } from './supabaseConfig'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)