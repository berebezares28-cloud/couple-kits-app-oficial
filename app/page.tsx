export const dynamic = 'force-dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { listarInsumosConStock } from '../scr/lib/calcularStock'
import { obtenerResumenVentasMes } from '../scr/lib/resumenVentasMes'
import { supabase } from '../scr/lib/supabase'

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

export default async function Home() {
  const { count: pedidosPendientes } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .eq('estatus', 'Pendiente')
    .neq('eliminado', true)

  const { count: kitsActivos } = await supabase
    .from('kits')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)

  const [insumosConStock, ventasMes] = await Promise.all([
    listarInsumosConStock(supabase),
    obtenerResumenVentasMes(supabase)
  ])

  const insumosCriticos = insumosConStock.filter(
    (i) =>
      Number(i.stock_actual) <=
      Number(i.stock_minimo)
  ).length

  const { data: pedidos } = await supabase
    .from('pedidos')
    .select('*')
    .neq('eliminado', true)
    .order('created_at', { ascending: false })
    .limit(20)

  const pedidoIds =
    pedidos?.map((p) => p.id) ?? []

  const { data: pedidoKits } = await supabase
    .from('pedido_kits')
    .select(`
      pedido_id,
      kits (
        nombre
      )
    `)
    .in('pedido_id', pedidoIds)

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24">

        {/* HEADER */}

        <div className="pt-8 pb-10">
          <div className="flex items-center gap-4">

            <Image
              src="/images/logo.png"
              alt="Couple Kits"
              width={70}
              height={70}
              priority
              className="shrink-0"
            />

            <div>
            <h1
  className="editorial-title"
  style={{
    color: '#c6302c',
    margin: 0,
    fontSize: '3rem',
    lineHeight: '0.95'
  }}
>
  Couple Kits
</h1>

<p
  className="mt-1"
  style={{
    fontSize: '0.7rem',
    letterSpacing: '0.35em',
    textTransform: 'uppercase',
    color: '#888',
    paddingLeft: '0.35rem'
  }}
>
  estudio
</p>
            </div>

          </div>
        </div>

        {/* MÉTRICAS */}

        <div className="grid grid-cols-2 gap-4">

          <Link
            href="/pedidos?estatus=Pendiente"
            className="editorial-card block hover:-translate-y-[1px] transition"
          >
            <p className="metric-label">
              📦 Pedidos pendientes
            </p>

            <h2
              className="metric-value"
              style={{ color: '#c6302c' }}
            >
              {pedidosPendientes ?? 0}
            </h2>
          </Link>

          <Link
            href="/kits"
            className="editorial-card block hover:-translate-y-[1px] transition"
          >
            <p className="metric-label">
              🎨 Kits activos
            </p>

            <h2 className="metric-value">
              {kitsActivos ?? 0}
            </h2>
          </Link>

          <Link
            href="/insumos/criticos"
            className="editorial-card block hover:-translate-y-[1px] transition"
          >
            <p className="metric-label">
              ⚠️ Insumos críticos
            </p>

            <h2 className="metric-value">
              {insumosCriticos}
            </h2>
          </Link>

          <Link
            href="/ventas"
            className="editorial-card block hover:-translate-y-[1px] transition"
          >
            <p className="metric-label">
              💰 Ventas del mes
            </p>

            <h2
              className="metric-value"
              style={{ color: '#389E0D' }}
            >
              {ventasMes.totalVentas}
            </h2>
          </Link>

        </div>

        <div className="mt-8 space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-between editorial-card hover:-translate-y-[1px] transition px-5 py-4"
          >
            <div>
              <p className="font-semibold">📊 Dashboard</p>
              <p className="text-xs text-gray-500 mt-0.5">
                KPIs, tendencias e insights del negocio
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </Link>

          <Link
            href="/contenido"
            className="flex items-center justify-between editorial-card hover:-translate-y-[1px] transition px-5 py-4"
          >
            <div>
              <p className="font-semibold">
                📱 Diario de contenido
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Publicaciones, anuncios y performance
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        {/* PEDIDOS */}

        <div className="mt-12">

          <h2 className="section-title">
            PEDIDOS RECIENTES
          </h2>

          {pedidos?.length ? (
            pedidos.map((pedido: any) => {

              const kitsDelPedido =
                pedidoKits
                  ?.filter(
                    (pk: any) =>
                      pk.pedido_id === pedido.id
                  )
                  .map(
                    (pk: any) =>
                      (pk.kits as any)?.nombre
                  )
                  .filter(Boolean)
                  .join(', ') ?? ''

              const statusStyle =
                getStatusStyle(
                  pedido.estatus
                )

              return (
                <Link
                  key={pedido.id}
                  href={`/pedidos/${pedido.id}`}
                  className="editorial-card mb-4 block hover:-translate-y-[1px] transition"
                >

                  <div className="flex justify-between items-start">

                    <div>
                      <p className="customer-name">
                        {pedido.nombre}
                      </p>

                      <p className="customer-instagram">
                        @{pedido.instagram}
                      </p>
                    </div>

                    <span
                      className="px-3 py-1 text-xs rounded-full border"
                      style={{
                        background:
                          statusStyle.background,
                        color:
                          statusStyle.color,
                        borderColor:
                          statusStyle.border
                      }}
                    >
                      {pedido.estatus}
                    </span>

                  </div>

                  <div className="mt-4">
                    <p className="kit-name">
                      🎨 {kitsDelPedido || 'Sin kits'}
                    </p>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-gray-600">

                    <p>
                      📅 {pedido.fecha_entrega}
                    </p>

                    <p>
                      ⏰ {pedido.hora_entrega}
                    </p>

                    <p>
                      📍 {pedido.lugar_entrega}
                    </p>

                  </div>

                </Link>
              )
            })
          ) : (
            <div className="editorial-card">
              No hay pedidos todavía
            </div>
          )}

        </div>

      </div>
    </main>
  )
}