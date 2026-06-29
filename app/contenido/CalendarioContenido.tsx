'use client'

import { useMemo, useState } from 'react'
import {
  agruparPorFecha,
  emojiFormato,
  etiquetaEstado,
  FORMATOS_CONTENIDO,
  opacidadCalendario,
  type PublicacionContenido
} from '../../scr/lib/contenidoData'

const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

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

function fechaHoy(): string {
  return new Date().toISOString().split('T')[0]
}

function celdasDelMes(anio: number, mes: number) {
  const primerDia = new Date(anio, mes, 1)
  const ultimoDia = new Date(anio, mes + 1, 0)
  const offset = (primerDia.getDay() + 6) % 7
  const celdas: Array<{
    fecha: string | null
    dia: number | null
  }> = []

  for (let i = 0; i < offset; i++) {
    celdas.push({ fecha: null, dia: null })
  }

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    celdas.push({ fecha, dia })
  }

  while (celdas.length % 7 !== 0) {
    celdas.push({ fecha: null, dia: null })
  }

  return celdas
}

export default function CalendarioContenido({
  publicaciones,
  onSeleccionar
}: {
  publicaciones: PublicacionContenido[]
  onSeleccionar?: (pub: PublicacionContenido) => void
}) {
  const hoy = fechaHoy()
  const [anio, setAnio] = useState(
    () => new Date().getFullYear()
  )
  const [mes, setMes] = useState(
    () => new Date().getMonth()
  )
  const [diaSeleccionado, setDiaSeleccionado] =
    useState<string | null>(null)

  const porFecha = useMemo(
    () => agruparPorFecha(publicaciones),
    [publicaciones]
  )

  const celdas = useMemo(
    () => celdasDelMes(anio, mes),
    [anio, mes]
  )

  const postsDelDia = diaSeleccionado
    ? porFecha.get(diaSeleccionado) ?? []
    : []

  function mesAnterior() {
    if (mes === 0) {
      setMes(11)
      setAnio((a) => a - 1)
    } else {
      setMes((m) => m - 1)
    }
    setDiaSeleccionado(null)
  }

  function mesSiguiente() {
    if (mes === 11) {
      setMes(0)
      setAnio((a) => a + 1)
    } else {
      setMes((m) => m + 1)
    }
    setDiaSeleccionado(null)
  }

  const postsEnMes = publicaciones.filter((p) =>
    p.fecha.startsWith(
      `${anio}-${String(mes + 1).padStart(2, '0')}`
    )
  ).length

  return (
    <div className="space-y-4">
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
              {MESES[mes]} {anio}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {postsEnMes} post
              {postsEnMes === 1 ? '' : 's'} este mes
            </p>
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

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="text-center text-[0.65rem] text-gray-400 font-medium py-1"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celdas.map((celda, i) => {
            if (!celda.fecha || celda.dia == null) {
              return (
                <div
                  key={`empty-${i}`}
                  className="aspect-square"
                />
              )
            }

            const posts =
              porFecha.get(celda.fecha) ?? []
            const esHoy = celda.fecha === hoy
            const seleccionado =
              diaSeleccionado === celda.fecha

            return (
              <button
                key={celda.fecha}
                type="button"
                onClick={() =>
                  setDiaSeleccionado(
                    seleccionado ? null : celda.fecha
                  )
                }
                className="aspect-square rounded-lg border text-left p-1 flex flex-col transition"
                style={{
                  borderColor: seleccionado
                    ? '#c6302c'
                    : esHoy
                      ? '#111'
                      : '#eee',
                  background: seleccionado
                    ? '#FFF5F5'
                    : posts.length > 0
                      ? '#fafafa'
                      : '#fff'
                }}
              >
                <span
                  className="text-[0.65rem] font-medium leading-none"
                  style={{
                    color: esHoy ? '#c6302c' : '#666'
                  }}
                >
                  {celda.dia}
                </span>
                <div className="flex flex-wrap gap-0.5 mt-auto justify-center">
                  {posts.slice(0, 4).map((p) => (
                    <span
                      key={p.id}
                      className="text-sm leading-none"
                      style={{
                        opacity: opacidadCalendario(p.estado)
                      }}
                      title={`${etiquetaEstado(p.estado)}: ${p.titulo}`}
                    >
                      {emojiFormato(p.formato)}
                    </span>
                  ))}
                  {posts.length > 4 && (
                    <span className="text-[0.55rem] text-gray-400">
                      +{posts.length - 4}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t flex flex-wrap gap-3 text-xs text-gray-500">
          {FORMATOS_CONTENIDO.filter((f) =>
            ['reel', 'carrusel'].includes(f.value)
          ).map((f) => (
            <span key={f.value}>
              {f.emoji} {f.label}
            </span>
          ))}
          <span className="text-gray-300">·</span>
          <span>
            <span style={{ opacity: 0.4 }}>🎬</span> por hacer
          </span>
          <span>
            <span style={{ opacity: 0.55 }}>🎬</span> por
            programar
          </span>
          <span>
            <span style={{ opacity: 0.8 }}>🎬</span> programado
          </span>
          <span>
            <span>🎬</span> publicado
          </span>
        </div>
      </div>

      {diaSeleccionado && (
        <div className="editorial-card">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            {new Date(
              `${diaSeleccionado}T12:00:00`
            ).toLocaleDateString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </p>

          {postsDelDia.length === 0 ? (
            <p className="text-sm text-gray-400">
              Sin posts este día
            </p>
          ) : (
            <div className="space-y-2">
              {postsDelDia.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSeleccionar?.(p)}
                  className="w-full text-left rounded-lg border px-3 py-2 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {emojiFormato(p.formato)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {p.titulo}
                      </p>
                      <p className="text-xs text-gray-400">
                        {etiquetaEstado(p.estado)} ·{' '}
                        {p.plataforma}
                        {p.tipo === 'anuncio_pagado'
                          ? ' · Anuncio'
                          : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
