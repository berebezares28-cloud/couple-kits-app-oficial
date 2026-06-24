const ETIQUETAS_CATEGORIA: Record<string, string> = {
  figura: 'Figuras',
  consumible: 'Consumibles',
  pintura: 'Pinturas',
  empaque: 'Empaque',
  herramienta: 'Herramientas',
  material: 'Materiales',
  otro: 'Otros',
  otros: 'Otros'
}

export const CATEGORIAS_INSUMO = [
  { value: 'figura', label: 'Figuras' },
  { value: 'consumible', label: 'Consumibles' },
  { value: 'empaque', label: 'Empaque' },
  { value: 'pintura', label: 'Pinturas' },
  { value: 'herramienta', label: 'Herramientas' },
  { value: 'material', label: 'Materiales' },
  { value: 'otro', label: 'Otro' }
] as const

export const UNIDADES_INSUMO = [
  { value: 'pieza', label: 'Pieza' },
  { value: 'metro', label: 'Metro' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'litro', label: 'Litro' },
  { value: 'otro', label: 'Otro' }
] as const

export function etiquetaCategoria(
  categoria: string | null | undefined
): string {
  if (!categoria) return 'Otros'

  const key = categoria.toLowerCase().trim()

  return (
    ETIQUETAS_CATEGORIA[key] ??
    key.charAt(0).toUpperCase() + key.slice(1)
  )
}

export function formatearMoneda(valor: number) {
  return valor.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  })
}

export function formatearFechaInsumo(fecha: string) {
  try {
    return new Date(fecha).toLocaleDateString(
      'es-MX',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    )
  } catch {
    return fecha
  }
}
