'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  CATEGORIAS_GASTO,
  ETIQUETAS_CATEGORIA_GASTO,
  normalizarFinanzasResumen,
  type CategoriaGasto,
  type CuentaFlujoMes,
  type CuentaResumen,
  type FinanzasResumen,
  type Gasto,
  METODOS_PAGO,
  type MetodoPago
} from '../../scr/lib/finanzasData'
import {
  formatearFechaInsumo,
  formatearMoneda
} from '../../scr/lib/insumosUtils'

const inputClass =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black'

type Tab = 'pl' | 'gastos' | 'activos' | 'cuentas'

function etiquetaMes(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  const fecha = new Date(y, m - 1, 1)
  return fecha.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric'
  })
}

function LineaPL({
  label,
  valor,
  destacado,
  negativo,
  indent
}: {
  label: string
  valor: number
  destacado?: boolean
  negativo?: boolean
  indent?: boolean
}) {
  const monto = negativo ? -Math.abs(valor) : valor

  return (
    <div
      className={`flex justify-between gap-3 py-2 ${
        destacado
          ? 'border-t border-gray-200 pt-3 mt-1 font-semibold'
          : ''
      } ${indent ? 'pl-3' : ''}`}
    >
      <span
        className={
          destacado
            ? ''
            : indent
              ? 'text-gray-500 text-xs'
              : 'text-gray-600 text-sm'
        }
      >
        {label}
      </span>
      <span
        className={
          destacado
            ? ''
            : indent
              ? 'text-xs font-medium'
              : 'text-sm font-medium'
        }
        style={{
          color:
            monto < 0 ? '#CF1322' : undefined
        }}
      >
        {formatearMoneda(monto)}
      </span>
    </div>
  )
}

function SeccionColapsable({
  titulo,
  subtitulo,
  abierto,
  onToggle,
  children
}: {
  titulo: string
  subtitulo?: string
  abierto: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition"
      >
        <div>
          <p className="text-sm font-semibold">
            {titulo}
          </p>
          {subtitulo && (
            <p className="text-xs text-gray-500 mt-0.5">
              {subtitulo}
            </p>
          )}
        </div>
        <span className="text-gray-400 text-xs shrink-0">
          {abierto ? '▲' : '▼'}
        </span>
      </button>
      {abierto && (
        <div className="px-4 pb-3 pt-1 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

function TarjetasFlujoMes({
  cuentas
}: {
  cuentas: CuentaFlujoMes[]
}) {
  return (
    <div className="space-y-3 pt-2">
      {cuentas.map((c) => (
        <div
          key={c.metodo_pago}
          className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
        >
          <p className="font-semibold text-sm mb-2">
            {c.metodo_pago}
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
            <span>Entradas</span>
            <span
              className="text-right"
              style={{ color: '#389E0D' }}
            >
              +{formatearMoneda(c.entradas)}
            </span>
            <span>Salidas</span>
            <span
              className="text-right"
              style={{ color: '#CF1322' }}
            >
              −{formatearMoneda(c.salidas)}
            </span>
            <span className="font-semibold text-gray-900">
              Flujo neto
            </span>
            <span
              className="text-right font-semibold"
              style={{
                color:
                  c.flujoNeto < 0
                    ? '#CF1322'
                    : '#389E0D'
              }}
            >
              {formatearMoneda(c.flujoNeto)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function TarjetasFlujoHistorico({
  cuentas
}: {
  cuentas: CuentaResumen[]
}) {
  return (
    <div className="space-y-3">
      {cuentas.map((c) => (
        <div
          key={c.metodo_pago}
          className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
        >
          <p className="font-semibold text-sm mb-2">
            {c.metodo_pago}
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
            <span>Saldo inicial</span>
            <span className="text-right">
              {formatearMoneda(c.saldoInicial)}
            </span>
            <span>Entradas</span>
            <span
              className="text-right"
              style={{ color: '#389E0D' }}
            >
              +{formatearMoneda(c.entradas)}
            </span>
            <span>Salidas</span>
            <span
              className="text-right"
              style={{ color: '#CF1322' }}
            >
              −{formatearMoneda(c.salidas)}
            </span>
            <span className="font-semibold text-gray-900">
              Saldo actual
            </span>
            <span className="text-right font-semibold">
              {formatearMoneda(c.saldoActual)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FinanzasClient({
  resumenInicial,
  gastosIniciales
}: {
  resumenInicial: FinanzasResumen
  gastosIniciales: Gasto[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pl')
  const [mes, setMes] = useState(resumenInicial.mes)
  const [resumen, setResumen] = useState(() =>
    normalizarFinanzasResumen(resumenInicial)
  )
  const [gastos, setGastos] = useState(gastosIniciales)
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  const [plAbierto, setPlAbierto] = useState({
    ingresos: true,
    gastosCosto: true,
    comisiones: true,
    gastosAdmin: true
  })
  const [mesesFlujoAbiertos, setMesesFlujoAbiertos] =
    useState<Record<string, boolean>>({})

  const [concepto, setConcepto] = useState('')
  const [fechaGasto, setFechaGasto] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] =
    useState<CategoriaGasto>('otros')
  const [metodoPago, setMetodoPago] =
    useState<MetodoPago>('Efectivo')

  const [saldosEdit, setSaldosEdit] = useState(
    resumenInicial.cuentas.map((c) => ({
      metodo_pago: c.metodo_pago,
      saldo_inicial: String(c.saldoInicial)
    }))
  )

  const recargar = useCallback(async (nuevoMes: string) => {
    setCargando(true)
    try {
      const [resFin, resGastos] = await Promise.all([
        fetch(`/api/finanzas?mes=${nuevoMes}`),
        fetch(`/api/finanzas/gastos?mes=${nuevoMes}`)
      ])

      if (resFin.ok) {
        const data = normalizarFinanzasResumen(
          await resFin.json()
        )
        setResumen(data)
        setSaldosEdit(
          data.cuentas.map(
            (c: (typeof resumen.cuentas)[0]) => ({
              metodo_pago: c.metodo_pago,
              saldo_inicial: String(c.saldoInicial)
            })
          )
        )
      }

      if (resGastos.ok) {
        const data = await resGastos.json()
        setGastos(data.gastos)
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (
      tab === 'cuentas' &&
      !Array.isArray(resumen.flujosPorMes)
    ) {
      recargar(mes)
    }
  }, [tab, resumen.flujosPorMes, mes, recargar])

  async function cambiarMes(nuevoMes: string) {
    setMes(nuevoMes)
    await recargar(nuevoMes)
  }

  function flujoNetoMes(cuentas: CuentaFlujoMes[]) {
    return cuentas.reduce((s, c) => s + c.flujoNeto, 0)
  }

  async function registrarGasto() {
    if (!concepto.trim()) {
      setMensaje({
        tipo: 'error',
        texto: 'Escribe el concepto'
      })
      return
    }

    const montoNum = Number(monto)
    if (Number.isNaN(montoNum) || montoNum <= 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Monto inválido'
      })
      return
    }

    setGuardando(true)
    setMensaje(null)

    try {
      const res = await fetch('/api/finanzas/gastos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          concepto,
          fecha: fechaGasto,
          monto: montoNum,
          categoria,
          metodo_pago: metodoPago
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al guardar'
        })
        return
      }

      setConcepto('')
      setMonto('')
      setMensaje({
        tipo: 'ok',
        texto: 'Gasto registrado'
      })
      await recargar(mes)
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

  async function borrarGasto(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return

    const res = await fetch(
      `/api/finanzas/gastos?id=${id}`,
      { method: 'DELETE' }
    )

    if (res.ok) {
      await recargar(mes)
      router.refresh()
    }
  }

  async function guardarSaldos() {
    setGuardando(true)
    setMensaje(null)

    try {
      const res = await fetch('/api/finanzas', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          saldos: saldosEdit.map((s) => ({
            metodo_pago: s.metodo_pago,
            saldo_inicial: Number(s.saldo_inicial) || 0
          }))
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'Error al guardar'
        })
        return
      }

      setMensaje({
        tipo: 'ok',
        texto: 'Saldos iniciales actualizados'
      })
      await recargar(mes)
    } catch {
      setMensaje({
        tipo: 'error',
        texto: 'Error de conexión'
      })
    } finally {
      setGuardando(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pl', label: 'P&L' },
    { id: 'gastos', label: 'Gastos' },
    { id: 'activos', label: 'Activos' },
    { id: 'cuentas', label: 'Cuentas' }
  ]

  const { pl } = resumen

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">

        <h1
          className="editorial-title"
          style={{ color: '#c6302c' }}
        >
          FINANZAS
        </h1>

        <p
          className="mt-1 mb-4"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#888'
          }}
        >
          estudio
        </p>

        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">
            Periodo
          </label>
          <select
            value={mes}
            onChange={(e) =>
              cambiarMes(e.target.value)
            }
            disabled={cargando}
            className={inputClass}
          >
            {resumen.mesesDisponibles.map((m) => (
              <option key={m} value={m}>
                {etiquetaMes(m)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-1 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="flex-1 min-w-[4.5rem] rounded-full py-2 text-xs font-semibold border whitespace-nowrap"
              style={{
                background:
                  tab === t.id ? '#111' : '#fff',
                color: tab === t.id ? '#fff' : '#111'
              }}
            >
              {t.label}
            </button>
          ))}
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

        {tab === 'pl' && (
          <div className="editorial-card space-y-3">
            <h2 className="section-title text-lg">
              P&L — {etiquetaMes(mes)}
            </h2>

            <p className="text-xs text-gray-500">
              Mensual · costo FIFO (primeras entradas,
              primeras salidas)
            </p>

            <SeccionColapsable
              titulo="Ingresos"
              subtitulo={`${pl.kitsVendidos} kits vendidos · ${formatearMoneda(pl.ingresos)}`}
              abierto={plAbierto.ingresos}
              onToggle={() =>
                setPlAbierto((p) => ({
                  ...p,
                  ingresos: !p.ingresos
                }))
              }
            >
              <LineaPL
                label="Ventas (pedidos + bulk)"
                valor={pl.ingresos}
              />
            </SeccionColapsable>

            <SeccionColapsable
              titulo="Gastos (costo de ventas)"
              subtitulo={formatearMoneda(pl.costoVentas)}
              abierto={plAbierto.gastosCosto}
              onToggle={() =>
                setPlAbierto((p) => ({
                  ...p,
                  gastosCosto: !p.gastosCosto
                }))
              }
            >
              <LineaPL
                label="Insumos consumidos (FIFO)"
                valor={pl.costoVentas}
                negativo
              />
              <LineaPL
                label="Margen bruto"
                valor={pl.margenBruto}
                destacado
              />
            </SeccionColapsable>

            <SeccionColapsable
              titulo="Comisiones"
              subtitulo={formatearMoneda(pl.comisiones)}
              abierto={plAbierto.comisiones}
              onToggle={() =>
                setPlAbierto((p) => ({
                  ...p,
                  comisiones: !p.comisiones
                }))
              }
            >
              <LineaPL
                label="Comisiones a locales"
                valor={pl.comisiones}
                negativo
              />
              <LineaPL
                label="Utilidad operativa"
                valor={pl.utilidadOperativa}
                destacado
              />
            </SeccionColapsable>

            <SeccionColapsable
              titulo="Gastos administrativos (G&A)"
              subtitulo={formatearMoneda(
                pl.totalGastosAdmin
              )}
              abierto={plAbierto.gastosAdmin}
              onToggle={() =>
                setPlAbierto((p) => ({
                  ...p,
                  gastosAdmin: !p.gastosAdmin
                }))
              }
            >
              {CATEGORIAS_GASTO.map((cat) => (
                <LineaPL
                  key={cat}
                  label={
                    ETIQUETAS_CATEGORIA_GASTO[cat]
                  }
                  valor={pl.gastosPorCategoria[cat]}
                  negativo
                  indent
                />
              ))}
              <LineaPL
                label="Total gastos administrativos"
                valor={pl.totalGastosAdmin}
                negativo
                destacado
              />
            </SeccionColapsable>

            <div
              className="rounded-xl px-4 py-4 flex justify-between items-center"
              style={{
                background: '#F6FFED',
                color: '#389E0D'
              }}
            >
              <span className="font-semibold text-sm">
                Utilidad neta
              </span>
              <span className="text-xl font-semibold">
                {formatearMoneda(pl.utilidadNeta)}
              </span>
            </div>
          </div>
        )}

        {tab === 'gastos' && (
          <div className="space-y-6">
            <div className="editorial-card space-y-3">
              <h2 className="section-title text-lg">
                Registrar gasto G&A
              </h2>

              <input
                placeholder="Concepto"
                value={concepto}
                onChange={(e) =>
                  setConcepto(e.target.value)
                }
                className={inputClass}
              />

              <input
                type="date"
                value={fechaGasto}
                onChange={(e) =>
                  setFechaGasto(e.target.value)
                }
                className={inputClass}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Monto"
                value={monto}
                onChange={(e) =>
                  setMonto(e.target.value)
                }
                className={inputClass}
              />

              <select
                value={categoria}
                onChange={(e) =>
                  setCategoria(
                    e.target.value as CategoriaGasto
                  )
                }
                className={inputClass}
              >
                {CATEGORIAS_GASTO.map((cat) => (
                  <option key={cat} value={cat}>
                    {ETIQUETAS_CATEGORIA_GASTO[cat]}
                  </option>
                ))}
              </select>

              <select
                value={metodoPago}
                onChange={(e) =>
                  setMetodoPago(
                    e.target.value as MetodoPago
                  )
                }
                className={inputClass}
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={registrarGasto}
                disabled={guardando}
                className="w-full rounded-xl py-3 text-white font-semibold disabled:opacity-50"
                style={{ background: '#c6302c' }}
              >
                {guardando
                  ? 'Guardando...'
                  : 'Registrar gasto'}
              </button>
            </div>

            <div className="editorial-card">
              <h3 className="section-title text-base mb-3">
                Gastos de {etiquetaMes(mes)}
              </h3>

              {gastos.length > 0 ? (
                <ul className="space-y-3">
                  {gastos.map((g) => (
                    <li
                      key={g.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="flex justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            {g.concepto}
                          </p>
                          <p className="text-xs text-gray-500">
                            {
                              ETIQUETAS_CATEGORIA_GASTO[
                                g.categoria
                              ]
                            }{' '}
                            · {g.metodo_pago}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatearFechaInsumo(
                              g.fecha
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatearMoneda(g.monto)}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              borrarGasto(g.id)
                            }
                            className="text-xs text-red-600 underline mt-1"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">
                  Sin gastos este mes
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'activos' && (
          <div className="editorial-card">
            <h2 className="section-title text-lg mb-3">
              Activos
            </h2>

            <div
              className="rounded-xl px-4 py-5 text-center mb-4"
              style={{
                background: '#F6FFED',
                color: '#389E0D'
              }}
            >
              <p className="text-xs uppercase tracking-wider mb-1">
                Inventario en existencia
              </p>
              <p className="text-3xl font-semibold">
                {formatearMoneda(
                  resumen.inventarioValor
                )}
              </p>
              <p className="text-xs mt-2 opacity-80">
                Valorado con costo FIFO de los lotes
                que aún no se han consumido
              </p>
            </div>
          </div>
        )}

        {tab === 'cuentas' && (
          <div className="space-y-6">
            <div className="editorial-card space-y-4">
              <div>
                <h2 className="section-title text-lg mb-1">
                  Flujo histórico acumulado
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Desde el saldo inicial hasta hoy
                </p>
                <TarjetasFlujoHistorico
                  cuentas={resumen.cuentas}
                />
              </div>
            </div>

            <div className="editorial-card space-y-4">
              <h2 className="section-title text-lg">
                Saldos iniciales
              </h2>

              {saldosEdit.map((s, i) => (
                <div key={s.metodo_pago}>
                  <label className="text-xs text-gray-500 mb-1 block">
                    {s.metodo_pago}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={s.saldo_inicial}
                    onChange={(e) => {
                      const copia = [...saldosEdit]
                      copia[i] = {
                        ...copia[i],
                        saldo_inicial: e.target.value
                      }
                      setSaldosEdit(copia)
                    }}
                    className={inputClass}
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={guardarSaldos}
                disabled={guardando}
                className="w-full rounded-xl py-3 text-white font-semibold disabled:opacity-50"
                style={{ background: '#111' }}
              >
                Guardar saldos iniciales
              </button>
            </div>

            <div className="editorial-card space-y-3">
              <h2 className="section-title text-lg">
                Flujo por mes
              </h2>
              <p className="text-xs text-gray-500">
                Movimientos de cada periodo
              </p>

              {(resumen.flujosPorMes ?? []).map((flujo) => {
                const neto = flujoNetoMes(flujo.cuentas)
                const abierto =
                  mesesFlujoAbiertos[flujo.mes] ?? false

                return (
                  <SeccionColapsable
                    key={flujo.mes}
                    titulo={etiquetaMes(flujo.mes)}
                    subtitulo={`Flujo neto total: ${formatearMoneda(neto)}`}
                    abierto={abierto}
                    onToggle={() =>
                      setMesesFlujoAbiertos((prev) => ({
                        ...prev,
                        [flujo.mes]: !abierto
                      }))
                    }
                  >
                    <TarjetasFlujoMes
                      cuentas={flujo.cuentas}
                    />
                  </SeccionColapsable>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
