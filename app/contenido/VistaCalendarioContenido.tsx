'use client'

import { useState } from 'react'
import CalendarioContenido from './CalendarioContenido'
import CalendarioFeedGrid from './CalendarioFeedGrid'
import type { PublicacionContenido } from '../../scr/lib/contenidoData'

type ModoCalendario = 'mes' | 'grid'

export default function VistaCalendarioContenido({
  publicaciones,
  onSeleccionar
}: {
  publicaciones: PublicacionContenido[]
  onSeleccionar?: (pub: PublicacionContenido) => void
}) {
  const [modo, setModo] =
    useState<ModoCalendario>('mes')

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(
          [
            ['mes', 'Calendario'],
            ['grid', 'Feed']
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setModo(id)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold border transition"
            style={{
              background: modo === id ? '#111' : '#fff',
              color: modo === id ? '#fff' : '#111'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {modo === 'mes' ? (
        <CalendarioContenido
          publicaciones={publicaciones}
          onSeleccionar={onSeleccionar}
        />
      ) : (
        <CalendarioFeedGrid
          publicaciones={publicaciones}
          onSeleccionar={onSeleccionar}
        />
      )}
    </div>
  )
}
