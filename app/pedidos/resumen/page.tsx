import Link from 'next/link'
import { supabase } from '../../../scr/lib/supabase'
import { obtenerResumenPedidos, type ResumenLugar } from '../../../scr/lib/resumenPedidos'

export const dynamic = 'force-dynamic'

function fechaHoy() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date())
}

export default async function ResumenPedidosPage({
  searchParams
}: {
  searchParams: { fecha?: string | string[] }
}) {
  const fecha = typeof searchParams.fecha === 'string' ? searchParams.fecha : fechaHoy()
  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
    !Number.isNaN(Date.parse(fecha)) &&
    new Date(fecha).toISOString().slice(0, 10) === fecha
  let grupos: ResumenLugar[] = []
  let error = fechaValida ? '' : 'Selecciona una fecha válida.'

  if (fechaValida) {
    try {
      grupos = await obtenerResumenPedidos(supabase, fecha)
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo cargar el resumen.'
    }
  }

  const totalKits = grupos.reduce((total, grupo) => total + grupo.cantidad, 0)
  const totalPedidos = grupos.reduce((total, grupo) => total + grupo.pedidos, 0)

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pt-8 pb-24">
        <Link href="/" className="text-sm text-gray-500 hover:text-black">← Inicio</Link>
        <h1 className="editorial-title mt-6" style={{ color: '#c6302c', fontSize: '2.5rem' }}>
          RESUMEN DE PEDIDOS
        </h1>
        <p className="text-sm text-gray-500 mt-3 mb-6">
          Pedidos pendientes y confirmados, agrupados por lugar de entrega.
        </p>

        <form action="/pedidos/resumen" method="get" className="editorial-card mb-6">
          <label htmlFor="fecha-entrega" className="block text-sm font-semibold mb-2">
            Fecha de entrega
          </label>
          <input id="fecha-entrega" name="fecha" type="date" required
            defaultValue={fechaValida ? fecha : ''}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
          <button type="submit" className="w-full mt-3 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-[#c6302c]">
            Ver resumen
          </button>
        </form>

        {error ? <p role="alert" className="editorial-card text-red-700">{error}</p> : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="editorial-card">
                <p className="metric-label">Kits por preparar</p>
                <p className="metric-value" style={{ color: '#c6302c' }}>{totalKits}</p>
              </div>
              <div className="editorial-card">
                <p className="metric-label">Pedidos</p>
                <p className="metric-value">{totalPedidos}</p>
              </div>
            </div>

            {grupos.length === 0 && (
              <p className="editorial-card text-sm text-gray-500">
                No hay pedidos pendientes ni confirmados para esta fecha.
              </p>
            )}

            {grupos.map((grupo) => (
              <section key={grupo.lugar} className="editorial-card mb-5" aria-label={grupo.lugar}>
                <h2 className="customer-name">📍 {grupo.lugar}</h2>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  {grupo.pedidos} {grupo.pedidos === 1 ? 'pedido' : 'pedidos'} · {grupo.cantidad} {grupo.cantidad === 1 ? 'kit' : 'kits'}
                </p>
                <ul className="divide-y divide-gray-100">
                  {grupo.kits.map((kit) => (
                    <li key={kit.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="text-sm font-medium">{kit.nombre}</span>
                      <span className="shrink-0 rounded-lg bg-[#FFF1F0] text-[#c6302c] px-3 py-1 text-sm font-bold">
                        × {kit.cantidad}
                      </span>
                    </li>
                  ))}
                </ul>
                {grupo.sinKits > 0 && (
                  <p className="mt-3 text-sm text-amber-700">
                    {grupo.sinKits} {grupo.sinKits === 1 ? 'pedido sin kits asignados' : 'pedidos sin kits asignados'}.
                  </p>
                )}
              </section>
            ))}
          </>
        )}
      </div>
    </main>
  )
}
