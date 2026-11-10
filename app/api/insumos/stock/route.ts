import { autorizarApp } from '../../../../scr/lib/appAuth'
import { listarInsumosConStock } from '../../../../scr/lib/calcularStock'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const acceso = await autorizarApp(req)
  if (acceso.response) return acceso.response
  const supabase = acceso.client

  try {
    const insumos =
      await listarInsumosConStock(supabase)

    return Response.json(insumos)
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'No se pudo cargar insumos' },
      { status: 500 }
    )
  }
}
