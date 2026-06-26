'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { formatearMoneda } from '../../../scr/lib/insumosUtils'
import type { EstadisticasComision } from '../../../scr/lib/puntosEntrega'
import { METODOS_PAGO } from '../../../scr/lib/fifoCosteo'

type Punto = {
  id: string
  nombre: string
}

type Kit = {
  id: string
  nombre: string
  precio_venta: number | null
}

type Linea = {
  kit_id: string
  cantidad: string
}

type VentaInicial = {
  punto_entrega_id: string
  fecha: string
  comision_monto: number
  metodo_pago: string | null
  notas: string | null
  kits: { kit_id: string; cantidad: number }[]
}

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black'

const selectKitClass =
  'min-w-0 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black'

const inputCantidadClass =
  'w-full rounded-lg border border-gray-200 px-2 py-2 text-sm text-center focus:outline-none focus:border-black'

function formatearPorcentaje(valor: number | null) {
  if (valor == null) return '—'
  return `${valor.toFixed(1)}%`
}

export default function VentaBulkClient({
  puntos,
  kits,
  ventaId,
  ventaInicial
}: {
  puntos: Punto[]
  kits: Kit[]
  ventaId?: string
  ventaInicial?: VentaInicial
}) {
  const esEdicion = Boolean(ventaId && ventaInicial)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [puntoId, setPuntoId] = useState(
    ventaInicial?.punto_entrega_id ??
      searchParams.get('local') ??
      ''
  )
  const [fecha, setFecha] = useState(
    ventaInicial?.fecha ??
      new Date().toISOString().split('T')[0]
  )
  const [comision, setComision] = useState(
    ventaInicial?.comision_monto != null
      ? String(ventaInicial.comision_monto)
      : ''
  )
  const [metodoPago, setMetodoPago] = useState(
    ventaInicial?.metodo_pago ?? ''
  )
  const [notas, setNotas] = useState(
    ventaInicial?.notas ?? ''
  )
  const [lineas, setLineas] = useState<Linea[]>(
    ventaInicial?.kits.length
      ? ventaInicial.kits.map((k) => ({
          kit_id: k.kit_id,
          cantidad: String(k.cantidad)
        }))
      : [{ kit_id: '', cantidad: '1' }]
  )
  const [statsHistoricas, setStatsHistoricas] =
    useState<EstadisticasComision | null>(null)
  const [cargandoStats, setCargandoStats] =
    useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  const ingresoCalculado = useMemo(() => {
    let total = 0

    for (const linea of lineas) {
      if (!linea.kit_id) continue

      const kit = kits.find((k) => k.id === linea.kit_id)
      const precio = Number(kit?.precio_venta) || 0
      const cantidad = Number(linea.cantidad) || 0

      total += precio * cantidad
    }

    return total
  }, [lineas, kits])

  const kitsEnVenta = useMemo(() => {
    return lineas.reduce((suma, linea) => {
      if (!linea.kit_id) return suma
      return suma + (Number(linea.cantidad) || 0)
    }, 0)
  }, [lineas])

  const comisionMonto = comision ? Number(comision) : 0

  const comisionPorKitVenta =
    kitsEnVenta > 0 && comisionMonto >= 0
      ? comisionMonto / kitsEnVenta
      : null

  const porcentajeVenta =
    ingresoCalculado > 0 && comisionMonto >= 0
      ? (comisionMonto / ingresoCalculado) * 100
      : null

  useEffect(() => {
    if (!puntoId) {
      setStatsHistoricas(null)
      return
    }

    let activo = true
    setCargandoStats(true)

    fetch(`/api/locales/${puntoId}/comision`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (activo) {
          setStatsHistoricas(data)
        }
      })
      .finally(() => {
        if (activo) {
          setCargandoStats(false)
        }
      })

    return () => {
      activo = false
    }
  }, [puntoId])

  function agregarLinea() {
    setLineas((prev) => [
      ...prev,
      { kit_id: '', cantidad: '1' }
    ])
  }

  function quitarLinea(index: number) {
    setLineas((prev) =>
      prev.filter((_, i) => i !== index)
    )
  }

  function actualizarLinea(
    index: number,
    campo: keyof Linea,
    valor: string
  ) {
    setLineas((prev) =>
      prev.map((l, i) =>
        i === index ? { ...l, [campo]: valor } : l
      )
    )
  }

  async function guardar() {
    if (!puntoId) {
      setMensaje({
        tipo: 'error',
        texto: 'Selecciona el local'
      })
      return
    }

    const kitsPayload = lineas
      .filter((l) => l.kit_id)
      .map((l) => ({
        kit_id: l.kit_id,
        cantidad: Number(l.cantidad)
      }))

    if (kitsPayload.length === 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Agrega al menos un kit'
      })
      return
    }

    if (Number.isNaN(comisionMonto) || comisionMonto < 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Comisión inválida'
      })
      return
    }

    setGuardando(true)
    setMensaje(null)

    const payload = {
      punto_entrega_id: puntoId,
      fecha,
      comision_monto: comisionMonto,
      metodo_pago: metodoPago || null,
      notas: notas || null,
      kits: kitsPayload
    }

    try {
      const res = await fetch(
        esEdicion
          ? `/api/locales/ventas/${ventaId}`
          : '/api/locales/ventas',
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
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al guardar'
        })
        return
      }

      router.push(`/locales/${puntoId}`)
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
    <main className="min-h-screen bg-[#fafafa]">
      <div className="max-w-md mx-auto px-5 pt-8 pb-24">

        <Link
          href={
            puntoId
              ? `/locales/${puntoId}`
              : '/locales'
          }
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Locales
        </Link>

        <div className="mt-6 mb-8">
          <h1
            className="editorial-title text-3xl"
            style={{ color: '#c6302c' }}
          >
            {esEdicion
              ? 'Editar venta bulk'
              : 'Venta en bulk'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {esEdicion
              ? 'Corrige kits, monto o comisión'
              : 'Registra kits vendidos directamente en un local'}
          </p>
        </div>

        <div className="editorial-card p-6 space-y-4">

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
              Local
            </label>
            <select
              value={puntoId}
              onChange={(e) =>
                setPuntoId(e.target.value)
              }
              disabled={esEdicion}
              className={`${inputClass} disabled:bg-gray-50`}
            >
              <option value="">
                Seleccionar local...
              </option>
              {puntos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {puntoId && (
            <div
              className="rounded-xl px-4 py-3 text-sm space-y-1"
              style={{
                background: '#FFF7E6',
                color: '#874D00'
              }}
            >
              <p className="text-xs uppercase tracking-wider font-semibold">
                Comisión histórica del local
              </p>
              {cargandoStats ? (
                <p className="text-xs">Calculando...</p>
              ) : statsHistoricas &&
                statsHistoricas.totalKits > 0 ? (
                <>
                  <p>
                    Promedio:{' '}
                    <strong>
                      {formatearMoneda(
                        statsHistoricas.comisionPromedioPorKit ?? 0
                      )}
                    </strong>{' '}
                    / kit
                  </p>
                  <p>
                    Porcentaje:{' '}
                    <strong>
                      {formatearPorcentaje(
                        statsHistoricas.porcentajePromedio
                      )}
                    </strong>
                  </p>
                  <p className="text-xs opacity-80">
                    Basado en{' '}
                    {statsHistoricas.totalKits} kits y{' '}
                    {formatearMoneda(
                      statsHistoricas.totalComision
                    )}{' '}
                    de comisión
                  </p>
                </>
              ) : (
                <p className="text-xs">
                  Aún no hay historial de comisiones en
                  este local
                </p>
              )}
            </div>
          )}

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
            <p className="text-xs text-gray-500 mb-2">
              Kits vendidos
            </p>
            <div className="grid grid-cols-[1fr_3.5rem_auto] gap-2 mb-1 px-1">
              <span className="text-xs text-gray-400">
                Kit
              </span>
              <span className="text-xs text-gray-400 text-center">
                Cant.
              </span>
              <span />
            </div>
            <div className="space-y-2">
              {lineas.map((linea, index) => {
                const kit = kits.find(
                  (k) => k.id === linea.kit_id
                )
                const subtotal =
                  (Number(kit?.precio_venta) || 0) *
                  (Number(linea.cantidad) || 0)

                return (
                  <div key={index}>
                    <div className="grid grid-cols-[1fr_3.5rem_auto] gap-2 items-center">
                      <select
                        value={linea.kit_id}
                        onChange={(e) =>
                          actualizarLinea(
                            index,
                            'kit_id',
                            e.target.value
                          )
                        }
                        className={selectKitClass}
                      >
                        <option value="">
                          Seleccionar kit...
                        </option>
                        {kits.map((k) => (
                          <option
                            key={k.id}
                            value={k.id}
                          >
                            {k.nombre} (
                            {k.precio_venta != null
                              ? formatearMoneda(
                                  k.precio_venta
                                )
                              : '—'}
                            )
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        title="Cantidad"
                        placeholder="1"
                        value={linea.cantidad}
                        onChange={(e) =>
                          actualizarLinea(
                            index,
                            'cantidad',
                            e.target.value
                          )
                        }
                        className={inputCantidadClass}
                      />

                      {lineas.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            quitarLinea(index)
                          }
                          className="text-gray-400 px-1 shrink-0"
                          aria-label="Quitar kit"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="w-5" />
                      )}
                    </div>
                    {linea.kit_id && (
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        Subtotal:{' '}
                        {formatearMoneda(subtotal)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            <button
              type="button"
              onClick={agregarLinea}
              className="mt-2 text-sm text-gray-500 underline"
            >
              + Agregar kit
            </button>
          </div>

          <div
            className="rounded-xl px-4 py-3 text-center"
            style={{
              background: '#F6FFED',
              color: '#389E0D'
            }}
          >
            <p className="text-xs uppercase tracking-wider">
              Ingreso calculado
            </p>
            <p className="text-2xl font-semibold">
              {formatearMoneda(ingresoCalculado)}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Método de pago
            </label>
            <select
              value={metodoPago}
              onChange={(e) =>
                setMetodoPago(e.target.value)
              }
              className={inputClass}
            >
              <option value="">
                Seleccionar...
              </option>
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Comisión pagada al local ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Monto exacto en pesos"
              value={comision}
              onChange={(e) =>
                setComision(e.target.value)
              }
              className={inputClass}
            />
          </div>

          {kitsEnVenta > 0 && comision !== '' && (
            <div
              className="rounded-xl px-4 py-3 text-sm space-y-1"
              style={{
                background: '#F0F5FF',
                color: '#1D39C4'
              }}
            >
              <p className="text-xs uppercase tracking-wider font-semibold">
                Esta venta
              </p>
              <p>
                Comisión / kit:{' '}
                <strong>
                  {formatearMoneda(comisionPorKitVenta ?? 0)}
                </strong>
              </p>
              <p>
                Porcentaje:{' '}
                <strong>
                  {formatearPorcentaje(porcentajeVenta)}
                </strong>
              </p>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Notas (opcional)
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) =>
                setNotas(e.target.value)
              }
              className={`${inputClass} resize-y`}
            />
          </div>

          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="w-full rounded-xl py-3 text-white font-semibold disabled:opacity-50"
            style={{ background: '#c6302c' }}
          >
            {guardando
              ? 'Guardando...'
              : esEdicion
                ? 'Guardar cambios'
                : 'Registrar venta'}
          </button>
        </div>

      </div>
    </main>
  )
}
