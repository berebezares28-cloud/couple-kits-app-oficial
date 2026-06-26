import { SupabaseClient } from '@supabase/supabase-js'
import { esEntregaEnLocal } from './puntosEntrega'
import {
  consumoInsumosPorPedido,
  pedidoActivo,
  precioLineaPedidoKit
} from './pedidoSnapshots'
import {
  CategoriaGasto,
  CATEGORIAS_GASTO,
  CompraFifo,
  ETIQUETAS_CATEGORIA_GASTO,
  METODOS_PAGO,
  construirLotesFifo,
  consumirFifo,
  enMes,
  valorInventarioLotes,
  type LoteFifo,
  type MetodoPago
} from './fifoCosteo'

export type { CategoriaGasto, MetodoPago }

export type Gasto = {
  id: string
  concepto: string
  fecha: string
  monto: number
  categoria: CategoriaGasto
  metodo_pago: MetodoPago
  notas: string | null
}

export type EstadoPL = {
  mes: string
  ingresos: number
  costoVentas: number
  margenBruto: number
  comisiones: number
  utilidadOperativa: number
  gastosPorCategoria: Record<CategoriaGasto, number>
  totalGastosAdmin: number
  utilidadNeta: number
  kitsVendidos: number
}

export type CuentaResumen = {
  metodo_pago: MetodoPago
  saldoInicial: number
  entradas: number
  salidas: number
  saldoActual: number
}

export type CuentaFlujoMes = {
  metodo_pago: MetodoPago
  entradas: number
  salidas: number
  flujoNeto: number
}

export type FlujoMesResumen = {
  mes: string
  cuentas: CuentaFlujoMes[]
}

export type FinanzasResumen = {
  mes: string
  pl: EstadoPL
  inventarioValor: number
  cuentas: CuentaResumen[]
  flujosPorMes: FlujoMesResumen[]
  mesesDisponibles: string[]
}

/** Asegura flujosPorMes aunque llegue respuesta antigua (cuentasMes). */
export function normalizarFinanzasResumen(
  data: FinanzasResumen & { cuentasMes?: CuentaFlujoMes[] }
): FinanzasResumen {
  if (Array.isArray(data.flujosPorMes)) {
    return data
  }

  const meses = data.mesesDisponibles ?? []
  const cuentasMes = data.cuentasMes

  if (cuentasMes && data.mes) {
    return {
      ...data,
      flujosPorMes: meses.map((m) => ({
        mes: m,
        cuentas:
          m === data.mes
            ? cuentasMes
            : METODOS_PAGO.map((metodo_pago) => ({
                metodo_pago,
                entradas: 0,
                salidas: 0,
                flujoNeto: 0
              }))
      }))
    }
  }

  return { ...data, flujosPorMes: [] }
}

type EventoVenta = {
  fecha: string
  pedidoId?: string
  kits: { kit_id: string; cantidad: number }[]
  ingreso: number
  comision: number
  metodo_pago: MetodoPago | null
  tipo: 'pedido' | 'bulk'
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

async function obtenerEventosVenta(
  supabase: SupabaseClient
): Promise<EventoVenta[]> {
  const eventos: EventoVenta[] = []

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(
      'id, estatus, fecha_entrega, created_at, punto_entrega_id, metodo_pago, eliminado'
    )
    .eq('estatus', 'Entregado')
    .neq('eliminado', true)

  const pedidosNormales =
    pedidos?.filter(
      (p) => !esEntregaEnLocal(p) && pedidoActivo(p)
    ) ?? []

  const pedidoIds = pedidosNormales.map((p) => p.id)

  if (pedidoIds.length > 0) {
    const { data: pedidoKits } = await supabase
      .from('pedido_kits')
      .select(`
        pedido_id,
        kit_id,
        cantidad,
        precio_unitario,
        subtotal,
        kits ( precio_venta )
      `)
      .in('pedido_id', pedidoIds)

    const kitsPorPedido = new Map<
      string,
      { kit_id: string; cantidad: number }[]
    >()
    const ingresoPorPedido = new Map<string, number>()

    for (const pk of pedidoKits ?? []) {
      const cantidad = Number(pk.cantidad) || 1
      const lista =
        kitsPorPedido.get(pk.pedido_id) ?? []
      lista.push({
        kit_id: pk.kit_id,
        cantidad
      })
      kitsPorPedido.set(pk.pedido_id, lista)

      ingresoPorPedido.set(
        pk.pedido_id,
        (ingresoPorPedido.get(pk.pedido_id) ?? 0) +
          precioLineaPedidoKit(pk)
      )
    }

    for (const pedido of pedidosNormales) {
      const fecha =
        pedido.fecha_entrega ??
        pedido.created_at?.split('T')[0] ??
        ''
      if (!fecha) continue

      eventos.push({
        fecha,
        pedidoId: pedido.id,
        kits: kitsPorPedido.get(pedido.id) ?? [],
        ingreso: ingresoPorPedido.get(pedido.id) ?? 0,
        comision: 0,
        metodo_pago:
          (pedido.metodo_pago as MetodoPago) ?? null,
        tipo: 'pedido'
      })
    }
  }

  const { data: ventasBulk } = await supabase
    .from('ventas_local')
    .select(
      'id, fecha, ingreso_total, comision_monto, metodo_pago'
    )

  const ventaIds = ventasBulk?.map((v) => v.id) ?? []

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

  for (const venta of ventasBulk ?? []) {
    const kits = lineasBulk
      .filter((l) => l.venta_local_id === venta.id)
      .map((l) => ({
        kit_id: l.kit_id,
        cantidad: Number(l.cantidad) || 1
      }))

    eventos.push({
      fecha: venta.fecha,
      kits,
      ingreso: Number(venta.ingreso_total) || 0,
      comision: Number(venta.comision_monto) || 0,
      metodo_pago:
        (venta.metodo_pago as MetodoPago) ?? null,
      tipo: 'bulk'
    })
  }

  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha))
  return eventos
}

async function consumoInsumosPorKits(
  supabase: SupabaseClient,
  kits: { kit_id: string; cantidad: number }[]
): Promise<Map<string, number>> {
  const consumo = new Map<string, number>()

  if (!kits.length) return consumo

  const kitIds = kits.map((k) => k.kit_id)

  const { data: recetas } = await supabase
    .from('recetas_kit')
    .select('kit_id, insumo_id, cantidad')
    .in('kit_id', kitIds)

  for (const kit of kits) {
    const recetasDelKit =
      recetas?.filter((r) => r.kit_id === kit.kit_id) ??
      []

    for (const receta of recetasDelKit) {
      if (!receta.insumo_id) continue

      const cantidad =
        Number(receta.cantidad) *
        Number(kit.cantidad)

      consumo.set(
        receta.insumo_id,
        (consumo.get(receta.insumo_id) ?? 0) +
          cantidad
      )
    }
  }

  return consumo
}

export async function simularFifoGlobal(
  supabase: SupabaseClient
): Promise<{
  lotesPorInsumo: Map<string, LoteFifo[]>
  cogsPorMes: Map<string, number>
}> {
  const { data: compras } = await supabase
    .from('compras_insumos')
    .select(
      'id, insumo_id, fecha, cantidad, costo_total, costo_unitario'
    )
    .order('fecha', { ascending: true })

  const lotesPorInsumo = construirLotesFifo(
    (compras ?? []) as CompraFifo[]
  )

  const eventos = await obtenerEventosVenta(supabase)
  const cogsPorMes = new Map<string, number>()

  for (const evento of eventos) {
    const consumo =
      evento.tipo === 'pedido' && evento.pedidoId
        ? await consumoInsumosPorPedido(
            supabase,
            evento.pedidoId
          )
        : await consumoInsumosPorKits(
            supabase,
            evento.kits
          )

    let costoEvento = 0

    for (const [insumoId, cantidad] of Array.from(
      consumo.entries()
    )) {
      const lotes = lotesPorInsumo.get(insumoId) ?? []
      const resultado = consumirFifo(lotes, cantidad)
      lotesPorInsumo.set(insumoId, resultado.lotes)
      costoEvento += resultado.costo
    }

    const mes = evento.fecha.slice(0, 7)
    cogsPorMes.set(
      mes,
      (cogsPorMes.get(mes) ?? 0) + costoEvento
    )
  }

  return { lotesPorInsumo, cogsPorMes }
}

export async function calcularPlRango(
  supabase: SupabaseClient,
  desde: string,
  hasta: string
): Promise<{
  ingresos: number
  costoVentas: number
  margenBruto: number
  comisiones: number
  totalGastosAdmin: number
  utilidadNeta: number
  kitsVendidos: number
}> {
  function enRango(fecha: string): boolean {
    return fecha >= desde && fecha <= hasta
  }

  const eventos = await obtenerEventosVenta(supabase)
  const eventosEnRango = eventos.filter((e) =>
    enRango(e.fecha)
  )

  let ingresos = 0
  let comisiones = 0
  let kitsVendidos = 0

  for (const evento of eventosEnRango) {
    ingresos += evento.ingreso
    comisiones += evento.comision

    for (const kit of evento.kits) {
      kitsVendidos += kit.cantidad
    }
  }

  const { data: compras } = await supabase
    .from('compras_insumos')
    .select(
      'id, insumo_id, fecha, cantidad, costo_total, costo_unitario'
    )
    .order('fecha', { ascending: true })

  const lotesPorInsumo = construirLotesFifo(
    (compras ?? []) as CompraFifo[]
  )

  let costoVentas = 0

  for (const evento of eventos) {
    const consumo =
      evento.tipo === 'pedido' && evento.pedidoId
        ? await consumoInsumosPorPedido(
            supabase,
            evento.pedidoId
          )
        : await consumoInsumosPorKits(
            supabase,
            evento.kits
          )

    let costoEvento = 0

    for (const [insumoId, cantidad] of Array.from(
      consumo.entries()
    )) {
      const lotes = lotesPorInsumo.get(insumoId) ?? []
      const resultado = consumirFifo(lotes, cantidad)
      lotesPorInsumo.set(insumoId, resultado.lotes)
      costoEvento += resultado.costo
    }

    if (enRango(evento.fecha)) {
      costoVentas += costoEvento
    }
  }

  const { data: gastos } = await supabase
    .from('gastos')
    .select('monto, fecha')
    .gte('fecha', desde)
    .lte('fecha', hasta)

  const totalGastosAdmin = (gastos ?? []).reduce(
    (sum, g) => sum + (Number(g.monto) || 0),
    0
  )

  const margenBruto = ingresos - costoVentas
  const utilidadNeta =
    margenBruto - comisiones - totalGastosAdmin

  return {
    ingresos,
    costoVentas,
    margenBruto,
    comisiones,
    totalGastosAdmin,
    utilidadNeta,
    kitsVendidos
  }
}


function mesesDesdeMovimientos(
  eventos: EventoVenta[],
  gastos: Gasto[],
  compras: CompraFlujo[]
): string[] {
  const meses = new Set<string>()

  for (const e of eventos) {
    if (e.fecha) meses.add(e.fecha.slice(0, 7))
  }

  for (const g of gastos) {
    meses.add(g.fecha.slice(0, 7))
  }

  for (const c of compras) {
    if (c.fecha) {
      meses.add(c.fecha.slice(0, 7))
    }
  }

  const hoy = new Date().toISOString().slice(0, 7)
  meses.add(hoy)

  return Array.from(meses).sort((a, b) =>
    b.localeCompare(a)
  )
}

type CompraFlujo = {
  costo_total: number | null
  metodo_pago: string | null
  fecha: string
}

function fechaEnMes(
  fecha: string,
  mes: string
): boolean {
  return fecha.slice(0, 7) === mes
}

function calcularFlujosCuenta(
  eventos: EventoVenta[],
  gastos: Gasto[],
  compras: CompraFlujo[],
  opciones?: { mes?: string; incluirSaldoInicial?: boolean; saldosMap?: Map<string, number> }
): CuentaResumen[] {
  return METODOS_PAGO.map((metodo) => {
    let entradas = 0
    let salidas = 0

    for (const e of eventos) {
      if (opciones?.mes && !fechaEnMes(e.fecha, opciones.mes)) {
        continue
      }
      if (e.metodo_pago === metodo) {
        entradas += e.ingreso
      }
      if (
        e.comision > 0 &&
        metodo === 'Efectivo'
      ) {
        salidas += e.comision
      }
    }

    for (const g of gastos) {
      if (opciones?.mes && !fechaEnMes(g.fecha, opciones.mes)) {
        continue
      }
      if (g.metodo_pago === metodo) {
        salidas += g.monto
      }
    }

    for (const compra of compras) {
      if (
        !compra.metodo_pago ||
        compra.costo_total == null
      ) {
        continue
      }
      const fechaCompra =
        typeof compra.fecha === 'string'
          ? compra.fecha.slice(0, 10)
          : ''
      if (
        opciones?.mes &&
        !fechaEnMes(fechaCompra, opciones.mes)
      ) {
        continue
      }
      if (compra.metodo_pago === metodo) {
        salidas += Number(compra.costo_total)
      }
    }

    const saldoInicial =
      opciones?.incluirSaldoInicial
        ? opciones.saldosMap?.get(metodo) ?? 0
        : 0

    return {
      metodo_pago: metodo,
      saldoInicial,
      entradas,
      salidas,
      saldoActual: saldoInicial + entradas - salidas
    }
  })
}

function aFlujoMes(
  raw: CuentaResumen[]
): CuentaFlujoMes[] {
  return raw.map((c) => ({
    metodo_pago: c.metodo_pago,
    entradas: c.entradas,
    salidas: c.salidas,
    flujoNeto: c.entradas - c.salidas
  }))
}

export async function obtenerFinanzasResumen(
  supabase: SupabaseClient,
  mes: string
): Promise<FinanzasResumen> {
  const [eventos, gastos, saldosDb, fifo, comprasResult] =
    await Promise.all([
      obtenerEventosVenta(supabase),
      listarGastos(supabase),
      supabase.from('saldos_cuenta').select('*'),
      simularFifoGlobal(supabase),
      supabase
        .from('compras_insumos')
        .select('costo_total, metodo_pago, fecha')
    ])

  const mesesDisponibles = mesesDesdeMovimientos(
    eventos,
    gastos,
    (comprasResult.data ?? []) as CompraFlujo[]
  )

  const eventosMes = eventos.filter((e) =>
    enMes(e.fecha, mes)
  )
  const gastosMes = gastos.filter((g) =>
    enMes(g.fecha, mes)
  )

  const ingresos = eventosMes.reduce(
    (s, e) => s + e.ingreso,
    0
  )
  const comisiones = eventosMes.reduce(
    (s, e) => s + e.comision,
    0
  )
  const kitsVendidos = eventosMes.reduce(
    (s, e) =>
      s +
      e.kits.reduce(
        (ks, k) => ks + Number(k.cantidad),
        0
      ),
    0
  )

  const costoVentas = fifo.cogsPorMes.get(mes) ?? 0

  const gastosPorCategoria = {
    marketing: 0,
    generacion_contenido: 0,
    suscripciones: 0,
    transporte: 0,
    promociones_descuentos: 0,
    otros: 0
  } as Record<CategoriaGasto, number>

  for (const g of gastosMes) {
    gastosPorCategoria[g.categoria] += g.monto
  }

  const totalGastosAdmin = gastosMes.reduce(
    (s, g) => s + g.monto,
    0
  )

  const margenBruto = ingresos - costoVentas
  const utilidadOperativa =
    margenBruto - comisiones
  const utilidadNeta =
    utilidadOperativa - totalGastosAdmin

  const saldosMap = new Map(
    saldosDb.data?.map((s) => [
      s.metodo_pago,
      Number(s.saldo_inicial)
    ]) ?? []
  )

  const compras =
    (comprasResult.data ?? []) as CompraFlujo[]

  const cuentas = calcularFlujosCuenta(
    eventos,
    gastos,
    compras,
    { incluirSaldoInicial: true, saldosMap }
  )

  const flujosPorMes: FlujoMesResumen[] =
    mesesDisponibles.map((m) => ({
      mes: m,
      cuentas: aFlujoMes(
        calcularFlujosCuenta(
          eventos,
          gastos,
          compras,
          { mes: m }
        )
      )
    }))

  return {
    mes,
    pl: {
      mes,
      ingresos,
      costoVentas,
      margenBruto,
      comisiones,
      utilidadOperativa,
      gastosPorCategoria,
      totalGastosAdmin,
      utilidadNeta,
      kitsVendidos
    },
    inventarioValor: valorInventarioLotes(
      fifo.lotesPorInsumo
    ),
    cuentas,
    flujosPorMes,
    mesesDisponibles
  }
}

export async function listarGastos(
  supabase: SupabaseClient,
  filtros?: { mes?: string }
): Promise<Gasto[]> {
  let query = supabase
    .from('gastos')
    .select('*')
    .order('fecha', { ascending: false })

  if (filtros?.mes) {
    const desde = `${filtros.mes}-01`
    const [year, month] = filtros.mes.split('-').map(
      Number
    )
    const ultimoDia = new Date(year, month, 0).getDate()
    const hasta = `${filtros.mes}-${String(ultimoDia).padStart(2, '0')}`
    query = query.gte('fecha', desde).lte('fecha', hasta)
  }

  const { data } = await query

  return (data ?? []).map((g) => ({
    id: g.id,
    concepto: g.concepto,
    fecha: g.fecha,
    monto: Number(g.monto),
    categoria: g.categoria as CategoriaGasto,
    metodo_pago: g.metodo_pago as MetodoPago,
    notas: g.notas
  }))
}

export async function crearGasto(
  supabase: SupabaseClient,
  params: {
    concepto: string
    fecha: string
    monto: number
    categoria: CategoriaGasto
    metodo_pago: MetodoPago
    notas?: string
  }
): Promise<
  | { ok: true; id: string }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from('gastos')
    .insert({
      concepto: params.concepto.trim(),
      fecha: params.fecha,
      monto: params.monto,
      categoria: params.categoria,
      metodo_pago: params.metodo_pago,
      notas: params.notas ?? null
    })
    .select('id')
    .single()

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'No se pudo crear'
    }
  }

  return { ok: true, id: data.id }
}

export async function eliminarGasto(
  supabase: SupabaseClient,
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('gastos')
    .delete()
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export async function actualizarSaldosIniciales(
  supabase: SupabaseClient,
  saldos: { metodo_pago: MetodoPago; saldo_inicial: number }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  for (const s of saldos) {
    const { error } = await supabase
      .from('saldos_cuenta')
      .upsert({
        metodo_pago: s.metodo_pago,
        saldo_inicial: s.saldo_inicial,
        updated_at: new Date().toISOString()
      })

    if (error) {
      return { ok: false, error: error.message }
    }
  }

  return { ok: true }
}

export { ETIQUETAS_CATEGORIA_GASTO, METODOS_PAGO, CATEGORIAS_GASTO }
