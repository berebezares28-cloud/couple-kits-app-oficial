'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import CalendarioContenido from './CalendarioContenido'
import {
  emojiFormato,
  engagementScore,
  FORMATOS_CONTENIDO,
  PLATAFORMAS_CONTENIDO,
  resumenContenido,
  TIPOS_CONTENIDO,
  type FormatoContenido,
  type PublicacionContenido,
  type TipoContenido
} from '../../scr/lib/contenidoData'
import {
  formatearFechaInsumo,
  formatearMoneda
} from '../../scr/lib/insumosUtils'

const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black'

type VistaContenido = 'lista' | 'calendario'

type FiltroContenido =
  | 'todos'
  | 'programados'
  | 'publicados'
  | TipoContenido

type Mensaje = {
  tipo: 'ok' | 'error'
  texto: string
} | null

function FormularioContenido({
  tituloForm,
  publicado,
  setPublicado,
  formato,
  setFormato,
  tipo,
  setTipo,
  fecha,
  setFecha,
  plataforma,
  setPlataforma,
  titulo,
  setTitulo,
  notas,
  setNotas,
  alcance,
  setAlcance,
  likes,
  setLikes,
  comentarios,
  setComentarios,
  clics,
  setClics,
  ventasAtribuidas,
  setVentasAtribuidas,
  montoAnuncio,
  setMontoAnuncio,
  url,
  setUrl,
  guardando,
  mensaje,
  onGuardar,
  onCancelar
}: {
  tituloForm: string
  publicado: boolean
  setPublicado: (v: boolean) => void
  formato: FormatoContenido
  setFormato: (v: FormatoContenido) => void
  tipo: TipoContenido
  setTipo: (v: TipoContenido) => void
  fecha: string
  setFecha: (v: string) => void
  plataforma: string
  setPlataforma: (v: string) => void
  titulo: string
  setTitulo: (v: string) => void
  notas: string
  setNotas: (v: string) => void
  alcance: string
  setAlcance: (v: string) => void
  likes: string
  setLikes: (v: string) => void
  comentarios: string
  setComentarios: (v: string) => void
  clics: string
  setClics: (v: string) => void
  ventasAtribuidas: string
  setVentasAtribuidas: (v: string) => void
  montoAnuncio: string
  setMontoAnuncio: (v: string) => void
  url: string
  setUrl: (v: string) => void
  guardando: boolean
  mensaje: Mensaje
  onGuardar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="section-title text-base pr-8">
        {tituloForm}
      </h2>

      <div>
        <label className="text-xs text-gray-500 mb-2 block">
          Estado
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPublicado(false)}
            className="rounded-xl py-2.5 text-sm font-semibold border"
            style={{
              background: !publicado ? '#111' : '#fff',
              color: !publicado ? '#fff' : '#111'
            }}
          >
            Programado
          </button>
          <button
            type="button"
            onClick={() => setPublicado(true)}
            className="rounded-xl py-2.5 text-sm font-semibold border"
            style={{
              background: publicado ? '#c6302c' : '#fff',
              color: publicado ? '#fff' : '#111'
            }}
          >
            Publicado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Formato
          </label>
          <select
            value={formato}
            onChange={(e) =>
              setFormato(e.target.value as FormatoContenido)
            }
            className={inputClass}
          >
            {FORMATOS_CONTENIDO.map((f) => (
              <option key={f.value} value={f.value}>
                {f.emoji} {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Tipo
          </label>
          <select
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value as TipoContenido)
            }
            className={inputClass}
          >
            {TIPOS_CONTENIDO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            {publicado
              ? 'Fecha de publicación'
              : 'Fecha programada'}
          </label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Plataforma
          </label>
          <select
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
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
          {publicado ? 'Qué publicaste' : 'Idea del post'}
        </label>
        <input
          type="text"
          placeholder={
            publicado
              ? 'Ej. Reel unboxing kit San Valentín'
              : 'Ej. Carrusel tips para regalar'
          }
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">
          {publicado
            ? 'Notas · qué funcionó'
            : 'Notas de planificación'}
        </label>
        <textarea
          rows={3}
          placeholder={
            publicado
              ? 'Ej. El hook del primer segundo funcionó muy bien...'
              : 'Ej. Grabar en la tarde, usar música trending...'
          }
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </div>

      {publicado && (
        <>
          {tipo === 'anuncio_pagado' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Monto del anuncio
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
                onChange={(e) => setAlcance(e.target.value)}
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
                onChange={(e) => setLikes(e.target.value)}
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
                onChange={(e) => setClics(e.target.value)}
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
              Link (opcional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
            />
          </div>
        </>
      )}

      {mensaje && (
        <p
          className="text-sm text-center"
          style={{
            color:
              mensaje.tipo === 'ok' ? '#389E0D' : '#CF1322'
          }}
        >
          {mensaje.texto}
        </p>
      )}

      <div className="flex gap-2 pb-1">
        <button
          type="button"
          onClick={onGuardar}
          disabled={guardando}
          className="flex-1 rounded-xl py-3 text-white font-semibold disabled:opacity-50"
          style={{ background: '#c6302c' }}
        >
          {guardando ? '...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
          className="flex-1 rounded-xl py-3 border font-semibold"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function ContenidoClient({
  publicacionesIniciales
}: {
  publicacionesIniciales: PublicacionContenido[]
}) {
  const router = useRouter()
  const [publicaciones, setPublicaciones] = useState(
    publicacionesIniciales
  )
  const [vista, setVista] = useState<VistaContenido>('lista')
  const [filtro, setFiltro] = useState<FiltroContenido>('todos')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(
    null
  )
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const [mensajeModal, setMensajeModal] = useState<Mensaje>(
    null
  )

  const [publicado, setPublicado] = useState(true)
  const [formato, setFormato] =
    useState<FormatoContenido>('reel')
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
    return publicaciones.filter((p) => {
      if (filtro === 'programados') return !p.publicado
      if (filtro === 'publicados') return p.publicado
      if (filtro === 'todos') return true
      return p.tipo === filtro
    })
  }, [publicaciones, filtro])

  const formProps = {
    publicado,
    setPublicado,
    formato,
    setFormato,
    tipo,
    setTipo,
    fecha,
    setFecha,
    plataforma,
    setPlataforma,
    titulo,
    setTitulo,
    notas,
    setNotas,
    alcance,
    setAlcance,
    likes,
    setLikes,
    comentarios,
    setComentarios,
    clics,
    setClics,
    ventasAtribuidas,
    setVentasAtribuidas,
    montoAnuncio,
    setMontoAnuncio,
    url,
    setUrl,
    guardando
  }

  useEffect(() => {
    if (!modalEditar) return

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [modalEditar])

  function resetCampos() {
    setPublicado(false)
    setFormato('reel')
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
  }

  function cerrarCrear() {
    setEditandoId(null)
    resetCampos()
    setMostrarForm(false)
    setMensaje(null)
  }

  function cerrarModal() {
    setEditandoId(null)
    resetCampos()
    setModalEditar(false)
    setMensajeModal(null)
  }

  function abrirNuevo(esPublicado = false) {
    cerrarModal()
    resetCampos()
    setPublicado(esPublicado)
    setMostrarForm(true)
    setVista('lista')
    setMensaje(null)
  }

  function cargarEnFormulario(p: PublicacionContenido) {
    cerrarCrear()
    setEditandoId(p.id)
    setPublicado(p.publicado)
    setFormato(p.formato)
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
    setMensajeModal(null)
    setModalEditar(true)
  }

  async function guardar(esEdicion: boolean) {
    if (!titulo.trim()) {
      const msg = {
        tipo: 'error' as const,
        texto: publicado
          ? 'Escribe qué publicaste'
          : 'Escribe de qué tratará el post'
      }
      if (esEdicion) setMensajeModal(msg)
      else setMensaje(msg)
      return
    }

    setGuardando(true)
    if (esEdicion) setMensajeModal(null)
    else setMensaje(null)

    const payload = {
      fecha,
      tipo,
      formato,
      publicado,
      plataforma,
      titulo: titulo.trim(),
      notas: notas.trim() || null,
      alcance: publicado ? alcance || null : null,
      likes: publicado ? likes || null : null,
      comentarios: publicado ? comentarios || null : null,
      clics: publicado ? clics || null : null,
      ventas_atribuidas: publicado
        ? ventasAtribuidas || null
        : null,
      monto_anuncio:
        publicado && tipo === 'anuncio_pagado'
          ? montoAnuncio || null
          : null,
      url: publicado ? url.trim() || null : null
    }

    try {
      const res = await fetch(
        esEdicion && editandoId
          ? `/api/contenido/${editandoId}`
          : '/api/contenido',
        {
          method: esEdicion ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      )

      const data = await res.json()

      if (!res.ok) {
        const msg = {
          tipo: 'error' as const,
          texto: data.error || 'Error al guardar'
        }
        if (esEdicion) setMensajeModal(msg)
        else setMensaje(msg)
        return
      }

      if (esEdicion && editandoId) {
        setPublicaciones((prev) =>
          prev.map((p) =>
            p.id === editandoId ? data.publicacion : p
          )
        )
        cerrarModal()
        setMensaje({
          tipo: 'ok',
          texto: 'Actualizado'
        })
      } else {
        setPublicaciones((prev) => [
          data.publicacion,
          ...prev
        ])
        cerrarCrear()
        setMensaje({
          tipo: 'ok',
          texto: publicado
            ? 'Publicación registrada'
            : 'Post programado'
        })
      }

      router.refresh()
    } catch {
      const msg = {
        tipo: 'error' as const,
        texto: 'Error de conexión'
      }
      if (esEdicion) setMensajeModal(msg)
      else setMensaje(msg)
    } finally {
      setGuardando(false)
    }
  }

  function marcarComoPublicado(p: PublicacionContenido) {
    cargarEnFormulario({ ...p, publicado: true })
    setPublicado(true)
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
    if (editandoId === id) cerrarModal()
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
          Planificación y performance
        </p>

        <p className="text-xs text-gray-400 mb-6">
          Programa posts futuros y registra métricas al
          publicar
        </p>

        <div className="flex gap-2 mb-6">
          {(
            [
              ['lista', 'Lista'],
              ['calendario', 'Calendario']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setVista(id)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition"
              style={{
                background: vista === id ? '#111' : '#fff',
                color: vista === id ? '#fff' : '#111'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="editorial-card">
            <p className="metric-label">Programados</p>
            <p className="text-xl font-bold">
              {resumen.programadas}
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Publicados</p>
            <p className="text-xl font-bold">
              {resumen.publicadas}
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Gasto en ads</p>
            <p className="text-sm font-bold mt-1">
              {formatearMoneda(resumen.gastoAnuncios)}
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Ventas atrib.</p>
            <p className="text-xl font-bold">
              {resumen.ventasAtribuidas}
            </p>
          </div>
        </div>

        {mensaje && vista === 'calendario' && (
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

        {vista === 'calendario' ? (
          <CalendarioContenido
            publicaciones={publicaciones}
            onSeleccionar={cargarEnFormulario}
          />
        ) : (
          <>
            {!mostrarForm ? (
              <div className="grid grid-cols-2 gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => abrirNuevo(false)}
                  className="rounded-xl py-3 border font-semibold text-sm"
                >
                  + Programar post
                </button>
                <button
                  type="button"
                  onClick={() => abrirNuevo(true)}
                  className="rounded-xl py-3 text-white font-semibold text-sm"
                  style={{ background: '#c6302c' }}
                >
                  + Ya publicado
                </button>
              </div>
            ) : (
              <div className="editorial-card mb-6">
                <FormularioContenido
                  tituloForm={
                    publicado
                      ? 'Registrar publicación'
                      : 'Programar post'
                  }
                  {...formProps}
                  mensaje={mensaje}
                  onGuardar={() => guardar(false)}
                  onCancelar={cerrarCrear}
                />
              </div>
            )}

            {mensaje && !mostrarForm && (
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
                        {i + 1}. {emojiFormato(p.formato)}{' '}
                        {p.titulo}
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
                  ['programados', 'Programados'],
                  ['publicados', 'Publicados'],
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
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className="text-[0.65rem] uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              background: p.publicado
                                ? '#F6FFED'
                                : '#FFF7E6',
                              color: p.publicado
                                ? '#389E0D'
                                : '#D48806'
                            }}
                          >
                            {p.publicado
                              ? 'Publicado'
                              : 'Programado'}
                          </span>
                          <span className="text-[0.65rem] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-50 text-gray-600">
                            {emojiFormato(p.formato)}{' '}
                            {
                              FORMATOS_CONTENIDO.find(
                                (f) => f.value === p.formato
                              )?.label
                            }
                          </span>
                          {p.tipo === 'anuncio_pagado' && (
                            <span
                              className="text-[0.65rem] uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{
                                background: '#F0F5FF',
                                color: '#1D39C4'
                              }}
                            >
                              Anuncio
                            </span>
                          )}
                        </div>
                        <p className="font-semibold mt-2">
                          {p.titulo}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatearFechaInsumo(p.fecha)} ·{' '}
                          {p.plataforma}
                        </p>
                      </div>
                    </div>

                    {p.publicado && (
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
                            {formatearMoneda(
                              p.monto_anuncio
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    {p.notas && (
                      <p className="mt-3 text-sm text-gray-600 italic">
                        “{p.notas}”
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-4">
                      {!p.publicado && (
                        <button
                          type="button"
                          onClick={() =>
                            marcarComoPublicado(p)
                          }
                          className="text-sm font-semibold underline"
                          style={{ color: '#389E0D' }}
                        >
                          Marcar publicado
                        </button>
                      )}
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
          </>
        )}
      </div>

      {modalEditar && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-editar-titulo"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Cerrar"
            onClick={cerrarModal}
          />

          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5">
            <button
              type="button"
              onClick={cerrarModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border text-gray-500 hover:bg-gray-50 flex items-center justify-center text-sm"
              aria-label="Cerrar edición"
            >
              ✕
            </button>

            <FormularioContenido
              tituloForm="Editar entrada"
              {...formProps}
              mensaje={mensajeModal}
              onGuardar={() => guardar(true)}
              onCancelar={cerrarModal}
            />
          </div>
        </div>
      )}
    </main>
  )
}
