import Link from 'next/link'
import { obtenerDisponibilidadFiguras, type DisponibilidadFigura } from '../../../scr/lib/disponibilidadFiguras'
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
  let disponibilidad = new Map<string, DisponibilidadFigura[]>()
  let errorDisponibilidad = ''
  let error = fechaValida ? '' : 'Selecciona una fecha válida.'

  if (fechaValida) {
    try {
      grupos = await obtenerResumenPedidos(supabase, fecha)
      if (grupos.length) {
        try {
          disponibilidad = await obtenerDisponibilidadFiguras(supabase)
        } catch {
          errorDisponibilidad = 'No se pudo verificar el inventario. Intenta de nuevo.'
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo cargar el resumen.'
    }
  }

  const totalKits = grupos.reduce((total, grupo) => total + grupo.cantidad, 0)
  const totalPedidos = grupos.reduce((total, grupo) => total + grupo.pedidos, 0)

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md md:max-w-3xl lg:max-w-7xl mx-auto px-5 lg:px-8 pt-8 pb-24 lg:pb-10">
        <Link href="/" className="text-sm text-gray-500 hover:text-black">← Inicio</Link>
        <h1 className="editorial-title mt-6" style={{ color: '#c6302c', fontSize: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
          RESUMEN DE PEDIDOS
        </h1>
        <p className="text-sm text-gray-500 mt-3 mb-6">
          Pedidos pendientes y confirmados, agrupados por lugar de entrega.
        </p>

        <p className="text-xs text-gray-500 mb-5">
          La disponibilidad de figuras considera todos los pedidos pendientes y confirmados, de cualquier fecha y lugar. No incluye empaques ni consumibles.
        </p>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:mb-8">
        <form action="/pedidos/resumen" method="get" className="editorial-card mb-6 lg:mb-0">
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
        {!error && (<div className="grid grid-cols-2 gap-3 mb-6 lg:mb-0">
              <div className="editorial-card lg:flex lg:flex-col lg:justify-center">
                <p className="metric-label">Kits por preparar</p>
                <p className="metric-value" style={{ color: '#c6302c' }}>{totalKits}</p>
              </div>
              <div className="editorial-card lg:flex lg:flex-col lg:justify-center">
                <p className="metric-label">Pedidos</p>
                <p className="metric-value">{totalPedidos}</p>
              </div>
            </div>)}
        </div>

        {error ? <p role="alert" className="editorial-card text-red-700">{error}</p> : (
          <>
            {errorDisponibilidad && <p role="alert" className="text-sm text-amber-700 mb-4">{errorDisponibilidad}</p>}

            {grupos.length === 0 && (
              <p className="editorial-card text-sm text-gray-500">
                No hay pedidos pendientes ni confirmados para esta fecha.
              </p>
            )}

            <div className="md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-5 md:items-start">
            {grupos.map((grupo) => (
              <section key={grupo.lugar} className="editorial-card mb-5 md:mb-0" aria-label={grupo.lugar}>
                <h2 className="customer-name">📍 {grupo.lugar}</h2>
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  {grupo.pedidos} {grupo.pedidos === 1 ? 'pedido' : 'pedidos'} · {grupo.cantidad} {grupo.cantidad === 1 ? 'kit' : 'kits'}
                </p>
                <ul className="divide-y divide-gray-100">
                  {grupo.kits.map((kit) => (
                    <li key={kit.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <span className="text-sm font-medium">{kit.nombre}</span>
                        {errorDisponibilidad ? (
                          <p className="text-xs text-amber-700 mt-1">(Disponibilidad no verificada)</p>
                        ) : disponibilidad.get(kit.id)?.length ? (
                          disponibilidad.get(kit.id)!.map((figura) => (
                            <p key={figura.id} className={`text-xs mt-1 ${figura.suficiente ? 'text-green-700' : 'text-red-700'}`}>
                              ({figura.nombre}: {figura.suficiente ? 'suficientes disponibles' : 'no hay suficientes disponibles'} · {figura.disponibles} disponibles / {figura.necesarios} necesarios en total)
                            </p>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">(Sin figura principal registrada)</p>
                        )}
                      </div>
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
            </div>
          </>
        )}
      </div>
    </main>
  )
}
