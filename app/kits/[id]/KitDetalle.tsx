'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  etiquetaCategoria,
  formatearFechaInsumo,
  formatearMoneda
} from '../../../scr/lib/insumosUtils'

type Kit = {
  id: string
  nombre: string
  precio_venta: number | null
  activo: boolean
}

type RecetaLinea = {
  id: string
  insumo_id: string
  cantidad: number
  insumo_nombre: string
  insumo_unidad: string
  insumo_categoria: string
}

type VentaPedido = {
  pedidoId: string
  nombre: string
  instagram: string
  fecha: string
  estatus: string
  cantidad: number
}

type InsumoOpcion = {
  id: string
  nombre: string
  categoria: string
}

type LineaEditable = {
  insumo_id: string
  cantidad: string
  insumo_nombre?: string
  insumo_unidad?: string
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black'

export default function KitDetalle({
  kit: kitInicial,
  receta: recetaInicial,
  ventasHistorico,
  ventasRangoInicial,
  insumos
}: {
  kit: Kit
  receta: RecetaLinea[]
  ventasHistorico: number
  ventasRangoInicial: {
    total: number
    pedidos: VentaPedido[]
  }
  insumos: InsumoOpcion[]
}) {
  const router = useRouter()
  const [kit, setKit] = useState(kitInicial)
  const [receta, setReceta] = useState(recetaInicial)
  const [editandoReceta, setEditandoReceta] =
    useState(false)
  const [lineasEdit, setLineasEdit] = useState<
    LineaEditable[]
  >([])
  const [editandoPrecio, setEditandoPrecio] =
    useState(false)
  const [precioEdit, setPrecioEdit] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [modoVentas, setModoVentas] = useState<
    'historico' | 'rango'
  >('historico')
  const [ventasRango, setVentasRango] = useState(
    ventasRangoInicial
  )
  const [cargandoVentas, setCargandoVentas] =
    useState(false)
  const [guardando, setGuardando] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] =
    useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  function iniciarEdicionReceta() {
    setLineasEdit(
      receta.length > 0
        ? receta.map((l) => ({
            insumo_id: l.insumo_id,
            cantidad: String(l.cantidad),
            insumo_nombre: l.insumo_nombre,
            insumo_unidad: l.insumo_unidad
          }))
        : [{ insumo_id: '', cantidad: '1' }]
    )
    setEditandoReceta(true)
    setMensaje(null)
  }

  function cancelarEdicionReceta() {
    setEditandoReceta(false)
    setLineasEdit([])
  }

  function agregarLineaReceta() {
    setLineasEdit((prev) => [
      ...prev,
      { insumo_id: '', cantidad: '1' }
    ])
  }

  function quitarLineaReceta(index: number) {
    setLineasEdit((prev) =>
      prev.filter((_, i) => i !== index)
    )
  }

  function actualizarLineaReceta(
    index: number,
    campo: 'insumo_id' | 'cantidad',
    valor: string
  ) {
    setLineasEdit((prev) =>
      prev.map((linea, i) => {
        if (i !== index) return linea

        if (campo === 'insumo_id') {
          const insumo = insumos.find(
            (ins) => ins.id === valor
          )
          return {
            ...linea,
            insumo_id: valor,
            insumo_nombre: insumo?.nombre
          }
        }

        return { ...linea, [campo]: valor }
      })
    )
  }

  async function guardarReceta() {
    const payload = lineasEdit
      .filter((l) => l.insumo_id)
      .map((l) => ({
        insumo_id: l.insumo_id,
        cantidad: Number(l.cantidad)
      }))

    if (payload.length === 0) {
      setMensaje({
        tipo: 'error',
        texto: 'La receta necesita al menos un insumo'
      })
      return
    }

    for (const linea of payload) {
      if (!linea.cantidad || linea.cantidad <= 0) {
        setMensaje({
          tipo: 'error',
          texto: 'Cantidades inválidas'
        })
        return
      }
    }

    setGuardando(true)
    setMensaje(null)

    try {
      const res = await fetch(
        `/api/kits/${kit.id}/receta`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ receta: payload })
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

      const nuevaReceta = payload.map((linea) => {
        const insumo = insumos.find(
          (i) => i.id === linea.insumo_id
        )
        return {
          id: crypto.randomUUID(),
          insumo_id: linea.insumo_id,
          cantidad: linea.cantidad,
          insumo_nombre: insumo?.nombre ?? 'Insumo',
          insumo_unidad: 'pieza',
          insumo_categoria: insumo?.categoria ?? 'otro'
        }
      })

      setReceta(nuevaReceta)
      cancelarEdicionReceta()
      setMensaje({
        tipo: 'ok',
        texto: 'Receta actualizada'
      })
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

  function iniciarEdicionPrecio() {
    setPrecioEdit(
      kit.precio_venta != null
        ? String(kit.precio_venta)
        : ''
    )
    setEditandoPrecio(true)
    setMensaje(null)
  }

  async function guardarPrecio() {
    const precio = precioEdit
      ? Number(precioEdit)
      : null

    if (
      precio != null &&
      (Number.isNaN(precio) || precio < 0)
    ) {
      setMensaje({
        tipo: 'error',
        texto: 'Precio inválido'
      })
      return
    }

    setGuardando(true)
    setMensaje(null)

    try {
      const res = await fetch(`/api/kits/${kit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ precio_venta: precio })
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al guardar'
        })
        return
      }

      setKit(data.kit)
      setEditandoPrecio(false)
      setMensaje({
        tipo: 'ok',
        texto: 'Precio actualizado'
      })
    } catch {
      setMensaje({
        tipo: 'error',
        texto: 'Error de conexión'
      })
    } finally {
      setGuardando(false)
    }
  }

  async function aplicarFiltroVentas() {
    setCargandoVentas(true)
    setModoVentas('rango')

    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)

      const res = await fetch(
        `/api/kits/${kit.id}?${params.toString()}`
      )

      if (!res.ok) return

      const data = await res.json()
      setVentasRango(data.ventasRango)
    } finally {
      setCargandoVentas(false)
    }
  }

  function verHistorico() {
    setModoVentas('historico')
    setDesde('')
    setHasta('')
  }

  async function eliminarKit() {
    setEliminando(true)
    setMensaje(null)

    try {
      const res = await fetch(`/api/kits/${kit.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'No se pudo eliminar'
        })
        setConfirmandoEliminar(false)
        return
      }

      router.push('/kits')
      router.refresh()
    } catch {
      setMensaje({
        tipo: 'error',
        texto: 'Error de conexión'
      })
      setConfirmandoEliminar(false)
    } finally {
      setEliminando(false)
    }
  }

  const ventasMostradas =
    modoVentas === 'historico'
      ? ventasHistorico
      : ventasRango.total

  const pedidosMostrados =
    modoVentas === 'historico'
      ? ventasRangoInicial.pedidos
      : ventasRango.pedidos

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="max-w-md mx-auto px-5 pt-8 pb-24">

        <Link
          href="/kits"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Kits
        </Link>

        <div className="mt-6 mb-8">
          <h1
            className="editorial-title text-4xl"
            style={{ color: '#c6302c' }}
          >
            {kit.nombre}
          </h1>
        </div>

        {mensaje && (
          <p
            className="text-sm mb-4 text-center"
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

        <div className="editorial-card p-0 overflow-hidden mb-6">
          <section className="p-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Precio de venta
            </p>

            {editandoPrecio ? (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioEdit}
                  onChange={(e) =>
                    setPrecioEdit(e.target.value)
                  }
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={guardarPrecio}
                  disabled={guardando}
                  className="shrink-0 rounded-lg px-3 py-2 text-sm text-white font-semibold disabled:opacity-50"
                  style={{ background: '#c6302c' }}
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditandoPrecio(false)
                  }
                  className="shrink-0 text-sm text-gray-500"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <p className="text-3xl font-semibold">
                  {kit.precio_venta != null
                    ? formatearMoneda(
                        kit.precio_venta
                      )
                    : '—'}
                </p>
                <button
                  type="button"
                  onClick={iniciarEdicionPrecio}
                  className="text-sm text-gray-500 underline"
                >
                  Editar
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="editorial-card p-0 overflow-hidden mb-6">
          <section className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="section-title text-lg">
                  Receta
                </h2>
                <p className="text-sm text-gray-500">
                  Insumos que lleva este kit
                </p>
              </div>

              {!editandoReceta && (
                <button
                  type="button"
                  onClick={iniciarEdicionReceta}
                  className="text-sm text-gray-500 underline shrink-0"
                >
                  Editar
                </button>
              )}
            </div>

            {editandoReceta ? (
              <div className="space-y-3">
                {lineasEdit.map((linea, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-start"
                  >
                    <select
                      value={linea.insumo_id}
                      onChange={(e) =>
                        actualizarLineaReceta(
                          index,
                          'insumo_id',
                          e.target.value
                        )
                      }
                      className={`${inputClass} flex-1`}
                    >
                      <option value="">
                        Insumo
                      </option>
                      {insumos.map((insumo) => (
                        <option
                          key={insumo.id}
                          value={insumo.id}
                        >
                          {insumo.nombre}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={linea.cantidad}
                      onChange={(e) =>
                        actualizarLineaReceta(
                          index,
                          'cantidad',
                          e.target.value
                        )
                      }
                      className={`${inputClass} w-20`}
                    />

                    {lineasEdit.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          quitarLineaReceta(index)
                        }
                        className="text-gray-400 px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={agregarLineaReceta}
                  className="text-sm text-gray-500 underline"
                >
                  + Agregar insumo
                </button>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={guardarReceta}
                    disabled={guardando}
                    className="flex-1 rounded-lg py-2 text-sm text-white font-semibold disabled:opacity-50"
                    style={{ background: '#c6302c' }}
                  >
                    {guardando
                      ? '...'
                      : 'Guardar receta'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelarEdicionReceta}
                    disabled={guardando}
                    className="flex-1 rounded-lg py-2 text-sm border font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : receta.length > 0 ? (
              <ul className="space-y-2">
                {receta.map((linea) => (
                  <li
                    key={linea.id}
                    className="flex justify-between items-center rounded-xl bg-gray-50 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">
                        {linea.insumo_nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {etiquetaCategoria(
                          linea.insumo_categoria
                        )}{' '}
                        · {linea.insumo_unidad}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {linea.cantidad} u
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Este kit aún no tiene receta
              </p>
            )}
          </section>
        </div>

        <div className="editorial-card p-0 overflow-hidden">
          <section className="p-6">
            <h2 className="section-title text-lg mb-1">
              Ventas
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Pedidos no cancelados que incluyeron
              este kit
            </p>

            <div
              className="rounded-xl px-4 py-4 mb-4 text-center"
              style={{
                background: '#F6FFED',
                color: '#389E0D'
              }}
            >
              <p className="text-xs uppercase tracking-wider mb-1">
                {modoVentas === 'historico'
                  ? 'Histórico total'
                  : 'En el rango seleccionado'}
              </p>
              <p className="text-4xl font-semibold">
                {ventasMostradas}
              </p>
              <p className="text-sm mt-1">kits vendidos</p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={verHistorico}
                className="flex-1 rounded-full py-2 text-sm border font-semibold"
                style={{
                  background:
                    modoVentas === 'historico'
                      ? '#111'
                      : '#fff',
                  color:
                    modoVentas === 'historico'
                      ? '#fff'
                      : '#111'
                }}
              >
                Histórico
              </button>
              <button
                type="button"
                onClick={() => setModoVentas('rango')}
                className="flex-1 rounded-full py-2 text-sm border font-semibold"
                style={{
                  background:
                    modoVentas === 'rango'
                      ? '#111'
                      : '#fff',
                  color:
                    modoVentas === 'rango'
                      ? '#fff'
                      : '#111'
                }}
              >
                Por fechas
              </button>
            </div>

            {modoVentas === 'rango' && (
              <div className="mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={desde}
                      onChange={(e) =>
                        setDesde(e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={hasta}
                      onChange={(e) =>
                        setHasta(e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={aplicarFiltroVentas}
                  disabled={cargandoVentas}
                  className="w-full rounded-lg py-2 text-sm text-white font-semibold disabled:opacity-50"
                  style={{ background: '#111' }}
                >
                  {cargandoVentas
                    ? 'Cargando...'
                    : 'Aplicar filtro'}
                </button>
              </div>
            )}

            {pedidosMostrados.length > 0 ? (
              <ul className="space-y-3">
                {pedidosMostrados.map((pedido) => (
                  <li
                    key={pedido.pedidoId}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <Link
                      href={`/pedidos/${pedido.pedidoId}`}
                      className="block"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold">
                            {pedido.nombre}
                          </p>
                          {pedido.instagram && (
                            <p className="text-xs text-gray-500">
                              @{pedido.instagram}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold shrink-0">
                          ×{pedido.cantidad}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatearFechaInsumo(
                          pedido.fecha
                        )}{' '}
                        · {pedido.estatus}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                {modoVentas === 'historico'
                  ? 'Aún no se ha vendido este kit'
                  : 'Sin ventas en ese rango'}
              </p>
            )}
          </section>
        </div>

        <div className="editorial-card p-6">
          {!confirmandoEliminar ? (
            <button
              type="button"
              onClick={() => {
                setConfirmandoEliminar(true)
                setMensaje(null)
              }}
              className="w-full rounded-xl py-3 text-sm font-semibold border"
              style={{
                color: '#CF1322',
                borderColor: '#FFA39E'
              }}
            >
              Eliminar kit
            </button>
          ) : (
            <div className="space-y-3 text-center">
              <p className="text-sm text-gray-600">
                ¿Eliminar <strong>{kit.nombre}</strong>?
                Dejará de aparecer en el catálogo, pero
                los pedidos pasados se conservan.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={eliminarKit}
                  disabled={eliminando}
                  className="flex-1 rounded-lg py-2 text-sm text-white font-semibold disabled:opacity-50"
                  style={{ background: '#CF1322' }}
                >
                  {eliminando
                    ? 'Eliminando...'
                    : 'Sí, eliminar'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmandoEliminar(false)
                  }
                  disabled={eliminando}
                  className="flex-1 rounded-lg py-2 text-sm border font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
