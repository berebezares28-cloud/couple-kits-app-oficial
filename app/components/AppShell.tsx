'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { destinoSeguro, esPaginaAcceso } from '../../scr/lib/rutasAcceso'
import { crearSupabaseBrowser } from '../../scr/lib/supabaseBrowser'
import BottomNav from './BottomNav'
import CerrarSesion from './CerrarSesionFinanzas'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const publico = esPaginaAcceso(pathname)
  const [correo, setCorreo] = useState('')
  const [sesionPresente, setSesionPresente] = useState<boolean | null>(null)

  useEffect(() => {
    if (publico) return
    const { data: { subscription } } = crearSupabaseBrowser().auth.onAuthStateChange((event, session) => {
      setCorreo(session?.user.email ?? '')
      setSesionPresente(Boolean(session))
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        const volver = destinoSeguro(`${window.location.pathname}${window.location.search}`)
        router.replace(event === 'SIGNED_OUT' ? '/acceso' : `/acceso?volver=${encodeURIComponent(volver)}`)
        router.refresh()
      }
    })
    return () => subscription.unsubscribe()
  }, [publico, router])

  if (publico) return <>{children}</>
  if (!sesionPresente) return <p role="status" className="p-8 text-sm text-gray-500">Comprobando sesión…</p>
  const cuenta = <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-stretch">
    <p title={correo} className="min-w-0 truncate text-xs text-gray-500">{correo || 'Mi cuenta'}</p>
    <CerrarSesion />
  </div>
  return <>
    <div className="lg:pl-60">
      <div className="lg:hidden border-b border-gray-100 bg-white px-5 py-2">{cuenta}</div>
      {children}
    </div>
    <BottomNav cuenta={cuenta} />
  </>
}
