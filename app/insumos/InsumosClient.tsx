'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { etiquetaCategoria } from '../../scr/lib/insumosUtils'

type Insumo = {
  id: string
  nombre: string
  categoria: string
  stock_actual: number
  stock_minimo: number
}

export default function InsumosClient({
  insumosIniciales
}: {
  insumosIniciales: Insumo[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [insumos, setInsumos] =
    useState(insumosIniciales)
  const [soloCriticos, setSoloCriticos] =
    useState(false)
  const [busqueda, setBusqueda] = useState('')

  async function cargarInsumos() {
    const res = await fetch('/api/insumos/stock')

    if (!res.ok) return

    const data = await res.json()
    setInsumos(data)
  }

  useEffect(() => {
    if (pathname === '/insumos') {
      cargarInsumos()
    }
  }, [pathname])

  useEffect(() => {
    setSoloCriticos(
      searchParams.get('criticos') === '1'
    )
  }, [searchParams])

  const insumosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase()

    return insumos.filter((insumo) => {
      const esCritico =
        Number(insumo.stock_actual) <=
        Number(insumo.stock_minimo)

      const coincideBusqueda =
        insumo.nombre?.toLowerCase().includes(q) ||
        etiquetaCategoria(insumo.categoria)
          .toLowerCase()
          .includes(q)

      const coincideCritico = soloCriticos
        ? esCritico
        : true

      return coincideBusqueda && coincideCritico
    })
  }, [insumos, busqueda, soloCriticos])

  const insumosPorCategoria = useMemo(() => {
    const grupos = new Map<string, Insumo[]>()

    for (const insumo of insumosFiltrados) {
      const etiqueta = etiquetaCategoria(
        insumo.categoria
      )
      const lista = grupos.get(etiqueta) ?? []
      lista.push(insumo)
      grupos.set(etiqueta, lista)
    }

    return Array.from(grupos.entries()).sort(
      ([a], [b]) => a.localeCompare(b, 'es')
    )
  }, [insumosFiltrados])

  const criticos = insumos.filter(
    (i) =>
      Number(i.stock_actual) <=
      Number(i.stock_minimo)
  ).length

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">

        <h1
          className="editorial-title"
          style={{ color: '#c6302c' }}
        >
          INSUMOS
        </h1>

        <p
          className="mt-1 mb-6"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#888'
          }}
        >
          Inventario
        </p>

        <Link
          href="/insumos/compra"
          className="block w-full text-center rounded-xl py-3 mb-6 text-white font-semibold"
          style={{ background: '#c6302c' }}
        >
          + Registrar compra
        </Link>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="editorial-card">
            <p className="metric-label">Total</p>
            <h2 className="metric-value">
              {insumos.length}
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              setSoloCriticos((prev) => !prev)
            }
            className="editorial-card text-left hover:-translate-y-[1px] transition"
            style={{
              outline: soloCriticos
                ? '2px solid #c6302c'
                : undefined
            }}
          >
            <p className="metric-label">
              ⚠️ Críticos
            </p>
            <h2
              className="metric-value"
              style={{ color: '#c6302c' }}
            >
              {criticos}
            </h2>
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar insumo o categoría..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          className="w-full border rounded-xl px-4 py-3 mb-6"
        />

        <p className="text-sm text-gray-500 mb-6">
          {insumosFiltrados.length} insumos ·{' '}
          {insumosPorCategoria.length} categorías
        </p>

        {insumosPorCategoria.length ? (
          insumosPorCategoria.map(
            ([categoria, lista]) => (
              <section
                key={categoria}
                className="mb-8"
              >
                <h2 className="section-title text-xl mb-3">
                  {categoria}
                </h2>

                <div className="space-y-3">
                  {lista.map((insumo) => {
                    const esCritico =
                      Number(
                        insumo.stock_actual
                      ) <=
                      Number(insumo.stock_minimo)

                    return (
                      <Link
                        key={insumo.id}
                        href={`/insumos/${insumo.id}`}
                        className="editorial-card block hover:-translate-y-[1px] transition"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <p className="customer-name">
                            {insumo.nombre}
                          </p>

                          {esCritico && (
                            <span
                              className="shrink-0 px-2 py-1 text-xs rounded-full border"
                              style={{
                                background:
                                  '#FFF1F0',
                                color: '#CF1322',
                                borderColor:
                                  '#FFA39E'
                              }}
                            >
                              Crítico
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex justify-between text-sm text-gray-600">
                          <span>
                            Stock:{' '}
                            <strong
                              style={{
                                color:
                                  Number(
                                    insumo.stock_actual
                                  ) < 0
                                    ? '#CF1322'
                                    : undefined
                              }}
                            >
                              {
                                insumo.stock_actual
                              }
                            </strong>
                          </span>
                          <span>
                            Mín:{' '}
                            {insumo.stock_minimo}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )
          )
        ) : (
          <div className="editorial-card">
            No hay insumos con ese filtro
          </div>
        )}

      </div>
    </main>
  )
}
