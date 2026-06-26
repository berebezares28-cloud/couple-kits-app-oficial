import { SupabaseClient } from '@supabase/supabase-js'
import { esEntregaEnLocal } from './puntosEntrega'
import {
  pedidoActivo,
  precioLineaPedidoKit
} from './pedidoSnapshots'

export type VentaMesLinea = {
  id: string
  tipo: 'pedido' | 'bulk'
  titulo: string
  subtitulo: string
  fecha: string
  kits: number
  ingreso: number
  href: string
}

export type ResumenVentasMes = {
  mes: string
  etiquetaMes: string
  totalVentas: number
  totalKits: number
  totalIngresos: number
  lineas: VentaMesLinea[]
}

export function etiquetaMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const fecha = new Date(y, m - 1, 1)
  return fecha.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric'
  })
}

function enMes(fecha: string, mes: string): boolean {
  return fecha.slice(0, 7) === mes
}

export function enRangoFechas(
  fecha: string,
  desde: string,
  hasta: string
): boolean {
  if (!fecha) return false
  return fecha >= desde && fecha <= hasta
}

export function formatearEtiquetaRango(
  desde: string,
  hasta: string
): string {
  const fmt = (s: string) => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString(
      'es-MX',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    )
  }

  if (desde === hasta) return fmt(desde)
  return `${fmt(desde)} – ${fmt(hasta)}`
}

function finDeMes(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  return new Date(y, m, 0).toISOString().slice(0, 10)
}

export type ResumenVentasRango = {
  fechaDesde: string
  fechaHasta: string
  etiquetaRango: string
  totalVentas: number
  totalKits: number
  totalIngresos: number
  lineas: VentaMesLinea[]
}

function fechaPedido(pedido: {
  fecha_entrega: string | null
  created_at: string | null
}): string {
  if (pedido.fecha_entrega) {
    return pedido.fecha_entrega
  }

  if (pedido.created_at) {
    return pedido.created_at.split('T')[0]
  }

  return ''
}

export async function obtenerResumenVentasRango(
  supabase: SupabaseClient,
  fechaDesde: string,
  fechaHasta: string
): Promise<ResumenVentasRango> {
  const [pedidosResult, ventasBulkResult, puntosResult] =
    await Promise.all([
      supabase
        .from('pedidos')
        .select(
          'id, nombre, instagram, estatus, fecha_entrega, created_at, punto_entrega_id, eliminado'
        )
        .eq('estatus', 'Entregado')
        .neq('eliminado', true),
      supabase
        .from('ventas_local')
        .select(
          'id, fecha, ingreso_total, punto_entrega_id'
        ),
      supabase
        .from('puntos_entrega')
        .select('id, nombre')
        .eq('activo', true)
    ])

  const nombresLocal = new Map(
    puntosResult.data?.map((p) => [p.id, p.nombre]) ??
      []
  )

  const pedidosNormales = (pedidosResult.data ?? [])
    .filter(
      (p) =>
        pedidoActivo(p) &&
        !esEntregaEnLocal(p) &&
        enRangoFechas(
          fechaPedido(p),
          fechaDesde,
          fechaHasta
        )
    )

  const pedidoIds = pedidosNormales.map((p) => p.id)

  let pedidoKits: {
    pedido_id: string
    cantidad: number
    precio_unitario: number | null
    subtotal: number | null
    kits:
      | { precio_venta: number | null }
      | { precio_venta: number | null }[]
      | null
  }[] = []

  if (pedidoIds.length > 0) {
    const { data } = await supabase
      .from('pedido_kits')
      .select(`
        pedido_id,
        cantidad,
        precio_unitario,
        subtotal,
        kits ( precio_venta )
      `)
      .in('pedido_id', pedidoIds)

    pedidoKits = data ?? []
  }

  const kitsPorPedido = new Map<string, number>()
  const ingresoPorPedido = new Map<string, number>()

  for (const pk of pedidoKits) {
    const cantidad = Number(pk.cantidad) || 1
    kitsPorPedido.set(
      pk.pedido_id,
      (kitsPorPedido.get(pk.pedido_id) ?? 0) +
        cantidad
    )
    ingresoPorPedido.set(
      pk.pedido_id,
      (ingresoPorPedido.get(pk.pedido_id) ?? 0) +
        precioLineaPedidoKit(pk)
    )
  }

  const lineas: VentaMesLinea[] = []

  for (const pedido of pedidosNormales) {
    const fecha = fechaPedido(pedido)
    if (!fecha) continue

    lineas.push({
      id: pedido.id,
      tipo: 'pedido',
      titulo: pedido.nombre ?? 'Pedido',
      subtitulo: pedido.instagram
        ? `@${pedido.instagram}`
        : 'Pedido directo',
      fecha,
      kits: kitsPorPedido.get(pedido.id) ?? 0,
      ingreso: ingresoPorPedido.get(pedido.id) ?? 0,
      href: `/pedidos/${pedido.id}`
    })
  }

  const ventaIds =
    (ventasBulkResult.data ?? [])
      .filter((v) =>
        enRangoFechas(v.fecha, fechaDesde, fechaHasta)
      )
      .map((v) => v.id) ?? []

  let kitsBulk: {
    venta_local_id: string
    cantidad: number
  }[] = []

  if (ventaIds.length > 0) {
    const { data } = await supabase
      .from('ventas_local_kits')
      .select('venta_local_id, cantidad')
      .in('venta_local_id', ventaIds)

    kitsBulk = data ?? []
  }

  const kitsPorVentaBulk = new Map<string, number>()

  for (const linea of kitsBulk) {
    kitsPorVentaBulk.set(
      linea.venta_local_id,
      (kitsPorVentaBulk.get(linea.venta_local_id) ??
        0) + (Number(linea.cantidad) || 1)
    )
  }

  for (const venta of ventasBulkResult.data ?? []) {
    if (
      !enRangoFechas(
        venta.fecha,
        fechaDesde,
        fechaHasta
      )
    ) {
      continue
    }

    const localNombre =
      nombresLocal.get(venta.punto_entrega_id) ??
      'Local'

    lineas.push({
      id: venta.id,
      tipo: 'bulk',
      titulo: `Venta en ${localNombre}`,
      subtitulo: 'Venta bulk',
      fecha: venta.fecha,
      kits: kitsPorVentaBulk.get(venta.id) ?? 0,
      ingreso: Number(venta.ingreso_total) || 0,
      href: `/locales/venta/${venta.id}`
    })
  }

  lineas.sort((a, b) => b.fecha.localeCompare(a.fecha))

  const totalKits = lineas.reduce(
    (s, l) => s + l.kits,
    0
  )
  const totalIngresos = lineas.reduce(
    (s, l) => s + l.ingreso,
    0
  )

  return {
    fechaDesde,
    fechaHasta,
    etiquetaRango: formatearEtiquetaRango(
      fechaDesde,
      fechaHasta
    ),
    totalVentas: lineas.length,
    totalKits,
    totalIngresos,
    lineas
  }
}

export async function obtenerResumenVentasMes(
  supabase: SupabaseClient,
  mes?: string
): Promise<ResumenVentasMes> {
  const mesActual =
    mes ?? new Date().toISOString().slice(0, 7)
  const desde = `${mesActual}-01`
  const hasta = finDeMes(mesActual)
  const rango = await obtenerResumenVentasRango(
    supabase,
    desde,
    hasta
  )

  return {
    mes: mesActual,
    etiquetaMes: etiquetaMes(mesActual),
    totalVentas: rango.totalVentas,
    totalKits: rango.totalKits,
    totalIngresos: rango.totalIngresos,
    lineas: rango.lineas
  }
}
