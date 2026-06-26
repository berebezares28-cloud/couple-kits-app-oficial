export const METODOS_PAGO = [
  'Mercado Pago',
  'Efectivo',
  'Nu'
] as const

export type MetodoPago = (typeof METODOS_PAGO)[number]

export const CATEGORIAS_GASTO = [
  'marketing',
  'generacion_contenido',
  'suscripciones',
  'transporte',
  'promociones_descuentos',
  'otros'
] as const

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number]

export const ETIQUETAS_CATEGORIA_GASTO: Record<
  CategoriaGasto,
  string
> = {
  marketing: 'Marketing',
  generacion_contenido: 'Generación de contenido',
  suscripciones: 'Suscripciones',
  transporte: 'Transporte',
  promociones_descuentos: 'Promociones y descuentos',
  otros: 'Otros gastos'
}

export type LoteFifo = {
  compraId: string
  fecha: string
  cantidadRestante: number
  costoUnitario: number
}

export type CompraFifo = {
  id: string
  insumo_id: string
  fecha: string
  cantidad: number
  costo_total: number | null
  costo_unitario: number | null
}

export function costoUnitarioCompra(
  compra: Pick<
    CompraFifo,
    'cantidad' | 'costo_total' | 'costo_unitario'
  >
): number {
  if (compra.costo_unitario != null) {
    return Number(compra.costo_unitario)
  }

  if (
    compra.costo_total != null &&
    Number(compra.cantidad) > 0
  ) {
    return (
      Number(compra.costo_total) /
      Number(compra.cantidad)
    )
  }

  return 0
}

export function construirLotesFifo(
  compras: CompraFifo[]
): Map<string, LoteFifo[]> {
  const porInsumo = new Map<string, LoteFifo[]>()

  const ordenadas = [...compras].sort((a, b) => {
    const cmp = a.fecha.localeCompare(b.fecha)
    if (cmp !== 0) return cmp
    return a.id.localeCompare(b.id)
  })

  for (const compra of ordenadas) {
    const costo = costoUnitarioCompra(compra)
    if (costo <= 0) continue

    const lotes = porInsumo.get(compra.insumo_id) ?? []
    lotes.push({
      compraId: compra.id,
      fecha: compra.fecha,
      cantidadRestante: Number(compra.cantidad),
      costoUnitario: costo
    })
    porInsumo.set(compra.insumo_id, lotes)
  }

  return porInsumo
}

export function consumirFifo(
  lotes: LoteFifo[],
  cantidad: number
): { costo: number; lotes: LoteFifo[] } {
  let restante = cantidad
  let costo = 0
  const copia = lotes.map((l) => ({ ...l }))

  for (const lote of copia) {
    if (restante <= 0) break
    if (lote.cantidadRestante <= 0) continue

    const tomar = Math.min(
      restante,
      lote.cantidadRestante
    )
    costo += tomar * lote.costoUnitario
    lote.cantidadRestante -= tomar
    restante -= tomar
  }

  return { costo, lotes: copia }
}

export function valorInventarioLotes(
  lotesPorInsumo: Map<string, LoteFifo[]>
): number {
  let total = 0

  for (const lotes of Array.from(
    lotesPorInsumo.values()
  )) {
    for (const lote of lotes) {
      total +=
        lote.cantidadRestante * lote.costoUnitario
    }
  }

  return total
}

export function mesDeFecha(fecha: string): string {
  return fecha.slice(0, 7)
}

export function enMes(
  fecha: string,
  mes: string
): boolean {
  return mesDeFecha(fecha) === mes
}
