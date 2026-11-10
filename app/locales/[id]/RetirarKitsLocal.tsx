'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { InventarioKitLocal, MovimientoKitLocal } from '../../../scr/lib/inventarioKitsLocal'
import { validarRetiroKitLocal, type RetiroKitLocal } from '../../../scr/lib/retirosKitsLocal'

const inputClass = 'mt-1 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c6302c]/30'

function hoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export default function RetirarKitsLocal({ puntoId, inventario, onRetiro }: {
  puntoId: string
  inventario: InventarioKitLocal[]
  onRetiro: (kitId: string, restante: number, movimiento: MovimientoKitLocal) => void
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [kitId, setKitId] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [fecha, setFecha] = useState(hoy)
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [sinConfirmar, setSinConfirmar] = useState(false)
  const [mensaje, setMensaje] = useState<{ error: boolean; texto: string } | null>(null)
  const intento = useRef<RetiroKitLocal | null>(null)
  const enviando = useRef(false)
  const seleccionado = inventario.find((kit) => kit.kit_id === kitId)

  function toggle() {
    if (!abierto && !intento.current) {
      setKitId(inventario[0]?.kit_id ?? '')
      setCantidad('1')
      setFecha(hoy())
      setMotivo('')
      setMensaje(null)
    }
    setAbierto(!abierto)
  }

  async function retirar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (enviando.current) return
    if (!intento.current) {
      const validacion = validarRetiroKitLocal({ operacion_id: crypto.randomUUID(), kit_id: kitId, cantidad: Number(cantidad), fecha, motivo })
      if (!validacion.ok) { setMensaje({ error: true, texto: validacion.error }); return }
      if (!seleccionado || validacion.retiro.cantidad > seleccionado.cantidad) {
        setMensaje({ error: true, texto: 'La cantidad supera los kits disponibles en este local' })
        return
      }
      intento.current = validacion.retiro
    }
    const retiro = intento.current
    enviando.current = true
    setGuardando(true)
    setMensaje(null)
    try {
      const res = await fetch(`/api/locales/${puntoId}/retiros`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(retiro)
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status < 500) {
          intento.current = null
          setSinConfirmar(false)
        } else setSinConfirmar(true)
        setMensaje({ error: true, texto: data.error || 'No se pudo confirmar el retiro. Reintenta con los mismos datos.' })
        return
      }
      const restante = Number(data.cantidad_restante)
      if (!data.movimiento_id || !Number.isFinite(restante) || restante < 0) throw new Error('Respuesta incompleta')
      onRetiro(retiro.kit_id, restante, {
        id: data.movimiento_id, kit_id: retiro.kit_id,
        kit_nombre: inventario.find((kit) => kit.kit_id === retiro.kit_id)?.kit_nombre ?? 'Kit',
        tipo: 'salida', cantidad: retiro.cantidad, fecha: retiro.fecha,
        motivo: 'Retiro sin venta', notas: retiro.motivo
      })
      intento.current = null
      setSinConfirmar(false)
      setAbierto(false)
      setMensaje({ error: false, texto: 'Retiro registrado. Solo se descontaron los kits de este local.' })
      router.refresh()
    } catch {
      setSinConfirmar(true)
      setMensaje({ error: true, texto: 'No se pudo confirmar la respuesta. Reintenta sin cambiar los datos; el retiro no se descontará dos veces.' })
    } finally {
      enviando.current = false
      setGuardando(false)
    }
  }

  return <section aria-label="Retiro sin venta" className="mb-4">
    <button type="button" onClick={toggle} disabled={guardando || (!inventario.length && !sinConfirmar)} aria-expanded={abierto}
      className="w-full rounded-lg border border-[#c6302c]/30 bg-red-50 px-3 py-2.5 text-sm font-semibold text-[#a82622] disabled:opacity-50">
      {abierto ? 'Cerrar retiro' : sinConfirmar ? 'Confirmar retiro pendiente' : 'Retirar kits sin venta'}
    </button>
    {mensaje && <p role={mensaje.error ? 'alert' : 'status'} className={`mt-2 rounded-lg p-3 text-sm ${mensaje.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{mensaje.texto}</p>}
    {abierto && <form onSubmit={retirar} className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h3 className="font-semibold text-sm">Retiro sin venta</h3>
      <p className="text-xs leading-relaxed text-gray-600">Reduce únicamente el inventario de este local. No registra ingresos, comisiones ni consumo de insumos.</p>
      <fieldset disabled={guardando || sinConfirmar} className="space-y-3 disabled:opacity-60">
        <label htmlFor="retiro-kit" className="block text-sm font-medium">Kit
          <select id="retiro-kit" required value={kitId} onChange={(e) => setKitId(e.target.value)} className={inputClass}>
            {inventario.map((kit) => <option key={kit.kit_id} value={kit.kit_id}>{kit.kit_nombre} · {kit.cantidad} disponibles</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label htmlFor="retiro-cantidad" className="block min-w-0 text-sm font-medium">Cantidad
            <input id="retiro-cantidad" required type="number" inputMode="numeric" min="1" step="1" max={seleccionado?.cantidad} value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={inputClass} />
          </label>
          <label htmlFor="retiro-fecha" className="block min-w-0 text-sm font-medium">Fecha
            <input id="retiro-fecha" required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
          </label>
        </div>
        <label htmlFor="retiro-motivo" className="block text-sm font-medium">Motivo del retiro
          <textarea id="retiro-motivo" required maxLength={1000} rows={2} placeholder="Ej. Regreso al taller, muestra o kit dañado" value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputClass} />
        </label>
      </fieldset>
      <button type="submit" disabled={guardando} className="w-full rounded-lg bg-[#c6302c] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {guardando ? 'Confirmando…' : sinConfirmar ? 'Reintentar confirmación' : 'Confirmar retiro sin venta'}
      </button>
    </form>}
  </section>
}
