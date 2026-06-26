import {
  registrarEntradaInsumo
} from '../../../../scr/lib/calcularStock'
import { agregarInsumoARecetasKits } from '../../../../scr/lib/pedidoSnapshots'
import { supabase } from '../../../../scr/lib/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.nombre?.trim()) {
      return Response.json(
        { error: 'El nombre es obligatorio' },
        { status: 400 }
      )
    }

    if (!body.categoria?.trim()) {
      return Response.json(
        { error: 'Selecciona una categoría' },
        { status: 400 }
      )
    }

    if (!body.unidad?.trim()) {
      return Response.json(
        { error: 'Selecciona una unidad' },
        { status: 400 }
      )
    }

    const categoria =
      body.categoria === 'otro' &&
      body.categoriaOtro?.trim()
        ? body.categoriaOtro.trim().toLowerCase()
        : body.categoria.trim()

    const unidad =
      body.unidad === 'otro' &&
      body.unidadOtro?.trim()
        ? body.unidadOtro.trim().toLowerCase()
        : body.unidad.trim()

    const { data, error } = await supabase
      .from('insumos')
      .insert({
        nombre: body.nombre.trim(),
        categoria,
        unidad,
        stock_actual: 0,
        stock_minimo: Number(body.stock_minimo) || 0,
        activo: true,
        costo_promedio: null
      })
      .select()
      .single()

    if (error || !data) {
      return Response.json(
        { error: error?.message || 'Error al crear' },
        { status: 500 }
      )
    }

    const stockInicial = Number(body.stock_inicial) || 0
    const montoInicial =
      body.monto_inicial != null &&
      body.monto_inicial !== ''
        ? Number(body.monto_inicial)
        : null

    if (stockInicial > 0) {
      const entrada =
        await registrarEntradaInsumo(supabase, {
          insumoId: data.id,
          cantidad: stockInicial,
          monto: montoInicial,
          motivo: 'Stock inicial'
        })

      if (!entrada.ok) {
        return Response.json(
          { error: entrada.error },
          { status: 500 }
        )
      }
    }

    const asignaciones = Array.isArray(body.asignaciones_kits)
      ? body.asignaciones_kits
          .filter(
            (a: { kit_id?: string; cantidad?: number }) =>
              a.kit_id && Number(a.cantidad) > 0
          )
          .map(
            (a: { kit_id: string; cantidad: number }) => ({
              kit_id: a.kit_id,
              cantidad: Number(a.cantidad)
            })
          )
      : []

    if (asignaciones.length > 0) {
      const recetas = await agregarInsumoARecetasKits(
        supabase,
        data.id,
        asignaciones
      )

      if (!recetas.ok) {
        return Response.json(
          { error: recetas.error },
          { status: 500 }
        )
      }
    }

    return Response.json({
      success: true,
      insumo: data
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error creando insumo' },
      { status: 500 }
    )
  }
}
