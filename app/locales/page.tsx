export const dynamic = 'force-dynamic'

import { listarPuntosEntrega } from '../../scr/lib/puntosEntrega'
import { exigirAppPagina } from '../../scr/lib/appAuth'
import LocalesClient from './LocalesClient'

export default async function LocalesPage() {
  const { client: supabase } = await exigirAppPagina()

  const puntos = await listarPuntosEntrega(supabase)

  return <LocalesClient puntosIniciales={puntos} />
}
