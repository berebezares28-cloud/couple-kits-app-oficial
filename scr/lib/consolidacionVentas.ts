import { SupabaseClient } from '@supabase/supabase-js'
import { esEntregaEnLocal } from './puntosEntrega'
import {
  pedidoActivo,
  precioLineaPedidoKit
} from './pedidoSnapshots'

export type ResumenPorLocal = {
  localId: string
  localNombre: string
  pedidos: number
  kits: number
}

export type ResumenBulkPorLocal = {
  localId: string
  localNombre: string
  ventas: number
  kits: number
  ingresos: number
  comision: number
}

export type PedidoEnLocalResumen = {
  id: string
  nombre: string
  fecha: string
  localNombre: string
  kits: number
}

export type ConsolidacionVentas = {
  pedidosEnLocal: {
    totalPedidos: number
    totalKits: number
    porLocal: ResumenPorLocal[]
    recientes: PedidoEnLocalResumen[]
  }
  ventasBulk: {
    totalVentas: number
    totalKits: number
    totalIngresos: number
    totalComision: number
    porLocal: ResumenBulkPorLocal[]
  }
  pedidosNormales: {
    totalPedidos: number
    totalKits: number
    totalIngresos: number
  }
}


function precioKit(
  kits:
    | { precio_venta: number | null }
    | { precio_venta: number | null }[]
    | null
): number {
  if (!kits) return 0
  const datos = Array.isArray(kits) ? kits[0] : kits
  return Number(datos?.precio_venta) || 0
}

export async function obtenerConsolidacionVentas(
  supabase: SupabaseClient
): Promise<ConsolidacionVentas> {
  const [puntosResult, pedidosResult, ventasBulkResult] =
    await Promise.all([
      supabase
        .from('puntos_entrega')
        .select('id, nombre')
        .eq('activo', true),
      supabase
        .from('pedidos')
        .select(
          'id, nombre, estatus, fecha_entrega, created_at, punto_entrega_id, eliminado'
        )
        .eq('estatus', 'Entregado')
        .neq('eliminado', true)
        .order('fecha_entrega', { ascending: false }),
      supabase
        .from('ventas_local')
        .select(
          'id, punto_entrega_id, fecha, ingreso_total, comision_monto'
        )
        .order('fecha', { ascending: false })
    ])

  const nombresLocal = new Map(
    puntosResult.data?.map((p) => [p.id, p.nombre]) ?? []
  )

  const pedidos = (pedidosResult.data ?? []).filter(
    pedidoActivo
  )
  const pedidosLocal = pedidos.filter((p) =>
    esEntregaEnLocal(p)
  )
  const pedidosNormales = pedidos.filter(
    (p) => !esEntregaEnLocal(p)
  )

  const todosPedidoIds = pedidos.map((p) => p.id)
  let pedidoKits: {
    pedido_id: string
    kit_id: string
    cantidad: number
    kits: {
      nombre: string
      precio_venta: number | null
    } | {
      nombre: string
      precio_venta: number | null
    }[] | null
  }[] = []

  if (todosPedidoIds.length > 0) {
    const { data } = await supabase
      .from('pedido_kits')
      .select(`
        pedido_id,
        kit_id,
        cantidad,
        precio_unitario,
        subtotal,
        kits ( nombre, precio_venta )
      `)
      .in('pedido_id', todosPedidoIds)

    pedidoKits = data ?? []
  }

  const kitsPorPedido = new Map<string, number>()
  const ingresoPorPedido = new Map<string, number>()

  for (const pk of pedidoKits) {
    const cantidad = Number(pk.cantidad) || 1
    const actual = kitsPorPedido.get(pk.pedido_id) ?? 0
    kitsPorPedido.set(pk.pedido_id, actual + cantidad)

    const ingreso =
      (ingresoPorPedido.get(pk.pedido_id) ?? 0) +
      precioLineaPedidoKit(pk)
    ingresoPorPedido.set(pk.pedido_id, ingreso)
  }

  const porLocalMap = new Map<
    string,
    { pedidos: number; kits: number }
  >()

  for (const pedido of pedidosLocal) {
    const localId = pedido.punto_entrega_id!
    const kits = kitsPorPedido.get(pedido.id) ?? 0
    const actual = porLocalMap.get(localId) ?? {
      pedidos: 0,
      kits: 0
    }
    porLocalMap.set(localId, {
      pedidos: actual.pedidos + 1,
      kits: actual.kits + kits
    })
  }

  const porLocal: ResumenPorLocal[] = Array.from(
    porLocalMap.entries()
  )
    .map(([localId, datos]) => ({
      localId,
      localNombre:
        nombresLocal.get(localId) ?? 'Local',
      pedidos: datos.pedidos,
      kits: datos.kits
    }))
    .sort((a, b) => b.kits - a.kits)

  const recientes: PedidoEnLocalResumen[] =
    pedidosLocal.slice(0, 8).map((p) => ({
      id: p.id,
      nombre: p.nombre ?? 'Cliente',
      fecha:
        p.fecha_entrega ??
        p.created_at?.split('T')[0] ??
        '',
      localNombre:
        nombresLocal.get(p.punto_entrega_id!) ??
        'Local',
      kits: kitsPorPedido.get(p.id) ?? 0
    }))

  const ventasBulk = ventasBulkResult.data ?? []
  const ventaIds = ventasBulk.map((v) => v.id)

  let lineasBulk: {
    venta_local_id: string
    kit_id: string
    cantidad: number
  }[] = []

  if (ventaIds.length > 0) {
    const { data } = await supabase
      .from('ventas_local_kits')
      .select('venta_local_id, kit_id, cantidad')
      .in('venta_local_id', ventaIds)

    lineasBulk = data ?? []
  }

  const kitsPorVenta = new Map<string, number>()

  for (const linea of lineasBulk) {
    const actual =
      kitsPorVenta.get(linea.venta_local_id) ?? 0
    kitsPorVenta.set(
      linea.venta_local_id,
      actual + Number(linea.cantidad || 1)
    )
  }

  const bulkPorLocalMap = new Map<
    string,
    {
      ventas: number
      kits: number
      ingresos: number
      comision: number
    }
  >()

  let totalKitsBulk = 0
  let totalIngresosBulk = 0
  let totalComisionBulk = 0

  for (const venta of ventasBulk) {
    const kits = kitsPorVenta.get(venta.id) ?? 0
    const ingreso = Number(venta.ingreso_total) || 0
    const comision = Number(venta.comision_monto) || 0

    totalKitsBulk += kits
    totalIngresosBulk += ingreso
    totalComisionBulk += comision

    const localId = venta.punto_entrega_id
    const actual = bulkPorLocalMap.get(localId) ?? {
      ventas: 0,
      kits: 0,
      ingresos: 0,
      comision: 0
    }
    bulkPorLocalMap.set(localId, {
      ventas: actual.ventas + 1,
      kits: actual.kits + kits,
      ingresos: actual.ingresos + ingreso,
      comision: actual.comision + comision
    })
  }

  const bulkPorLocal: ResumenBulkPorLocal[] = Array.from(
    bulkPorLocalMap.entries()
  )
    .map(([localId, datos]) => ({
      localId,
      localNombre:
        nombresLocal.get(localId) ?? 'Local',
      ...datos
    }))
    .sort((a, b) => b.kits - a.kits)

  let totalKitsNormales = 0
  let totalIngresosNormales = 0

  for (const pedido of pedidosNormales) {
    totalKitsNormales += kitsPorPedido.get(pedido.id) ?? 0
    totalIngresosNormales +=
      ingresoPorPedido.get(pedido.id) ?? 0
  }

  return {
    pedidosEnLocal: {
      totalPedidos: pedidosLocal.length,
      totalKits: pedidosLocal.reduce(
        (s, p) => s + (kitsPorPedido.get(p.id) ?? 0),
        0
      ),
      porLocal,
      recientes
    },
    ventasBulk: {
      totalVentas: ventasBulk.length,
      totalKits: totalKitsBulk,
      totalIngresos: totalIngresosBulk,
      totalComision: totalComisionBulk,
      porLocal: bulkPorLocal
    },
    pedidosNormales: {
      totalPedidos: pedidosNormales.length,
      totalKits: totalKitsNormales,
      totalIngresos: totalIngresosNormales
    }
  }
}
