'use client'

import Link from 'next/link'
import { useState } from 'react'
import type {
  AtajoRangoDashboard,
  DashboardBloquePeriodo,
  DashboardData
} from '../../scr/lib/dashboardData'
import {
  ATAJOS_RANGO_DASHBOARD,
  rangoAtajo,
  validarRangoFechas
} from '../../scr/lib/dashboardData'
import { formatearMoneda } from '../../scr/lib/insumosUtils'

function BarChart({
  datos,
  color = '#c6302c',
  format = (v: number) => String(v)
}: {
  datos: { etiqueta: string; valor: number }[]
  color?: string
  format?: (v: number) => string
}) {
  const max = Math.max(...datos.map((d) => d.valor), 1)

  return (
    <div className="flex items-end justify-between gap-2 h-40 pt-4">
      {datos.map((d) => {
        const pct = (d.valor / max) * 100

        return (
          <div
            key={d.etiqueta}
            className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
          >
            <span className="text-[0.6rem] text-gray-500 text-center leading-tight">
              {d.valor > 0 ? format(d.valor) : '—'}
            </span>
            <div
              className="w-full rounded-t-lg transition-all min-h-[4px]"
              style={{
                height: `${Math.max(pct, d.valor > 0 ? 8 : 2)}%`,
                background: color,
                opacity: d.valor > 0 ? 1 : 0.15
              }}
            />
            <span className="text-[0.65rem] text-gray-600 capitalize">
              {d.etiqueta}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DonutSegment({
  pct,
  color,
  offset
}: {
  pct: number
  color: string
  offset: number
}) {
  const circ = 2 * Math.PI * 40
  const dash = (pct / 100) * circ

  return (
    <circle
      r="40"
      cx="50"
      cy="50"
      fill="transparent"
      stroke={color}
      strokeWidth="14"
      strokeDasharray={`${dash} ${circ}`}
      strokeDashoffset={-offset}
      transform="rotate(-90 50 50)"
    />
  )
}

export default function DashboardClient({
  data
}: {
  data: DashboardData
}) {
  const { tendencia, statusPedidos } = data

  const [fechaDesde, setFechaDesde] = useState(
    data.bloquePeriodo.fechaDesde
  )
  const [fechaHasta, setFechaHasta] = useState(
    data.bloquePeriodo.fechaHasta
  )
  const [bloque, setBloque] =
    useState<DashboardBloquePeriodo>(
      data.bloquePeriodo
    )
  const [cargandoPeriodo, setCargandoPeriodo] =
    useState(false)
  const [errorRango, setErrorRango] = useState<
    string | null
  >(null)

  async function cargarRango(desde: string, hasta: string) {
    const error = validarRangoFechas(desde, hasta)
    if (error) {
      setErrorRango(error)
      return
    }

    setErrorRango(null)
    setCargandoPeriodo(true)

    try {
      const res = await fetch(
        `/api/dashboard/kpis?desde=${desde}&hasta=${hasta}`
      )
      if (!res.ok) return
      const json = await res.json()
      setBloque(json)
      setFechaDesde(json.fechaDesde)
      setFechaHasta(json.fechaHasta)
    } finally {
      setCargandoPeriodo(false)
    }
  }

  function aplicarRango() {
    cargarRango(fechaDesde, fechaHasta)
  }

  function aplicarAtajo(atajo: AtajoRangoDashboard) {
    const { desde, hasta } = rangoAtajo(atajo)
    setFechaDesde(desde)
    setFechaHasta(hasta)
    cargarRango(desde, hasta)
  }

  const { kpis, topKits, mixVentas, etiquetaPeriodo } =
    bloque

  const totalStatus =
    statusPedidos.pendiente +
    statusPedidos.entregado +
    statusPedidos.cancelado

  const statusSegments = [
    {
      label: 'Pendiente',
      valor: statusPedidos.pendiente,
      color: '#D48806'
    },
    {
      label: 'Entregado',
      valor: statusPedidos.entregado,
      color: '#389E0D'
    },
    {
      label: 'Cancelado',
      valor: statusPedidos.cancelado,
      color: '#CF1322'
    }
  ]

  const circ = 2 * Math.PI * 40
  let donutAcc = 0
  const donutSegments =
    totalStatus === 0
      ? []
      : statusSegments.map((seg) => {
          const pct = (seg.valor / totalStatus) * 100
          const item = {
            ...seg,
            pct,
            offset: donutAcc
          }
          donutAcc += (pct / 100) * circ
          return item
        })

  return (
    <main className="min-h-screen bg-[#fafafa]">
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
          DASHBOARD
        </h1>

        <p
          className="mt-1 mb-4 capitalize"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#888'
          }}
        >
          Gráficas · últimos 6 meses
        </p>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
            Rango de tarjetas
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <label className="block">
              <span className="text-[0.65rem] text-gray-500 uppercase tracking-wider">
                Desde
              </span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) =>
                  setFechaDesde(e.target.value)
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              />
            </label>
            <label className="block">
              <span className="text-[0.65rem] text-gray-500 uppercase tracking-wider">
                Hasta
              </span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) =>
                  setFechaHasta(e.target.value)
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white"
              />
            </label>
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            {ATAJOS_RANGO_DASHBOARD.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => aplicarAtajo(a.id)}
                disabled={cargandoPeriodo}
                className="px-3 py-1.5 rounded-full text-xs border whitespace-nowrap font-medium transition bg-white text-gray-700 border-gray-200 hover:border-gray-400 disabled:opacity-60"
              >
                {a.label}
              </button>
            ))}
            <button
              type="button"
              onClick={aplicarRango}
              disabled={cargandoPeriodo}
              className="px-3 py-1.5 rounded-full text-xs border whitespace-nowrap font-medium transition"
              style={{
                background: '#111',
                color: '#fff',
                borderColor: '#111',
                opacity: cargandoPeriodo ? 0.7 : 1
              }}
            >
              Aplicar
            </button>
          </div>
          {errorRango ? (
            <p className="text-xs text-red-600 mt-1">
              {errorRango}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              {etiquetaPeriodo}
            </p>
          )}
        </div>

        <div
          className="grid grid-cols-2 gap-3 mb-6 transition-opacity"
          style={{
            opacity: cargandoPeriodo ? 0.5 : 1
          }}
        >
          <div className="editorial-card">
            <p className="metric-label">Ingresos</p>
            <p
              className="text-xl font-bold mt-1"
              style={{ color: '#389E0D' }}
            >
              {formatearMoneda(kpis.ingresosMes)}
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Utilidad neta</p>
            <p
              className="text-xl font-bold mt-1"
              style={{
                color:
                  kpis.utilidadNetaMes >= 0
                    ? '#389E0D'
                    : '#CF1322'
              }}
            >
              {formatearMoneda(kpis.utilidadNetaMes)}
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Kits vendidos</p>
            <p className="text-xl font-bold mt-1">
              {kpis.kitsVendidosMes}
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Ticket prom.</p>
            <p className="text-xl font-bold mt-1">
              {formatearMoneda(kpis.ticketPromedio)}
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Margen bruto</p>
            <p className="text-xl font-bold mt-1">
              {kpis.margenBrutoPct.toFixed(0)}%
            </p>
          </div>
          <div className="editorial-card">
            <p className="metric-label">Ventas</p>
            <p className="text-xl font-bold mt-1">
              {kpis.ventasMes}
            </p>
          </div>
        </div>

        <div className="editorial-card mb-6">
          <h2 className="section-title text-base mb-1">
            Ingresos · 6 meses
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            Tendencia de ventas registradas
          </p>
          <BarChart
            datos={tendencia.map((t) => ({
              etiqueta: t.etiqueta,
              valor: t.ingresos
            }))}
            color="#389E0D"
            format={(v) =>
              v >= 1000
                ? `$${(v / 1000).toFixed(1)}k`
                : `$${v.toFixed(0)}`
            }
          />
        </div>

        <div className="editorial-card mb-6">
          <h2 className="section-title text-base mb-1">
            Utilidad neta · 6 meses
          </h2>
          <BarChart
            datos={tendencia.map((t) => ({
              etiqueta: t.etiqueta,
              valor: Math.max(0, t.utilidadNeta)
            }))}
            color="#c6302c"
            format={(v) =>
              v >= 1000
                ? `$${(v / 1000).toFixed(1)}k`
                : `$${v.toFixed(0)}`
            }
          />
        </div>

        <div className="editorial-card mb-6">
          <h2 className="section-title text-base mb-1">
            Kits vendidos · 6 meses
          </h2>
          <BarChart
            datos={tendencia.map((t) => ({
              etiqueta: t.etiqueta,
              valor: t.kits
            }))}
            color="#111"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <div
            className="editorial-card transition-opacity"
            style={{
              opacity: cargandoPeriodo ? 0.5 : 1
            }}
          >
            <h2 className="section-title text-base mb-4">
              Top kits del periodo
            </h2>
            {topKits.length === 0 ? (
              <p className="text-sm text-gray-400">
                Sin ventas en este periodo
              </p>
            ) : (
              <div className="space-y-3">
                {topKits.map((kit, i) => {
                  const max = topKits[0]?.cantidad ?? 1
                  const pct =
                    (kit.cantidad / max) * 100

                  return (
                    <div key={kit.nombre}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium truncate pr-2">
                          {i + 1}. {kit.nombre}
                        </span>
                        <span className="text-gray-500 shrink-0">
                          {kit.cantidad}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: '#c6302c'
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="editorial-card">
            <h2 className="section-title text-base mb-4">
              Estado de pedidos
            </h2>
            <div className="flex items-center gap-6">
              <svg
                viewBox="0 0 100 100"
                className="w-28 h-28 shrink-0"
              >
                {totalStatus === 0 ? (
                  <circle
                    r="40"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    stroke="#eee"
                    strokeWidth="14"
                  />
                ) : (
                  donutSegments.map((seg) => (
                    <DonutSegment
                      key={seg.label}
                      pct={seg.pct}
                      color={seg.color}
                      offset={seg.offset}
                    />
                  ))
                )}
              </svg>
              <div className="space-y-2 text-sm flex-1">
                {statusSegments.map((seg) => (
                  <div
                    key={seg.label}
                    className="flex justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: seg.color
                        }}
                      />
                      {seg.label}
                    </span>
                    <span className="font-semibold">
                      {seg.valor}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="editorial-card mb-6 transition-opacity"
          style={{
            opacity: cargandoPeriodo ? 0.5 : 1
          }}
        >
          <h2 className="section-title text-base mb-4">
            Mix de ventas
          </h2>
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">
                Directo
              </p>
              <p className="text-2xl font-bold mt-1">
                {mixVentas.directo}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {kpis.mixDirectoPct.toFixed(0)}%
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-xs text-gray-500 uppercase">
                Bulk / local
              </p>
              <p className="text-2xl font-bold mt-1">
                {mixVentas.bulk}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {(100 - kpis.mixDirectoPct).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/insumos/criticos"
            className="editorial-card block hover:-translate-y-[1px] transition"
          >
            <p className="metric-label">⚠️ Críticos</p>
            <p
              className="text-xl font-bold"
              style={{ color: '#CF1322' }}
            >
              {kpis.insumosCriticos}
            </p>
          </Link>
          <Link
            href="/finanzas"
            className="editorial-card block hover:-translate-y-[1px] transition"
          >
            <p className="metric-label">📦 Inventario</p>
            <p className="text-lg font-bold">
              {formatearMoneda(kpis.inventarioValor)}
            </p>
          </Link>
          <Link
            href="/pedidos?estatus=Pendiente"
            className="editorial-card block hover:-translate-y-[1px] transition col-span-2"
          >
            <p className="metric-label">
              📦 Pedidos pendientes
            </p>
            <p className="text-xl font-bold">
              {kpis.pedidosPendientes}
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
