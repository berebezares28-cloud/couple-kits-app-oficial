'use client'

import Link from 'next/link'

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

export default function PedidoDetalle({
  pedido,
  kits
}: {
  pedido: any
  kits: any[]
}) {
  const statusStyle = getStatusStyle(
    pedido.estatus
  )

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
            style={{
              color: '#c6302c'
            }}
          >
            {pedido.nombre}
          </h1>

          <p
            className="mt-1"
            style={{
              color: '#777'
            }}
          >
            @{pedido.instagram}
          </p>

        </div>

        <div className="editorial-card p-0 overflow-hidden">

          {/* ESTATUS */}

          <div className="p-6">

            <span
              className="px-4 py-2 rounded-full border text-sm font-medium"
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

          <hr />

          {/* KITS */}

          <section className="p-6">

            <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-4">
              Kits
            </p>

            <div className="space-y-2">

              {kits.map((kit: any) => (
                <div
                  key={kit.nombre}
                  className="flex justify-between"
                >
                  <span>
                    {kit.nombre}
                  </span>

                  <span className="text-gray-400">
                    x{kit.cantidad}
                  </span>
                </div>
              ))}

            </div>

          </section>

          <hr />

          {/* ENTREGA */}

          <section className="p-6">

            <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-4">
              Entrega
            </p>

            <div className="space-y-2">

              <p>
                {pedido.fecha_entrega}
              </p>

              <p>
                {pedido.hora_entrega}
              </p>

              <p>
                {pedido.lugar_entrega}
              </p>

            </div>

          </section>

          <hr />

          {/* PAGO */}

          <section className="p-6">

            <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-4">
              Pago
            </p>

            <p>
              {pedido.metodo_pago || '-'}
            </p>

          </section>

          <hr />

          {/* OCASIÓN */}

          <section className="p-6">

            <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-4">
              Ocasión
            </p>

            <p>
              {pedido.ocasion || '-'}
            </p>

          </section>

          <hr />

          {/* SEMILLAS */}

          <section className="p-6">

            <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-4">
              Semillas
            </p>

            <p>
              {pedido.semillas || '-'}
            </p>

          </section>

          <hr />

          {/* NOTA */}

          <section className="p-6">

            <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-4">
              Nota
            </p>

            <p className="leading-7 whitespace-pre-wrap">
              {pedido.nota || 'Sin nota'}
            </p>

          </section>

          <hr />

          {/* ACCIONES */}

          <section className="p-6">

            <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-5">
              Acciones
            </p>

            <div className="space-y-3">

              <button className="w-full border rounded-xl py-3 hover:bg-gray-50 transition">
                Editar pedido
              </button>

              <button className="w-full border rounded-xl py-3 hover:bg-gray-50 transition">
                Duplicar pedido
              </button>

              <button className="w-full border rounded-xl py-3 text-red-600 hover:bg-red-50 transition">
                Eliminar pedido
              </button>

            </div>

          </section>

        </div>

      </div>
    </main>
  )
}