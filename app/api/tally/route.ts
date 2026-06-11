import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getField(fields: any[], label: string) {
  return fields.find((f) => f.label === label)
}

function getDropdownText(field: any) {
  if (!field || !field.value || !field.options) return null

  const selectedId = Array.isArray(field.value)
    ? field.value[0]
    : field.value

  const option = field.options.find(
    (o: any) => o.id === selectedId
  )

  return option?.text ?? null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const fields = body.data.fields

    const submissionId = body.data.submissionId

    const nombre =
      getField(fields, 'Nombre')?.value ?? null

    const instagram =
      getField(fields, 'Instagram')?.value ?? null

    const ocasion = getDropdownText(
      getField(fields, '¿Para quién es el kit?')
    )

    const semillas = getDropdownText(
      getField(fields, 'Semillas')
    )

    const nota =
      getField(fields, 'Nota')?.value ?? null

    const lugarEntrega = getDropdownText(
      getField(fields, 'Lugar de entrega')
    )

    const fechaEntrega =
      getField(fields, 'Fecha de entrega')?.value ?? null

    const horaEntrega =
      getField(fields, 'Hora')?.value ?? null

    const { error } = await supabase
      .from('pedidos')
      .insert({
        tally_submission_id: submissionId,
        nombre,
        instagram,
        ocasion,
        semillas,
        nota,
        lugar_entrega: lugarEntrega,
        fecha_entrega: fechaEntrega,
        hora_entrega: horaEntrega,
        estatus: 'Pendiente'
      })

    if (error) {
      console.error('SUPABASE ERROR:', error)

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
      { error: 'Webhook failed' },
      { status: 500 }
    )
  }
}