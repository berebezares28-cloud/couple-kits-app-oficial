import { SupabaseClient } from '@supabase/supabase-js'

const MARCADOR_INVENTARIO = '[inventario_aplicado]'

type Resultado =
  | { ok: true; yaDescontado?: boolean; descontados?: string[] }
  | { ok: false; error: string }

type ConsumoLinea = {
  insumoId: string
  nombre: string
  cantidad: number
}

export async function calcularConsumoDesdeKits(
  supabase: SupabaseClient,
  pedidoKits: { kit_id: string; cantidad: number }[]
): Promise<
  | { ok: true; lineas: ConsumoLinea[] }
  | { ok: false; error: string }
> {
  if (!pedidoKits.length) {
    return { ok: true, lineas: [] }
  }

  const kitIds = pedidoKits.map((pk) => pk.kit_id)

  const { data: recetas, error: recetasError } =
    await supabase
      .from('recetas_kit')
      .select('kit_id, insumo_id, cantidad')
      .in('kit_id', kitIds)

  if (recetasError) {
    return { ok: false, error: recetasError.message }
  }

  if (!recetas?.length) {
    return {
      ok: false,
      error:
        'Este pedido no tiene receta de insumos para sus kits'
    }
  }

  const consumoPorInsumo = new Map<string, number>()

  for (const pedidoKit of pedidoKits) {
    const recetasDelKit = recetas.filter(
      (r) => r.kit_id === pedidoKit.kit_id
    )

    for (const receta of recetasDelKit) {
      const cantidad =
        Number(receta.cantidad) *
        Number(pedidoKit.cantidad)

      const actual =
        consumoPorInsumo.get(receta.insumo_id) ?? 0

      consumoPorInsumo.set(
        receta.insumo_id,
        actual + cantidad
      )
    }
  }

  const insumoIds = Array.from(consumoPorInsumo.keys())

  const { data: insumos } = await supabase
    .from('insumos')
    .select('id, nombre')
    .in('id', insumoIds)

  const nombres = new Map(
    insumos?.map((i) => [i.id, i.nombre]) ?? []
  )

  const lineas: ConsumoLinea[] = []

  for (const [insumoId, cantidad] of Array.from(
    consumoPorInsumo.entries()
  )) {
    lineas.push({
      insumoId,
      nombre: nombres.get(insumoId) ?? 'Insumo',
      cantidad
    })
  }

  lineas.sort((a, b) =>
    a.nombre.localeCompare(b.nombre)
  )

  return { ok: true, lineas }
}

async function calcularConsumoPedido(
  supabase: SupabaseClient,
  pedidoId: string
): Promise<
  | { ok: true; lineas: ConsumoLinea[] }
  | { ok: false; error: string }
> {
  const { data: pedidoKits, error: kitsError } =
    await supabase
      .from('pedido_kits')
      .select('kit_id, cantidad')
      .eq('pedido_id', pedidoId)

  if (kitsError) {
    return { ok: false, error: kitsError.message }
  }

  return calcularConsumoDesdeKits(
    supabase,
    pedidoKits ?? []
  )
}

export async function obtenerConsumoDesdeKits(
  supabase: SupabaseClient,
  kits: { kit_id: string; cantidad: number }[]
) {
  return calcularConsumoDesdeKits(supabase, kits)
}

async function pedidoYaTieneInventarioAplicado(
  supabase: SupabaseClient,
  pedidoId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('inventario_aplicado, nota')
    .eq('id', pedidoId)
    .single()

  if (!error && data?.inventario_aplicado === true) {
    return true
  }

  if (data?.nota?.includes(MARCADOR_INVENTARIO)) {
    return true
  }

  const { data: movimientos } = await supabase
    .from('movimientos_inventario')
    .select('id')
    .eq('pedido_id', pedidoId)
    .limit(1)

  if (movimientos?.length) {
    return true
  }

  const { data: porMotivo } = await supabase
    .from('movimientos_inventario')
    .select('id')
    .ilike('motivo', `%${pedidoId}%`)
    .limit(1)

  return Boolean(porMotivo?.length)
}

async function marcarInventarioAplicado(
  supabase: SupabaseClient,
  pedidoId: string
) {
  const { error } = await supabase
    .from('pedidos')
    .update({ inventario_aplicado: true })
    .eq('id', pedidoId)

  if (error) {
    const { data } = await supabase
      .from('pedidos')
      .select('nota')
      .eq('id', pedidoId)
      .single()

    const notaActual = data?.nota ?? ''

    if (!notaActual.includes(MARCADOR_INVENTARIO)) {
      await supabase
        .from('pedidos')
        .update({
          nota: `${notaActual}\n${MARCADOR_INVENTARIO}`.trim()
        })
        .eq('id', pedidoId)
    }
  }
}

async function desmarcarInventarioAplicado(
  supabase: SupabaseClient,
  pedidoId: string
) {
  await supabase
    .from('pedidos')
    .update({ inventario_aplicado: false })
    .eq('id', pedidoId)

  const { data } = await supabase
    .from('pedidos')
    .select('nota')
    .eq('id', pedidoId)
    .single()

  if (data?.nota?.includes(MARCADOR_INVENTARIO)) {
    const notaLimpia = data.nota
      .replace(MARCADOR_INVENTARIO, '')
      .replace(/\n\n+/g, '\n')
      .trim()

    await supabase
      .from('pedidos')
      .update({ nota: notaLimpia || null })
      .eq('id', pedidoId)
  }
}

async function registrarMovimiento(
  supabase: SupabaseClient,
  pedidoId: string,
  insumoId: string,
  cantidad: number,
  tipo: 'entrada' | 'salida'
) {
  const hoy = new Date().toISOString().split('T')[0]
  const motivo =
    tipo === 'salida'
      ? `Entrega pedido ${pedidoId}`
      : `Reversa pedido ${pedidoId}`

  const intentos = [
    {
      pedido_id: pedidoId,
      insumo_id: insumoId,
      cantidad,
      tipo,
      motivo,
      fecha: hoy
    },
    {
      insumo_id: insumoId,
      cantidad,
      tipo,
      motivo,
      fecha: hoy
    }
  ]

  for (const fila of intentos) {
    const { error } = await supabase
      .from('movimientos_inventario')
      .insert(fila)

    if (!error) return
  }
}

async function aplicarConsumo(
  supabase: SupabaseClient,
  pedidoId: string,
  lineas: ConsumoLinea[],
  modo: 'descontar' | 'revertir'
): Promise<Resultado> {
  const cambios: string[] = []

  for (const linea of lineas) {
    const { data: insumo, error: fetchError } =
      await supabase
        .from('insumos')
        .select('stock_actual, nombre')
        .eq('id', linea.insumoId)
        .single()

    if (fetchError || !insumo) {
      return {
        ok: false,
        error:
          fetchError?.message ||
          `Insumo no encontrado: ${linea.insumoId}`
      }
    }

    const stockActual = Number(insumo.stock_actual) || 0
    const nuevoStock =
      modo === 'descontar'
        ? stockActual - linea.cantidad
        : stockActual + linea.cantidad

    const { error: updateError } = await supabase
      .from('insumos')
      .update({ stock_actual: nuevoStock })
      .eq('id', linea.insumoId)

    if (updateError) {
      return {
        ok: false,
        error: `${insumo.nombre}: ${updateError.message}`
      }
    }

    const simbolo = modo === 'descontar' ? '−' : '+'

    cambios.push(
      `${insumo.nombre} (${simbolo}${linea.cantidad} → ${nuevoStock})`
    )

    await registrarMovimiento(
      supabase,
      pedidoId,
      linea.insumoId,
      linea.cantidad,
      modo === 'descontar' ? 'salida' : 'entrada'
    )
  }

  return { ok: true, descontados: cambios }
}

export async function obtenerConsumoPedido(
  supabase: SupabaseClient,
  pedidoId: string
) {
  return calcularConsumoPedido(supabase, pedidoId)
}

export async function descontarInventarioPedido(
  supabase: SupabaseClient,
  pedidoId: string
): Promise<Resultado> {
  const yaAplicado =
    await pedidoYaTieneInventarioAplicado(
      supabase,
      pedidoId
    )

  if (yaAplicado) {
    return { ok: true, yaDescontado: true }
  }

  const consumo = await calcularConsumoPedido(
    supabase,
    pedidoId
  )

  if (!consumo.ok) {
    return consumo
  }

  if (consumo.lineas.length === 0) {
    await marcarInventarioAplicado(supabase, pedidoId)
    return { ok: true }
  }

  const resultado = await aplicarConsumo(
    supabase,
    pedidoId,
    consumo.lineas,
    'descontar'
  )

  if (!resultado.ok) {
    return resultado
  }

  await marcarInventarioAplicado(supabase, pedidoId)

  return resultado
}

export async function revertirInventarioPedido(
  supabase: SupabaseClient,
  pedidoId: string,
  opciones?: { forzar?: boolean }
): Promise<Resultado> {
  const yaAplicado =
    await pedidoYaTieneInventarioAplicado(
      supabase,
      pedidoId
    )

  if (!yaAplicado && !opciones?.forzar) {
    return { ok: true, yaDescontado: true }
  }

  const consumo = await calcularConsumoPedido(
    supabase,
    pedidoId
  )

  if (!consumo.ok) {
    return consumo
  }

  if (consumo.lineas.length > 0) {
    const resultado = await aplicarConsumo(
      supabase,
      pedidoId,
      consumo.lineas,
      'revertir'
    )

    if (!resultado.ok) {
      return resultado
    }
  }

  await desmarcarInventarioAplicado(supabase, pedidoId)

  return { ok: true, descontados: consumo.lineas.map(
    (l) => `${l.nombre} (+${l.cantidad})`
  ) }
}

export async function resincronizarInventarioPedido(
  supabase: SupabaseClient,
  pedidoId: string
): Promise<Resultado> {
  await revertirInventarioPedido(
    supabase,
    pedidoId,
    { forzar: true }
  )
  return descontarInventarioPedido(supabase, pedidoId)
}

export async function syncPedidoKits(
  supabase: SupabaseClient,
  pedidoId: string,
  kits: { kit_id: string; cantidad: number }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error: deleteError } = await supabase
    .from('pedido_kits')
    .delete()
    .eq('pedido_id', pedidoId)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  if (kits.length === 0) {
    return { ok: true }
  }

  const rows = kits.map((kit) => ({
    pedido_id: pedidoId,
    kit_id: kit.kit_id,
    cantidad: kit.cantidad
  }))

  const { error: insertError } = await supabase
    .from('pedido_kits')
    .insert(rows)

  if (insertError) {
    return { ok: false, error: insertError.message }
  }

  return { ok: true }
}

export function pedidoSaleDeEntregado(
  estatusActualDb: string,
  nuevoEstatus: string
): boolean {
  return (
    estatusActualDb === 'Entregado' &&
    nuevoEstatus !== 'Entregado'
  )
}

export function pedidoEntraAEntregado(
  estatusActualDb: string,
  nuevoEstatus: string
): boolean {
  return (
    nuevoEstatus === 'Entregado' &&
    estatusActualDb !== 'Entregado'
  )
}

export async function inventarioYaAplicado(
  supabase: SupabaseClient,
  pedidoId: string
): Promise<boolean> {
  return pedidoYaTieneInventarioAplicado(
    supabase,
    pedidoId
  )
}
