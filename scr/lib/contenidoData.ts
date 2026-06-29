import { SupabaseClient } from '@supabase/supabase-js'

export type TipoContenido = 'organico' | 'anuncio_pagado'

export type FormatoContenido =
  | 'reel'
  | 'carrusel'
  | 'foto'
  | 'story'
  | 'otro'

export type EstadoContenido =
  | 'publicado'
  | 'programado'
  | 'por_hacer'
  | 'por_programar'

export type PublicacionContenido = {
  id: string
  fecha: string
  tipo: TipoContenido
  formato: FormatoContenido
  estado: EstadoContenido
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

export const ESTADOS_CONTENIDO = [
  {
    value: 'por_hacer',
    label: 'Por hacer',
    color: '#595959',
    bg: '#F5F5F5'
  },
  {
    value: 'por_programar',
    label: 'Por programar',
    color: '#874D00',
    bg: '#FFF7E6'
  },
  {
    value: 'programado',
    label: 'Programado',
    color: '#1D39C4',
    bg: '#F0F5FF'
  },
  {
    value: 'publicado',
    label: 'Publicado',
    color: '#389E0D',
    bg: '#F6FFED'
  }
] as const

export const TIPOS_CONTENIDO = [
  { value: 'organico', label: 'Orgánico' },
  { value: 'anuncio_pagado', label: 'Anuncio pagado' }
] as const

export const FORMATOS_CONTENIDO = [
  { value: 'reel', label: 'Reel', emoji: '🎬' },
  { value: 'carrusel', label: 'Carrusel', emoji: '🖼️' },
  { value: 'foto', label: 'Foto', emoji: '📷' },
  { value: 'story', label: 'Story', emoji: '⭕' },
  { value: 'otro', label: 'Otro', emoji: '📝' }
] as const

export const PLATAFORMAS_CONTENIDO = [
  'Instagram',
  'TikTok',
  'Facebook',
  'Otro'
] as const

export function emojiFormato(
  formato: FormatoContenido
): string {
  return (
    FORMATOS_CONTENIDO.find((f) => f.value === formato)
      ?.emoji ?? '📝'
  )
}

export function etiquetaEstado(
  estado: EstadoContenido
): string {
  return (
    ESTADOS_CONTENIDO.find((e) => e.value === estado)
      ?.label ?? estado
  )
}

export function estiloEstado(estado: EstadoContenido) {
  const item = ESTADOS_CONTENIDO.find(
    (e) => e.value === estado
  )
  return {
    color: item?.color ?? '#595959',
    background: item?.bg ?? '#F5F5F5'
  }
}

export function esPublicado(
  estado: EstadoContenido
): boolean {
  return estado === 'publicado'
}

export function opacidadCalendario(
  estado: EstadoContenido
): number {
  switch (estado) {
    case 'publicado':
      return 1
    case 'programado':
      return 0.8
    case 'por_programar':
      return 0.55
    case 'por_hacer':
      return 0.4
    default:
      return 1
  }
}

function parseFormato(
  valor: unknown
): FormatoContenido {
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

function mapPublicacion(row: Record<string, unknown>): PublicacionContenido {
  const estado = row.estado
    ? parseEstado(row.estado)
    : row.publicado !== false
      ? 'publicado'
      : 'programado'

  return {
    id: String(row.id),
    fecha: String(row.fecha).slice(0, 10),
    tipo: row.tipo as TipoContenido,
    formato: parseFormato(row.formato),
    estado,
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

function limpiarMetricasSiNoPublicado<
  T extends { estado: EstadoContenido }
>(params: T & {
  alcance?: number | null
  likes?: number | null
  comentarios?: number | null
  clics?: number | null
  ventas_atribuidas?: number | null
  monto_anuncio?: number | null
  url?: string | null
  tipo?: TipoContenido
}) {
  if (params.estado !== 'publicado') {
    return {
      ...params,
      alcance: null,
      likes: null,
      comentarios: null,
      clics: null,
      ventas_atribuidas: null,
      monto_anuncio: null,
      url: null
    }
  }

  if (params.tipo !== 'anuncio_pagado') {
    return { ...params, monto_anuncio: null }
  }

  return params
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
    formato?: FormatoContenido
    estado?: EstadoContenido
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
  const estado = params.estado ?? 'por_hacer'
  const datos = limpiarMetricasSiNoPublicado({
    fecha: params.fecha,
    tipo: params.tipo,
    formato: params.formato ?? 'reel',
    estado,
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

  const { data, error } = await supabase
    .from('contenido_publicaciones')
    .insert({
      ...datos,
      publicado: estado === 'publicado'
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
    formato: FormatoContenido
    estado: EstadoContenido
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
  const updateParams =
    params.estado && params.estado !== 'publicado'
      ? limpiarMetricasSiNoPublicado({
          ...params,
          estado: params.estado,
          tipo: params.tipo
        })
      : params

  const payload = {
    ...updateParams,
    ...(updateParams.estado !== undefined && {
      publicado: updateParams.estado === 'publicado'
    })
  }

  const { data, error } = await supabase
    .from('contenido_publicaciones')
    .update(payload)
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
  if (!esPublicado(p.estado)) return 0

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
  const porEstado = {
    por_hacer: 0,
    por_programar: 0,
    programado: 0,
    publicado: 0
  }

  for (const p of publicaciones) {
    porEstado[p.estado]++
  }

  const publicadas = publicaciones.filter((p) =>
    esPublicado(p.estado)
  )
  const organicos = publicadas.filter(
    (p) => p.tipo === 'organico'
  )
  const anuncios = publicadas.filter(
    (p) => p.tipo === 'anuncio_pagado'
  )

  const topPorEngagement = [...publicadas]
    .sort(
      (a, b) =>
        engagementScore(b) - engagementScore(a)
    )
    .slice(0, 5)

  const gastoAnuncios = anuncios.reduce(
    (s, p) => s + (p.monto_anuncio ?? 0),
    0
  )

  const ventasAtribuidas = publicadas.reduce(
    (s, p) => s + (p.ventas_atribuidas ?? 0),
    0
  )

  return {
    total: publicaciones.length,
    porHacer: porEstado.por_hacer,
    porProgramar: porEstado.por_programar,
    programadas: porEstado.programado,
    publicadas: porEstado.publicado,
    organicos: organicos.length,
    anuncios: anuncios.length,
    gastoAnuncios,
    ventasAtribuidas,
    topPorEngagement
  }
}

export function agruparPorFecha(
  publicaciones: PublicacionContenido[]
): Map<string, PublicacionContenido[]> {
  const mapa = new Map<string, PublicacionContenido[]>()

  for (const pub of publicaciones) {
    const lista = mapa.get(pub.fecha) ?? []
    lista.push(pub)
    mapa.set(pub.fecha, lista)
  }

  return mapa
}

export function etiquetaFechaPorEstado(
  estado: EstadoContenido
): string {
  switch (estado) {
    case 'publicado':
      return 'Fecha de publicación'
    case 'programado':
      return 'Fecha programada'
    case 'por_programar':
      return 'Fecha tentativa'
    case 'por_hacer':
      return 'Fecha (opcional)'
    default:
      return 'Fecha'
  }
}
