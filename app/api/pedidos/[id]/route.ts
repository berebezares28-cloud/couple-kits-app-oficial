import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const { error } = await supabase
      .from('pedidos')
      .update({
        estatus: body.estatus,
        fecha_entrega: body.fecha_entrega,
        hora_entrega: body.hora_entrega
      })
      .eq('id', params.id)

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return Response.json({
      success: true
    })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'Error actualizando pedido' },
      { status: 500 }
    )
  }
}