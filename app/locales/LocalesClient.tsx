'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Punto = {
  id: string
  nombre: string
  tiene_comision: boolean
  porcentaje_comision: number | null
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black'

export default function LocalesClient({
  puntosIniciales
}: {
  puntosIniciales: Punto[]
}) {
  const router = useRouter()
  const [puntos, setPuntos] = useState(puntosIniciales)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [tieneComision, setTieneComision] =
    useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  async function crearLocal() {
    if (!nombre.trim()) {
      setMensaje({
        tipo: 'error',
        texto: 'Escribe el nombre del local'
      })
      return
    }

    setGuardando(true)
    setMensaje(null)

    try {
      const res = await fetch('/api/locales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre,
          tiene_comision: tieneComision,
          porcentaje_comision: null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al crear'
        })
        return
      }

      router.push(`/locales/${data.id}`)
      router.refresh()
    } catch {
      setMensaje({
        tipo: 'error',
        texto: 'Error de conexión'
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">

        <h1
          className="editorial-title"
          style={{ color: '#c6302c' }}
        >
          LOCALES
        </h1>

        <p
          className="mt-1 mb-6"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#888'
          }}
        >
          estudio
        </p>

        <Link
          href="/locales/venta"
          className="block w-full mb-3 text-center rounded-xl py-3 text-white font-semibold"
          style={{ background: '#111' }}
        >
          Registrar venta en bulk
        </Link>

        <button
          type="button"
          onClick={() => {
            setMostrarForm(!mostrarForm)
            setMensaje(null)
          }}
          className="w-full mb-6 rounded-xl py-3 text-white font-semibold"
          style={{ background: '#c6302c' }}
        >
          {mostrarForm
            ? 'Cerrar formulario'
            : '+ Nuevo punto de entrega'}
        </button>

        {mostrarForm && (
          <div className="editorial-card mb-6 space-y-4">
            <h2 className="section-title text-lg">
              Nuevo local
            </h2>

            {mensaje && (
              <p
                className="text-sm text-center"
                style={{
                  color:
                    mensaje.tipo === 'ok'
                      ? '#389E0D'
                      : '#CF1322'
                }}
              >
                {mensaje.texto}
              </p>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Nombre
              </label>
              <input
                value={nombre}
                onChange={(e) =>
                  setNombre(e.target.value)
                }
                className={inputClass}
                placeholder="Ej. Local Islas de CU"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={tieneComision}
                onChange={(e) =>
                  setTieneComision(e.target.checked)
                }
              />
              Cuenta con comisión
            </label>

            <p className="text-xs text-gray-500">
              La comisión se calcula del historial al
              registrar ventas.
            </p>

            <button
              type="button"
              onClick={crearLocal}
              disabled={guardando}
              className="w-full rounded-xl py-3 text-white font-semibold disabled:opacity-50"
              style={{ background: '#111' }}
            >
              {guardando ? 'Guardando...' : 'Crear local'}
            </button>
          </div>
        )}

        <div className="space-y-3">
          {puntos.map((punto) => (
            <Link
              key={punto.id}
              href={`/locales/${punto.id}`}
              className="block editorial-card hover:-translate-y-[1px] transition"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="customer-name">
                    {punto.nombre}
                  </p>
                  {punto.tiene_comision ? (
                    <p className="mt-1 text-sm text-gray-600">
                      Comisión del historial
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">
                      Sin comisión
                    </p>
                  )}
                </div>
                {punto.tiene_comision && (
                  <span
                    className="text-xs px-2 py-1 rounded-full shrink-0"
                    style={{
                      background: '#FFF7E6',
                      color: '#D48806'
                    }}
                  >
                    Comisión
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  )
}
