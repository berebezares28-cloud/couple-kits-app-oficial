'use client'

import { useMemo } from 'react'
import {
  emojiFormato,
  estiloEstado,
  etiquetaEstado,
  type PublicacionContenido
} from '../../scr/lib/contenidoData'
import { formatearFechaInsumo } from '../../scr/lib/insumosUtils'

export default function CalendarioFeedGrid({
  publicaciones,
  onSeleccionar
}: {
  publicaciones: PublicacionContenido[]
  onSeleccionar?: (pub: PublicacionContenido) => void
}) {
  const ordenadas = useMemo(() => {
    return [...publicaciones].sort((a, b) => {
      const cmpFecha = b.fecha.localeCompare(a.fecha)
      if (cmpFecha !== 0) return cmpFecha
      return b.created_at.localeCompare(a.created_at)
    })
  }, [publicaciones])

  if (ordenadas.length === 0) {
    return (
      <div className="editorial-card text-center text-gray-400 py-10">
        Sin publicaciones para mostrar
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 text-center">
        {ordenadas.length} publicación
        {ordenadas.length === 1 ? '' : 'es'} · más recientes
        primero
      </p>

      <div className="grid grid-cols-3 gap-1">
        {ordenadas.map((p) => {
          const estilo = estiloEstado(p.estado)
          const esHit = (p.likes ?? 0) > 1000

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSeleccionar?.(p)}
              className="relative aspect-square rounded-sm border border-gray-200 p-2 flex flex-col items-center text-center overflow-hidden active:scale-[0.98] transition"
              style={{
                background: esHit ? '#F3EBFA' : '#fff'
              }}
            >
              {p.likes != null && (
                <span className="absolute top-1 right-1.5 text-[0.45rem] text-gray-400 leading-none flex items-center gap-0.5">
                  <span className="text-[0.55rem] leading-none">
                    ♥
                  </span>
                  <span>{p.likes}</span>
                </span>
              )}
              <div className="flex-1 flex flex-col items-center justify-center gap-1.5 w-full min-h-0">
                <span className="text-2xl leading-none shrink-0">
                  {emojiFormato(p.formato)}
                </span>
                <p className="text-[0.55rem] font-medium text-gray-800 leading-tight line-clamp-3 w-full px-0.5">
                  {p.titulo}
                </p>
              </div>

              <div className="w-full shrink-0 flex flex-col items-center gap-0.5 pt-1 border-t border-gray-100">
                <p className="text-[0.55rem] font-semibold text-gray-500 leading-tight text-center">
                  {formatearFechaInsumo(p.fecha)}
                </p>
                <span
                  className="text-[0.45rem] uppercase tracking-wide font-semibold px-1 py-0.5 rounded text-center max-w-full truncate"
                  style={{
                    background: estilo.background,
                    color: estilo.color
                  }}
                >
                  {etiquetaEstado(p.estado)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
