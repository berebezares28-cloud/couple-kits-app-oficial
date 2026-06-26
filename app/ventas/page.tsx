export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { formatearFechaInsumo, formatearMoneda } from '../../scr/lib/insumosUtils'
import { obtenerResumenVentasMes } from '../../scr/lib/resumenVentasMes'
import { supabase } from '../../scr/lib/supabase'

export default async function VentasMesPage() {
  const resumen = await obtenerResumenVentasMes(supabase)

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
          VENTAS
        </h1>

        <p
          className="mt-1 mb-8 capitalize"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#888'
          }}
        >
          {resumen.etiquetaMes}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="editorial-card text-center">
            <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 mb-1">
              Ventas
            </p>
            <p
              className="text-2xl font-semibold"
              style={{ color: '#c6302c' }}
            >
              {resumen.totalVentas}
            </p>
          </div>

          <div className="editorial-card text-center">
            <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 mb-1">
              Kits
            </p>
            <p className="text-2xl font-semibold">
              {resumen.totalKits}
            </p>
          </div>

          <div className="editorial-card text-center">
            <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 mb-1">
              Ingresos
            </p>
            <p
              className="text-lg font-semibold"
              style={{ color: '#389E0D' }}
            >
              {formatearMoneda(resumen.totalIngresos)}
            </p>
          </div>
        </div>

        {resumen.lineas.length === 0 ? (
          <div className="editorial-card text-center text-gray-500">
            No hay ventas registradas este mes
          </div>
        ) : (
          <div className="space-y-4">
            {resumen.lineas.map((venta) => (
              <Link
                key={`${venta.tipo}-${venta.id}`}
                href={venta.href}
                className="editorial-card block hover:-translate-y-[1px] transition"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold">
                      {venta.titulo}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {venta.subtitulo}
                    </p>
                  </div>

                  <span
                    className="text-xs px-2 py-1 rounded-full shrink-0"
                    style={{
                      background:
                        venta.tipo === 'bulk'
                          ? '#F0F5FF'
                          : '#F6FFED',
                      color:
                        venta.tipo === 'bulk'
                          ? '#1D39C4'
                          : '#389E0D'
                    }}
                  >
                    {venta.tipo === 'bulk'
                      ? 'Bulk'
                      : 'Pedido'}
                  </span>
                </div>

                <div className="mt-4 flex justify-between items-end text-sm">
                  <div className="text-gray-600 space-y-1">
                    <p>
                      📅 {formatearFechaInsumo(venta.fecha)}
                    </p>
                    <p>🎨 {venta.kits} kit(s)</p>
                  </div>

                  <p
                    className="font-semibold"
                    style={{ color: '#389E0D' }}
                  >
                    {formatearMoneda(venta.ingreso)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
