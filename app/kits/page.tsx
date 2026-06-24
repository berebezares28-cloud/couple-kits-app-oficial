export const dynamic = 'force-dynamic'

import { supabase } from '../../scr/lib/supabase'

export default async function KitsPage() {
  const { data: kits } = await supabase
    .from('kits')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">

        <h1
          className="editorial-title"
          style={{ color: '#c6302c' }}
        >
          KITS
        </h1>

        <p
          className="mt-1 mb-8"
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: '#888'
          }}
        >
          Catálogo activo
        </p>

        {kits?.length ? (
          kits.map((kit: any) => (
            <div
              key={kit.id}
              className="editorial-card mb-4"
            >
              <p className="customer-name">
                {kit.nombre}
              </p>

              {kit.descripcion && (
                <p className="mt-2 text-sm text-gray-600">
                  {kit.descripcion}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="editorial-card">
            No hay kits activos
          </div>
        )}

      </div>
    </main>
  )
}
