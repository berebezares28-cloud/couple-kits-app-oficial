'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../../scr/lib/supabase'
import {
  obtenerConsumoDesdeKits,
  syncPedidoKits
} from '../../../scr/lib/descontarInventario'
import { inferirEntregaDesdePedido } from '../../../scr/lib/puntosEntrega'

type Pedido = {
  id: string
  nombre: string
  instagram: string
  estatus: string
  fecha_entrega: string | null
  hora_entrega: string | null
  lugar_entrega: string | null
  metodo_pago: string | null
  ocasion: string | null
  semillas: string | null
  nota: string | null
  recibe_comision: boolean
  porcentaje_comision: number | null
  punto_entrega_id: string | null
}

type PedidoKit = {
  kit_id: string
  nombre: string
  cantidad: number
  precio_venta: number | null
}

type PuntoEntrega = {
  id: string
  nombre: string
  tiene_comision: boolean
  porcentaje_comision: number | null
}

type KitDisponible = {
  id: string
  nombre: string
  precio_venta: number | null
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'Pendiente':
      return {
        background: '#FFF7E6',
        color: '#D48806',
        border: '#FFE58F'
      }

    case 'Entregado':
      return {
        background: '#F6FFED',
        color: '#389E0D',
        border: '#B7EB8F'
      }

    case 'Cancelado':
      return {
        background: '#FFF1F0',
        color: '#CF1322',
        border: '#FFA39E'
      }

    default:
      return {
        background: '#F5F5F5',
        color: '#595959',
        border: '#D9D9D9'
      }
  }
}

type ConsumoLinea = {
  insumoId: string
  nombre: string
  cantidad: number
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-4">
      {children}
    </p>
  )
}

const METODOS_PAGO = [
  'Mercado Pago',
  'Efectivo',
  'Nu'
] as const

const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition'

export default function PedidoDetalle({
  pedido: pedidoInicial,
  kits: kitsIniciales,
  kitsDisponibles,
  puntosEntrega
}: {
  pedido: Pedido
  kits: PedidoKit[]
  kitsDisponibles: KitDisponible[]
  puntosEntrega: PuntoEntrega[]
}) {
  const entregaInicial = inferirEntregaDesdePedido(
    pedidoInicial,
    puntosEntrega
  )

  const [pedido, setPedido] = useState({
    ...pedidoInicial,
    punto_entrega_id:
      entregaInicial.punto_entrega_id ??
      pedidoInicial.punto_entrega_id
  })
  const [kitsPedido, setKitsPedido] =
    useState(kitsIniciales)
  const [kitSeleccionado, setKitSeleccionado] =
    useState('')
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [consumoPreview, setConsumoPreview] =
    useState<ConsumoLinea[]>([])
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)
  const [tipoEntrega, setTipoEntrega] = useState<
    'directa' | 'local'
  >(entregaInicial.tipo)

  const router = useRouter()

  const esLocal = tipoEntrega === 'local'

  const localSeleccionado = puntosEntrega.find(
    (p) => p.id === pedido.punto_entrega_id
  )

  useEffect(() => {
    async function cargarPedidoActual() {
      const { data: pedidoDb } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoInicial.id)
        .single()

      if (pedidoDb) {
        const entrega = inferirEntregaDesdePedido(
          pedidoDb,
          puntosEntrega
        )

        setPedido({
          ...pedidoDb,
          punto_entrega_id:
            entrega.punto_entrega_id ??
            pedidoDb.punto_entrega_id
        })
        setTipoEntrega(entrega.tipo)
      }

      const { data: pedidoKits } = await supabase
        .from('pedido_kits')
        .select(`
          kit_id,
          cantidad,
          kits ( nombre, precio_venta )
        `)
        .eq('pedido_id', pedidoInicial.id)

      if (pedidoKits) {
        const kitsCargados = pedidoKits.map(
          (item: {
            kit_id: string
            cantidad: number
            kits: {
              nombre: string
              precio_venta: number | null
            } | {
              nombre: string
              precio_venta: number | null
            }[] | null
          }) => {
            const kitData = item.kits
            const datos = Array.isArray(kitData)
              ? kitData[0]
              : kitData

            return {
              kit_id: item.kit_id,
              nombre: datos?.nombre ?? 'Kit',
              cantidad: item.cantidad,
              precio_venta:
                datos?.precio_venta != null
                  ? Number(datos.precio_venta)
                  : null
            }
          }
        )

        setKitsPedido(kitsCargados)
      }
    }

    cargarPedidoActual()
  }, [pedidoInicial.id])

  useEffect(() => {
    async function cargarConsumo() {
      if (
        pedido.estatus !== 'Entregado' ||
        esLocal
      ) {
        setConsumoPreview([])
        return
      }

      const consumo = await obtenerConsumoDesdeKits(
        supabase,
        kitsPedido.map((k) => ({
          kit_id: k.kit_id,
          cantidad: k.cantidad
        }))
      )

      if (consumo.ok) {
        setConsumoPreview(consumo.lineas)
      }
    }

    cargarConsumo()
  }, [pedido.estatus, kitsPedido, esLocal])

  const statusStyle = getStatusStyle(pedido.estatus)

  const kitsParaAgregar = kitsDisponibles.filter(
    (kit) =>
      !kitsPedido.some(
        (pk) => pk.kit_id === kit.id
      )
  )

  function actualizarCampo(
    campo: keyof Pedido,
    valor: string
  ) {
    setPedido((prev) => ({
      ...prev,
      [campo]: valor
    }))
    setMensaje(null)
  }

  function agregarKit() {
    if (!kitSeleccionado) return

    const kit = kitsDisponibles.find(
      (k) => k.id === kitSeleccionado
    )

    if (!kit) return

    setKitsPedido((prev) => [
      ...prev,
      {
        kit_id: kit.id,
        nombre: kit.nombre,
        cantidad: 1,
        precio_venta: kit.precio_venta
      }
    ])

    setKitSeleccionado('')
    setMensaje(null)
  }

  function quitarKit(kitId: string) {
    setKitsPedido((prev) =>
      prev.filter((k) => k.kit_id !== kitId)
    )
    setMensaje(null)
  }

  function actualizarCantidad(
    kitId: string,
    cantidad: number
  ) {
    if (cantidad < 1) return

    setKitsPedido((prev) =>
      prev.map((k) =>
        k.kit_id === kitId
          ? { ...k, cantidad }
          : k
      )
    )
    setMensaje(null)
  }

  async function guardarCambios() {
    setGuardando(true)
    setMensaje(null)

    if (tipoEntrega === 'local' && !pedido.punto_entrega_id) {
      setGuardando(false)
      setMensaje({
        tipo: 'error',
        texto: 'Selecciona el local de entrega'
      })
      return
    }

    if (
      tipoEntrega === 'directa' &&
      pedido.estatus === 'Entregado' &&
      !pedido.metodo_pago
    ) {
      setGuardando(false)
      setMensaje({
        tipo: 'error',
        texto: 'Selecciona el método de pago para registrar la venta'
      })
      return
    }

    const kitsResult = await syncPedidoKits(
      supabase,
      pedido.id,
      kitsPedido.map((k) => ({
        kit_id: k.kit_id,
        cantidad: k.cantidad
      }))
    )

    if (!kitsResult.ok) {
      setGuardando(false)
      setMensaje({
        tipo: 'error',
        texto: kitsResult.error
      })
      return
    }

    const { error: pedidoError } = await supabase
      .from('pedidos')
      .update({
        estatus: pedido.estatus,
        fecha_entrega: pedido.fecha_entrega || null,
        hora_entrega: pedido.hora_entrega || null,
        lugar_entrega: pedido.lugar_entrega || null,
        metodo_pago: pedido.metodo_pago || null,
        ocasion: pedido.ocasion || null,
        semillas: pedido.semillas || null,
        nota: pedido.nota || null,
        recibe_comision: false,
        porcentaje_comision: null,
        punto_entrega_id:
          tipoEntrega === 'local'
            ? pedido.punto_entrega_id
            : null
      })
      .eq('id', pedido.id)

    setGuardando(false)

    if (pedidoError) {
      setMensaje({
        tipo: 'error',
        texto: pedidoError.message
      })
      return
    }

    const detalleInventario =
      !esLocal &&
      pedido.estatus === 'Entregado' &&
      consumoPreview.length > 0
        ? `Insumos descontados en stock: ${consumoPreview.map((l) => `${l.nombre} (−${l.cantidad})`).join(', ')}`
        : null

    setMensaje({
      tipo: 'ok',
      texto: detalleInventario
        ? `Pedido guardado. ${detalleInventario}`
        : 'Cambios guardados'
    })

    router.refresh()
  }

  async function eliminarPedidoAccion() {
    const confirmar = window.confirm(
      '¿Eliminar este pedido? Si ya estaba entregado, se revertirá el inventario descontado.'
    )

    if (!confirmar) return

    setEliminando(true)
    setMensaje(null)

    try {
      const res = await fetch(`/api/pedidos/${pedido.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje({
          tipo: 'error',
          texto: data.error || 'No se pudo eliminar'
        })
        return
      }

      router.push('/pedidos')
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

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="max-w-md mx-auto px-5 pt-8 pb-24">

        <Link
          href="/pedidos"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Pedidos
        </Link>

        <div className="mt-6 mb-8">

          <h1
            className="editorial-title"
            style={{ color: '#c6302c' }}
          >
            {pedido.nombre}
          </h1>

          <p className="mt-1" style={{ color: '#777' }}>
            @{pedido.instagram}
          </p>

        </div>

        <div className="editorial-card p-0 overflow-hidden">

          <section className="p-6">
            <SectionLabel>Estatus</SectionLabel>

            <select
              value={pedido.estatus}
              onChange={(e) =>
                actualizarCampo(
                  'estatus',
                  e.target.value
                )
              }
              className="text-sm border rounded-xl px-4 py-3 w-full font-medium"
              style={{
                background: statusStyle.background,
                color: statusStyle.color,
                borderColor: statusStyle.border
              }}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </section>

          {pedido.estatus === 'Entregado' && esLocal && (
            <>
              <hr />
              <section className="p-6 space-y-3">
                <div
                  className="rounded-xl px-4 py-4 text-sm space-y-3"
                  style={{
                    background: '#FFF7E6',
                    color: '#874D00'
                  }}
                >
                  <p className="font-semibold">
                    Pedido en local
                    {localSeleccionado
                      ? `: ${localSeleccionado.nombre}`
                      : ''}
                  </p>
                  <p>
                    Este pedido no cuenta como venta ni
                    descuenta inventario. Regístralo en
                    venta bulk del local para contabilizar
                    kits, ingreso y comisión.
                  </p>
                  {pedido.punto_entrega_id && (
                    <Link
                      href={`/locales/venta?local=${pedido.punto_entrega_id}`}
                      className="inline-block rounded-lg px-4 py-2 text-sm font-semibold text-white"
                      style={{ background: '#111' }}
                    >
                      Ir a venta bulk
                    </Link>
                  )}
                </div>
              </section>
            </>
          )}

          {pedido.estatus === 'Entregado' && !esLocal && (
            <>
              <hr />

              <section className="p-6 space-y-3">
                <SectionLabel>Inventario</SectionLabel>

                <p className="text-sm text-gray-600">
                  Al guardar como entregado, estos insumos
                  se restan del stock automáticamente.
                  Si vuelves a pendiente, regresan solos.
                </p>

                {consumoPreview.length > 0 ? (
                  <ul className="text-sm space-y-1 rounded-lg bg-gray-50 px-3 py-2">
                    {consumoPreview.map((linea) => (
                      <li
                        key={linea.insumoId}
                        className="flex justify-between gap-2"
                      >
                        <span>{linea.nombre}</span>
                        <span className="text-gray-500">
                          −{linea.cantidad}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">
                    Sin insumos en la receta de estos kits
                  </p>
                )}
              </section>
            </>
          )}

          <hr />

          <section className="p-6">
            <SectionLabel>Kits</SectionLabel>

            <div className="space-y-3">
              {kitsPedido.length > 0 ? (
                kitsPedido.map((kit) => (
                  <div
                    key={kit.kit_id}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {kit.nombre}
                      </p>
                    </div>

                    <input
                      type="number"
                      min="1"
                      value={kit.cantidad}
                      onChange={(e) =>
                        actualizarCantidad(
                          kit.kit_id,
                          Number(e.target.value)
                        )
                      }
                      className="w-16 rounded-lg border px-2 py-2 text-sm text-center"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        quitarKit(kit.kit_id)
                      }
                      className="shrink-0 w-9 h-9 rounded-lg border text-red-600 hover:bg-red-50 transition"
                      aria-label={`Quitar ${kit.nombre}`}
                    >
                      ✕
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">
                  Sin kits asignados
                </p>
              )}
            </div>

            {kitsParaAgregar.length > 0 && (
              <div className="mt-4 flex gap-2">
                <select
                  value={kitSeleccionado}
                  onChange={(e) =>
                    setKitSeleccionado(
                      e.target.value
                    )
                  }
                  className={`${inputClass} flex-1`}
                >
                  <option value="">
                    Agregar kit...
                  </option>
                  {kitsParaAgregar.map((kit) => (
                    <option
                      key={kit.id}
                      value={kit.id}
                    >
                      {kit.nombre}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={agregarKit}
                  disabled={!kitSeleccionado}
                  className="shrink-0 px-4 rounded-xl border font-semibold hover:bg-gray-50 transition disabled:opacity-40"
                >
                  +
                </button>
              </div>
            )}
          </section>

          <hr />

          <section className="p-6 space-y-4">
            <SectionLabel>Entrega</SectionLabel>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Tipo de entrega
              </label>
              <select
                value={tipoEntrega}
                onChange={(e) => {
                  const tipo = e.target
                    .value as 'directa' | 'local'
                  setTipoEntrega(tipo)
                  if (tipo === 'directa') {
                    setPedido((prev) => ({
                      ...prev,
                      punto_entrega_id: null
                    }))
                  }
                  setMensaje(null)
                }}
                className={inputClass}
              >
                <option value="directa">
                  Entrega directa (no es local)
                </option>
                <option value="local">
                  Entrega en local
                </option>
              </select>
            </div>

            {esLocal ? (
              <>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Local
                  </label>
                  <select
                    value={pedido.punto_entrega_id ?? ''}
                    onChange={(e) => {
                      const puntoId =
                        e.target.value || null
                      const punto = puntosEntrega.find(
                        (p) => p.id === puntoId
                      )

                      setPedido((prev) => ({
                        ...prev,
                        punto_entrega_id: puntoId,
                        lugar_entrega:
                          punto?.nombre ??
                          prev.lugar_entrega
                      }))
                      setMensaje(null)
                    }}
                    className={inputClass}
                  >
                    <option value="">
                      Seleccionar local...
                    </option>
                    {puntosEntrega.map((punto) => (
                      <option
                        key={punto.id}
                        value={punto.id}
                      >
                        {punto.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: '#F0F5FF',
                    color: '#1D39C4'
                  }}
                >
                  Al marcar entregado, registra la venta
                  manualmente en bulk del local para no
                  duplicar kits vendidos.
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Fecha de entrega (referencia)
                  </label>
                  <input
                    type="date"
                    value={pedido.fecha_entrega ?? ''}
                    onChange={(e) =>
                      actualizarCampo(
                        'fecha_entrega',
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={pedido.fecha_entrega ?? ''}
                    onChange={(e) =>
                      actualizarCampo(
                        'fecha_entrega',
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Hora
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 6:00 PM"
                    value={pedido.hora_entrega ?? ''}
                    onChange={(e) =>
                      actualizarCampo(
                        'hora_entrega',
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Lugar
                  </label>
                  <input
                    type="text"
                    placeholder="Lugar de entrega"
                    value={pedido.lugar_entrega ?? ''}
                    onChange={(e) =>
                      actualizarCampo(
                        'lugar_entrega',
                        e.target.value
                      )
                    }
                    className={inputClass}
                  />
                </div>
              </>
            )}
          </section>

          {!esLocal && (
            <>
              <hr />

              <section className="p-6">
                <SectionLabel>Pago</SectionLabel>

                <p className="text-sm text-gray-600 mb-3">
                  {pedido.estatus === 'Entregado'
                    ? 'Indica cómo se pagó para registrar la venta.'
                    : 'Al entregar, selecciona el método de pago.'}
                </p>

                <select
                  value={pedido.metodo_pago ?? ''}
                  onChange={(e) =>
                    actualizarCampo(
                      'metodo_pago',
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Seleccionar método...
                  </option>
                  {METODOS_PAGO.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {metodo}
                    </option>
                  ))}
                  {pedido.metodo_pago &&
                    !METODOS_PAGO.includes(
                      pedido.metodo_pago as (typeof METODOS_PAGO)[number]
                    ) && (
                      <option
                        value={pedido.metodo_pago}
                      >
                        {pedido.metodo_pago}
                      </option>
                    )}
                </select>
              </section>
            </>
          )}

          <hr />

          <section className="p-6">
            <SectionLabel>Ocasión</SectionLabel>

            <input
              type="text"
              placeholder="Ocasión"
              value={pedido.ocasion ?? ''}
              onChange={(e) =>
                actualizarCampo(
                  'ocasion',
                  e.target.value
                )
              }
              className={inputClass}
            />
          </section>

          <hr />

          <section className="p-6">
            <SectionLabel>Semillas</SectionLabel>

            <input
              type="text"
              placeholder="Semillas"
              value={pedido.semillas ?? ''}
              onChange={(e) =>
                actualizarCampo(
                  'semillas',
                  e.target.value
                )
              }
              className={inputClass}
            />
          </section>

          <hr />

          <section className="p-6">
            <SectionLabel>Nota</SectionLabel>

            <textarea
              rows={4}
              placeholder="Nota del pedido"
              value={pedido.nota ?? ''}
              onChange={(e) =>
                actualizarCampo(
                  'nota',
                  e.target.value
                )
              }
              className={`${inputClass} resize-y`}
            />
          </section>

          <hr />

          <section className="p-6">
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

            <button
              type="button"
              onClick={guardarCambios}
              disabled={guardando || eliminando}
              className="w-full rounded-xl py-3 text-white font-semibold transition disabled:opacity-50"
              style={{ background: '#c6302c' }}
            >
              {guardando
                ? 'Guardando...'
                : 'Guardar cambios'}
            </button>

            <button
              type="button"
              onClick={eliminarPedidoAccion}
              disabled={guardando || eliminando}
              className="w-full rounded-xl py-3 font-semibold transition disabled:opacity-50 mt-3 border"
              style={{
                color: '#CF1322',
                borderColor: '#FFA39E'
              }}
            >
              {eliminando
                ? 'Eliminando...'
                : 'Eliminar pedido'}
            </button>
          </section>

        </div>

      </div>
    </main>
  )
}
