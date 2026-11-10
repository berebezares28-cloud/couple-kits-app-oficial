'use client'

import { useState, type FormEvent } from 'react'
import { METODOS_PAGO, type MetodoPago } from '../../scr/lib/fifoCosteo'
import { validarIngresoExtra, type IngresoExtra } from '../../scr/lib/ingresosExtra'
import { formatearFechaInsumo, formatearMoneda } from '../../scr/lib/insumosUtils'

const inputClass = 'mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6302c]/30'

function hoyMexico() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export default function IngresosExtra({ ingresos, periodo, cargando, onCambio }: {
  ingresos: IngresoExtra[]
  periodo: string
  cargando: boolean
  onCambio: (fecha?: string) => Promise<void>
}) {
  const [concepto, setConcepto] = useState('')
  const [fecha, setFecha] = useState(hoyMexico)
  const [monto, setMonto] = useState('')
  const [cuenta, setCuenta] = useState<MetodoPago>('Efectivo')
  const [notas, setNotas] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState<{ error: boolean; texto: string } | null>(null)
  const total = ingresos.reduce((suma, ingreso) => suma + ingreso.monto, 0)

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (ocupado || cargando) return
    const validacion = validarIngresoExtra({ concepto, fecha, monto, metodo_pago: cuenta, notas })
    if (!validacion.ok) { setMensaje({ error: true, texto: validacion.error }); return }
    setOcupado(true)
    setMensaje(null)
    try {
      const res = await fetch('/api/finanzas/ingresos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validacion.ingreso)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo registrar el ingreso')
      setConcepto('')
      setMonto('')
      setNotas('')
      setMensaje({ error: false, texto: 'Ingreso extra registrado' })
      await onCambio(fecha)
    } catch (error) {
      setMensaje({ error: true, texto: error instanceof Error ? error.message : 'Error de conexión. Revisa tus movimientos antes de volver a guardar.' })
    } finally { setOcupado(false) }
  }

  async function eliminar(ingreso: IngresoExtra) {
    if (ocupado || cargando || !confirm(`¿Eliminar el ingreso “${ingreso.concepto}” por ${formatearMoneda(ingreso.monto)}? Se descontará de los totales.`)) return
    setOcupado(true)
    setMensaje(null)
    try {
      const res = await fetch(`/api/finanzas/ingresos?id=${ingreso.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el ingreso')
      setMensaje({ error: false, texto: 'Ingreso extra eliminado' })
      await onCambio()
    } catch (error) {
      setMensaje({ error: true, texto: error instanceof Error ? error.message : 'Error de conexión' })
    } finally { setOcupado(false) }
  }

  return (
    <section aria-label="Ingresos extra" className="space-y-4">
      <p className="text-sm text-gray-600">Registra lo que reciban por actividades o trabajos adicionales. Se sumará a los ingresos y a la cuenta que elijas.</p>
      {mensaje && <p role={mensaje.error ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ${mensaje.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{mensaje.texto}</p>}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={registrar} className="editorial-card space-y-4">
          <h2 className="section-title text-lg">Registrar ingreso extra</h2>
          <fieldset disabled={ocupado || cargando} className="space-y-4 disabled:opacity-60">
            <label className="block text-sm font-medium" htmlFor="ingreso-concepto">Concepto
              <input id="ingreso-concepto" required maxLength={200} placeholder="Ej. Taller de pintura" value={concepto} onChange={(e) => setConcepto(e.target.value)} className={inputClass} />
            </label>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block text-sm font-medium" htmlFor="ingreso-fecha">Fecha
                <input id="ingreso-fecha" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${inputClass} min-w-0`} />
              </label>
              <label className="block text-sm font-medium" htmlFor="ingreso-monto">Monto recibido (MXN)
                <input id="ingreso-monto" type="number" inputMode="decimal" required min="0.01" max="9999999999.99" step="0.01" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} className={inputClass} />
              </label>
            </div>
            <label className="block text-sm font-medium" htmlFor="ingreso-cuenta">Cuenta donde se recibió
              <select id="ingreso-cuenta" value={cuenta} onChange={(e) => setCuenta(e.target.value as MetodoPago)} className={inputClass}>
                {METODOS_PAGO.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium" htmlFor="ingreso-notas">Notas <span className="font-normal text-gray-400">(opcional)</span>
              <textarea id="ingreso-notas" rows={3} maxLength={2000} value={notas} onChange={(e) => setNotas(e.target.value)} className={inputClass} />
            </label>
            <button type="submit" className="w-full rounded-xl bg-[#c6302c] px-4 py-3 font-semibold text-white disabled:opacity-50" disabled={ocupado || cargando}>{ocupado ? 'Guardando…' : 'Registrar ingreso'}</button>
          </fieldset>
        </form>
        <div className="editorial-card min-w-0" aria-busy={cargando}>
          <div className="mb-4">
            <h2 className="section-title text-lg">Ingresos de {periodo}</h2>
            <p className="mt-1 text-2xl font-bold text-green-700">{formatearMoneda(total)}</p>
            <p className="text-xs text-gray-500">{ingresos.length} {ingresos.length === 1 ? 'registro' : 'registros'}</p>
          </div>
          {ingresos.length ? <ul className="divide-y divide-gray-100">
            {ingresos.map((ingreso) => <li key={ingreso.id} className="py-4 first:pt-0">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">{ingreso.concepto}</p>
                  <p className="mt-1 text-xs text-gray-500">{formatearFechaInsumo(ingreso.fecha)} · {ingreso.metodo_pago}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-green-700">+{formatearMoneda(ingreso.monto)}</p>
              </div>
              {ingreso.notas && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-gray-600">{ingreso.notas}</p>}
              <button type="button" onClick={() => eliminar(ingreso)} disabled={ocupado || cargando} aria-label={`Eliminar ingreso ${ingreso.concepto}`} className="mt-2 py-1 text-xs font-medium text-red-600 underline disabled:opacity-50">Eliminar</button>
            </li>)}
          </ul> : <p className="py-8 text-center text-sm text-gray-500">Sin ingresos extra en este periodo</p>}
        </div>
      </div>
    </section>
  )
}
