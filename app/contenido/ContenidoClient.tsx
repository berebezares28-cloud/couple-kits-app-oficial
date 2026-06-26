'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  engagementScore,
  PLATAFORMAS_CONTENIDO,
  resumenContenido,
  TIPOS_CONTENIDO,
  type PublicacionContenido,
  type TipoContenido
} from '../../scr/lib/contenidoData'
import {
  formatearFechaInsumo,
  formatearMoneda
} from '../../scr/lib/insumosUtils'

const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black'

export default function ContenidoClient({
  publicacionesIniciales
}: {
  publicacionesIniciales: PublicacionContenido[]
}) {
  const router = useRouter()
  const [publicaciones, setPublicaciones] = useState(
    publicacionesIniciales
  )
  const [filtro, setFiltro] = useState<
    'todos' | TipoContenido
  >('todos')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<
    string | null
  >(null)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [tipo, setTipo] =
    useState<TipoContenido>('organico')
  const [plataforma, setPlataforma] =
    useState('Instagram')
  const [titulo, setTitulo] = useState('')
  const [notas, setNotas] = useState('')
  const [alcance, setAlcance] = useState('')
  const [likes, setLikes] = useState('')
  const [comentarios, setComentarios] = useState('')
  const [clics, setClics] = useState('')
  const [ventasAtribuidas, setVentasAtribuidas] =
    useState('')
  const [montoAnuncio, setMontoAnuncio] = useState('')
  const [url, setUrl] = useState('')

  const resumen = useMemo(
    () => resumenContenido(publicaciones),
    [publicaciones]
  )

  const filtradas = useMemo(() => {
    if (filtro === 'todos') return publicaciones
    return publicaciones.filter((p) => p.tipo === filtro)
  }, [publicaciones, filtro])

  function limpiarFormulario() {
    setEditandoId(null)
    setFecha(new Date().toISOString().split('T')[0])
    setTipo('organico')
    setPlataforma('Instagram')
    setTitulo('')
    setNotas('')
    setAlcance('')
    setLikes('')
    setComentarios('')
    setClics('')
    setVentasAtribuidas('')
    setMontoAnuncio('')
    setUrl('')
    setMostrarForm(false)
  }

  function cargarEnFormulario(p: PublicacionContenido) {
    setEditandoId(p.id)
    setFecha(p.fecha)
    setTipo(p.tipo)
    setPlataforma(p.plataforma)
    setTitulo(p.titulo)
    setNotas(p.notas ?? '')
    setAlcance(p.alcance != null ? String(p.alcance) : '')
    setLikes(p.likes != null ? String(p.likes) : '')
    setComentarios(
      p.comentarios != null ? String(p.comentarios) : ''
    )
    setClics(p.clics != null ? String(p.clics) : '')
    setVentasAtribuidas(
      p.ventas_atribuidas != null
        ? String(p.ventas_atribuidas)
        : ''
    )
    setMontoAnuncio(
      p.monto_anuncio != null
        ? String(p.monto_anuncio)
        : ''
    )
    setUrl(p.url ?? '')
    setMostrarForm(true)
    setMensaje(null)
  }

  async function guardar() {
    if (!titulo.trim()) {
      setMensaje({
        tipo: 'error',
        texto: 'Escribe qué publicaste'
      })
      return
    }

    setGuardando(true)
    setMensaje(null)

    const payload = {
      fecha,
      tipo,
      plataforma,
      titulo: titulo.trim(),
      notas: notas.trim() || null,
      alcance: alcance || null,
      likes: likes || null,
      comentarios: comentarios || null,
      clics: clics || null,
      ventas_atribuidas: ventasAtribuidas || null,
      monto_anuncio:
        tipo === 'anuncio_pagado'
          ? montoAnuncio || null
          : null,
      url: url.trim() || null
    }

    try {
      const res = await fetch(
        editandoId
          ? `/api/contenido/${editandoId}`
          : '/api/contenido',
        {
          method: editandoId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al guardar'
        })
        return
      }

      if (editandoId) {
        setPublicaciones((prev) =>
          prev.map((p) =>
            p.id === editandoId
              ? data.publicacion
              : p
          )
        )
      } else {
        setPublicaciones((prev) => [
          data.publicacion,
          ...prev
        ])
      }

      setMensaje({
        tipo: 'ok',
        texto: editandoId
          ? 'Actualizado'
          : 'Publicación registrada'
      })
      limpiarFormulario()
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

  async function eliminar(id: string) {
    if (
      !window.confirm(
        '¿Eliminar esta entrada del diario?'
      )
    ) {
      return
    }

    const res = await fetch(`/api/contenido/${id}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      const data = await res.json()
      setMensaje({
        tipo: 'error',
        texto: data.error || 'No se pudo eliminar'
      })
      return
    }

    setPublicaciones((prev) =>
      prev.filter((p) => p.id !== id)
    )
    if (editandoId === id) limpiarFormulario()
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Inicio
        </Link>

        <h1
          className="editorial-title mt-6"
          style={{ color: '#c6302c' }}
        >
          CONTENIDO
        </h1>

        <p
          className="mt-1 mb-2"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#888'
          }}
        >
          Diario de publicaciones
        </p>

        <p className="text-xs text-gray-400 mb-6">
          Solo control interno — no afecta finanzas
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="editorial-card">
            <p className="metric-label">Publicaciones</p>
            <p className="text-xl font-bold">
              {resumen.organicos}
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Anuncios pagados</p>
            <p className="text-xl font-bold">
              {resumen.anuncios}
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Gasto en ads</p>
            <p className="text-sm font-bold mt-1">
              {formatearMoneda(resumen.gastoAnuncios)}
            </p>
            <p className="text-[0.6rem] text-gray-400 mt-1">
              tracking propio
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Ventas atrib.</p>
            <p className="text-xl font-bold">
              {resumen.ventasAtribuidas}
            </p>
          </div>
        </div>

        {!mostrarForm ? (
          <button
            type="button"
            onClick={() => {
              limpiarFormulario()
              setMostrarForm(true)
            }}
            className="w-full rounded-xl py-3 mb-6 text-white font-semibold"
            style={{ background: '#c6302c' }}
          >
            + Registrar publicación
          </button>
        ) : (
          <div className="editorial-card space-y-4 mb-6">
            <h2 className="section-title text-base">
              {editandoId
                ? 'Editar entrada'
                : 'Nueva entrada'}
            </h2>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) =>
                  setTipo(
                    e.target.value as TipoContenido
                  )
                }
                className={inputClass}
              >
                {TIPOS_CONTENIDO.map((t) => (
                  <option
                    key={t.value}
                    value={t.value}
                  >
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) =>
                    setFecha(e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Plataforma
                </label>
                <select
                  value={plataforma}
                  onChange={(e) =>
                    setPlataforma(e.target.value)
                  }
                  className={inputClass}
                >
                  {PLATAFORMAS_CONTENIDO.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Qué publicaste
              </label>
              <input
                type="text"
                placeholder="Ej. Reel unboxing kit San Valentín"
                value={titulo}
                onChange={(e) =>
                  setTitulo(e.target.value)
                }
                className={inputClass}
              />
            </div>

            {tipo === 'anuncio_pagado' && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Monto del anuncio (solo tracking)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 500"
                  value={montoAnuncio}
                  onChange={(e) =>
                    setMontoAnuncio(e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            )}

            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Performance
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Alcance / views
                </label>
                <input
                  type="number"
                  min="0"
                  value={alcance}
                  onChange={(e) =>
                    setAlcance(e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Likes
                </label>
                <input
                  type="number"
                  min="0"
                  value={likes}
                  onChange={(e) =>
                    setLikes(e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Comentarios
                </label>
                <input
                  type="number"
                  min="0"
                  value={comentarios}
                  onChange={(e) =>
                    setComentarios(e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Clics / DMs
                </label>
                <input
                  type="number"
                  min="0"
                  value={clics}
                  onChange={(e) =>
                    setClics(e.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500 mb-1 block">
                  Ventas que atribuyes a esto
                </label>
                <input
                  type="number"
                  min="0"
                  value={ventasAtribuidas}
                  onChange={(e) =>
                    setVentasAtribuidas(e.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Notas · qué funcionó
              </label>
              <textarea
                rows={3}
                placeholder="Ej. El hook del primer segundo funcionó muy bien..."
                value={notas}
                onChange={(e) =>
                  setNotas(e.target.value)
                }
                className={`${inputClass} resize-y`}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Link (opcional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) =>
                  setUrl(e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="flex-1 rounded-xl py-3 text-white font-semibold disabled:opacity-50"
                style={{ background: '#c6302c' }}
              >
                {guardando ? '...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={limpiarFormulario}
                disabled={guardando}
                className="flex-1 rounded-xl py-3 border font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {mensaje && (
          <p
            className="text-sm text-center mb-4"
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

        {resumen.topPorEngagement.length > 0 && (
          <div className="editorial-card mb-6">
            <h2 className="section-title text-base mb-3">
              Lo que más pegó
            </h2>
            <div className="space-y-2">
              {resumen.topPorEngagement.map((p, i) => (
                <div
                  key={p.id}
                  className="flex justify-between text-sm gap-2"
                >
                  <span className="truncate">
                    {i + 1}. {p.titulo}
                  </span>
                  <span className="text-gray-500 shrink-0">
                    score {engagementScore(p)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4 overflow-x-auto">
          {(
            [
              ['todos', 'Todos'],
              ['organico', 'Orgánico'],
              ['anuncio_pagado', 'Anuncios']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltro(id)}
              className="px-4 py-2 rounded-full text-sm border whitespace-nowrap"
              style={{
                background:
                  filtro === id ? '#111' : '#fff',
                color: filtro === id ? '#fff' : '#111'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {filtradas.length === 0 ? (
          <div className="editorial-card text-center text-gray-400 py-8">
            Sin entradas todavía
          </div>
        ) : (
          <div className="space-y-4">
            {filtradas.map((p) => (
              <div
                key={p.id}
                className="editorial-card"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span
                      className="text-[0.65rem] uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          p.tipo === 'anuncio_pagado'
                            ? '#F0F5FF'
                            : '#F6FFED',
                        color:
                          p.tipo === 'anuncio_pagado'
                            ? '#1D39C4'
                            : '#389E0D'
                      }}
                    >
                      {p.tipo === 'anuncio_pagado'
                        ? 'Anuncio'
                        : 'Orgánico'}
                    </span>
                    <p className="font-semibold mt-2">
                      {p.titulo}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatearFechaInsumo(p.fecha)} ·{' '}
                      {p.plataforma}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {p.alcance != null && (
                    <span className="bg-gray-50 px-2 py-1 rounded-lg">
                      👁 {p.alcance}
                    </span>
                  )}
                  {p.likes != null && (
                    <span className="bg-gray-50 px-2 py-1 rounded-lg">
                      ♥ {p.likes}
                    </span>
                  )}
                  {p.comentarios != null && (
                    <span className="bg-gray-50 px-2 py-1 rounded-lg">
                      💬 {p.comentarios}
                    </span>
                  )}
                  {p.clics != null && (
                    <span className="bg-gray-50 px-2 py-1 rounded-lg">
                      👆 {p.clics}
                    </span>
                  )}
                  {p.ventas_atribuidas != null && (
                    <span className="bg-gray-50 px-2 py-1 rounded-lg">
                      🛒 {p.ventas_atribuidas}
                    </span>
                  )}
                  {p.monto_anuncio != null && (
                    <span className="bg-gray-50 px-2 py-1 rounded-lg">
                      💸{' '}
                      {formatearMoneda(p.monto_anuncio)}
                    </span>
                  )}
                </div>

                {p.notas && (
                  <p className="mt-3 text-sm text-gray-600 italic">
                    “{p.notas}”
                  </p>
                )}

                <div className="mt-3 flex gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      cargarEnFormulario(p)
                    }
                    className="text-sm text-gray-500 underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(p.id)}
                    className="text-sm underline"
                    style={{ color: '#CF1322' }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
