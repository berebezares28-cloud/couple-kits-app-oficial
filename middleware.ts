import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseUrl, supabaseAnonKey } from './scr/lib/supabaseConfig'

export async function middleware(request: NextRequest) {
  function continuar() {
    const headers = new Headers(request.headers)
    headers.set('x-couplekits-destino', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.next({ request: { headers } })
  }
  let response = continuar()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = continuar()
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
      }
    }
  })
  await supabase.auth.getClaims()
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}

export const config = {
  // Cada página y API comprueba además la sesión y la membresía en el servidor.
  matcher: ['/', '/acceso', '/pedidos/:path*', '/insumos/:path*', '/locales/:path*', '/finanzas/:path*', '/kits/:path*', '/dashboard/:path*', '/contenido/:path*', '/ventas/:path*', '/api/:path*']
}
