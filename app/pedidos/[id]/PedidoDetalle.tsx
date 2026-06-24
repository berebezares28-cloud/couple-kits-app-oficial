'use client'

import Link from 'next/link'
import { useState } from 'react'

type Pedido = {
  id: string
  nombre: string
  instagram: string
  estatus: string
  fecha_entrega: string | null
  hora_entrega: string | null
  lugar_entrega: string | null
  metodo_pago: string | null
  ocasion: string | null
  semillas: string | null
  nota: string | null
}

type Kit = {
  nombre: string
  cantidad: number
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'Pendiente':
      return {
        background: '#FFF7E6',
        color: '#D48806',
        border: '#FFE58F'
      }

    case 'Entregado':
      return {
        background: '#F6FFED',
        color: '#389E0D',
        border: '#B7EB8F'
      }

    case 'Cancelado':
      return {
        background: '#FFF1F0',
        color: '#CF1322',
        border: '#FFA39E'
      }

    default:
      return {
        background: '#F5F5F5',
        color: '#595959',
        border: '#D9D9D9'
      }
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-4">
      {children}
    </p>
  )
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition'

export default function PedidoDetalle({
  pedido: pedidoInicial,
  kits
}: {
  pedido: Pedido
  kits: Kit[]
}) {
  const [pedido, setPedido] = useState(pedidoInicial)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{
    tipo: 'ok' | 'error'
    texto: string
  } | null>(null)

  const statusStyle = getStatusStyle(pedido.estatus)

  function actualizarCampo(
    campo: keyof Pedido,
    valor: string
  ) {
    setPedido((prev) => ({
      ...prev,
      [campo]: valor
    }))
    setMensaje(null)
  }

  async function guardarCambios() {
    setGuardando(true)
    setMensaje(null)

    const response = await fetch(
      `/api/pedidos/${pedido.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estatus: pedido.estatus,
          fecha_entrega: pedido.fecha_entrega || null,
          hora_entrega: pedido.hora_entrega || null,
          lugar_entrega: pedido.lugar_entrega || null,
          metodo_pago: pedido.metodo_pago || null,
          ocasion: pedido.ocasion || null,
          semillas: pedido.semillas || null,
          nota: pedido.nota || null
        })
      }
    )

    setGuardando(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setMensaje({
        tipo: 'error',
        texto:
          data.error ||
          'No se pudieron guardar los cambios'
      })
      return
    }

    setMensaje({
      tipo: 'ok',
      texto: 'Cambios guardados'
    })
  }

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="max-w-md mx-auto px-5 py-8">

        <Link
          href="/pedidos"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Pedidos
        </Link>

        <div className="mt-6 mb-8">

          <h1
            className="editorial-title"
            style={{ color: '#c6302c' }}
          >
            {pedido.nombre}
          </h1>

          <p className="mt-1" style={{ color: '#777' }}>
            @{pedido.instagram}
          </p>

        </div>

        <div className="editorial-card p-0 overflow-hidden">

          <section className="p-6">
            <SectionLabel>Estatus</SectionLabel>

            <select
              value={pedido.estatus}
              onChange={(e) =>
                actualizarCampo(
                  'estatus',
                  e.target.value
                )
              }
              className="text-sm border rounded-xl px-4 py-3 w-full font-medium"
              style={{
                background: statusStyle.background,
                color: statusStyle.color,
                borderColor: statusStyle.border
              }}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </section>

          <hr />

          <section className="p-6">
            <SectionLabel>Kits</SectionLabel>

            <div className="space-y-2">
              {kits.length > 0 ? (
                kits.map((kit) => (
                  <div
                    key={kit.nombre}
                    className="flex justify-between text-sm"
                  >
                    <span>{kit.nombre}</span>
                    <span className="text-gray-400">
                      x{kit.cantidad}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">
                  Sin kits asignados
                </p>
              )}
            </div>
          </section>

          <hr />

          <section className="p-6 space-y-4">
            <SectionLabel>Entrega</SectionLabel>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Fecha
              </label>
              <input
                type="date"
                value={pedido.fecha_entrega ?? ''}
                onChange={(e) =>
                  actualizarCampo(
                    'fecha_entrega',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Hora
              </label>
              <input
                type="text"
                placeholder="Ej. 6:00 PM"
                value={pedido.hora_entrega ?? ''}
                onChange={(e) =>
                  actualizarCampo(
                    'hora_entrega',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Lugar
              </label>
              <input
                type="text"
                placeholder="Lugar de entrega"
                value={pedido.lugar_entrega ?? ''}
                onChange={(e) =>
                  actualizarCampo(
                    'lugar_entrega',
                    e.target.value
                  )
                }
                className={inputClass}
              />
            </div>
          </section>

          <hr />

          <section className="p-6">
            <SectionLabel>Pago</SectionLabel>

            <input
              type="text"
              placeholder="Método de pago"
              value={pedido.metodo_pago ?? ''}
              onChange={(e) =>
                actualizarCampo(
                  'metodo_pago',
                  e.target.value
                )
              }
              className={inputClass}
            />
          </section>

          <hr />

          <section className="p-6">
            <SectionLabel>Ocasión</SectionLabel>

            <input
              type="text"
              placeholder="Ocasión"
              value={pedido.ocasion ?? ''}
              onChange={(e) =>
                actualizarCampo(
                  'ocasion',
                  e.target.value
                )
              }
              className={inputClass}
            />
          </section>

          <hr />

          <section className="p-6">
            <SectionLabel>Semillas</SectionLabel>

            <input
              type="text"
              placeholder="Semillas"
              value={pedido.semillas ?? ''}
              onChange={(e) =>
                actualizarCampo(
                  'semillas',
                  e.target.value
                )
              }
              className={inputClass}
            />
          </section>

          <hr />

          <section className="p-6">
            <SectionLabel>Nota</SectionLabel>

            <textarea
              rows={4}
              placeholder="Nota del pedido"
              value={pedido.nota ?? ''}
              onChange={(e) =>
                actualizarCampo(
                  'nota',
                  e.target.value
                )
              }
              className={`${inputClass} resize-y`}
            />
          </section>

          <hr />

          <section className="p-6">
            {mensaje && (
              <p
                className="text-sm mb-4 text-center"
                style={{
                  color:
                    mensaje.tipo === 'ok'
                      ? '#389E0D'
                      : '#CF1322'
                }}
              >
                {mensaje.texto}
              </p>
            )}

            <button
              type="button"
              onClick={guardarCambios}
              disabled={guardando}
              className="w-full rounded-xl py-3 text-white font-semibold transition disabled:opacity-50"
              style={{ background: '#c6302c' }}
            >
              {guardando
                ? 'Guardando...'
                : 'Guardar cambios'}
            </button>
          </section>

        </div>

      </div>
    </main>
  )
}
