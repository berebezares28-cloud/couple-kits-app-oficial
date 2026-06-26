import { SupabaseClient } from '@supabase/supabase-js'
import { listarInsumosConStock } from './calcularStock'
import {
  calcularPlRango,
  obtenerFinanzasResumen
} from './finanzasData'
import {
  etiquetaMes,
  formatearEtiquetaRango,
  obtenerResumenVentasMes,
  obtenerResumenVentasRango
} from './resumenVentasMes'

export type PuntoMes = {
  mes: string
  etiqueta: string
  ingresos: number
  utilidadNeta: number
  kits: number
  ventas: number
}

export type TopKitMes = {
  nombre: string
  cantidad: number
}

export type DashboardKpis = {
  ingresosMes: number
  utilidadNetaMes: number
  margenBrutoPct: number
  kitsVendidosMes: number
  ticketPromedio: number
  ventasMes: number
  pedidosPendientes: number
  insumosCriticos: number
  inventarioValor: number
  mixDirectoPct: number
}

export type AtajoRangoDashboard =
  | 'mes_actual'
  | 'mes_anterior'
  | 'ultimos_30_dias'
  | 'ultimos_3_meses'

export const ATAJOS_RANGO_DASHBOARD: {
  id: AtajoRangoDashboard
  label: string
}[] = [
  { id: 'mes_actual', label: 'Este mes' },
  { id: 'mes_anterior', label: 'Mes anterior' },
  { id: 'ultimos_30_dias', label: '30 días' },
  { id: 'ultimos_3_meses', label: '3 meses' }
]

export type DashboardBloquePeriodo = {
  fechaDesde: string
  fechaHasta: string
  etiquetaPeriodo: string
  kpis: DashboardKpis
  topKits: TopKitMes[]
  mixVentas: {
    directo: number
    bulk: number
  }
}

export type DashboardData = {
  mesActual: string
  etiquetaMes: string
  bloquePeriodo: DashboardBloquePeriodo
  tendencia: PuntoMes[]
  statusPedidos: {
    pendiente: number
    entregado: number
    cancelado: number
  }
}

function ultimosMeses(cantidad: number): string[] {
  const meses: string[] = []
  const hoy = new Date()

  for (let i = cantidad - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
    meses.push(d.toISOString().slice(0, 7))
  }

  return meses
}

function mesDesplazado(offset: number): string {
  const hoy = new Date()
  const d = new Date(
    hoy.getFullYear(),
    hoy.getMonth() + offset,
    1
  )
  return d.toISOString().slice(0, 7)
}

function fechaHoy(): string {
  return new Date().toISOString().slice(0, 10)
}

function fechaISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function rangoPorDefecto(): {
  desde: string
  hasta: string
} {
  const hoy = new Date()
  const inicio = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1
  )
  return {
    desde: fechaISO(inicio),
    hasta: fechaHoy()
  }
}

export function rangoAtajo(
  atajo: AtajoRangoDashboard
): { desde: string; hasta: string } {
  const hoy = new Date()
  const hasta = fechaHoy()

  switch (atajo) {
    case 'mes_anterior': {
      const inicio = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - 1,
        1
      )
      const fin = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        0
      )
      return {
        desde: fechaISO(inicio),
        hasta: fechaISO(fin)
      }
    }
    case 'ultimos_30_dias': {
      const inicio = new Date(hoy)
      inicio.setDate(inicio.getDate() - 29)
      return { desde: fechaISO(inicio), hasta }
    }
    case 'ultimos_3_meses': {
      const inicio = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - 2,
        1
      )
      return { desde: fechaISO(inicio), hasta }
    }
    case 'mes_actual':
    default: {
      const inicio = new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      )
      return { desde: fechaISO(inicio), hasta }
    }
  }
}

export function validarRangoFechas(
  desde: string,
  hasta: string
): string | null {
  if (!desde || !hasta) {
    return 'Indica fecha desde y hasta'
  }

  if (desde > hasta) {
    return 'La fecha inicial no puede ser posterior a la final'
  }

  return null
}

export async function obtenerBloqueRango(
  supabase: SupabaseClient,
  fechaDesde: string,
  fechaHasta: string
): Promise<DashboardBloquePeriodo> {
  const errorRango = validarRangoFechas(
    fechaDesde,
    fechaHasta
  )

  if (errorRango) {
    throw new Error(errorRango)
  }

  const [
    pl,
    ventas,
    topKits,
    insumos,
    pendientesResult,
    finanzasActual
  ] = await Promise.all([
    calcularPlRango(supabase, fechaDesde, fechaHasta),
    obtenerResumenVentasRango(
      supabase,
      fechaDesde,
      fechaHasta
    ),
    topKitsDelRango(supabase, fechaDesde, fechaHasta),
    listarInsumosConStock(supabase),
    supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('estatus', 'Pendiente')
      .neq('eliminado', true),
    obtenerFinanzasResumen(
      supabase,
      mesDesplazado(0)
    )
  ])

  const lineasDirecto = ventas.lineas.filter(
    (l) => l.tipo === 'pedido'
  ).length
  const lineasBulk = ventas.lineas.filter(
    (l) => l.tipo === 'bulk'
  ).length
  const totalLineas = lineasDirecto + lineasBulk

  const insumosCriticos = insumos.filter(
    (i) =>
      Number(i.stock_actual) <=
      Number(i.stock_minimo)
  ).length

  return {
    fechaDesde,
    fechaHasta,
    etiquetaPeriodo: formatearEtiquetaRango(
      fechaDesde,
      fechaHasta
    ),
    kpis: {
      ingresosMes: pl.ingresos,
      utilidadNetaMes: pl.utilidadNeta,
      margenBrutoPct:
        pl.ingresos > 0
          ? (pl.margenBruto / pl.ingresos) * 100
          : 0,
      kitsVendidosMes: pl.kitsVendidos,
      ticketPromedio:
        ventas.totalVentas > 0
          ? ventas.totalIngresos / ventas.totalVentas
          : 0,
      ventasMes: ventas.totalVentas,
      pedidosPendientes: pendientesResult.count ?? 0,
      insumosCriticos,
      inventarioValor: finanzasActual.inventarioValor,
      mixDirectoPct:
        totalLineas > 0
          ? (lineasDirecto / totalLineas) * 100
          : 0
    },
    topKits,
    mixVentas: {
      directo: lineasDirecto,
      bulk: lineasBulk
    }
  }
}

async function topKitsDelRango(
  supabase: SupabaseClient,
  fechaDesde: string,
  fechaHasta: string
): Promise<TopKitMes[]> {
  const resumen = await obtenerResumenVentasRango(
    supabase,
    fechaDesde,
    fechaHasta
  )

  const pedidoIds = resumen.lineas
    .filter((l) => l.tipo === 'pedido')
    .map((l) => l.id)

  const ventaBulkIds = resumen.lineas
    .filter((l) => l.tipo === 'bulk')
    .map((l) => l.id)

  const conteo = new Map<string, number>()

  if (pedidoIds.length > 0) {
    const { data } = await supabase
      .from('pedido_kits')
      .select('kit_id, cantidad, kits ( nombre )')
      .in('pedido_id', pedidoIds)

    for (const pk of data ?? []) {
      const kit = pk.kits as
        | { nombre: string }
        | { nombre: string }[]
        | null
      const nombre = Array.isArray(kit)
        ? kit[0]?.nombre
        : kit?.nombre

      if (!nombre) continue

      conteo.set(
        nombre,
        (conteo.get(nombre) ?? 0) +
          (Number(pk.cantidad) || 1)
      )
    }
  }

  if (ventaBulkIds.length > 0) {
    const { data } = await supabase
      .from('ventas_local_kits')
      .select('cantidad, kits ( nombre )')
      .in('venta_local_id', ventaBulkIds)

    for (const linea of data ?? []) {
      const kit = linea.kits as
        | { nombre: string }
        | { nombre: string }[]
        | null
      const nombre = Array.isArray(kit)
        ? kit[0]?.nombre
        : kit?.nombre

      if (!nombre) continue

      conteo.set(
        nombre,
        (conteo.get(nombre) ?? 0) +
          (Number(linea.cantidad) || 1)
      )
    }
  }

  return Array.from(conteo.entries())
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)
}

export async function obtenerDashboardData(
  supabase: SupabaseClient
): Promise<DashboardData> {
  const mesActual = mesDesplazado(0)
  const meses = ultimosMeses(6)

  const rangoInicial = rangoPorDefecto()

  const [bloquePeriodo, statusResult] = await Promise.all([
    obtenerBloqueRango(
      supabase,
      rangoInicial.desde,
      rangoInicial.hasta
    ),
    supabase
      .from('pedidos')
      .select('estatus')
      .neq('eliminado', true)
  ])

  const tendenciaRaw = await Promise.all(
    meses.map(async (mes) => {
      const [fin, ven] = await Promise.all([
        obtenerFinanzasResumen(supabase, mes),
        obtenerResumenVentasMes(supabase, mes)
      ])

      return {
        mes,
        etiqueta: etiquetaMes(mes).slice(0, 3),
        ingresos: fin.pl.ingresos,
        utilidadNeta: fin.pl.utilidadNeta,
        kits: ven.totalKits,
        ventas: ven.totalVentas
      }
    })
  )

  const statusPedidos = {
    pendiente: 0,
    entregado: 0,
    cancelado: 0
  }

  for (const p of statusResult.data ?? []) {
    const e = p.estatus ?? 'Pendiente'
    if (e === 'Pendiente') statusPedidos.pendiente++
    else if (e === 'Entregado') statusPedidos.entregado++
    else if (e === 'Cancelado') statusPedidos.cancelado++
  }

  return {
    mesActual,
    etiquetaMes: etiquetaMes(mesActual),
    bloquePeriodo,
    tendencia: tendenciaRaw,
    statusPedidos
  }
}
