import {
  crearPublicacionContenido,
  listarPublicacionesContenido,
  type EstadoContenido,
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
    const estado = parseEstado(body.estado)

    const resultado = await crearPublicacionContenido(
      supabase,
      {
        fecha:
          body.fecha ||
          new Date().toISOString().split('T')[0],
        tipo,
        formato: parseFormato(body.formato),
        estado,
        plataforma: body.plataforma || 'Instagram',
        titulo: body.titulo.trim(),
        notas: body.notas?.trim() || null,
        alcance: num(body.alcance),
        likes: num(body.likes),
        comentarios: num(body.comentarios),
        clics: num(body.clics),
        ventas_atribuidas: num(body.ventas_atribuidas),
        monto_anuncio: num(body.monto_anuncio),
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

function parseEstado(valor: unknown): EstadoContenido {
  const estados: EstadoContenido[] = [
    'publicado',
    'programado',
    'por_hacer',
    'por_programar'
  ]
  if (
    typeof valor === 'string' &&
    estados.includes(valor as EstadoContenido)
  ) {
    return valor as EstadoContenido
  }
  return 'por_hacer'
}
