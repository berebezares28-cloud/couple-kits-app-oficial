'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  CATEGORIAS_INSUMO,
  UNIDADES_INSUMO
} from '../../../scr/lib/insumosUtils'

type Insumo = {
  id: string
  nombre: string
  stock_actual: number
}

type KitOpcion = {
  id: string
  nombre: string
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition'

function kitsAsignadosVacios(kits: KitOpcion[]) {
  return Object.fromEntries(
    kits.map((kit) => [
      kit.id,
      { activo: false, cantidad: '1' }
    ])
  )
}

export default function CompraClient({
  insumos: insumosIniciales,
  kits: kitsIniciales = []
}: {
  insumos: Insumo[]
  kits?: KitOpcion[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [insumos, setInsumos] =
    useState(insumosIniciales)
  const [modo, setModo] = useState<'entrada' | 'nuevo'>(
    'entrada'
  )
  const [insumoId, setInsumoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [monto, setMonto] = useState('')
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('figura')
  const [categoriaOtro, setCategoriaOtro] =
    useState('')
  const [unidad, setUnidad] = useState('pieza')
  const [unidadOtro, setUnidadOtro] = useState('')
  const [stockInicial, setStockInicial] = useState('')
  const [montoInicial, setMontoInicial] = useState('')
  const [stockMinimo, setStockMinimo] = useState('0')
  const [kits, setKits] = useState<KitOpcion[]>(
    kitsIniciales
  )
  const [kitsAsignados, setKitsAsignados] = useState<
    Record<string, { activo: boolean; cantidad: string }>
  >(() => kitsAsignadosVacios(kitsIniciales))
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  useEffect(() => {
    async function cargar() {
      const res = await fetch('/api/insumos/stock')
      if (!res.ok) return
      const data = await res.json()
      setInsumos(data)
    }

    cargar()
  }, [])

  useEffect(() => {
    if (kitsIniciales.length > 0) {
      setKits(kitsIniciales)
      setKitsAsignados(kitsAsignadosVacios(kitsIniciales))
      return
    }

    async function cargarKits() {
      const res = await fetch('/api/kits')
      if (!res.ok) return

      const data = await res.json()
      const lista: KitOpcion[] = Array.isArray(data)
        ? data.map((k: { id: string; nombre: string }) => ({
            id: k.id,
            nombre: k.nombre ?? 'Kit'
          }))
        : []

      setKits(lista)
      setKitsAsignados(kitsAsignadosVacios(lista))
    }

    cargarKits()
  }, [kitsIniciales])

  useEffect(() => {
    const preseleccion =
      searchParams.get('insumo')

    if (preseleccion) {
      setInsumoId(preseleccion)
      setModo('entrada')
    }
  }, [searchParams])

  const insumoSeleccionado = insumos.find(
    (i) => i.id === insumoId
  )

  async function registrarEntrada() {
    if (!insumoId) {
      setMensaje({
        tipo: 'error',
        texto: 'Selecciona un insumo'
      })
      return
    }

    const qty = Number(cantidad)
    const montoGastado = monto
      ? Number(monto)
      : null

    if (!qty || qty <= 0) {
      setMensaje({
        tipo: 'error',
        texto: 'Ingresa una cantidad válida'
      })
      return
    }

    if (
      montoGastado != null &&
      (Number.isNaN(montoGastado) ||
        montoGastado < 0)
    ) {
      setMensaje({
        tipo: 'error',
        texto: 'Ingresa un monto válido'
      })
      return
    }

    setGuardando(true)
    setMensaje(null)

    const res = await fetch('/api/insumos/compra', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        insumoId,
        cantidad: qty,
        monto: montoGastado
      })
    })

    const payload = await res.json()
    setGuardando(false)

    if (!res.ok) {
      setMensaje({
        tipo: 'error',
        texto: payload.error || 'Error al guardar'
      })
      return
    }

    const stockRes = await fetch('/api/insumos/stock')
    const data = stockRes.ok
      ? await stockRes.json()
      : []
    setInsumos(data)

    const nuevoStock =
      data.find((i: Insumo) => i.id === insumoId)
        ?.stock_actual ?? 0

    const costoUnitario =
      montoGastado != null && qty > 0
        ? (montoGastado / qty).toFixed(2)
        : null

    setMensaje({
      tipo: 'ok',
      texto: costoUnitario
        ? `Compra registrada. Stock: ${nuevoStock} · ~$${costoUnitario}/u`
        : `Compra registrada. Stock: ${nuevoStock}`
    })

    setCantidad('')
    setMonto('')
    router.refresh()
  }

  async function crearInsumo() {
    if (!nombre.trim()) {
      setMensaje({
        tipo: 'error',
        texto: 'El nombre es obligatorio'
      })
      return
    }

    if (
      categoria === 'otro' &&
      !categoriaOtro.trim()
    ) {
      setMensaje({
        tipo: 'error',
        texto: 'Escribe la categoría'
      })
      return
    }

    if (unidad === 'otro' && !unidadOtro.trim()) {
      setMensaje({
        tipo: 'error',
        texto: 'Escribe la unidad'
      })
      return
    }

    setGuardando(true)
    setMensaje(null)

    const asignaciones_kits = kits
      .filter((kit) => kitsAsignados[kit.id]?.activo)
      .map((kit) => ({
        kit_id: kit.id,
        cantidad:
          Number(kitsAsignados[kit.id]?.cantidad) || 0
      }))
      .filter((a) => a.cantidad > 0)

    const res = await fetch('/api/insumos/nuevo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: nombre.trim(),
        categoria,
        categoriaOtro: categoriaOtro.trim(),
        unidad,
        unidadOtro: unidadOtro.trim(),
        stock_minimo: Number(stockMinimo) || 0,
        stock_inicial: Number(stockInicial) || 0,
        monto_inicial: montoInicial
          ? Number(montoInicial)
          : null,
        asignaciones_kits
      })
    })

    const payload = await res.json()
    setGuardando(false)

    if (!res.ok) {
      setMensaje({
        tipo: 'error',
        texto: payload.error || 'Error al crear'
      })
      return
    }

    setMensaje({
      tipo: 'ok',
      texto: asignaciones_kits.length
        ? `Insumo "${payload.insumo.nombre}" creado y agregado a ${asignaciones_kits.length} kit(s). Solo aplica a pedidos nuevos.`
        : `Insumo "${payload.insumo.nombre}" creado`
    })

    setNombre('')
    setCategoria('figura')
    setCategoriaOtro('')
    setUnidad('pieza')
    setUnidadOtro('')
    setStockInicial('')
    setMontoInicial('')
    setStockMinimo('0')
    setKitsAsignados(kitsAsignadosVacios(kits))
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">

        <Link
          href="/insumos"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Insumos
        </Link>

        <h1
          className="editorial-title mt-6"
          style={{ color: '#c6302c' }}
        >
          COMPRA
        </h1>

        <p
          className="mt-1 mb-8"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#888'
          }}
        >
          Entrada de inventario
        </p>

        <div className="flex gap-2 mb-8">
          <button
            type="button"
            onClick={() => setModo('entrada')}
            className="flex-1 px-4 py-2 rounded-full text-sm border transition"
            style={{
              background:
                modo === 'entrada'
                  ? '#c6302c'
                  : '#fff',
              color:
                modo === 'entrada' ? '#fff' : '#000'
            }}
          >
            Agregar stock
          </button>

          <button
            type="button"
            onClick={() => setModo('nuevo')}
            className="flex-1 px-4 py-2 rounded-full text-sm border transition"
            style={{
              background:
                modo === 'nuevo'
                  ? '#c6302c'
                  : '#fff',
              color:
                modo === 'nuevo' ? '#fff' : '#000'
            }}
          >
            Nuevo insumo
          </button>
        </div>

        <div className="editorial-card space-y-4">

          {modo === 'entrada' ? (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Insumo
                </label>
                <select
                  value={insumoId}
                  onChange={(e) =>
                    setInsumoId(e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">
                    Seleccionar...
                  </option>
                  {insumos.map((insumo) => (
                    <option
                      key={insumo.id}
                      value={insumo.id}
                    >
                      {insumo.nombre} (stock:{' '}
                      {insumo.stock_actual})
                    </option>
                  ))}
                </select>
              </div>

              {insumoSeleccionado && (
                <p className="text-sm text-gray-500">
                  Stock actual:{' '}
                  <strong>
                    {
                      insumoSeleccionado.stock_actual
                    }
                  </strong>
                </p>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Cantidad comprada
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej. 10"
                  value={cantidad}
                  onChange={(e) =>
                    setCantidad(e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Monto gastado (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 150"
                  value={monto}
                  onChange={(e) =>
                    setMonto(e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <button
                type="button"
                onClick={registrarEntrada}
                disabled={guardando}
                className="w-full rounded-xl py-3 text-white font-semibold transition disabled:opacity-50"
                style={{ background: '#c6302c' }}
              >
                {guardando
                  ? 'Guardando...'
                  : 'Registrar compra'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Ej. Pincel fino"
                  value={nombre}
                  onChange={(e) =>
                    setNombre(e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Categoría
                </label>
                <select
                  value={categoria}
                  onChange={(e) =>
                    setCategoria(e.target.value)
                  }
                  className={inputClass}
                >
                  {CATEGORIAS_INSUMO.map((cat) => (
                    <option
                      key={cat.value}
                      value={cat.value}
                    >
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {categoria === 'otro' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Nombre de categoría
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. adhesivo"
                    value={categoriaOtro}
                    onChange={(e) =>
                      setCategoriaOtro(e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Unidad
                </label>
                <select
                  value={unidad}
                  onChange={(e) =>
                    setUnidad(e.target.value)
                  }
                  className={inputClass}
                >
                  {UNIDADES_INSUMO.map((u) => (
                    <option
                      key={u.value}
                      value={u.value}
                    >
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {unidad === 'otro' && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Nombre de unidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. caja"
                    value={unidadOtro}
                    onChange={(e) =>
                      setUnidadOtro(e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Stock mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockMinimo}
                  onChange={(e) =>
                    setStockMinimo(e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <hr />

              <div className="space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Agregar a recetas de kits (opcional)
                </p>
                <p className="text-xs text-gray-500">
                  Solo afecta pedidos creados después de
                  hoy. Los pedidos anteriores conservan su
                  receta congelada.
                </p>

                {kits.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No hay kits activos
                  </p>
                ) : (
                  kits.map((kit) => {
                    const asignacion =
                      kitsAsignados[kit.id] ?? {
                        activo: false,
                        cantidad: '1'
                      }

                    return (
                      <div
                        key={kit.id}
                        className="rounded-xl border border-gray-100 px-4 py-3"
                      >
                        <label className="flex items-center gap-3 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={asignacion.activo}
                            onChange={(e) =>
                              setKitsAsignados(
                                (prev) => ({
                                  ...prev,
                                  [kit.id]: {
                                    ...asignacion,
                                    activo:
                                      e.target.checked
                                  }
                                })
                              )
                            }
                          />
                          {kit.nombre}
                        </label>

                        {asignacion.activo && (
                          <div className="mt-3">
                            <label className="text-xs text-gray-500 mb-1 block">
                              Cantidad por kit
                            </label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={asignacion.cantidad}
                              onChange={(e) =>
                                setKitsAsignados(
                                  (prev) => ({
                                    ...prev,
                                    [kit.id]: {
                                      ...asignacion,
                                      cantidad:
                                        e.target.value
                                    }
                                  })
                                )
                              }
                              className={inputClass}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              <hr />

              <p className="text-xs text-gray-400 uppercase tracking-wider">
                Primera compra (opcional)
              </p>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Cantidad inicial
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej. 10"
                  value={stockInicial}
                  onChange={(e) =>
                    setStockInicial(e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Monto de esa compra
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 200"
                  value={montoInicial}
                  onChange={(e) =>
                    setMontoInicial(e.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <button
                type="button"
                onClick={crearInsumo}
                disabled={guardando}
                className="w-full rounded-xl py-3 text-white font-semibold transition disabled:opacity-50"
                style={{ background: '#c6302c' }}
              >
                {guardando
                  ? 'Guardando...'
                  : 'Crear insumo'}
              </button>
            </>
          )}

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

        </div>

      </div>
    </main>
  )
}
