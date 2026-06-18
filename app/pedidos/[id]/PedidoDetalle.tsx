'use client'

import Link from 'next/link'

export default function PedidoDetalle({
  pedido,
  kits
}: {
  pedido: any
  kits: any[]
}) {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-20">

        <div className="pt-8 pb-8">

          <Link
            href="/pedidos"
            className="text-sm text-gray-500"
          >
            ← Pedidos
          </Link>

          <h1
            className="editorial-title mt-4"
            style={{
              color: '#c6302c'
            }}
          >
            {pedido.nombre}
          </h1>

          <p
            style={{
              fontSize: '0.8rem',
              color: '#888'
            }}
          >
            @{pedido.instagram}
          </p>

        </div>

        <div className="editorial-card mb-5">

          <h3 className="section-title">
            ESTATUS
          </h3>

          <p>
            {pedido.estatus}
          </p>

        </div>

        <div className="editorial-card mb-5">

          <h3 className="section-title">
            KITS
          </h3>

          {kits.map((kit) => (
            <p key={kit.nombre}>
              🎨 {kit.nombre}
            </p>
          ))}

        </div>

        <div className="editorial-card mb-5">

          <h3 className="section-title">
            ENTREGA
          </h3>

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

        <div className="editorial-card mb-5">

          <h3 className="section-title">
            PAGO
          </h3>

          <p>
            {pedido.metodo_pago || '-'}
          </p>

        </div>

        <div className="editorial-card mb-5">

          <h3 className="section-title">
            OCASIÓN
          </h3>

          <p>
            {pedido.ocasion || '-'}
          </p>

        </div>

        <div className="editorial-card mb-5">

          <h3 className="section-title">
            SEMILLAS
          </h3>

          <p>
            {pedido.semillas || '-'}
          </p>

        </div>

        <div className="editorial-card">

          <h3 className="section-title">
            NOTA
          </h3>

          <p>
            {pedido.nota || 'Sin nota'}
          </p>

        </div>

      </div>
    </main>
  )
}