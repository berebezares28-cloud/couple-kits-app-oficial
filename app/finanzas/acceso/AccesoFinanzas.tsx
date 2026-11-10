'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { crearSupabaseBrowser } from '../../../scr/lib/supabaseBrowser'

const inputClass = 'mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6302c]/30'

export default function AccesoFinanzas() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [activando, setActivando] = useState(false)
  const [nuevaPassword, setNuevaPassword] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const procesado = useRef(false)

  useEffect(() => {
    if (procesado.current) return
    procesado.current = true
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('token_hash')
    if (!token) {
      const query = new URLSearchParams(window.location.search)
      if (query.has('sin_acceso')) setError('Tu cuenta no tiene acceso a Finanzas. Solicita acceso al administrador.')
      if (query.has('activar')) {
        setActivando(true)
        crearSupabaseBrowser().auth.getUser().then(({ data: { user } }) => {
          if (user) setNuevaPassword(true)
          else setError('Abre tu enlace de activación para elegir una contraseña.')
        }).catch(() => setError('No se pudo verificar tu sesión.'))
          .finally(() => setActivando(false))
      }
      return
    }
    window.history.replaceState(null, '', `${window.location.pathname}?activar=1`)
    setActivando(true)
    crearSupabaseBrowser().auth.verifyOtp({ token_hash: token, type: 'recovery' })
      .then(({ error: errorToken }) => {
        if (errorToken) setError('Este enlace venció o ya fue utilizado. Solicita un nuevo enlace de activación.')
        else setNuevaPassword(true)
      })
      .catch(() => setError('No se pudo verificar el enlace. Revisa tu conexión.'))
      .finally(() => setActivando(false))
  }, [])

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (ocupado) return
    setError('')
    if (nuevaPassword && (password.length < 12 || password !== confirmacion)) {
      setError(password.length < 12 ? 'Usa al menos 12 caracteres para tu contraseña.' : 'Las contraseñas no coinciden.')
      return
    }
    setOcupado(true)
    try {
      const client = crearSupabaseBrowser()
      const resultado = nuevaPassword
        ? await client.auth.updateUser({ password })
        : await client.auth.signInWithPassword({ email: email.trim(), password })
      if (resultado.error) {
        setError(nuevaPassword ? 'No se pudo guardar la contraseña. Intenta de nuevo.' : 'Correo o contraseña incorrectos.')
        return
      }
      const { data: acceso, error: errorAcceso } = await client.from('finanzas_accesos').select('user_id').maybeSingle()
      if (errorAcceso || !acceso) {
        await client.auth.signOut({ scope: 'local' })
        setError('Tu cuenta no tiene acceso a Finanzas. Solicita acceso al administrador.')
        return
      }
      const volver = new URLSearchParams(window.location.search).get('volver')
      router.replace(volver === '/dashboard' ? '/dashboard' : '/finanzas')
      router.refresh()
    } catch { setError('No se pudo conectar. Intenta de nuevo.') }
    finally { setOcupado(false) }
  }

  return (
    <main className="min-h-screen bg-gray-50/60 px-5 py-12 pb-28">
      <div className="mx-auto max-w-md">
        <Link prefetch={false} href="/" className="text-sm font-semibold text-gray-600 hover:text-black">← Volver a Inicio</Link>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c6302c]">Couple Kits</p>
          <h1 className="mt-3 text-2xl font-extrabold">{nuevaPassword ? 'Activa tu acceso' : 'Acceso a Finanzas'}</h1>
          <p className="mt-2 text-sm text-gray-600">{nuevaPassword ? 'Elige la contraseña que usarás para entrar a Finanzas y al Dashboard.' : 'Inicia sesión con tu cuenta autorizada para consultar y registrar movimientos.'}</p>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">{error}</p>}
          {activando ? <p role="status" className="mt-6 text-sm text-gray-600">Verificando enlace…</p> : <form onSubmit={entrar} className="mt-6 space-y-4">
            <fieldset disabled={ocupado} className="space-y-4 disabled:opacity-60">
              {!nuevaPassword && <label htmlFor="finanzas-email" className="block text-sm font-medium">Correo
                <input id="finanzas-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </label>}
              <label htmlFor="finanzas-password" className="block text-sm font-medium">{nuevaPassword ? 'Nueva contraseña' : 'Contraseña'}
                <input id="finanzas-password" type="password" autoComplete={nuevaPassword ? 'new-password' : 'current-password'} required minLength={nuevaPassword ? 12 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              </label>
              {nuevaPassword && <label htmlFor="finanzas-confirmar" className="block text-sm font-medium">Confirma tu contraseña
                <input id="finanzas-confirmar" type="password" autoComplete="new-password" required minLength={12} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className={inputClass} />
              </label>}
              <button type="submit" disabled={ocupado} className="w-full rounded-xl bg-[#c6302c] px-4 py-3 font-semibold text-white disabled:opacity-50">{ocupado ? 'Un momento…' : nuevaPassword ? 'Guardar contraseña y entrar' : 'Entrar'}</button>
            </fieldset>
          </form>}
          {!nuevaPassword && <p className="mt-5 text-xs leading-relaxed text-gray-500">Si es tu primer acceso o necesitas recuperar tu cuenta, solicita un enlace de activación al administrador.</p>}
        </div>
      </div>
    </main>
  )
}
