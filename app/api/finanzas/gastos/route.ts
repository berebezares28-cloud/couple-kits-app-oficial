import {
  CATEGORIAS_GASTO,
  crearGasto,
  eliminarGasto,
  listarGastos,
  METODOS_PAGO
} from '../../../../scr/lib/finanzasData'
import { supabase } from '../../../../scr/lib/supabase'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const mes = url.searchParams.get('mes') ?? undefined

    const gastos = await listarGastos(supabase, { mes })

    return Response.json({ gastos })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando gastos' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const monto = Number(body.monto)

    if (!body.concepto?.trim()) {
      return Response.json(
        { error: 'Escribe el concepto' },
        { status: 400 }
      )
    }

    if (Number.isNaN(monto) || monto <= 0) {
      return Response.json(
        { error: 'Monto inválido' },
        { status: 400 }
      )
    }

    if (
      !CATEGORIAS_GASTO.includes(body.categoria)
    ) {
      return Response.json(
        { error: 'Categoría inválida' },
        { status: 400 }
      )
    }

    if (!METODOS_PAGO.includes(body.metodo_pago)) {
      return Response.json(
        { error: 'Método de pago inválido' },
        { status: 400 }
      )
    }

    const resultado = await crearGasto(supabase, {
      concepto: body.concepto,
      fecha:
        body.fecha ??
        new Date().toISOString().split('T')[0],
      monto,
      categoria: body.categoria,
      metodo_pago: body.metodo_pago,
      notas: body.notas
    })

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 500 }
      )
    }

    return Response.json({ success: true, id: resultado.id })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error registrando gasto' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return Response.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }

    const resultado = await eliminarGasto(supabase, id)

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error eliminando gasto' },
      { status: 500 }
    )
  }
}
