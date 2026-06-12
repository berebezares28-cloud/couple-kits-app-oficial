'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type Pedido = {
id: string
nombre: string
instagram: string
lugar_entrega: string
fecha_entrega: string
hora_entrega: string
estatus: string
kits: string[]
}

function getStatusStyle(status: string) {
switch (status) {
case 'Pendiente':
return {
background: '#FFF7E6',
color: '#D48806'
}

```
case 'Entregado':
  return {
    background: '#F6FFED',
    color: '#389E0D'
  }

case 'Cancelado':
  return {
    background: '#FFF1F0',
    color: '#CF1322'
  }

default:
  return {
    background: '#F5F5F5',
    color: '#595959'
  }
```

}
}

export default function PedidosClient({
pedidosIniciales
}: {
pedidosIniciales: Pedido[]
}) {
const [busqueda, setBusqueda] =
useState('')

const [filtro, setFiltro] =
useState('Todos')

const [pedidos, setPedidos] =
useState(pedidosIniciales)

const pedidosFiltrados = useMemo(() => {
const q =
busqueda.toLowerCase()

```
return pedidos.filter((pedido) => {
  const kits =
    pedido.kits.join(' ')

  const coincideBusqueda =
    pedido.nombre
      ?.toLowerCase()
      .includes(q) ||
    pedido.instagram
      ?.toLowerCase()
      .includes(q) ||
    pedido.lugar_entrega
      ?.toLowerCase()
      .includes(q) ||
    kits
      .toLowerCase()
      .includes(q)

  const coincideFiltro =
    filtro === 'Todos'
      ? true
      : pedido.estatus === filtro

  return (
    coincideBusqueda &&
    coincideFiltro
  )
})
```

}, [
busqueda,
pedidos,
filtro
])

async function actualizarEstatus(
pedidoId: string,
nuevoEstatus: string
) {
const response = await fetch(
`/api/pedidos/${pedidoId}`,
{
method: 'PATCH',
headers: {
'Content-Type':
'application/json'
},
body: JSON.stringify({
estatus: nuevoEstatus
})
}
)

```
if (!response.ok) {
  alert(
    'Error actualizando pedido'
  )
  return
}

setPedidos((prev) =>
  prev.map((pedido) =>
    pedido.id === pedidoId
      ? {
          ...pedido,
          estatus:
            nuevoEstatus
        }
      : pedido
  )
)
```

}

return ( <main className="min-h-screen bg-white"> <div className="max-w-md mx-auto px-5 pb-20">

```
    <div className="pt-8 pb-8">

      <Link
        href="/"
        className="text-sm text-gray-500"
      >
        ← Dashboard
      </Link>

      <h1
        className="editorial-title mt-4"
        style={{
          color: '#c6302c'
        }}
      >
        PEDIDOS
      </h1>

      <p
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.35em',
          textTransform:
            'uppercase',
          color: '#888'
        }}
      >
        Studio
      </p>

    </div>

    <input
      type="text"
      placeholder="Buscar nombre, kit, instagram o lugar..."
      value={busqueda}
      onChange={(e) =>
        setBusqueda(
          e.target.value
        )
      }
      className="w-full border rounded-xl px-4 py-3 mb-6"
    />

    <div className="flex gap-2 mb-6 overflow-x-auto">

      {[
        'Todos',
        'Pendiente',
        'Entregado',
        'Cancelado'
      ].map((item) => (

        <button
          key={item}
          onClick={() =>
            setFiltro(item)
          }
          className="px-4 py-2 rounded-full text-sm border whitespace-nowrap transition"
          style={{
            background:
              filtro === item
                ? '#c6302c'
                : '#fff',
            color:
              filtro === item
                ? '#fff'
                : '#000',
            borderColor:
              '#e5e5e5'
          }}
        >
          {item}
        </button>

      ))}

    </div>

    <p className="text-sm text-gray-500 mb-6">
      {pedidosFiltrados.length} pedidos
    </p>

    {pedidosFiltrados.map(
      (pedido) => {

        const statusStyle =
          getStatusStyle(
            pedido.estatus
          )

        return (
          <Link
            key={pedido.id}
            href={`/pedidos/${pedido.id}`}
            className="block editorial-card mb-4 hover:-translate-y-[1px] transition"
          >

            <div className="flex justify-between">

              <div>
                <p className="customer-name">
                  {pedido.nombre}
                </p>

                <p className="customer-instagram">
                  @{pedido.instagram}
                </p>
              </div>

              <select
                value={
                  pedido.estatus
                }
                onChange={(e) => {
                  e.preventDefault()

                  actualizarEstatus(
                    pedido.id,
                    e.target.value
                  )
                }}
                onClick={(e) =>
                  e.stopPropagation()
                }
                className="text-xs border rounded-lg p-2"
                style={{
                  background:
                    statusStyle.background,
                  color:
                    statusStyle.color
                }}
              >
                <option>
                  Pendiente
                </option>

                <option>
                  Entregado
                </option>

                <option>
                  Cancelado
                </option>
              </select>

            </div>

            <div className="mt-4">

              <p className="kit-name">
                🎨 {pedido.kits.join(', ')}
              </p>

            </div>

            <div className="mt-4 text-sm text-gray-600 space-y-1">

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
      }
    )}

  </div>
</main>

)
    }
