import { SupabaseClient } from '@supabase/supabase-js'

export type TipoContenido = 'organico' | 'anuncio_pagado'

export type PublicacionContenido = {
  id: string
  fecha: string
  tipo: TipoContenido
  plataforma: string
  titulo: string
  notas: string | null
  alcance: number | null
  likes: number | null
  comentarios: number | null
  clics: number | null
  ventas_atribuidas: number | null
  monto_anuncio: number | null
  url: string | null
  created_at: string
}

export const TIPOS_CONTENIDO = [
  { value: 'organico', label: 'Contenido publicado' },
  { value: 'anuncio_pagado', label: 'Anuncio pagado' }
] as const

export const PLATAFORMAS_CONTENIDO = [
  'Instagram',
  'TikTok',
  'Facebook',
  'Otro'
] as const

function mapPublicacion(row: Record<string, unknown>): PublicacionContenido {
  return {
    id: String(row.id),
    fecha: String(row.fecha).slice(0, 10),
    tipo: row.tipo as TipoContenido,
    plataforma: String(row.plataforma ?? 'instagram'),
    titulo: String(row.titulo ?? ''),
    notas: row.notas != null ? String(row.notas) : null,
    alcance: row.alcance != null ? Number(row.alcance) : null,
    likes: row.likes != null ? Number(row.likes) : null,
    comentarios:
      row.comentarios != null
        ? Number(row.comentarios)
        : null,
    clics: row.clics != null ? Number(row.clics) : null,
    ventas_atribuidas:
      row.ventas_atribuidas != null
        ? Number(row.ventas_atribuidas)
        : null,
    monto_anuncio:
      row.monto_anuncio != null
        ? Number(row.monto_anuncio)
        : null,
    url: row.url != null ? String(row.url) : null,
    created_at: String(row.created_at ?? '')
  }
}

export async function listarPublicacionesContenido(
  supabase: SupabaseClient
): Promise<PublicacionContenido[]> {
  const { data, error } = await supabase
    .from('contenido_publicaciones')
    .select('*')
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(mapPublicacion)
}

export async function crearPublicacionContenido(
  supabase: SupabaseClient,
  params: {
    fecha: string
    tipo: TipoContenido
    plataforma: string
    titulo: string
    notas?: string | null
    alcance?: number | null
    likes?: number | null
    comentarios?: number | null
    clics?: number | null
    ventas_atribuidas?: number | null
    monto_anuncio?: number | null
    url?: string | null
  }
): Promise<
  | { ok: true; publicacion: PublicacionContenido }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from('contenido_publicaciones')
    .insert({
      fecha: params.fecha,
      tipo: params.tipo,
      plataforma: params.plataforma.trim(),
      titulo: params.titulo.trim(),
      notas: params.notas?.trim() || null,
      alcance: params.alcance ?? null,
      likes: params.likes ?? null,
      comentarios: params.comentarios ?? null,
      clics: params.clics ?? null,
      ventas_atribuidas: params.ventas_atribuidas ?? null,
      monto_anuncio: params.monto_anuncio ?? null,
      url: params.url?.trim() || null
    })
    .select('*')
    .single()

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'No se pudo guardar'
    }
  }

  return { ok: true, publicacion: mapPublicacion(data) }
}

export async function actualizarPublicacionContenido(
  supabase: SupabaseClient,
  id: string,
  params: Partial<{
    fecha: string
    tipo: TipoContenido
    plataforma: string
    titulo: string
    notas: string | null
    alcance: number | null
    likes: number | null
    comentarios: number | null
    clics: number | null
    ventas_atribuidas: number | null
    monto_anuncio: number | null
    url: string | null
  }>
): Promise<
  | { ok: true; publicacion: PublicacionContenido }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from('contenido_publicaciones')
    .update(params)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? 'No se pudo actualizar'
    }
  }

  return { ok: true, publicacion: mapPublicacion(data) }
}

export async function eliminarPublicacionContenido(
  supabase: SupabaseClient,
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from('contenido_publicaciones')
    .delete()
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

export function engagementScore(p: PublicacionContenido): number {
  return (
    (p.alcance ?? 0) +
    (p.likes ?? 0) * 2 +
    (p.comentarios ?? 0) * 3 +
    (p.clics ?? 0) * 4 +
    (p.ventas_atribuidas ?? 0) * 10
  )
}

export function resumenContenido(
  publicaciones: PublicacionContenido[]
) {
  const organicos = publicaciones.filter(
    (p) => p.tipo === 'organico'
  )
  const anuncios = publicaciones.filter(
    (p) => p.tipo === 'anuncio_pagado'
  )

  const topPorEngagement = [...publicaciones]
    .sort(
      (a, b) =>
        engagementScore(b) - engagementScore(a)
    )
    .slice(0, 5)

  const gastoAnuncios = anuncios.reduce(
    (s, p) => s + (p.monto_anuncio ?? 0),
    0
  )

  const ventasAtribuidas = publicaciones.reduce(
    (s, p) => s + (p.ventas_atribuidas ?? 0),
    0
  )

  return {
    total: publicaciones.length,
    organicos: organicos.length,
    anuncios: anuncios.length,
    gastoAnuncios,
    ventasAtribuidas,
    topPorEngagement
  }
}
