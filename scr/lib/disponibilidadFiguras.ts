import type { SupabaseClient } from '@supabase/supabase-js'

export type DisponibilidadFigura = {
  id: string
  nombre: string
  disponibles: number
  necesarios: number
  suficiente: boolean
}

type Pedido = { id: string; estatus: string; eliminado: boolean | null; punto_entrega_id: string | null }
type Linea = { id: string; pedido_id: string; kit_id: string; cantidad: number }
type Receta = { kit_id: string; insumo_id: string; cantidad: number }
type Snapshot = { pedido_kit_id: string; insumo_id: string; cantidad: number }
type Figura = { id: string; nombre: string }
type Entrada = { insumo_id: string; cantidad: number }

type DatosFiguras = {
  pedidos: Pedido[]; lineas: Linea[]; recetas: Receta[]; snapshots: Snapshot[]
  figuras: Figura[]; compras: Entrada[]; entradas: Entrada[]
}

// Mismo inventario que Insumos: compras + entradas, menos consumo histórico
// de pedidos entregados directamente. No reserva ni modifica existencias.
export function calcularDisponibilidadFiguras(datos: DatosFiguras) {
  const figuras = new Map(datos.figuras.map((f) => [f.id, f]))
  const stock = new Map<string, number>()
  const demanda = new Map<string, number>()
  const recetas = new Map<string, Receta[]>()
  const snapshots = new Map<string, Snapshot[]>()
  const pedidos = new Map(datos.pedidos.map((p) => [p.id, p]))
  const figurasPorKit = new Map<string, Set<string>>()

  for (const r of datos.recetas) {
    const lista = recetas.get(r.kit_id) ?? []
    lista.push(r)
    recetas.set(r.kit_id, lista)
  }
  for (const s of datos.snapshots) {
    const lista = snapshots.get(s.pedido_kit_id) ?? []
    lista.push(s)
    snapshots.set(s.pedido_kit_id, lista)
  }
  for (const e of [...datos.compras, ...datos.entradas]) {
    stock.set(e.insumo_id, (stock.get(e.insumo_id) ?? 0) + Number(e.cantidad))
  }
  for (const linea of datos.lineas) {
    const pedido = pedidos.get(linea.pedido_id)
    if (!pedido || pedido.eliminado === true) continue
    const abierto = ['Pendiente', 'Confirmado'].includes(pedido.estatus)
    const entregadoDirecto = pedido.estatus === 'Entregado' && !pedido.punto_entrega_id
    if (!abierto && !entregadoDirecto) continue
    // La preparación pendiente sigue siempre la receta vigente del catálogo.
    // Solo el consumo ya entregado conserva la receta histórica del pedido.
    const componentes = abierto
      ? recetas.get(linea.kit_id) ?? []
      : snapshots.get(linea.id) ?? []
    for (const c of componentes) {
      if (!figuras.has(c.insumo_id)) continue
      const cantidad = Number(c.cantidad) * (Number(linea.cantidad) || 1)
      if (cantidad <= 0 || !Number.isFinite(cantidad)) continue
      if (abierto) {
        demanda.set(c.insumo_id, (demanda.get(c.insumo_id) ?? 0) + cantidad)
        const ids = figurasPorKit.get(linea.kit_id) ?? new Set<string>()
        ids.add(c.insumo_id)
        figurasPorKit.set(linea.kit_id, ids)
      } else {
        stock.set(c.insumo_id, (stock.get(c.insumo_id) ?? 0) - cantidad)
      }
    }
  }

  const resultado = new Map<string, DisponibilidadFigura[]>()
  for (const [kitId, ids] of Array.from(figurasPorKit.entries())) {
    resultado.set(kitId, Array.from(ids).map((id) => {
      const disponibles = stock.get(id) ?? 0
      const necesarios = demanda.get(id) ?? 0
      return { id, nombre: figuras.get(id)!.nombre, disponibles, necesarios,
        suficiente: disponibles >= necesarios }
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')))
  }
  return resultado
}

async function leerTodo<T>(consultar: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const filas: T[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await consultar(desde, desde + 999)
    if (error || !data) throw new Error('No se pudo consultar la disponibilidad de figuras.')
    filas.push(...data)
    if (data.length < 1000) return filas
  }
}

export async function obtenerDisponibilidadFiguras(supabase: SupabaseClient) {
  // Ninguna consulta depende del filtro de fecha del resumen.
  const [pedidos, lineas, recetas, snapshots, figuras, compras, entradas] = await Promise.all([
    leerTodo<Pedido>((a,b) => supabase.from('pedidos').select('id, estatus, eliminado, punto_entrega_id').order('id').range(a,b)),
    leerTodo<Linea>((a,b) => supabase.from('pedido_kits').select('id, pedido_id, kit_id, cantidad').order('id').range(a,b)),
    leerTodo<Receta>((a,b) => supabase.from('recetas_kit').select('kit_id, insumo_id, cantidad').order('id').range(a,b)),
    leerTodo<Snapshot>((a,b) => supabase.from('pedido_kit_receta').select('pedido_kit_id, insumo_id, cantidad').order('id').range(a,b)),
    leerTodo<Figura>((a,b) => supabase.from('insumos').select('id, nombre').eq('categoria', 'figura').order('id').range(a,b)),
    leerTodo<Entrada>((a,b) => supabase.from('compras_insumos').select('insumo_id, cantidad').order('id').range(a,b)),
    leerTodo<Entrada>((a,b) => supabase.from('movimientos_inventario').select('insumo_id, cantidad').eq('tipo_movimiento', 'entrada').order('id').range(a,b))
  ])
  return calcularDisponibilidadFiguras({ pedidos, lineas, recetas, snapshots, figuras, compras, entradas })
}
