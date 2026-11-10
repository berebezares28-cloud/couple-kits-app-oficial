import { createHmac, timingSafeEqual } from 'node:crypto'

export function firmaTallyValida(payload: unknown, firma: string | null, secret: string): boolean {
  if (!firma || !/^[A-Za-z0-9+/]{43}=$/.test(firma) || !secret) return false
  // Tally firma JSON.stringify(payload), según su documentación oficial.
  const calculada = createHmac('sha256', secret).update(JSON.stringify(payload)).digest()
  const recibida = Buffer.from(firma, 'base64')
  return recibida.length === calculada.length && timingSafeEqual(recibida, calculada)
}
