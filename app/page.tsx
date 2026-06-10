import { supabase } from '../scr/lib/supabase'

export default async function Home() {
  // Pedidos pendientes
  const { count: pedidosPendientes } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .eq('estatus', 'Pendiente')

  // Kits activos
  const { count: kitsActivos } = await supabase
    .from('kits')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)

  // Insumos registrados
  const { count: insumosRegistrados } = await supabase
    .from('insumos')
    .select('*', { count: 'exact', head: true })

  // Insumos críticos
  const { data: insumosCriticosData } = await supabase
    .from('insumos')
    .select('stock_actual, stock_minimo')

  const insumosCriticos =
    insumosCriticosData?.filter(
      (i) => Number(i.stock_actual) <= Number(i.stock_minimo)
    ).length ?? 0

  // Próximas entregas
  const { data: proximasEntregas } = await supabase
    .from('pedidos')
    .select(`
      nombre,
      fecha_entrega,
      lugar_entrega,
      kits(nombre)
    `)
    .order('fecha_entrega', { ascending: true })
    .limit(5)

  return (
    <main className="min-h-screen bg-[#F9F6F2] p-6">
      <div className="max-w-md mx-auto">

        <h1 className="text-3xl font-bold mb-2">
          Hola Bere 👋
        </h1>

        <p className="text-gray-500 mb-6">
          Así va Couple Kits hoy
        </p>

        <div className="grid grid-cols-2 gap-4">

          <div className="bg-[#F8D7DA] rounded-3xl p-5">
            <p className="text-sm text-gray-600">
              Pedidos pendientes
            </p>
            <h2 className="text-2xl font-bold mt-2">
              {pedidosPendientes ?? 0}
            </h2>
          </div>

          <div className="bg-[#DDE5B6] rounded-3xl p-5">
            <p className="text-sm text-gray-600">
              Kits activos
            </p>
            <h2 className="text-2xl font-bold mt-2">
              {kitsActivos ?? 0}
            </h2>
          </div>

          <div className="bg-[#E8DFF5] rounded-3xl p-5">
            <p className="text-sm text-gray-600">
              Insumos
            </p>
            <h2 className="text-2xl font-bold mt-2">
              {insumosRegistrados ?? 0}
            </h2>
          </div>

          <div className="bg-[#D8F3DC] rounded-3xl p-5">
            <p className="text-sm text-gray-600">
              Insumos críticos
            </p>
            <h2 className="text-2xl font-bold mt-2">
              {insumosCriticos}
            </h2>
          </div>

        </div>

        <div className="mt-8">

          <h2 className="text-xl font-semibold mb-4">
            Próximas entregas
          </h2>

          {proximasEntregas?.length ? (
            proximasEntregas.map((pedido: any, index: number) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-4 mb-3"
              >
                <p className="font-semibold">
                  {pedido.nombre}
                </p>

                <p className="text-gray-500 text-sm">
                  {pedido.fecha_entrega}
                </p>

                <p className="text-gray-500 text-sm">
                  📍 {pedido.lugar_entrega}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-4">
              No hay entregas programadas
            </div>
          )}

        </div>

      </div>
    </main>
  )
}