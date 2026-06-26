'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ConsolidacionVentas } from '../../scr/lib/consolidacionVentas'
import {
  etiquetaCategoria,
  formatearFechaInsumo,
  formatearMoneda
} from '../../scr/lib/insumosUtils'

type Kit = {
  id: string
  nombre: string
  precio_venta: number | null
  ventasTotal: number
}

type InsumoOpcion = {
  id: string
  nombre: string
  categoria: string
  unidad: string
}

type LineaReceta = {
  insumo_id: string
  cantidad: string
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black'

export default function KitsClient({
  kitsIniciales,
  insumos,
  consolidacion
}: {
  kitsIniciales: Kit[]
  insumos: InsumoOpcion[]
  consolidacion: ConsolidacionVentas
}) {
  const router = useRouter()
  const [kits, setKits] = useState(kitsIniciales)
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [lineas, setLineas] = useState<LineaReceta[]>([
    { insumo_id: '', cantidad: '1' }
  ])
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  function agregarLinea() {
    setLineas((prev) => [
      ...prev,
      { insumo_id: '', cantidad: '1' }
    ])
  }

  function quitarLinea(index: number) {
    setLineas((prev) =>
      prev.filter((_, i) => i !== index)
    )
  }

  function actualizarLinea(
    index: number,
    campo: keyof LineaReceta,
    valor: string
  ) {
    setLineas((prev) =>
      prev.map((linea, i) =>
        i === index
          ? { ...linea, [campo]: valor }
          : linea
      )
    )
  }

  async function crearKit() {
    if (!nombre.trim()) {
      setMensaje({
        tipo: 'error',
        texto: 'Escribe el nombre del kit'
      })
      return
    }

    const receta = lineas
      .filter((l) => l.insumo_id)
      .map((l) => ({
        insumo_id: l.insumo_id,
        cantidad: Number(l.cantidad)
      }))

    if (receta.length === 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Agrega al menos un insumo a la receta'
      })
      return
    }

    for (const linea of receta) {
      if (!linea.cantidad || linea.cantidad <= 0) {
        setMensaje({
          tipo: 'error',
          texto: 'Todas las cantidades deben ser mayores a 0'
        })
        return
      }
    }

    setGuardando(true)
    setMensaje(null)

    try {
      const res = await fetch('/api/kits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre,
          precio_venta: precio ? Number(precio) : null,
          receta
        })
      })

      const payload = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: payload.error || 'Error al crear'
        })
        return
      }

      router.push(`/kits/${payload.kitId}`)
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

  const [mostrarResumen, setMostrarResumen] =
    useState(true)

  const kitsContabilizados =
    consolidacion.ventasBulk.totalKits +
    consolidacion.pedidosNormales.totalKits

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">

        <h1
          className="editorial-title"
          style={{ color: '#c6302c' }}
        >
          KITS
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

        <div className="editorial-card mb-6 p-0 overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setMostrarResumen((v) => !v)
            }
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div>
              <h2 className="section-title text-base">
                Resumen de ventas
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {kitsContabilizados} kits contabilizados
                en total
              </p>
            </div>
            <span className="text-gray-400 text-sm">
              {mostrarResumen ? '▲' : '▼'}
            </span>
          </button>

          {mostrarResumen && (
            <div className="px-5 pb-5 space-y-4 border-t border-gray-100">

              <div className="grid grid-cols-3 gap-2 pt-4 text-center">
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-lg font-semibold text-amber-800">
                    {
                      consolidacion.pedidosEnLocal
                        .totalKits
                    }
                  </p>
                  <p className="text-[0.65rem] text-amber-700 uppercase tracking-wide">
                    En local
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-lg font-semibold text-blue-800">
                    {
                      consolidacion.ventasBulk
                        .totalKits
                    }
                  </p>
                  <p className="text-[0.65rem] text-blue-700 uppercase tracking-wide">
                    Bulk
                  </p>
                </div>
                <div className="rounded-xl bg-green-50 p-3">
                  <p className="text-lg font-semibold text-green-800">
                    {
                      consolidacion.pedidosNormales
                        .totalKits
                    }
                  </p>
                  <p className="text-[0.65rem] text-green-700 uppercase tracking-wide">
                    Normal
                  </p>
                </div>
              </div>

              <section
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: '#FFF7E6',
                  color: '#874D00'
                }}
              >
                <p className="font-semibold mb-1">
                  1. Pedidos entregados en local
                </p>
                <p className="text-xs mb-2 opacity-90">
                  No cuentan como venta hasta registrar
                  en bulk
                </p>
                <p>
                  <strong>
                    {
                      consolidacion.pedidosEnLocal
                        .totalPedidos
                    }
                  </strong>{' '}
                  pedidos ·{' '}
                  <strong>
                    {
                      consolidacion.pedidosEnLocal
                        .totalKits
                    }
                  </strong>{' '}
                  kits
                </p>
                {consolidacion.pedidosEnLocal.porLocal
                  .length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs">
                    {consolidacion.pedidosEnLocal.porLocal.map(
                      (l) => (
                        <li
                          key={l.localId}
                          className="flex justify-between gap-2"
                        >
                          <Link
                            href={`/locales/${l.localId}`}
                            className="underline"
                          >
                            {l.localNombre}
                          </Link>
                          <span>
                            {l.pedidos} ped. · {l.kits}{' '}
                            kits
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs opacity-80">
                    Sin pedidos entregados en local
                  </p>
                )}
                {consolidacion.pedidosEnLocal.recientes
                  .length > 0 && (
                  <ul className="mt-3 pt-2 border-t border-amber-200/60 space-y-1 text-xs">
                    {consolidacion.pedidosEnLocal.recientes.map(
                      (p) => (
                        <li key={p.id}>
                          <Link
                            href={`/pedidos/${p.id}`}
                            className="underline font-medium"
                          >
                            {p.nombre}
                          </Link>
                          {' · '}
                          {p.localNombre} · {p.kits}{' '}
                          kit{p.kits !== 1 ? 's' : ''}
                          {p.fecha && (
                            <>
                              {' · '}
                              {formatearFechaInsumo(
                                p.fecha
                              )}
                            </>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </section>

              <section
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: '#F0F5FF',
                  color: '#1D39C4'
                }}
              >
                <p className="font-semibold mb-1">
                  2. Ventas bulk en locales
                </p>
                <p className="text-xs mb-2 opacity-90">
                  Registradas manualmente — cuentan como
                  venta real
                </p>
                <p>
                  <strong>
                    {
                      consolidacion.ventasBulk
                        .totalVentas
                    }
                  </strong>{' '}
                  ventas ·{' '}
                  <strong>
                    {
                      consolidacion.ventasBulk.totalKits
                    }
                  </strong>{' '}
                  kits
                </p>
                <p className="mt-1">
                  Ingresos:{' '}
                  <strong>
                    {formatearMoneda(
                      consolidacion.ventasBulk
                        .totalIngresos
                    )}
                  </strong>
                  {' · '}
                  Comisión:{' '}
                  <strong>
                    {formatearMoneda(
                      consolidacion.ventasBulk
                        .totalComision
                    )}
                  </strong>
                </p>
                {consolidacion.ventasBulk.porLocal.length >
                0 ? (
                  <ul className="mt-2 space-y-1 text-xs">
                    {consolidacion.ventasBulk.porLocal.map(
                      (l) => (
                        <li
                          key={l.localId}
                          className="flex justify-between gap-2"
                        >
                          <Link
                            href={`/locales/${l.localId}`}
                            className="underline shrink-0"
                          >
                            {l.localNombre}
                          </Link>
                          <span className="text-right">
                            {l.kits} kits ·{' '}
                            {formatearMoneda(l.ingresos)}
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs opacity-80">
                    Sin ventas bulk registradas
                  </p>
                )}
                <Link
                  href="/locales/venta"
                  className="inline-block mt-3 text-xs underline font-semibold"
                >
                  Registrar venta bulk →
                </Link>
              </section>

              <section
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: '#F6FFED',
                  color: '#389E0D'
                }}
              >
                <p className="font-semibold mb-1">
                  3. Pedidos entregados normales
                </p>
                <p className="text-xs mb-2 opacity-90">
                  Entrega directa — cuentan al marcar
                  entregado
                </p>
                <p>
                  <strong>
                    {
                      consolidacion.pedidosNormales
                        .totalPedidos
                    }
                  </strong>{' '}
                  pedidos ·{' '}
                  <strong>
                    {
                      consolidacion.pedidosNormales
                        .totalKits
                    }
                  </strong>{' '}
                  kits ·{' '}
                  <strong>
                    {formatearMoneda(
                      consolidacion.pedidosNormales
                        .totalIngresos
                    )}
                  </strong>
                </p>
              </section>

            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setMostrarFormulario(!mostrarFormulario)
            setMensaje(null)
          }}
          className="w-full mb-6 rounded-xl py-3 text-white font-semibold"
          style={{ background: '#c6302c' }}
        >
          {mostrarFormulario
            ? 'Cerrar formulario'
            : '+ Crear nuevo kit'}
        </button>

        {mostrarFormulario && (
          <div className="editorial-card mb-6 space-y-4">
            <h2 className="section-title text-lg">
              Nuevo kit
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
                placeholder="Ej. Moonlight kit"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Precio de venta
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) =>
                  setPrecio(e.target.value)
                }
                className={inputClass}
                placeholder="Ej. 175"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">
                Receta (insumos)
              </p>

              <div className="space-y-2">
                {lineas.map((linea, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-start"
                  >
                    <select
                      value={linea.insumo_id}
                      onChange={(e) =>
                        actualizarLinea(
                          index,
                          'insumo_id',
                          e.target.value
                        )
                      }
                      className={`${inputClass} flex-1`}
                    >
                      <option value="">
                        Seleccionar insumo
                      </option>
                      {insumos.map((insumo) => (
                        <option
                          key={insumo.id}
                          value={insumo.id}
                        >
                          {insumo.nombre} (
                          {etiquetaCategoria(
                            insumo.categoria
                          )}
                          )
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={linea.cantidad}
                      onChange={(e) =>
                        actualizarLinea(
                          index,
                          'cantidad',
                          e.target.value
                        )
                      }
                      className={`${inputClass} w-20`}
                    />

                    {lineas.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          quitarLinea(index)
                        }
                        className="text-sm text-gray-400 px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={agregarLinea}
                className="mt-2 text-sm text-gray-500 underline"
              >
                + Agregar insumo
              </button>
            </div>

            <button
              type="button"
              onClick={crearKit}
              disabled={guardando}
              className="w-full rounded-xl py-3 text-white font-semibold disabled:opacity-50"
              style={{ background: '#111' }}
            >
              {guardando ? 'Guardando...' : 'Crear kit'}
            </button>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-4">
          Ordenados por kits vendidos
        </p>

        {kits.length > 0 ? (
          kits.map((kit) => (
            <Link
              key={kit.id}
              href={`/kits/${kit.id}`}
              className="block editorial-card mb-4 hover:-translate-y-[1px] transition"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="customer-name">
                    {kit.nombre}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {kit.precio_venta != null
                      ? formatearMoneda(
                          kit.precio_venta
                        )
                      : 'Sin precio'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-2xl font-semibold">
                    {kit.ventasTotal}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    vendidos
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="editorial-card text-center py-8 text-gray-500">
            No hay kits activos
          </div>
        )}

      </div>
    </main>
  )
}
