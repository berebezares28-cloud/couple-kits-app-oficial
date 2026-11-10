import { createSupabaseAdmin } from '../../../scr/lib/supabase-admin'
import { firmaTallyValida } from '../../../scr/lib/tallySeguridad'
import { insertarPedidoKitsConSnapshot } from '../../../scr/lib/pedidoSnapshots'
import {
  buscarPuntoEntregaPorLugar,
  listarPuntosEntrega
} from '../../../scr/lib/puntosEntrega'
import { resolverKitsDesdeCamposTally, extraerCandidatosKit } from '../../../scr/lib/resolverKitsTally'

export const dynamic = 'force-dynamic'

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

function getMultiSelectTexts(field: any) {
  if (!field || !field.value || !field.options) {
    return []
  }

  const values = Array.isArray(field.value)
    ? field.value
    : [field.value]

  return field.options
    .filter((option: any) =>
      values.includes(option.id)
    )
    .map((option: any) => option.text)
}

export async function POST(req: Request) {
  const secret = process.env.TALLY_SIGNING_SECRET
  if (!secret) return Response.json({ error: 'Firma de webhook no configurada' }, { status: 503 })
  let body
  try { body = await req.json() } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }
  if (!firmaTallyValida(body, req.headers.get('tally-signature'), secret)) {
    return Response.json({ error: 'Firma inválida' }, { status: 401 })
  }
  if (!body?.data || !Array.isArray(body.data.fields) || typeof body.data.submissionId !== 'string' || !body.data.submissionId.trim()) {
    return Response.json({ error: 'Pedido inválido' }, { status: 400 })
  }
  const supabase = createSupabaseAdmin()
  if (!supabase) return Response.json({ error: 'Conexión no configurada' }, { status: 503 })
  try {
    const fields = body.data.fields

    const submissionId = body.data.submissionId

    const nombre =
      getField(fields, 'Nombre')?.value ?? null

    const instagram =
      getField(fields, 'Instagram')?.value ?? null

    const ocasion = getDropdownText(
      getField(fields, '¿Para quién es el kit?')
    )

    const semillasSeleccionadas = getMultiSelectTexts(
      getField(fields, 'Semillas')
    )
    const semillas =
      semillasSeleccionadas.length > 0
        ? semillasSeleccionadas.join(', ')
        : getDropdownText(getField(fields, 'Semillas'))

    const nota =
      getField(fields, 'Nota')?.value ?? null

    const lugarEntrega = getDropdownText(
      getField(fields, 'Lugar de entrega')
    )

    const fechaEntrega =
      getField(fields, 'Fecha de entrega')?.value ?? null

    const horaEntrega =
      getField(fields, 'Hora')?.value ?? null

    const puntosEntrega = await listarPuntosEntrega(supabase)
    const puntoLocal = buscarPuntoEntregaPorLugar(
      lugarEntrega,
      puntosEntrega
    )

    const { data: pedidoCreado, error } = await supabase
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
        punto_entrega_id: puntoLocal?.id ?? null,
        estatus: 'Pendiente'
      })
      .select()
      .single()

    if (error) {
      console.error('SUPABASE ERROR:', error)

      return Response.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const pedidoId = pedidoCreado.id

    const { data: kitsCatalogo, error: kitsError } =
      await supabase
        .from('kits')
        .select('id, nombre')
        .eq('activo', true)

    if (kitsError) {
      console.error(
        'Error cargando catálogo de kits:',
        kitsError
      )
    }

    const kitsParaInsertar = resolverKitsDesdeCamposTally(
      fields,
      kitsCatalogo ?? []
    )

    if (kitsParaInsertar.length === 0) {
      console.error(
        'No se encontraron kits en la respuesta de Tally',
        extraerCandidatosKit(fields)
      )
    }

    if (kitsParaInsertar.length > 0) {
      const resultado =
        await insertarPedidoKitsConSnapshot(
          supabase,
          pedidoId,
          kitsParaInsertar
        )

      if (!resultado.ok) {
        console.error(
          'Error insertando pedido_kits:',
          resultado.error
        )
      }
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
