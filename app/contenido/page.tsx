export const dynamic = 'force-dynamic'

import { listarPublicacionesContenido } from '../../scr/lib/contenidoData'
import { exigirAppPagina } from '../../scr/lib/appAuth'
import ContenidoClient from './ContenidoClient'

export default async function ContenidoPage() {
  const { client: supabase } = await exigirAppPagina()

  const publicaciones =
    await listarPublicacionesContenido(supabase)

  return (
    <ContenidoClient
      publicacionesIniciales={publicaciones}
    />
  )
}
