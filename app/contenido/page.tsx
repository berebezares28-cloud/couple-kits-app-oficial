export const dynamic = 'force-dynamic'

import { listarPublicacionesContenido } from '../../scr/lib/contenidoData'
import { supabase } from '../../scr/lib/supabase'
import ContenidoClient from './ContenidoClient'

export default async function ContenidoPage() {
  const publicaciones =
    await listarPublicacionesContenido(supabase)

  return (
    <ContenidoClient
      publicacionesIniciales={publicaciones}
    />
  )
}
