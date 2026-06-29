'use client'

import { useMemo, useState } from 'react'
import {
  calcularInformePerformance,
  emojiFormatoInforme,
  etiquetaFormatoInforme,
  etiquetaMes,
  formatearMetrica,
  lineaMetricas,
  META_REELS_MES,
  type FiltroFormatoInforme
} from '../../scr/lib/contenidoPerformance'
import {
  emojiFormato,
  FORMATOS_CONTENIDO,
  type PublicacionContenido
} from '../../scr/lib/contenidoData'
import { formatearFechaInsumo } from '../../scr/lib/insumosUtils'

function TarjetaDestacada({
  titulo,
  emoji,
  pub,
  tono
}: {
  titulo: string
  emoji: string
  pub: PublicacionContenido | null
  tono: 'mejor' | 'peor'
}) {
  if (!pub) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400">
        {titulo}: sin datos
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border-2 px-4 py-3"
      style={{
        borderColor: tono === 'mejor' ? '#B7EB8F' : '#FFE58F',
        background: tono === 'mejor' ? '#F6FFED' : '#FFFBE6'
      }}
    >
      <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 mb-1">
        {emoji} {titulo}
      </p>
      <p className="text-sm font-semibold leading-snug">
        {emojiFormato(pub.formato)} {pub.titulo}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {formatearFechaInsumo(pub.fecha)}
      </p>
      <p className="text-xs font-medium mt-2 text-gray-700">
        {lineaMetricas(pub)}
      </p>
    </div>
  )
}

function FilaRanking({
  pub,
  posicion,
  onSeleccionar
}: {
  pub: PublicacionContenido
  posicion: number
  onSeleccionar?: (p: PublicacionContenido) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSeleccionar?.(pub)}
      className="w-full text-left rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition"
    >
      <div className="flex gap-2 items-start">
        <span className="text-sm font-bold text-gray-400 w-5 shrink-0">
          {posicion}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {emojiFormato(pub.formato)} {pub.titulo}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatearFechaInsumo(pub.fecha)} ·{' '}
            {lineaMetricas(pub)}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function InformePerformance({
  publicaciones,
  onSeleccionar
}: {
  publicaciones: PublicacionContenido[]
  onSeleccionar?: (pub: PublicacionContenido) => void
}) {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [formato, setFormato] =
    useState<FiltroFormatoInforme>('reel')

  const informe = useMemo(
    () =>
      calcularInformePerformance(
        publicaciones,
        anio,
        mes,
        formato
      ),
    [publicaciones, anio, mes, formato]
  )

  function mesAnterior() {
    if (mes === 0) {
      setMes(11)
      setAnio((a) => a - 1)
    } else {
      setMes((m) => m - 1)
    }
  }

  function mesSiguiente() {
    if (mes === 11) {
      setMes(0)
      setAnio((a) => a + 1)
    } else {
      setMes((m) => m + 1)
    }
  }

  const { mes: resumenMes, historico } = informe
  const esReel = formato === 'reel'

  return (
    <div className="space-y-4">
      <div className="editorial-card text-center">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gray-400 mb-1">
          Informe de performance
        </p>
        <p className="text-sm text-gray-600">
          Listo para screenshot ·{' '}
          {emojiFormatoInforme(formato)}{' '}
          {etiquetaFormatoInforme(formato)}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFormato('reel')}
          className="px-3 py-2 rounded-full text-sm border whitespace-nowrap"
          style={{
            background: formato === 'reel' ? '#111' : '#fff',
            color: formato === 'reel' ? '#fff' : '#111'
          }}
        >
          🎬 Reels
        </button>
        {FORMATOS_CONTENIDO.filter(
          (f) => f.value !== 'reel'
        ).map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFormato(f.value)}
            className="px-3 py-2 rounded-full text-sm border whitespace-nowrap"
            style={{
              background:
                formato === f.value ? '#111' : '#fff',
              color: formato === f.value ? '#fff' : '#111'
            }}
          >
            {f.emoji} {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFormato('todos')}
          className="px-3 py-2 rounded-full text-sm border whitespace-nowrap"
          style={{
            background:
              formato === 'todos' ? '#111' : '#fff',
            color: formato === 'todos' ? '#fff' : '#111'
          }}
        >
          Todos
        </button>
      </div>

      <div className="editorial-card">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={mesAnterior}
            className="w-9 h-9 rounded-lg border text-lg hover:bg-gray-50"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="font-semibold">
              {etiquetaMes(anio, mes)}
            </p>
            {esReel && (
              <p className="text-xs text-gray-500 mt-0.5">
                Meta: {META_REELS_MES} reels / mes
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={mesSiguiente}
            className="w-9 h-9 rounded-lg border text-lg hover:bg-gray-50"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gray-50 px-3 py-3 text-center">
            <p className="text-[0.6rem] uppercase tracking-wider text-gray-400">
              Publicados
            </p>
            <p className="text-xl font-bold mt-1">
              {resumenMes.publicados}
              {esReel ? ` / ${META_REELS_MES}` : ''}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-3 text-center">
            <p className="text-[0.6rem] uppercase tracking-wider text-gray-400">
              Con métricas
            </p>
            <p className="text-xl font-bold mt-1">
              {resumenMes.conMetricas}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-3 text-center">
            <p className="text-[0.6rem] uppercase tracking-wider text-gray-400">
              ♥ Promedio
            </p>
            <p className="text-lg font-bold mt-1">
              {formatearMetrica(resumenMes.promedioLikes)}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-3 text-center">
            <p className="text-[0.6rem] uppercase tracking-wider text-gray-400">
              👁 Promedio
            </p>
            <p className="text-lg font-bold mt-1">
              {formatearMetrica(resumenMes.promedioAlcance)}
            </p>
          </div>
        </div>

        {resumenMes.promedioComentarios != null && (
          <p className="text-xs text-center text-gray-500 mt-3">
            💬 Promedio comentarios:{' '}
            {formatearMetrica(resumenMes.promedioComentarios)}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <TarjetaDestacada
          titulo="Mejor del mes"
          emoji="🏆"
          pub={resumenMes.mejor}
          tono="mejor"
        />
        <TarjetaDestacada
          titulo="Menor del mes"
          emoji="📉"
          pub={resumenMes.peor}
          tono="peor"
        />
      </div>

      {resumenMes.ranking.length > 0 && (
        <div className="editorial-card">
          <h2 className="section-title text-base mb-3">
            Ranking del mes
          </h2>
          <div className="space-y-2">
            {resumenMes.ranking.map((p, i) => (
              <FilaRanking
                key={p.id}
                pub={p}
                posicion={i + 1}
                onSeleccionar={onSeleccionar}
              />
            ))}
          </div>
        </div>
      )}

      {resumenMes.publicados === 0 && (
        <div className="editorial-card text-center text-gray-400 py-6 text-sm">
          Sin publicaciones de este tipo en{' '}
          {etiquetaMes(anio, mes)}
        </div>
      )}

      <div className="editorial-card border-2 border-black">
        <h2 className="section-title text-base mb-1">
          Histórico
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          {historico.totalPublicados} publicados en total
        </p>

        {historico.mejor ? (
          <>
            <TarjetaDestacada
              titulo={`Mejor ${etiquetaFormatoInforme(formato).toLowerCase()} de siempre`}
              emoji="⭐"
              pub={historico.mejor}
              tono="mejor"
            />

            {historico.ranking.length > 1 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Top histórico
                </p>
                <div className="space-y-2">
                  {historico.ranking.map((p, i) => (
                    <FilaRanking
                      key={p.id}
                      pub={p}
                      posicion={i + 1}
                      onSeleccionar={onSeleccionar}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">
            Aún no hay métricas históricas para este
            formato
          </p>
        )}
      </div>
    </div>
  )
}
