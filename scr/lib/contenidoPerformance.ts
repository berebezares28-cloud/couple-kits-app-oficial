import {
  engagementScore,
  emojiFormato,
  esPublicado,
  FORMATOS_CONTENIDO,
  type FormatoContenido,
  type PublicacionContenido
} from './contenidoData'

export const META_REELS_MES = 5

export type FiltroFormatoInforme = FormatoContenido | 'todos'

export type ResumenPerformance = {
  publicados: number
  conMetricas: number
  promedioLikes: number | null
  promedioAlcance: number | null
  promedioComentarios: number | null
  promedioEngagement: number | null
  mejor: PublicacionContenido | null
  peor: PublicacionContenido | null
  ranking: PublicacionContenido[]
}

export type InformePerformanceData = {
  mes: ResumenPerformance
  historico: {
    mejor: PublicacionContenido | null
    totalPublicados: number
    ranking: PublicacionContenido[]
  }
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
]

export function etiquetaMes(anio: number, mes: number): string {
  return `${MESES[mes]} ${anio}`
}

export function prefijoMes(anio: number, mes: number): string {
  return `${anio}-${String(mes + 1).padStart(2, '0')}`
}

export function publicadosConMetricas(
  publicaciones: PublicacionContenido[],
  formato: FiltroFormatoInforme
): PublicacionContenido[] {
  return publicaciones.filter(
    (p) =>
      esPublicado(p.estado) &&
      (formato === 'todos' || p.formato === formato) &&
      tieneMetricas(p)
  )
}

function tieneMetricas(p: PublicacionContenido): boolean {
  return (
    p.likes != null ||
    p.alcance != null ||
    p.comentarios != null ||
    p.clics != null
  )
}

export function filtrarPublicadosMes(
  publicaciones: PublicacionContenido[],
  anio: number,
  mes: number,
  formato: FiltroFormatoInforme
): PublicacionContenido[] {
  const prefijo = prefijoMes(anio, mes)

  return publicaciones.filter(
    (p) =>
      esPublicado(p.estado) &&
      p.fecha.startsWith(prefijo) &&
      (formato === 'todos' || p.formato === formato)
  )
}

function promedio(
  valores: (number | null | undefined)[]
): number | null {
  const nums = valores.filter(
    (v): v is number => v != null && !Number.isNaN(v)
  )
  if (nums.length === 0) return null
  return Math.round(
    nums.reduce((s, n) => s + n, 0) / nums.length
  )
}

function ordenarPorEngagement(
  publicaciones: PublicacionContenido[]
): PublicacionContenido[] {
  return [...publicaciones].sort(
    (a, b) => engagementScore(b) - engagementScore(a)
  )
}

export function calcularResumenMes(
  publicaciones: PublicacionContenido[],
  anio: number,
  mes: number,
  formato: FiltroFormatoInforme
): ResumenPerformance {
  const delMes = filtrarPublicadosMes(
    publicaciones,
    anio,
    mes,
    formato
  )
  const conMetricas = delMes.filter(tieneMetricas)
  const ranking = ordenarPorEngagement(conMetricas)

  return {
    publicados: delMes.length,
    conMetricas: conMetricas.length,
    promedioLikes: promedio(conMetricas.map((p) => p.likes)),
    promedioAlcance: promedio(
      conMetricas.map((p) => p.alcance)
    ),
    promedioComentarios: promedio(
      conMetricas.map((p) => p.comentarios)
    ),
    promedioEngagement: promedio(
      conMetricas.map((p) => engagementScore(p))
    ),
    mejor: ranking[0] ?? null,
    peor:
      ranking.length > 1
        ? ranking[ranking.length - 1]
        : null,
    ranking
  }
}

export function calcularInformePerformance(
  publicaciones: PublicacionContenido[],
  anio: number,
  mes: number,
  formato: FiltroFormatoInforme
): InformePerformanceData {
  const mesResumen = calcularResumenMes(
    publicaciones,
    anio,
    mes,
    formato
  )

  const historicoPublicados = publicaciones.filter(
    (p) =>
      esPublicado(p.estado) &&
      (formato === 'todos' || p.formato === formato)
  )
  const historicoConMetricas =
    historicoPublicados.filter(tieneMetricas)
  const rankingHistorico = ordenarPorEngagement(
    historicoConMetricas
  )

  return {
    mes: mesResumen,
    historico: {
      mejor: rankingHistorico[0] ?? null,
      totalPublicados: historicoPublicados.length,
      ranking: rankingHistorico.slice(0, 5)
    }
  }
}

export function etiquetaFormatoInforme(
  formato: FiltroFormatoInforme
): string {
  if (formato === 'todos') return 'Todo el contenido'
  return (
    FORMATOS_CONTENIDO.find((f) => f.value === formato)
      ?.label ?? formato
  )
}

export function emojiFormatoInforme(
  formato: FiltroFormatoInforme
): string {
  if (formato === 'todos') return '📊'
  return emojiFormato(formato)
}

export function formatearMetrica(
  valor: number | null | undefined
): string {
  if (valor == null) return '—'
  if (valor >= 1_000_000) {
    return `${(valor / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (valor >= 1000) {
    return `${(valor / 1000).toFixed(1).replace(/\.0$/, '')}k`
  }
  return String(valor)
}

export function lineaMetricas(p: PublicacionContenido): string {
  const partes: string[] = []
  if (p.likes != null) partes.push(`♥ ${formatearMetrica(p.likes)}`)
  if (p.alcance != null) {
    partes.push(`👁 ${formatearMetrica(p.alcance)}`)
  }
  if (p.comentarios != null) {
    partes.push(`💬 ${formatearMetrica(p.comentarios)}`)
  }
  return partes.length > 0 ? partes.join(' · ') : 'Sin métricas'
}
