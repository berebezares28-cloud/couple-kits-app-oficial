'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '../../scr/lib/supabase'
import {
  DIAS_RETENCION_PEDIDOS_ELIMINADOS,
  diasRestantesParaPurga
} from '../../scr/lib/pedidosEliminados'

type KitLinea = {
  nombre: string
  cantidad: number
}

type Pedido = {
  id: string
  nombre: string
  instagram: string
  lugar_entrega: string
  fecha_entrega: string
  hora_entrega: string
  estatus: string
  kitLineas: KitLinea[]
  kits: string[]
  eliminado_at?: string | null
}

type ResumenPrepararGrupo = {
  lugar: string
  fecha: string
  fechaEtiqueta: string
  lineas: { kit: string; cantidad: number }[]
}

function formatearFechaEntrega(fecha: string): string {
  if (!fecha) return 'Sin fecha'

  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(
    'es-MX',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }
  )
}

function fechaLocalISO(fecha = new Date()): string {
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseFechaLocal(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function rangoSemanaLocal(): { inicio: Date; fin: Date } {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const dia = hoy.getDay()
  const diasDesdeLunes = dia === 0 ? 6 : dia - 1

  const inicio = new Date(hoy)
  inicio.setDate(hoy.getDate() - diasDesdeLunes)

  const fin = new Date(inicio)
  fin.setDate(inicio.getDate() + 6)
  fin.setHours(23, 59, 59, 999)

  return { inicio, fin }
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

  const [panelFiltrosAbierto, setPanelFiltrosAbierto] =
    useState(false)

  const [prepararAbierto, setPrepararAbierto] =
    useState(false)

  const cantidadFiltrosActivos =
    (filtro !== 'Todos' ? 1 : 0) +
    (fechaSeleccionada || filtroFecha !== 'Todas' ? 1 : 0)

  const hayFiltrosActivos =
    busqueda !== '' || cantidadFiltrosActivos > 0

  function limpiarFiltros() {
    setBusqueda('')
    setFiltro('Todos')
    setFiltroFecha('Todas')
    setFechaSeleccionada('')
    setPanelFiltrosAbierto(false)
  }

  useEffect(() => {
    if (!panelFiltrosAbierto) return

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prev
    }
  }, [panelFiltrosAbierto])

  async function mapearPedidosConKits(
    lista: {
      id: string
      nombre: string
      instagram: string
      lugar_entrega: string
      fecha_entrega: string
      hora_entrega: string
      estatus: string
      eliminado_at?: string | null
    }[]
  ): Promise<Pedido[]> {
    if (!lista.length) return []

    const pedidoIds = lista.map((p) => p.id)

    const { data: pedidoKits } = await supabase
      .from('pedido_kits')
      .select(`
        pedido_id,
        cantidad,
        kits (
          nombre
        )
      `)
      .in('pedido_id', pedidoIds)

    return lista.map((pedido) => {
      const lineasPedido = (pedidoKits ?? [])
        .filter((pk) => pk.pedido_id === pedido.id)
        .flatMap((pk) => {
          const kit = pk.kits as
            | { nombre: string }
            | { nombre: string }[]
            | null
          const nombre = Array.isArray(kit)
            ? kit[0]?.nombre
            : kit?.nombre

          if (!nombre) return []

          return [
            {
              nombre,
              cantidad: Number(pk.cantidad) || 1
            }
          ]
        })

      return {
        id: pedido.id,
        nombre: pedido.nombre,
        instagram: pedido.instagram,
        lugar_entrega: pedido.lugar_entrega,
        fecha_entrega: pedido.fecha_entrega,
        hora_entrega: pedido.hora_entrega,
        estatus: pedido.estatus,
        eliminado_at: pedido.eliminado_at ?? null,
        kitLineas: lineasPedido,
        kits: lineasPedido.map((l) =>
          l.cantidad > 1
            ? `${l.nombre} ×${l.cantidad}`
            : l.nombre
        )
      }
    })
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
    hoy.setHours(0, 0, 0, 0)

    const hoyString = fechaLocalISO(hoy)

    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)
    const mananaString = fechaLocalISO(manana)

    const { inicio: inicioSemana, fin: finSemana } =
      rangoSemanaLocal()

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
              pedido.fecha_entrega === hoyString
          } else if (filtroFecha === 'Mañana') {
            coincideFecha =
              pedido.fecha_entrega === mananaString
          } else if (filtroFecha === 'Esta semana') {
            if (!pedido.fecha_entrega) {
              coincideFecha = false
            } else {
              const fechaPedido = parseFechaLocal(
                pedido.fecha_entrega
              )

              coincideFecha =
                fechaPedido >= inicioSemana &&
                fechaPedido <= finSemana
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

  const resumenPorPreparar = useMemo((): ResumenPrepararGrupo[] => {
    const grupos = new Map<
      string,
      {
        lugar: string
        fecha: string
        kits: Map<string, number>
      }
    >()

    for (const pedido of pedidos) {
      if (pedido.estatus !== 'Pendiente') continue

      const lugar =
        pedido.lugar_entrega?.trim() || 'Sin lugar'
      const fecha = pedido.fecha_entrega || ''
      const key = `${fecha}|||${lugar}`

      if (!grupos.has(key)) {
        grupos.set(key, {
          lugar,
          fecha,
          kits: new Map()
        })
      }

      const grupo = grupos.get(key)!
      const kitsMap = grupo.kits

      for (const linea of pedido.kitLineas ?? []) {
        kitsMap.set(
          linea.nombre,
          (kitsMap.get(linea.nombre) ?? 0) +
            linea.cantidad
        )
      }
    }

    return Array.from(grupos.values())
      .map((grupo) => ({
        lugar: grupo.lugar,
        fecha: grupo.fecha,
        fechaEtiqueta: formatearFechaEntrega(
          grupo.fecha
        ),
        lineas: Array.from(grupo.kits.entries())
          .map(([kit, cantidad]) => ({ kit, cantidad }))
          .sort((a, b) => a.kit.localeCompare(b.kit))
      }))
      .sort((a, b) => {
        if (a.fecha !== b.fecha) {
          return a.fecha.localeCompare(b.fecha)
        }

        return a.lugar.localeCompare(b.lugar)
      })
  }, [pedidos])

  const totalKitsPorPreparar = useMemo(
    () =>
      resumenPorPreparar.reduce(
        (sum, grupo) =>
          sum +
          grupo.lineas.reduce(
            (s, l) => s + l.cantidad,
            0
          ),
        0
      ),
    [resumenPorPreparar]
  )

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

        <div className="pt-8 pb-4">

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
          type="search"
          placeholder="Buscar..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 mb-2 text-sm"
          autoComplete="off"
        />

        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() =>
              setPanelFiltrosAbierto(true)
            }
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium"
          >
            <span>Filtrar</span>
            {cantidadFiltrosActivos > 0 && (
              <span
                className="min-w-[1.25rem] h-5 px-1 rounded-full text-[0.65rem] font-bold flex items-center justify-center text-white"
                style={{ background: '#c6302c' }}
              >
                {cantidadFiltrosActivos}
              </span>
            )}
          </button>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1">
            {filtro !== 'Todos' && (
              <button
                type="button"
                onClick={() => setFiltro('Todos')}
                className="shrink-0 px-2.5 py-1.5 rounded-full text-xs border bg-[#FFF1F0] text-[#c6302c] border-[#ffccc7] whitespace-nowrap"
              >
                {filtro} ×
              </button>
            )}
            {fechaSeleccionada ? (
              <button
                type="button"
                onClick={() =>
                  setFechaSeleccionada('')
                }
                className="shrink-0 px-2.5 py-1.5 rounded-full text-xs border bg-gray-100 text-gray-700 border-gray-200 whitespace-nowrap"
              >
                {fechaSeleccionada} ×
              </button>
            ) : (
              filtroFecha !== 'Todas' && (
                <button
                  type="button"
                  onClick={() =>
                    setFiltroFecha('Todas')
                  }
                  className="shrink-0 px-2.5 py-1.5 rounded-full text-xs border bg-gray-100 text-gray-700 border-gray-200 whitespace-nowrap"
                >
                  {filtroFecha} ×
                </button>
              )
            )}
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="shrink-0 px-2.5 py-1.5 rounded-full text-xs text-gray-500 underline whitespace-nowrap"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-3">
          {pedidosFiltrados.length} pedido
          {pedidosFiltrados.length === 1 ? '' : 's'}
        </p>

        {resumenPorPreparar.length > 0 && (
          <div className="editorial-card !p-3 mb-5">
            <button
              type="button"
              onClick={() =>
                setPrepararAbierto((v) => !v)
              }
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="customer-name text-black">
                  Pedidos por preparar
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {totalKitsPorPreparar} kit
                  {totalKitsPorPreparar === 1
                    ? ''
                    : 's'}{' '}
                  · {resumenPorPreparar.length} entrega
                  {resumenPorPreparar.length === 1
                    ? ''
                    : 's'}
                </p>
              </div>
              <span className="text-gray-400 text-lg">
                {prepararAbierto ? '−' : '+'}
              </span>
            </button>

            {prepararAbierto && (
              <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
                {resumenPorPreparar.map((grupo) => (
                  <div
                    key={`${grupo.fecha}-${grupo.lugar}`}
                    className="rounded-lg border border-gray-200 bg-[#fafafa] px-3 py-2"
                  >
                    <p className="text-[0.7rem] text-[#D48806]">
                      📅 {grupo.fechaEtiqueta}
                    </p>
                    <p className="text-[0.7rem] text-gray-500 mt-0.5">
                      📍 {grupo.lugar}
                    </p>
                    <div className="space-y-1 mt-2">
                      {grupo.lineas.map((linea) => (
                        <div
                          key={`${grupo.fecha}-${grupo.lugar}-${linea.kit}`}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span
                            className="font-medium"
                            style={{ color: '#c6302c' }}
                          >
                            {linea.kit}
                          </span>
                          <span className="shrink-0 text-[0.65rem] font-medium px-2 py-0.5 rounded-md bg-[#FFF7E6] text-[#D48806]">
                            {linea.cantidad} kit
                            {linea.cantidad === 1
                              ? ''
                              : 's'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {panelFiltrosAbierto && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
            <button
              type="button"
              aria-label="Cerrar filtros"
              className="absolute inset-0 bg-black/40"
              onClick={() =>
                setPanelFiltrosAbierto(false)
              }
            />

            <div className="relative w-full max-w-sm bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0_#000] p-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold">Filtros</p>
                <button
                  type="button"
                  onClick={() =>
                    setPanelFiltrosAbierto(false)
                  }
                  className="text-sm font-medium text-[#c6302c]"
                >
                  Listo
                </button>
              </div>

              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2">
                Estatus
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  'Todos',
                  'Pendiente',
                  'Entregado',
                  'Cancelado'
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFiltro(item)}
                    className="min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium border transition active:scale-[0.98]"
                    style={{
                      background:
                        filtro === item ? '#c6302c' : '#fff',
                      color:
                        filtro === item ? '#fff' : '#111',
                      borderColor:
                        filtro === item ? '#c6302c' : '#e5e5e5'
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2">
                Fecha de entrega
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  'Todas',
                  'Hoy',
                  'Mañana',
                  'Esta semana'
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setFiltroFecha(item)
                      setFechaSeleccionada('')
                    }}
                    className="min-h-[44px] px-3 py-2.5 rounded-xl text-sm font-medium border transition active:scale-[0.98]"
                    style={{
                      background:
                        filtroFecha === item &&
                        !fechaSeleccionada
                          ? '#111'
                          : '#fff',
                      color:
                        filtroFecha === item &&
                        !fechaSeleccionada
                          ? '#fff'
                          : '#111',
                      borderColor:
                        filtroFecha === item &&
                        !fechaSeleccionada
                          ? '#111'
                          : '#e5e5e5'
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-2">
                Fecha exacta
              </p>
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => {
                  setFechaSeleccionada(e.target.value)
                  if (e.target.value) {
                    setFiltroFecha('Todas')
                  }
                }}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
              />

              {hayFiltrosActivos && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="w-full mt-4 py-2 text-sm text-gray-500 underline"
                >
                  Quitar todos los filtros
                </button>
              )}
            </div>
          </div>
        )}

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
                · se borran solos a los{' '}
                {DIAS_RETENCION_PEDIDOS_ELIMINADOS} días
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
                        {pedido.eliminado_at && (
                          <p className="text-xs text-amber-700 mt-2">
                            {(() => {
                              const dias =
                                diasRestantesParaPurga(
                                  pedido.eliminado_at
                                )
                              if (dias === null) return null
                              if (dias === 0) {
                                return 'Se eliminará permanentemente hoy'
                              }
                              return `Quedan ${dias} día${dias === 1 ? '' : 's'} para restaurar`
                            })()}
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