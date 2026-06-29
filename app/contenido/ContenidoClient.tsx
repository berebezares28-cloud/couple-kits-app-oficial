'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import InformePerformance from './InformePerformance'
import CalendarioContenido from './CalendarioContenido'
import CalendarioFeedGrid from './CalendarioFeedGrid'
import {
  emojiFormato,
  engagementScore,
  esPublicado,
  ESTADOS_CONTENIDO,
  etiquetaEstado,
  etiquetaFechaPorEstado,
  estiloEstado,
  FORMATOS_CONTENIDO,
  PLATAFORMAS_CONTENIDO,
  resumenContenido,
  TIPOS_CONTENIDO,
  type EstadoContenido,
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

type VistaContenido = 'feed' | 'lista' | 'calendario' | 'informe'

type FiltroContenido =
  | 'todos'
  | EstadoContenido
  | TipoContenido

type Mensaje = {
  tipo: 'ok' | 'error'
  texto: string
} | null

type FormFieldsProps = {
  estado: EstadoContenido
  setEstado: (v: EstadoContenido) => void
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
}

function ContenidoFormFields({
  estado,
  setEstado,
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
  setUrl
}: FormFieldsProps) {
  const mostrarMetricas = esPublicado(estado)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 mb-2 block">
          Estado
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ESTADOS_CONTENIDO.map((item) => {
            const activo = estado === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setEstado(item.value)}
                className="rounded-xl py-2.5 text-xs font-semibold border transition"
                style={{
                  background: activo ? item.bg : '#fff',
                  color: activo ? item.color : '#111',
                  borderColor: activo
                    ? item.color
                    : '#e5e5e5'
                }}
              >
                {item.label}
              </button>
            )
          })}
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
            {etiquetaFechaPorEstado(estado)}
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
          {mostrarMetricas ? 'Qué publicaste' : 'Idea del post'}
        </label>
        <input
          type="text"
          placeholder={
            mostrarMetricas
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
          {mostrarMetricas
            ? 'Notas · qué funcionó'
            : 'Notas de planificación'}
        </label>
        <textarea
          rows={3}
          placeholder={
            mostrarMetricas
              ? 'Ej. El hook del primer segundo funcionó muy bien...'
              : 'Ej. Grabar en la tarde, usar música trending...'
          }
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </div>

      {mostrarMetricas && (
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
    </div>
  )
}

function FormularioFooter({
  mensaje,
  guardando,
  onGuardar,
  onCancelar
}: {
  mensaje: Mensaje
  guardando: boolean
  onGuardar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="space-y-3">
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
      <div className="flex gap-2">
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
  const [vista, setVista] = useState<VistaContenido>('feed')
  const [filtro, setFiltro] = useState<FiltroContenido>('todos')
  const [filtrosAbiertos, setFiltrosAbiertos] =
    useState(false)
  const [modalFormulario, setModalFormulario] =
    useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(
    null
  )
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<Mensaje>(null)
  const [mensajeModal, setMensajeModal] = useState<Mensaje>(
    null
  )

  const [estado, setEstado] =
    useState<EstadoContenido>('por_hacer')
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
      if (filtro === 'todos') return true
      if (filtro === 'organico' || filtro === 'anuncio_pagado') {
        return p.tipo === filtro
      }
      return p.estado === filtro
    })
  }, [publicaciones, filtro])

  const formProps: FormFieldsProps = {
    estado,
    setEstado,
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
    setUrl
  }

  useEffect(() => {
    if (!modalFormulario) return

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [modalFormulario])

  function resetCampos() {
    setEstado('por_hacer')
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

  function cerrarModal() {
    setEditandoId(null)
    resetCampos()
    setModalFormulario(false)
    setMensajeModal(null)
  }

  function abrirNuevo() {
    resetCampos()
    setEstado('por_hacer')
    setEditandoId(null)
    setMensajeModal(null)
    setModalFormulario(true)
  }

  function cargarEnFormulario(p: PublicacionContenido) {
    setEditandoId(p.id)
    setEstado(p.estado)
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
    setModalFormulario(true)
  }

  async function guardar() {
    if (!titulo.trim()) {
      setMensajeModal({
        tipo: 'error',
        texto: esPublicado(estado)
          ? 'Escribe qué publicaste'
          : 'Escribe de qué tratará el post'
      })
      return
    }

    setGuardando(true)
    setMensajeModal(null)

    const esEdicion = Boolean(editandoId)
    const publicado = esPublicado(estado)
    const payload = {
      fecha,
      tipo,
      formato,
      estado,
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
        setMensajeModal({
          tipo: 'error',
          texto: data.error || 'Error al guardar'
        })
        return
      }

      if (esEdicion && editandoId) {
        setPublicaciones((prev) =>
          prev.map((p) =>
            p.id === editandoId ? data.publicacion : p
          )
        )
        cerrarModal()
        setMensaje({ tipo: 'ok', texto: 'Actualizado' })
      } else {
        setPublicaciones((prev) => [
          data.publicacion,
          ...prev
        ])
        cerrarModal()
        setMensaje({
          tipo: 'ok',
          texto:
            estado === 'publicado'
              ? 'Publicación registrada'
              : 'Post guardado'
        })
      }

      router.refresh()
    } catch {
      setMensajeModal({
        tipo: 'error',
        texto: 'Error de conexión'
      })
    } finally {
      setGuardando(false)
    }
  }

  function marcarComoPublicado(p: PublicacionContenido) {
    cargarEnFormulario({ ...p, estado: 'publicado' })
    setEstado('publicado')
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

  const tituloFormCrear =
    estado === 'publicado'
      ? 'Registrar publicación'
      : estado === 'programado'
        ? 'Programar post'
        : estado === 'por_programar'
          ? 'Post por programar'
          : 'Nueva idea de post'

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

        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {(
            [
              ['feed', 'Feed'],
              ['lista', 'Lista'],
              ['calendario', 'Calendario'],
              ['informe', 'Informe']
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setVista(id)}
              className="flex-1 min-w-[4.5rem] py-2.5 rounded-xl text-sm font-semibold border transition whitespace-nowrap"
              style={{
                background: vista === id ? '#111' : '#fff',
                color: vista === id ? '#fff' : '#111'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mensaje && !modalFormulario && (
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

        {(vista === 'feed' || vista === 'lista') && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={abrirNuevo}
                className="flex-1 rounded-xl py-3 text-white font-semibold"
                style={{ background: '#c6302c' }}
              >
                + Agregar
              </button>
              <button
                type="button"
                onClick={() =>
                  setFiltrosAbiertos((v) => !v)
                }
                className="shrink-0 px-4 rounded-xl py-3 text-sm font-semibold border"
                style={{
                  background:
                    filtrosAbiertos || filtro !== 'todos'
                      ? '#111'
                      : '#fff',
                  color:
                    filtrosAbiertos || filtro !== 'todos'
                      ? '#fff'
                      : '#111'
                }}
              >
                Filtrar
              </button>
            </div>

            {filtrosAbiertos && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {(
                  [
                    ['todos', 'Todos'],
                    ['por_hacer', 'Por hacer'],
                    ['por_programar', 'Por programar'],
                    ['programado', 'Programados'],
                    ['publicado', 'Publicados'],
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
            )}
          </>
        )}

        {vista === 'feed' && (
          <CalendarioFeedGrid
            publicaciones={filtradas}
            onSeleccionar={cargarEnFormulario}
          />
        )}

        {vista === 'calendario' && (
          <CalendarioContenido
            publicaciones={publicaciones}
            onSeleccionar={cargarEnFormulario}
          />
        )}

        {vista === 'informe' && (
          <InformePerformance
            publicaciones={publicaciones}
            onSeleccionar={cargarEnFormulario}
          />
        )}

        {vista === 'lista' && (
          <>
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

            {filtradas.length === 0 ? (
              <div className="editorial-card text-center text-gray-400 py-8">
                Sin entradas todavía
              </div>
            ) : (
              <div className="space-y-4">
                {filtradas.map((p) => {
                  const estilo = estiloEstado(p.estado)
                  return (
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
                                background: estilo.background,
                                color: estilo.color
                              }}
                            >
                              {etiquetaEstado(p.estado)}
                            </span>
                            <span className="text-[0.65rem] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-50 text-gray-600">
                              {emojiFormato(p.formato)}{' '}
                              {
                                FORMATOS_CONTENIDO.find(
                                  (f) =>
                                    f.value === p.formato
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

                      {esPublicado(p.estado) && (
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
                        {!esPublicado(p.estado) && (
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
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {modalFormulario && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar"
            onClick={cerrarModal}
          />

          <div
            className="relative w-full max-w-sm bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0_#000] p-4 max-h-[85vh] overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-base">
                {editandoId
                  ? 'Editar entrada'
                  : tituloFormCrear}
              </h2>
              <button
                type="button"
                onClick={cerrarModal}
                className="text-sm font-medium text-[#c6302c] px-2 py-1"
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>

            <ContenidoFormFields {...formProps} />

            <div className="mt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <FormularioFooter
                mensaje={mensajeModal}
                guardando={guardando}
                onGuardar={guardar}
                onCancelar={cerrarModal}
              />
              {editandoId && (
                <button
                  type="button"
                  onClick={() => eliminar(editandoId)}
                  className="w-full mt-3 py-2 text-sm underline"
                  style={{ color: '#CF1322' }}
                >
                  Eliminar entrada
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
