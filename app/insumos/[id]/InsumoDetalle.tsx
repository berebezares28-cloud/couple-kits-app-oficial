'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  etiquetaCategoria,
  formatearFechaInsumo,
  formatearMoneda
} from '../../../scr/lib/insumosUtils'

type Insumo = {
  id: string
  nombre: string
  categoria: string
  unidad: string
  stock_actual: number
  stock_minimo: number
  costo_promedio: number | null
}

type Compra = {
  id: string
  fecha: string
  cantidad: number
  costo_total: number | null
  costo_unitario: number | null
  notas: string | null
}

type ConsumoPedido = {
  pedidoId: string
  nombre: string
  instagram: string
  fechaEntrega: string
  cantidad: number
  detalleKits: {
    kitNombre: string
    kitCantidad: number
    consumo: number
  }[]
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black'

export default function InsumoDetalle({
  insumo,
  compras: comprasIniciales,
  costoPromedio: costoPromedioInicial,
  consumoPedidos
}: {
  insumo: Insumo
  compras: Compra[]
  costoPromedio: number | null
  consumoPedidos: ConsumoPedido[]
}) {
  const router = useRouter()
  const [stockActual, setStockActual] = useState(
    Number(insumo.stock_actual)
  )
  const [compras, setCompras] =
    useState(comprasIniciales)
  const [costoPromedio, setCostoPromedio] =
    useState(costoPromedioInicial)
  const [editandoId, setEditandoId] = useState<
    string | null
  >(null)
  const [editCantidad, setEditCantidad] = useState('')
  const [editMonto, setEditMonto] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<
    string | null
  >(null)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  const esCritico =
    stockActual <= Number(insumo.stock_minimo)

  const totalConsumido = consumoPedidos.reduce(
    (suma, p) => suma + p.cantidad,
    0
  )

  function iniciarEdicion(compra: Compra) {
    setEditandoId(compra.id)
    setEditCantidad(String(compra.cantidad))
    setEditMonto(
      compra.costo_total != null
        ? String(compra.costo_total)
        : ''
    )
    setMensaje(null)
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setEditCantidad('')
    setEditMonto('')
  }

  async function guardarEdicion(compraId: string) {
    const cantidad = Number(editCantidad)
    const monto = editMonto
      ? Number(editMonto)
      : null

    if (!cantidad || cantidad <= 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Cantidad inválida'
      })
      return
    }

    if (
      monto != null &&
      (Number.isNaN(monto) || monto < 0)
    ) {
      setMensaje({
        tipo: 'error',
        texto: 'Monto inválido'
      })
      return
    }

    setGuardando(true)
    setMensaje(null)

    try {
      const res = await fetch(
        `/api/insumos/compra/${compraId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            insumoId: insumo.id,
            cantidad,
            monto
          })
        }
      )

      let payload: {
        error?: string
        stock?: number
        costoPromedio?: number | null
      } = {}

      try {
        payload = await res.json()
      } catch {
        payload = {}
      }

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto:
            payload.error ||
            'No se pudo guardar. Revisa que el servidor esté corriendo.'
        })
        return
      }

      const costoTotal = monto
      const costoUnitario =
        costoTotal != null && cantidad > 0
          ? costoTotal / cantidad
          : null

      const comprasActualizadas = compras.map((c) =>
        c.id === compraId
          ? {
              ...c,
              cantidad,
              costo_total: costoTotal,
              costo_unitario: costoUnitario
            }
          : c
      )

      setCompras(comprasActualizadas)

      if (payload.costoPromedio !== undefined) {
        setCostoPromedio(payload.costoPromedio)
      } else {
        let totalCosto = 0
        let totalUnidades = 0

        for (const c of comprasActualizadas) {
          if (c.costo_total == null) continue
          totalCosto += Number(c.costo_total)
          totalUnidades += Number(c.cantidad)
        }

        setCostoPromedio(
          totalUnidades > 0
            ? totalCosto / totalUnidades
            : null
        )
      }

      if (payload.stock != null) {
        setStockActual(Number(payload.stock))
      }

      cancelarEdicion()
      setMensaje({
        tipo: 'ok',
        texto: 'Compra actualizada'
      })
      router.refresh()
    } catch {
      setMensaje({
        tipo: 'error',
        texto:
          'Error de conexión. Intenta de nuevo.'
      })
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarCompra(compraId: string) {
    const confirmar = window.confirm(
      '¿Eliminar esta compra? Se restará del stock y del historial.'
    )

    if (!confirmar) return

    setEliminandoId(compraId)
    setMensaje(null)

    try {
      const res = await fetch(
        `/api/insumos/compra/${compraId}?insumoId=${insumo.id}`,
        { method: 'DELETE' }
      )

      let payload: {
        error?: string
        stock?: number
        costoPromedio?: number | null
      } = {}

      try {
        payload = await res.json()
      } catch {
        payload = {}
      }

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto:
            payload.error ||
            'No se pudo eliminar la compra'
        })
        return
      }

      setCompras((prev) =>
        prev.filter((c) => c.id !== compraId)
      )

      if (payload.stock != null) {
        setStockActual(payload.stock)
      }

      if (payload.costoPromedio !== undefined) {
        setCostoPromedio(payload.costoPromedio)
      }

      if (editandoId === compraId) {
        cancelarEdicion()
      }

      setMensaje({
        tipo: 'ok',
        texto: 'Compra eliminada'
      })
      router.refresh()
    } catch {
      setMensaje({
        tipo: 'error',
        texto: 'Error de conexión'
      })
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="max-w-md mx-auto px-5 pt-8 pb-24">

        <Link
          href="/insumos"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Insumos
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">
            {etiquetaCategoria(insumo.categoria)} ·{' '}
            {insumo.unidad}
          </p>
          <h1
            className="editorial-title text-4xl"
            style={{ color: '#c6302c' }}
          >
            {insumo.nombre}
          </h1>
        </div>

        <div className="editorial-card p-0 overflow-hidden mb-6">

          <section className="p-6">
            {esCritico && (
              <span
                className="inline-block mb-4 px-3 py-1 text-xs rounded-full border"
                style={{
                  background: '#FFF1F0',
                  color: '#CF1322',
                  borderColor: '#FFA39E'
                }}
              >
                Stock crítico
              </span>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Stock
                </p>
                <p
                  className="text-3xl font-semibold"
                  style={{
                    color:
                      stockActual < 0
                        ? '#CF1322'
                        : '#111'
                  }}
                >
                  {stockActual}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Mínimo
                </p>
                <p className="text-3xl font-semibold text-gray-700">
                  {insumo.stock_minimo ?? 0}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                Costo promedio / unidad
              </p>
              <p className="text-xl font-semibold">
                {costoPromedio != null
                  ? formatearMoneda(costoPromedio)
                  : '—'}
              </p>
            </div>
          </section>

          <hr />

          <section className="p-6">
            <Link
              href={`/insumos/compra?insumo=${insumo.id}`}
              className="block w-full text-center rounded-xl py-3 text-white font-semibold transition"
              style={{ background: '#c6302c' }}
            >
              Registrar compra
            </Link>
          </section>

        </div>

        <div className="editorial-card p-0 overflow-hidden mb-6">
          <section className="p-6">
            <h2 className="section-title text-lg mb-1">
              Historial de compras
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Edita o elimina entradas del historial
            </p>

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

            {compras.length > 0 ? (
              <ul className="space-y-3">
                {compras.map((compra) => {
                  const editando =
                    editandoId === compra.id
                  const unitario =
                    compra.costo_unitario ??
                    (compra.costo_total != null &&
                    compra.cantidad > 0
                      ? compra.costo_total /
                        compra.cantidad
                      : null)

                  return (
                    <li
                      key={compra.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      {editando ? (
                        <div className="space-y-3">
                          <p className="text-sm font-semibold">
                            {formatearFechaInsumo(
                              compra.fecha
                            )}
                          </p>

                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              Cantidad
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={editCantidad}
                              onChange={(e) =>
                                setEditCantidad(
                                  e.target.value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              Monto total
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Opcional"
                              value={editMonto}
                              onChange={(e) =>
                                setEditMonto(
                                  e.target.value
                                )
                              }
                              className={
                                inputClass
                              }
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                guardarEdicion(
                                  compra.id
                                )
                              }
                              disabled={guardando}
                              className="flex-1 rounded-lg py-2 text-sm text-white font-semibold disabled:opacity-50"
                              style={{
                                background:
                                  '#c6302c'
                              }}
                            >
                              {guardando
                                ? '...'
                                : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              onClick={
                                cancelarEdicion
                              }
                              disabled={guardando}
                              className="flex-1 rounded-lg py-2 text-sm border font-semibold"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-semibold">
                              {formatearFechaInsumo(
                                compra.fecha
                              )}
                            </p>
                            <p className="text-sm text-gray-600 shrink-0">
                              +{compra.cantidad} u
                            </p>
                          </div>

                          <div className="mt-2 flex justify-between text-sm text-gray-600">
                            <span>
                              Total:{' '}
                              {compra.costo_total !=
                              null
                                ? formatearMoneda(
                                    compra.costo_total
                                  )
                                : '—'}
                            </span>
                            <span>
                              /u:{' '}
                              {unitario != null
                                ? formatearMoneda(
                                    unitario
                                  )
                                : '—'}
                            </span>
                          </div>

                          {compra.notas && (
                            <p className="mt-1 text-xs text-gray-400">
                              {compra.notas}
                            </p>
                          )}

                          <div className="mt-3 flex gap-4">
                            <button
                              type="button"
                              onClick={() =>
                                iniciarEdicion(compra)
                              }
                              disabled={
                                eliminandoId ===
                                compra.id
                              }
                              className="text-sm text-gray-500 underline disabled:opacity-50"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                eliminarCompra(
                                  compra.id
                                )
                              }
                              disabled={
                                eliminandoId ===
                                compra.id
                              }
                              className="text-sm underline disabled:opacity-50"
                              style={{ color: '#CF1322' }}
                            >
                              {eliminandoId ===
                              compra.id
                                ? 'Eliminando...'
                                : 'Eliminar'}
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Aún no hay compras de este insumo
              </p>
            )}
          </section>
        </div>

        <div className="editorial-card p-0 overflow-hidden">
          <section className="p-6">
            <h2 className="section-title text-lg mb-1">
              Consumo en pedidos entregados
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Pedidos marcados como entregados que
              usaron este insumo según la receta de
              cada kit
            </p>

            {consumoPedidos.length > 0 ? (
              <>
                <div
                  className="rounded-xl px-4 py-3 mb-4 text-sm"
                  style={{
                    background: '#FFF7E6',
                    color: '#874D00'
                  }}
                >
                  Total consumido:{' '}
                  <strong>−{totalConsumido}</strong>{' '}
                  {insumo.unidad}
                  {totalConsumido > 0 &&
                    compras.length > 0 && (
                      <>
                        {' '}
                        · Compras:{' '}
                        <strong>
                          +
                          {compras.reduce(
                            (s, c) =>
                              s + Number(c.cantidad),
                            0
                          )}
                        </strong>{' '}
                        · Stock:{' '}
                        <strong>{stockActual}</strong>
                      </>
                    )}
                </div>

                <ul className="space-y-3">
                  {consumoPedidos.map((pedido) => (
                    <li
                      key={pedido.pedidoId}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <Link
                        href={`/pedidos/${pedido.pedidoId}`}
                        className="block"
                      >
                        <div className="flex justify-between items-start gap-2">
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
                          <p
                            className="text-sm font-semibold shrink-0"
                            style={{ color: '#CF1322' }}
                          >
                            −{pedido.cantidad} u
                          </p>
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          Entregado:{' '}
                          {formatearFechaInsumo(
                            pedido.fechaEntrega
                          )}
                        </p>

                        <ul className="mt-2 space-y-1">
                          {pedido.detalleKits.map(
                            (kit, i) => (
                              <li
                                key={i}
                                className="text-xs text-gray-600"
                              >
                                {kit.kitNombre} ×
                                {kit.kitCantidad} → −
                                {kit.consumo} u
                              </li>
                            )
                          )}
                        </ul>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Ningún pedido entregado ha consumido
                este insumo
              </p>
            )}
          </section>
        </div>

      </div>
    </main>
  )
}
