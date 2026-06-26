'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '../../scr/lib/supabase'

type Pedido = {
  id: string
  nombre: string
  instagram: string
  lugar_entrega: string
  fecha_entrega: string
  hora_entrega: string
  estatus: string
  kits: string[]
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'Pendiente':
      return {
        background: '#FFF7E6',
        color: '#D48806'
      }

    case 'Entregado':
      return {
        background: '#F6FFED',
        color: '#389E0D'
      }

    case 'Cancelado':
      return {
        background: '#FFF1F0',
        color: '#CF1322'
      }

    default:
      return {
        background: '#F5F5F5',
        color: '#595959'
      }
  }
}

export default function PedidosClient({
  pedidosIniciales,
  pedidosEliminadosIniciales = []
}: {
  pedidosIniciales: Pedido[]
  pedidosEliminadosIniciales?: Pedido[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [busqueda, setBusqueda] =
    useState('')

  const [filtro, setFiltro] =
    useState('Todos')

  const [filtroFecha, setFiltroFecha] =
    useState('Todas')

    const [fechaSeleccionada, setFechaSeleccionada] =
    useState('')

  const [pedidos, setPedidos] =
    useState(pedidosIniciales)

  const [pedidosEliminados, setPedidosEliminados] =
    useState(pedidosEliminadosIniciales)

  const [eliminadosAbierto, setEliminadosAbierto] =
    useState(false)

  const [restaurandoId, setRestaurandoId] =
    useState<string | null>(null)

  async function mapearPedidosConKits(
    lista: {
      id: string
      nombre: string
      instagram: string
      lugar_entrega: string
      fecha_entrega: string
      hora_entrega: string
      estatus: string
    }[]
  ): Promise<Pedido[]> {
    if (!lista.length) return []

    const pedidoIds = lista.map((p) => p.id)

    const { data: pedidoKits } = await supabase
      .from('pedido_kits')
      .select(`
        pedido_id,
        kits (
          nombre
        )
      `)
      .in('pedido_id', pedidoIds)

    return lista.map((pedido) => ({
      id: pedido.id,
      nombre: pedido.nombre,
      instagram: pedido.instagram,
      lugar_entrega: pedido.lugar_entrega,
      fecha_entrega: pedido.fecha_entrega,
      hora_entrega: pedido.hora_entrega,
      estatus: pedido.estatus,
      kits:
        (pedidoKits ?? [])
          .filter((pk) => pk.pedido_id === pedido.id)
          .map((pk) => {
            const kit = pk.kits
            if (Array.isArray(kit)) {
              return kit[0]?.nombre
            }
            return kit?.nombre
          })
          .filter((nombre): nombre is string =>
            Boolean(nombre)
          )
    }))
  }

  async function cargarPedidos() {
    try {
      const { data: lista, error } = await supabase
        .from('pedidos')
        .select('*')
        .neq('eliminado', true)
        .order('created_at', { ascending: false })

      if (error || !lista) return

      setPedidos(await mapearPedidosConKits(lista))
    } catch (error) {
      console.error('Error cargando pedidos', error)
    }
  }

  async function cargarPedidosEliminados() {
    try {
      const { data: lista, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('eliminado', true)
        .order('created_at', { ascending: false })

      if (error || !lista) return

      setPedidosEliminados(
        await mapearPedidosConKits(lista)
      )
    } catch (error) {
      console.error(
        'Error cargando pedidos eliminados',
        error
      )
    }
  }

  async function cargarTodo() {
    await Promise.all([
      cargarPedidos(),
      cargarPedidosEliminados()
    ])
  }

  useEffect(() => {
    if (pathname === '/pedidos') {
      cargarTodo()
    }
  }, [pathname])

  useEffect(() => {
    setPedidos(pedidosIniciales)
  }, [pedidosIniciales])

  useEffect(() => {
    setPedidosEliminados(pedidosEliminadosIniciales)
  }, [pedidosEliminadosIniciales])

  useEffect(() => {
    const estatus = searchParams.get('estatus')

    if (
      estatus &&
      [
        'Todos',
        'Pendiente',
        'Entregado',
        'Cancelado'
      ].includes(estatus)
    ) {
      setFiltro(estatus)
    }
  }, [searchParams])

  const pedidosFiltrados = useMemo(() => {
    const q =
      busqueda.toLowerCase()

    const hoy = new Date()

    const hoyString =
      hoy.toISOString().split('T')[0]

    const manana = new Date()
    manana.setDate(
      manana.getDate() + 1
    )

    const mananaString =
      manana.toISOString().split('T')[0]

    const dentroDe7Dias = new Date()
    dentroDe7Dias.setDate(
      dentroDe7Dias.getDate() + 7
    )

    return pedidos.filter((pedido) => {
      const kits =
        (pedido.kits ?? []).join(' ')

      const coincideBusqueda =
        pedido.nombre
          ?.toLowerCase()
          .includes(q) ||
        pedido.instagram
          ?.toLowerCase()
          .includes(q) ||
        pedido.lugar_entrega
          ?.toLowerCase()
          .includes(q) ||
        kits
          .toLowerCase()
          .includes(q)

      const coincideFiltro =
        filtro === 'Todos'
          ? true
          : pedido.estatus === filtro

          let coincideFecha = true

          if (fechaSeleccionada) {
            coincideFecha =
              pedido.fecha_entrega ===
              fechaSeleccionada
          } else if (filtroFecha === 'Hoy') {
            coincideFecha =
              pedido.fecha_entrega ===
              hoyString
          } else if (filtroFecha === 'Mañana') {
            coincideFecha =
              pedido.fecha_entrega ===
              mananaString
          } else if (filtroFecha === 'Esta semana') {
            if (!pedido.fecha_entrega) {
              coincideFecha = false
            } else {
              const fechaPedido =
                new Date(pedido.fecha_entrega)

              coincideFecha =
                fechaPedido >= hoy &&
                fechaPedido <= dentroDe7Dias
            }
          }

      return (
        coincideBusqueda &&
        coincideFiltro &&
        coincideFecha
      )
    })
  }, [
    busqueda,
    filtro,
    filtroFecha,
    fechaSeleccionada,
    pedidos
  ])

  async function actualizarEstatus(
    pedidoId: string,
    nuevoEstatus: string
  ) {
    const { error } = await supabase
      .from('pedidos')
      .update({ estatus: nuevoEstatus })
      .eq('id', pedidoId)

    if (error) {
      alert(error.message)
      return
    }

    setPedidos((prev) =>
      prev.map((pedido) =>
        pedido.id === pedidoId
          ? {
              ...pedido,
              estatus:
                nuevoEstatus
            }
          : pedido
      )
    )
  }

  async function restaurarPedido(pedidoId: string) {
    const confirmar = window.confirm(
      '¿Restaurar este pedido? Volverá a aparecer en la lista y, si estaba entregado, contará de nuevo en ventas e inventario.'
    )

    if (!confirmar) return

    setRestaurandoId(pedidoId)

    try {
      const res = await fetch(
        `/api/pedidos/${pedidoId}/restaurar`,
        { method: 'POST' }
      )

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'No se pudo restaurar')
        return
      }

      await cargarTodo()
    } catch {
      alert('Error de conexión')
    } finally {
      setRestaurandoId(null)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24">

        <div className="pt-8 pb-8">

          <h1
            className="editorial-title mt-4"
            style={{
              color: '#c6302c'
            }}
          >
            PEDIDOS
          </h1>

          <p
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.35em',
              textTransform:
                'uppercase',
              color: '#888'
            }}
          >
            estudio
          </p>

        </div>

        <input
          type="text"
          placeholder="Buscar nombre, kit, instagram o lugar..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(
              e.target.value
            )
          }
          className="w-full border rounded-xl px-4 py-3 mb-6"
        />

        <div className="flex gap-2 mb-4 overflow-x-auto">

          {[
            'Todos',
            'Pendiente',
            'Entregado',
            'Cancelado'
          ].map((item) => (
            <button
              key={item}
              onClick={() =>
                setFiltro(item)
              }
              className="px-4 py-2 rounded-full text-sm border whitespace-nowrap transition"
              style={{
                background:
                  filtro === item
                    ? '#c6302c'
                    : '#ffffff',
                color:
                  filtro === item
                    ? '#ffffff'
                    : '#000000',
                borderColor:
                  '#e5e5e5'
              }}
            >
              {item}
            </button>
          ))}

        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">

          {[
            'Todas',
            'Hoy',
            'Mañana',
            'Esta semana'
          ].map((item) => (
            <button
              key={item}
              onClick={() =>
                setFiltroFecha(item)
              }
              className="px-4 py-2 rounded-full text-sm border whitespace-nowrap transition"
              style={{
                background:
                  filtroFecha === item
                    ? '#000000'
                    : '#ffffff',
                color:
                  filtroFecha === item
                    ? '#ffffff'
                    : '#000000',
                borderColor:
                  '#e5e5e5'
              }}
            >
              {item}
            </button>
          ))}

        </div>
        <div className="mb-8">

  <p
    style={{
      fontSize: '0.72rem',
      letterSpacing: '0.25em',
      textTransform: 'uppercase',
      color: '#888',
      marginBottom: '0.7rem'
    }}
  >
    Fecha específica
  </p>

  <input
    type="date"
    value={fechaSeleccionada}
    onChange={(e) => {
      setFechaSeleccionada(
        e.target.value
      )

      if (e.target.value) {
        setFiltroFecha('Todas')
      }
    }}
    className="w-full rounded-xl border px-4 py-3"
  />

  {fechaSeleccionada && (
    <button
      onClick={() =>
        setFechaSeleccionada('')
      }
      className="text-sm mt-3 text-gray-500 underline"
    >
      Limpiar fecha
    </button>
  )}

</div>

        <p className="text-sm text-gray-500 mb-6">
          {pedidosFiltrados.length} pedidos
        </p>

        {pedidosFiltrados.map(
          (pedido) => {
            const statusStyle =
              getStatusStyle(
                pedido.estatus
              )

            return (
              <Link
                key={pedido.id}
                href={`/pedidos/${pedido.id}`}
                className="block editorial-card mb-4 hover:-translate-y-[1px] transition"
              >

                <div className="flex justify-between items-start">

                  <div>
                    <p className="customer-name">
                      {pedido.nombre}
                    </p>

                    <p className="customer-instagram">
                      @{pedido.instagram}
                    </p>
                  </div>

                  <select
                    value={
                      pedido.estatus
                    }
                    onChange={(e) => {
                      e.preventDefault()

                      actualizarEstatus(
                        pedido.id,
                        e.target.value
                      )
                    }}
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                    className="text-xs border rounded-lg p-2"
                    style={{
                      background:
                        statusStyle.background,
                      color:
                        statusStyle.color
                    }}
                  >
                    <option value="Pendiente">
                      Pendiente
                    </option>

                    <option value="Entregado">
                      Entregado
                    </option>

                    <option value="Cancelado">
                      Cancelado
                    </option>

                  </select>

                </div>

                <div className="mt-4">

                  <p className="kit-name">
                    🎨 {pedido.kits.join(', ')}
                  </p>

                </div>

                <div className="mt-4 text-sm text-gray-600 space-y-1">

                  <p>
                    📅 {pedido.fecha_entrega}
                  </p>

                  <p>
                    ⏰ {pedido.hora_entrega}
                  </p>

                  <p>
                    📍 {pedido.lugar_entrega}
                  </p>

                </div>

              </Link>
            )
          }
        )}

        <div className="mt-10 border-t border-gray-100 pt-8">
          <button
            type="button"
            onClick={() =>
              setEliminadosAbierto((v) => !v)
            }
            className="w-full flex items-center justify-between text-left"
          >
            <div>
              <p
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: '#888'
                }}
              >
                Pedidos eliminados
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {pedidosEliminados.length} pedido
                {pedidosEliminados.length === 1
                  ? ''
                  : 's'}
              </p>
            </div>
            <span className="text-gray-400 text-lg">
              {eliminadosAbierto ? '−' : '+'}
            </span>
          </button>

          {eliminadosAbierto && (
            <div className="mt-4 space-y-4">
              {pedidosEliminados.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No hay pedidos eliminados
                </p>
              ) : (
                pedidosEliminados.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="editorial-card opacity-80"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <p className="customer-name">
                          {pedido.nombre}
                        </p>
                        <p className="customer-instagram">
                          @{pedido.instagram}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {pedido.estatus} ·{' '}
                          {pedido.fecha_entrega ||
                            'Sin fecha'}
                        </p>
                        {pedido.kits.length > 0 && (
                          <p className="text-sm text-gray-600 mt-2">
                            🎨 {pedido.kits.join(', ')}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          restaurarPedido(pedido.id)
                        }
                        disabled={
                          restaurandoId === pedido.id
                        }
                        className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border disabled:opacity-50"
                        style={{
                          color: '#389E0D',
                          borderColor: '#B7EB8F'
                        }}
                      >
                        {restaurandoId === pedido.id
                          ? '...'
                          : 'Restaurar'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}