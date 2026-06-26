import {
  crearPublicacionContenido,
  listarPublicacionesContenido
} from '../../../scr/lib/contenidoData'
import { supabase } from '../../../scr/lib/supabase'

export async function GET() {
  try {
    const publicaciones =
      await listarPublicacionesContenido(supabase)

    return Response.json({ publicaciones })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error cargando contenido' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.titulo?.trim()) {
      return Response.json(
        { error: 'Escribe un título o descripción' },
        { status: 400 }
      )
    }

    const tipo =
      body.tipo === 'anuncio_pagado'
        ? 'anuncio_pagado'
        : 'organico'

    const resultado = await crearPublicacionContenido(
      supabase,
      {
        fecha:
          body.fecha ||
          new Date().toISOString().split('T')[0],
        tipo,
        plataforma: body.plataforma || 'Instagram',
        titulo: body.titulo.trim(),
        notas: body.notas?.trim() || null,
        alcance: num(body.alcance),
        likes: num(body.likes),
        comentarios: num(body.comentarios),
        clics: num(body.clics),
        ventas_atribuidas: num(body.ventas_atribuidas),
        monto_anuncio:
          tipo === 'anuncio_pagado'
            ? num(body.monto_anuncio)
            : null,
        url: body.url?.trim() || null
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
      { error: 'Error guardando' },
      { status: 500 }
    )
  }
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}
