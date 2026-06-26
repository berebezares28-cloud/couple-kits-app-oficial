export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { listarInsumosConStock } from '../../../scr/lib/calcularStock'
import {
  etiquetaCategoria
} from '../../../scr/lib/insumosUtils'
import { supabase } from '../../../scr/lib/supabase'

export default async function InsumosCriticosPage() {
  const insumos = await listarInsumosConStock(supabase)

  const criticos = insumos
    .filter(
      (i) =>
        Number(i.stock_actual) <=
        Number(i.stock_minimo)
    )
    .sort((a, b) => {
      const diffA =
        Number(a.stock_actual) - Number(a.stock_minimo)
      const diffB =
        Number(b.stock_actual) - Number(b.stock_minimo)
      return diffA - diffB
    })

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Inicio
        </Link>

        <h1
          className="editorial-title mt-6"
          style={{ color: '#c6302c' }}
        >
          INSUMOS CRÍTICOS
        </h1>

        <p
          className="mt-1 mb-8"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#888'
          }}
        >
          Stock en o por debajo del mínimo
        </p>

        <div className="editorial-card mb-8 text-center">
          <p className="metric-label">Total críticos</p>
          <h2
            className="metric-value"
            style={{ color: '#c6302c' }}
          >
            {criticos.length}
          </h2>
        </div>

        <Link
          href="/insumos/compra"
          className="block w-full text-center rounded-xl py-3 mb-8 text-white font-semibold"
          style={{ background: '#c6302c' }}
        >
          + Registrar compra
        </Link>

        {criticos.length === 0 ? (
          <div className="editorial-card text-center text-gray-500">
            No hay insumos críticos en este momento
          </div>
        ) : (
          <div className="space-y-4">
            {criticos.map((insumo) => {
              const faltante = Math.max(
                0,
                Number(insumo.stock_minimo) -
                  Number(insumo.stock_actual)
              )

              return (
                <Link
                  key={insumo.id}
                  href={`/insumos/${insumo.id}`}
                  className="editorial-card block hover:-translate-y-[1px] transition"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold">
                        {insumo.nombre}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {etiquetaCategoria(
                          insumo.categoria
                        )}
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        background: '#FFF1F0',
                        color: '#CF1322'
                      }}
                    >
                      Crítico
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-gray-50 py-2">
                      <p className="text-gray-500">
                        Stock
                      </p>
                      <p className="font-semibold text-sm mt-1">
                        {insumo.stock_actual}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 py-2">
                      <p className="text-gray-500">
                        Mínimo
                      </p>
                      <p className="font-semibold text-sm mt-1">
                        {insumo.stock_minimo}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 py-2">
                      <p className="text-gray-500">
                        Faltante
                      </p>
                      <p
                        className="font-semibold text-sm mt-1"
                        style={{ color: '#CF1322' }}
                      >
                        {faltante}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
