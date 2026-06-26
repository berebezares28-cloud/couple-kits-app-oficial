export const dynamic = 'force-dynamic'

import { listarPuntosEntrega } from '../../scr/lib/puntosEntrega'
import { supabase } from '../../scr/lib/supabase'
import LocalesClient from './LocalesClient'

export default async function LocalesPage() {
  const puntos = await listarPuntosEntrega(supabase)

  return <LocalesClient puntosIniciales={puntos} />
}
