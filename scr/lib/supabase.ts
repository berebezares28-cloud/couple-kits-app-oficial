import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lzengtvqlolcevgbtizt.supabase.co'

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6ZW5ndHZxbG9sY2V2Z2J0aXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5Mjg2NzgsImV4cCI6MjA5NjUwNDY3OH0.VZ0Ipa4o9Vt4wI55Bp62a4lxtVOFFAppxxIpGCYRDIk'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)