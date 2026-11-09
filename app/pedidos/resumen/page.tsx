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
    <main className="min-h-screen bg-gray-50/70">
      <div className="max-w-md md:max-w-3xl lg:max-w-7xl mx-auto px-5 lg:px-8 pt-6 lg:pt-9 pb-24 lg:pb-12">
        <Link href="/" className="text-sm text-gray-500 hover:text-[#c6302c]">← Inicio</Link>
        <header className="mt-5 mb-6">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-500 mb-2">Entregas y preparación</p>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-950">Resumen de pedidos</h1>
          <p className="text-sm text-gray-500 mt-2">Organiza los kits pendientes y confirmados por lugar de entrega.</p>
        </header>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:p-5 shadow-sm mb-5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <form action="/pedidos/resumen" method="get" className="sm:flex sm:items-end sm:gap-3">
              <div className="min-w-0 sm:w-48">
                <label htmlFor="fecha-entrega" className="block text-xs font-semibold text-gray-600 mb-2">Fecha de entrega</label>
                <input id="fecha-entrega" name="fecha" type="date" required defaultValue={fechaValida ? fecha : ''}
                  className="block w-full min-w-0 h-11 border border-gray-300 rounded-lg bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6302c]/20 focus:border-[#c6302c]" />
              </div>
              <button type="submit" className="w-full sm:w-auto mt-3 sm:mt-0 h-11 rounded-lg px-5 text-sm font-semibold text-white bg-[#c6302c] hover:bg-[#ab2926] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6302c]">
                Ver resumen
              </button>
            </form>
            {!error && (
              <dl className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 xl:border-t-0 xl:pt-0 xl:min-w-[330px]">
                <div className="xl:border-l xl:border-gray-100 xl:pl-5">
                  <dt className="text-[0.65rem] sm:text-xs text-gray-500">Kits por preparar</dt>
                  <dd className="text-2xl font-bold tabular-nums text-[#c6302c] mt-1">{totalKits}</dd>
                </div>
                <div className="border-l border-gray-100 pl-4">
                  <dt className="text-[0.65rem] sm:text-xs text-gray-500">Pedidos</dt>
                  <dd className="text-2xl font-bold tabular-nums mt-1">{totalPedidos}</dd>
                </div>
                <div className="border-l border-gray-100 pl-4">
                  <dt className="text-[0.65rem] sm:text-xs text-gray-500">Lugares</dt>
                  <dd className="text-2xl font-bold tabular-nums mt-1">{grupos.length}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white/70 px-4 py-3 mb-6">
              <span aria-hidden="true" className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">i</span>
              <p className="text-xs leading-relaxed text-gray-500">
                <strong className="font-semibold text-gray-700">Inventario global de figuras.</strong> Disponibles y necesarios consideran todos los pedidos pendientes y confirmados, de cualquier fecha y lugar. No incluye empaques ni consumibles.
              </p>
            </div>
            {errorDisponibilidad && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-5">{errorDisponibilidad}</p>}

            {grupos.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
                <p className="font-semibold text-gray-700">Sin pedidos para esta fecha</p>
                <p className="text-sm text-gray-500 mt-2">No hay pedidos pendientes ni confirmados. Elige otra fecha para consultar sus entregas.</p>
              </div>
            )}

            <div className="space-y-5">
              {grupos.map((grupo) => (
                <section key={grupo.lugar} aria-label={grupo.lugar} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 sm:px-5 py-4">
                    <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 min-w-0">
                      <span aria-hidden="true" className="text-[#c6302c]">📍</span>{grupo.lugar}
                    </h2>
                    <p className="shrink-0 text-xs text-gray-500 tabular-nums">
                      {grupo.pedidos} {grupo.pedidos === 1 ? 'pedido' : 'pedidos'} <span aria-hidden="true" className="mx-1">·</span> {grupo.cantidad} {grupo.cantidad === 1 ? 'kit' : 'kits'}
                    </p>
                  </header>
                  <div aria-hidden="true" className="hidden md:grid grid-cols-[minmax(0,1fr)_5rem_minmax(0,1.8fr)] gap-6 px-5 py-2.5 border-b border-gray-100 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-500">
                    <span>Kit</span><span className="text-center">Cantidad</span><span>Figuras · inventario global</span>
                  </div>
                  <ul className="divide-y divide-gray-100 px-4 sm:px-5">
                    {grupo.kits.map((kit) => (
                      <li key={kit.id} className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1.8fr)] gap-x-4 md:gap-x-6 items-start py-4">
                        <span className="text-sm font-semibold text-gray-800 md:pt-1.5">{kit.nombre}</span>
                        <span aria-label={`${kit.cantidad} ${kit.cantidad === 1 ? 'kit' : 'kits'} de ${kit.nombre}`} className="shrink-0 md:justify-self-center rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-sm font-bold tabular-nums text-gray-700">
                          <span className="md:hidden">× </span>{kit.cantidad}
                        </span>
                        <div className="col-span-2 md:col-span-1 mt-3 md:mt-0 min-w-0">
                          {errorDisponibilidad ? (
                            <p className="text-xs text-amber-700">Disponibilidad no verificada</p>
                          ) : disponibilidad.get(kit.id)?.length ? (
                            <ul className="space-y-2">
                              {disponibilidad.get(kit.id)!.map((figura) => (
                                <li key={figura.id} className="rounded-lg bg-gray-50 px-3 py-2">
                                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                                    <span className="text-xs font-medium text-gray-700">{figura.nombre}</span>
                                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${figura.suficiente ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      <span aria-hidden="true">{figura.suficiente ? '✓' : '!'}</span>
                                      {figura.suficiente ? 'Suficiente' : `Faltan ${Math.max(0, figura.necesarios - figura.disponibles)}`}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[0.7rem] text-gray-500 tabular-nums">
                                    <span className="font-semibold text-gray-700">{figura.disponibles}</span> disponibles <span aria-hidden="true" className="mx-1">·</span> <span className="font-semibold text-gray-700">{figura.necesarios}</span> necesarios
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500">Sin figura principal registrada</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {grupo.sinKits > 0 && (
                    <p className="border-t border-amber-100 bg-amber-50 px-4 sm:px-5 py-3 text-xs text-amber-800">
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
