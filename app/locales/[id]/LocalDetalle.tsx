'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  formatearFechaInsumo,
  formatearMoneda
} from '../../../scr/lib/insumosUtils'
import {
  type EstadisticasComision,
  type PuntoEntrega,
  type VentaLocal
} from '../../../scr/lib/puntosEntrega'

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black'

function formatearPorcentaje(valor: number | null) {
  if (valor == null) return '—'
  return `${valor.toFixed(1)}%`
}

export default function LocalDetalle({
  punto: puntoInicial,
  ventasIniciales,
  totalIngresos: ingresosInicial,
  totalComision: comisionInicial,
  totalKits: kitsInicial,
  estadisticasComision: statsInicial
}: {
  punto: PuntoEntrega
  ventasIniciales: VentaLocal[]
  totalIngresos: number
  totalComision: number
  totalKits: number
  estadisticasComision: EstadisticasComision
}) {
  const router = useRouter()
  const [punto, setPunto] = useState(puntoInicial)
  const [ventas, setVentas] = useState(ventasIniciales)
  const [totalIngresos, setTotalIngresos] =
    useState(ingresosInicial)
  const [totalComision, setTotalComision] =
    useState(comisionInicial)
  const [totalKits, setTotalKits] =
    useState(kitsInicial)
  const [estadisticas, setEstadisticas] =
    useState(statsInicial)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [modoHistorico, setModoHistorico] =
    useState(true)
  const [editando, setEditando] = useState(false)
  const [nombreEdit, setNombreEdit] = useState(
    puntoInicial.nombre
  )
  const [tieneComisionEdit, setTieneComisionEdit] =
    useState(puntoInicial.tiene_comision)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [eliminandoId, setEliminandoId] = useState<
    string | null
  >(null)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  async function aplicarFiltro() {
    setCargando(true)
    setModoHistorico(false)

    try {
      const params = new URLSearchParams()
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)

      const res = await fetch(
        `/api/locales/${punto.id}?${params.toString()}`
      )

      if (!res.ok) return

      const data = await res.json()
      setVentas(data.ventas)
      setTotalIngresos(data.totalIngresos)
      setTotalComision(data.totalComision)
      setTotalKits(data.totalKits)
    } finally {
      setCargando(false)
    }
  }

  function verHistorico() {
    setModoHistorico(true)
    setDesde('')
    setHasta('')
    setVentas(ventasIniciales)
    setTotalIngresos(ingresosInicial)
    setTotalComision(comisionInicial)
    setTotalKits(kitsInicial)
    setEstadisticas(statsInicial)
  }

  async function guardarPunto() {
    setGuardando(true)
    setMensaje(null)

    try {
      const res = await fetch(
        `/api/locales/${punto.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: nombreEdit,
            tiene_comision: tieneComisionEdit,
            porcentaje_comision: null
          })
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

      setPunto(data.punto)
      setEditando(false)
      setMensaje({
        tipo: 'ok',
        texto: 'Local actualizado'
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

  async function eliminarLocal() {
    if (
      !confirm(
        `¿Eliminar "${punto.nombre}"? Ya no aparecerá en la lista, pero el historial de ventas y pedidos se conserva.`
      )
    ) {
      return
    }

    setEliminando(true)
    setMensaje(null)

    try {
      const res = await fetch(
        `/api/locales/${punto.id}`,
        { method: 'DELETE' }
      )

      const data = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al eliminar'
        })
        return
      }

      router.push('/locales')
      router.refresh()
    } catch {
      setMensaje({
        tipo: 'error',
        texto: 'Error de conexión'
      })
    } finally {
      setEliminando(false)
    }
  }

  async function eliminarVenta(ventaId: string) {
    if (
      !confirm(
        '¿Eliminar esta venta bulk? No se puede deshacer.'
      )
    ) {
      return
    }

    setEliminandoId(ventaId)
    setMensaje(null)

    try {
      const res = await fetch(
        `/api/locales/ventas/${ventaId}`,
        { method: 'DELETE' }
      )

      const data = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al eliminar'
        })
        return
      }

      router.refresh()
      window.location.reload()
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
          href="/locales"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Locales
        </Link>

        <div className="mt-6 mb-6">
          <h1
            className="editorial-title text-3xl"
            style={{ color: '#c6302c' }}
          >
            {punto.nombre}
          </h1>
          {punto.tiene_comision && (
            <div className="mt-2 text-sm text-gray-600 space-y-0.5">
              {estadisticas.totalKits > 0 ? (
                <>
                  <p>
                    Comisión histórica:{' '}
                    <strong>
                      {formatearMoneda(
                        estadisticas.comisionPromedioPorKit ?? 0
                      )}
                    </strong>{' '}
                    / kit
                  </p>
                  <p>
                    Porcentaje histórico:{' '}
                    <strong>
                      {formatearPorcentaje(
                        estadisticas.porcentajePromedio
                      )}
                    </strong>
                  </p>
                </>
              ) : (
                <p>
                  Sin historial de comisiones aún
                </p>
              )}
            </div>
          )}
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

        <div className="editorial-card p-6 mb-6">
          {!editando ? (
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="text-sm text-gray-500 underline"
              >
                Editar local
              </button>
              <button
                type="button"
                onClick={eliminarLocal}
                disabled={eliminando}
                className="text-sm text-red-600 underline disabled:opacity-50"
              >
                {eliminando
                  ? 'Eliminando...'
                  : 'Eliminar local'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                value={nombreEdit}
                onChange={(e) =>
                  setNombreEdit(e.target.value)
                }
                className={inputClass}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tieneComisionEdit}
                  onChange={(e) =>
                    setTieneComisionEdit(
                      e.target.checked
                    )
                  }
                />
                Cuenta con comisión
              </label>
              <p className="text-xs text-gray-500">
                La comisión se calcula del historial de
                ventas, no se define manualmente.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={guardarPunto}
                  disabled={guardando}
                  className="flex-1 rounded-lg py-2 text-sm text-white font-semibold"
                  style={{ background: '#c6302c' }}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="flex-1 rounded-lg py-2 text-sm border"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <Link
          href={`/locales/venta?local=${punto.id}`}
          className="block w-full mb-6 text-center rounded-xl py-3 text-white font-semibold"
          style={{ background: '#111' }}
        >
          Registrar venta en bulk
        </Link>

        <div className="editorial-card p-0 overflow-hidden">
          <section className="p-6">
            <h2 className="section-title text-lg mb-4">
              Ventas
            </h2>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Kits
                </p>
                <p className="text-xl font-semibold">
                  {totalKits}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Ingresos
                </p>
                <p className="text-sm font-semibold">
                  {formatearMoneda(totalIngresos)}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  Comisión
                </p>
                <p className="text-sm font-semibold">
                  {formatearMoneda(totalComision)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={verHistorico}
                className="flex-1 rounded-full py-2 text-sm border font-semibold"
                style={{
                  background: modoHistorico
                    ? '#111'
                    : '#fff',
                  color: modoHistorico
                    ? '#fff'
                    : '#111'
                }}
              >
                Histórico
              </button>
              <button
                type="button"
                onClick={() => setModoHistorico(false)}
                className="flex-1 rounded-full py-2 text-sm border font-semibold"
                style={{
                  background: !modoHistorico
                    ? '#111'
                    : '#fff',
                  color: !modoHistorico
                    ? '#fff'
                    : '#111'
                }}
              >
                Por fechas
              </button>
            </div>

            {!modoHistorico && (
              <div className="mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={desde}
                    onChange={(e) =>
                      setDesde(e.target.value)
                    }
                    className={inputClass}
                  />
                  <input
                    type="date"
                    value={hasta}
                    onChange={(e) =>
                      setHasta(e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={aplicarFiltro}
                  disabled={cargando}
                  className="w-full rounded-lg py-2 text-sm text-white font-semibold disabled:opacity-50"
                  style={{ background: '#111' }}
                >
                  {cargando
                    ? 'Cargando...'
                    : 'Aplicar filtro'}
                </button>
              </div>
            )}

            {ventas.length > 0 ? (
              <ul className="space-y-3">
                {ventas.map((venta) => (
                  <li
                    key={`${venta.tipo}-${venta.id}`}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    {venta.tipo === 'pedido' &&
                    venta.pedido_id ? (
                      <Link
                        href={`/pedidos/${venta.pedido_id}`}
                        className="block"
                      >
                        <VentaCard venta={venta} />
                      </Link>
                    ) : (
                      <>
                        <VentaCard venta={venta} />
                        <div className="flex gap-3 mt-3 pt-2 border-t border-gray-200">
                          <Link
                            href={`/locales/venta/${venta.id}`}
                            className="text-xs text-gray-600 underline"
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              eliminarVenta(venta.id)
                            }
                            disabled={
                              eliminandoId === venta.id
                            }
                            className="text-xs text-red-600 underline disabled:opacity-50"
                          >
                            {eliminandoId === venta.id
                              ? 'Eliminando...'
                              : 'Eliminar'}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                Sin ventas registradas
              </p>
            )}
          </section>
        </div>

      </div>
    </main>
  )
}

function VentaCard({ venta }: { venta: VentaLocal }) {
  const kitsTotal = venta.kits.reduce(
    (s, k) => s + k.cantidad,
    0
  )
  const comisionPorKit =
    kitsTotal > 0
      ? venta.comision_monto / kitsTotal
      : null
  const porcentaje =
    venta.ingreso_total > 0
      ? (venta.comision_monto / venta.ingreso_total) *
        100
      : null

  return (
    <>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold">
            {venta.tipo === 'pedido'
              ? `Pedido: ${venta.cliente ?? 'Cliente'}`
              : 'Venta bulk'}
          </p>
          <p className="text-xs text-gray-500">
            {formatearFechaInsumo(venta.fecha)}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">
            {formatearMoneda(venta.ingreso_total)}
          </p>
          <p className="text-xs text-gray-500">
            Comisión:{' '}
            {formatearMoneda(venta.comision_monto)}
          </p>
        </div>
      </div>
      <ul className="mt-2 space-y-0.5">
        {venta.kits.map((k) => (
          <li
            key={k.kit_id}
            className="text-xs text-gray-600"
          >
            {k.kit_nombre} ×{k.cantidad} —{' '}
            {formatearMoneda(k.subtotal)}
          </li>
        ))}
      </ul>
      {venta.tipo === 'bulk' && kitsTotal > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {formatearMoneda(comisionPorKit ?? 0)} / kit ·{' '}
          {formatearPorcentaje(porcentaje)}
        </p>
      )}
    </>
  )
}
