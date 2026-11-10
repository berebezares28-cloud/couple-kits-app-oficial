import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { calcularPlRango, obtenerFinanzasResumen } from './finanzasData'
import { listarIngresosExtra, rangoMes, validarIngresoExtra } from './ingresosExtra'

type Row = Record<string, unknown>

// Datos aislados: ninguna prueba se conecta a la base real.
function cliente(datos: Record<string, Row[]>, tablaConError?: string): SupabaseClient {
  return { from(tabla: string) {
    let filas = [...(datos[tabla] ?? [])]
    const query = {
      select() { return query },
      eq(campo: string, valor: unknown) { filas = filas.filter((f) => f[campo] === valor); return query },
      neq(campo: string, valor: unknown) { filas = filas.filter((f) => f[campo] !== valor); return query },
      in(campo: string, valores: unknown[]) { filas = filas.filter((f) => valores.includes(f[campo])); return query },
      gte(campo: string, valor: string) { filas = filas.filter((f) => String(f[campo]) >= valor); return query },
      lte(campo: string, valor: string) { filas = filas.filter((f) => String(f[campo]) <= valor); return query },
      order() { return query },
      range(desde: number, hasta: number) { filas = filas.slice(desde, hasta + 1); return query },
      then(resolve: (value: unknown) => unknown) {
        return Promise.resolve({ data: tabla === tablaConError ? null : filas, error: tabla === tablaConError ? { message: 'Error simulado' } : null }).then(resolve)
      }
    }
    return query
  } } as unknown as SupabaseClient
}

async function pruebas() {
  const valido = { concepto: ' Taller de pintura ', fecha: '2026-11-10', monto: '75.50', metodo_pago: 'Nu', notas: ' Evento ' }
  assert.deepEqual(validarIngresoExtra(valido), { ok: true, ingreso: { concepto: 'Taller de pintura', fecha: '2026-11-10', monto: 75.5, metodo_pago: 'Nu', notas: 'Evento' } })
  for (const body of [null, [], { ...valido, concepto: ' ' }, { ...valido, concepto: 3 }, { ...valido, fecha: '2026-02-30' }, { ...valido, fecha: '' }, { ...valido, monto: 0 }, { ...valido, monto: -10 }, { ...valido, monto: Infinity }, { ...valido, monto: 'NaN' }, { ...valido, monto: 1.001 }, { ...valido, monto: 1e12 }, { ...valido, monto: true }, { ...valido, metodo_pago: 'Otra' }, { ...valido, notas: {} }]) {
    assert.equal(validarIngresoExtra(body).ok, false, JSON.stringify(body))
  }
  assert.deepEqual(rangoMes('2028-02'), { desde: '2028-02-01', hasta: '2028-02-29' })
  assert.equal(rangoMes('2026-13'), null)

  const datos: Record<string, Row[]> = {
    pedidos: [{ id: 'p1', estatus: 'Entregado', eliminado: false, fecha_entrega: '2026-11-05', punto_entrega_id: null, metodo_pago: 'Efectivo' }],
    pedido_kits: [{ id: 'pk1', pedido_id: 'p1', kit_id: 'k1', cantidad: 2, subtotal: 200 }],
    pedido_kit_receta: [{ pedido_kit_id: 'pk1', insumo_id: 'i1', cantidad: 2 }],
    insumos: [{ id: 'i1', nombre: 'Figura' }],
    recetas_kit: [{ kit_id: 'k1', insumo_id: 'i1', cantidad: 2 }],
    compras_insumos: [{ id: 'c1', insumo_id: 'i1', fecha: '2026-11-01', cantidad: 20, costo_unitario: 10, costo_total: 200, metodo_pago: 'Efectivo' }],
    ventas_local: [{ id: 'v1', fecha: '2026-11-06', ingreso_total: 90, comision_monto: 9, metodo_pago: 'Mercado Pago' }],
    ventas_local_kits: [{ venta_local_id: 'v1', kit_id: 'k1', cantidad: 1 }],
    gastos: [{ id: 'g1', concepto: 'Transporte', fecha: '2026-11-07', monto: 30, categoria: 'transporte', metodo_pago: 'Nu' }],
    saldos_cuenta: [{ metodo_pago: 'Efectivo', saldo_inicial: 100 }],
    ingresos_extra: []
  }
  const base = await obtenerFinanzasResumen(cliente(datos), '2026-11')
  assert.equal(base.pl.ingresos, 290)
  assert.equal(base.pl.costoVentas, 60)
  assert.equal(base.pl.utilidadNeta, 191)
  datos.ingresos_extra = [
    { id: 'e1', concepto: 'Taller', fecha: '2026-11-10', monto: 75.5, metodo_pago: 'Nu', notas: null },
    { id: 'e2', concepto: 'Personalización', fecha: '2026-11-11', monto: 25, metodo_pago: 'Efectivo', notas: null },
    { id: 'e3', concepto: 'Evento anterior', fecha: '2026-10-30', monto: 300, metodo_pago: 'Nu', notas: null }
  ]
  const nuevo = await obtenerFinanzasResumen(cliente(datos), '2026-11')
  assert.equal(nuevo.pl.ingresosVentas, 290)
  assert.equal(nuevo.pl.ingresosExtra, 100.5)
  assert.equal(nuevo.pl.ingresos, 390.5)
  assert.equal(nuevo.pl.utilidadNeta, 291.5)
  assert.equal(nuevo.pl.kitsVendidos, base.pl.kitsVendidos)
  assert.equal(nuevo.pl.costoVentas, base.pl.costoVentas)
  assert.equal(nuevo.inventarioValor, base.inventarioValor)
  assert.equal(nuevo.pl.comisiones, base.pl.comisiones)
  assert.equal(nuevo.pl.totalGastosAdmin, base.pl.totalGastosAdmin)
  assert.equal(nuevo.cuentas.find((c) => c.metodo_pago === 'Nu')?.saldoActual, 345.5)
  assert.equal(nuevo.cuentas.find((c) => c.metodo_pago === 'Efectivo')?.saldoActual, 116)
  assert.equal(nuevo.cuentas.find((c) => c.metodo_pago === 'Mercado Pago')?.saldoActual, 90)
  assert.ok(nuevo.mesesDisponibles.includes('2026-10'))
  assert.equal(nuevo.flujosPorMes.find((m) => m.mes === '2026-11')?.cuentas.find((c) => c.metodo_pago === 'Nu')?.flujoNeto, 45.5)
  const rango = await calcularPlRango(cliente(datos), '2026-11-10', '2026-11-10')
  assert.equal(rango.ingresos, 75.5)
  assert.equal(rango.utilidadNeta, 75.5)
  assert.equal(rango.kitsVendidos, 0)
  const octubre = await obtenerFinanzasResumen(cliente(datos), '2026-10')
  assert.equal(octubre.pl.ingresosVentas, 0)
  assert.equal(octubre.pl.ingresosExtra, 300)
  datos.ingresos_extra = []
  assert.deepEqual(await obtenerFinanzasResumen(cliente(datos), '2026-11'), base)

  datos.ingresos_extra = Array.from({ length: 1005 }, (_, i) => ({ id: String(i), concepto: 'Evento', fecha: '2026-11-10', monto: 1, metodo_pago: 'Nu', notas: null }))
  assert.equal((await listarIngresosExtra(cliente(datos))).length, 1005)
  await assert.rejects(() => listarIngresosExtra(cliente(datos, 'ingresos_extra')), /No se pudieron cargar/)
  console.log('Ingresos extra: validación, periodos, cuentas, P&L, rangos, paginación y reversión correctos; inventario y kits sin cambios.')
}

pruebas().catch((error) => { console.error(error); process.exitCode = 1 })
