import {
  actualizarPublicacionContenido,
  eliminarPublicacionContenido,
  type FormatoContenido
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

    const publicado =
      body.publicado === true
        ? true
        : body.publicado === false
          ? false
          : undefined

    const formato =
      body.formato != null
        ? parseFormato(body.formato)
        : undefined

    const resultado = await actualizarPublicacionContenido(
      supabase,
      params.id,
      {
        ...(body.fecha && { fecha: body.fecha }),
        ...(tipo && { tipo }),
        ...(formato && { formato }),
        ...(publicado !== undefined && { publicado }),
        ...(body.plataforma && {
          plataforma: body.plataforma
        }),
        ...(body.titulo && {
          titulo: body.titulo.trim()
        }),
        ...(body.notas !== undefined && {
          notas: body.notas?.trim() || null
        }),
        ...(publicado === false && {
          alcance: null,
          likes: null,
          comentarios: null,
          clics: null,
          ventas_atribuidas: null,
          monto_anuncio: null,
          url: null
        }),
        ...(publicado !== false &&
          body.alcance !== undefined && {
            alcance: num(body.alcance)
          }),
        ...(publicado !== false &&
          body.likes !== undefined && {
            likes: num(body.likes)
          }),
        ...(publicado !== false &&
          body.comentarios !== undefined && {
            comentarios: num(body.comentarios)
          }),
        ...(publicado !== false &&
          body.clics !== undefined && {
            clics: num(body.clics)
          }),
        ...(publicado !== false &&
          body.ventas_atribuidas !== undefined && {
            ventas_atribuidas: num(body.ventas_atribuidas)
          }),
        ...(publicado !== false &&
          body.monto_anuncio !== undefined && {
            monto_anuncio: num(body.monto_anuncio)
          }),
        ...(publicado !== false &&
          body.url !== undefined && {
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

function parseFormato(valor: unknown): FormatoContenido {
  const formatos: FormatoContenido[] = [
    'reel',
    'carrusel',
    'foto',
    'story',
    'otro'
  ]
  if (
    typeof valor === 'string' &&
    formatos.includes(valor as FormatoContenido)
  ) {
    return valor as FormatoContenido
  }
  return 'reel'
}
