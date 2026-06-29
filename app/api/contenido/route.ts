import {
  crearPublicacionContenido,
  listarPublicacionesContenido,
  type FormatoContenido
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
    const publicado = body.publicado !== false
    const formato = parseFormato(body.formato)

    const resultado = await crearPublicacionContenido(
      supabase,
      {
        fecha:
          body.fecha ||
          new Date().toISOString().split('T')[0],
        tipo,
        formato,
        publicado,
        plataforma: body.plataforma || 'Instagram',
        titulo: body.titulo.trim(),
        notas: body.notas?.trim() || null,
        alcance: publicado ? num(body.alcance) : null,
        likes: publicado ? num(body.likes) : null,
        comentarios: publicado
          ? num(body.comentarios)
          : null,
        clics: publicado ? num(body.clics) : null,
        ventas_atribuidas: publicado
          ? num(body.ventas_atribuidas)
          : null,
        monto_anuncio:
          publicado && tipo === 'anuncio_pagado'
            ? num(body.monto_anuncio)
            : null,
        url: publicado
          ? body.url?.trim() || null
          : null
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
