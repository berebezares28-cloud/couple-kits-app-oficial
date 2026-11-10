'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearSupabaseBrowser } from '../../scr/lib/supabaseBrowser'

export default function CerrarSesionFinanzas() {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(false)
  async function salir() {
    setOcupado(true)
    setError(false)
    try {
      const { error: errorSalir } = await crearSupabaseBrowser().auth.signOut({ scope: 'local' })
      if (errorSalir) throw errorSalir
      router.replace('/acceso')
      router.refresh()
    } catch { setError(true); setOcupado(false) }
  }
  return <div className="text-right">
    <button type="button" onClick={salir} disabled={ocupado} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">{ocupado ? 'Cerrando…' : 'Cerrar sesión'}</button>
    {error && <p role="alert" className="mt-1 text-xs text-red-600">No se pudo cerrar la sesión. Intenta de nuevo.</p>}
  </div>
}
