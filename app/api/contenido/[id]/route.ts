import {
  actualizarPublicacionContenido,
  eliminarPublicacionContenido
} from '../../../../scr/lib/contenidoData'
import { supabase } from '../../../../scr/lib/supabase'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const tipo =
      body.tipo === 'anuncio_pagado'
        ? 'anuncio_pagado'
        : body.tipo === 'organico'
          ? 'organico'
          : undefined

    const resultado = await actualizarPublicacionContenido(
      supabase,
      params.id,
      {
        ...(body.fecha && { fecha: body.fecha }),
        ...(tipo && { tipo }),
        ...(body.plataforma && {
          plataforma: body.plataforma
        }),
        ...(body.titulo && {
          titulo: body.titulo.trim()
        }),
        ...(body.notas !== undefined && {
          notas: body.notas?.trim() || null
        }),
        ...(body.alcance !== undefined && {
          alcance: num(body.alcance)
        }),
        ...(body.likes !== undefined && {
          likes: num(body.likes)
        }),
        ...(body.comentarios !== undefined && {
          comentarios: num(body.comentarios)
        }),
        ...(body.clics !== undefined && {
          clics: num(body.clics)
        }),
        ...(body.ventas_atribuidas !== undefined && {
          ventas_atribuidas: num(body.ventas_atribuidas)
        }),
        ...(body.monto_anuncio !== undefined && {
          monto_anuncio: num(body.monto_anuncio)
        }),
        ...(body.url !== undefined && {
          url: body.url?.trim() || null
        })
      }
    )

    if (!resultado.ok) {
      return Response.json(
        { error: resultado.error },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      publicacion: resultado.publicacion
    })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error actualizando' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resultado =
      await eliminarPublicacionContenido(
        supabase,
        params.id
      )

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
      { error: 'Error eliminando' },
      { status: 500 }
    )
  }
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}
