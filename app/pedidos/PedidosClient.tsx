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
  pedidosIniciales
}: {
  pedidosIniciales: Pedido[]
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

  async function cargarPedidos() {
    try {
      const { data: lista, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !lista) return

      const pedidoIds = lista.map((p) => p.id)

      let pedidoKits: {
        pedido_id: string
        kits: { nombre: string } | { nombre: string }[] | null
      }[] = []

      if (pedidoIds.length > 0) {
        const { data } = await supabase
          .from('pedido_kits')
          .select(`
            pedido_id,
            kits (
              nombre
            )
          `)
          .in('pedido_id', pedidoIds)

        pedidoKits = data ?? []
      }

      const pedidosConKits = lista.map((pedido) => ({
        id: pedido.id,
        nombre: pedido.nombre,
        instagram: pedido.instagram,
        lugar_entrega: pedido.lugar_entrega,
        fecha_entrega: pedido.fecha_entrega,
        hora_entrega: pedido.hora_entrega,
        estatus: pedido.estatus,
        kits:
          pedidoKits
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

      setPedidos(pedidosConKits)
    } catch (error) {
      console.error('Error cargando pedidos', error)
    }
  }

  useEffect(() => {
    if (pathname === '/pedidos') {
      cargarPedidos()
    }
  }, [pathname])

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
        pedido.kits.join(' ')

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
            const fechaPedido =
              new Date(pedido.fecha_entrega)
          
            coincideFecha =
              fechaPedido >= hoy &&
              fechaPedido <= dentroDe7Dias
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
            Studio
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

      </div>
    </main>
  )
}