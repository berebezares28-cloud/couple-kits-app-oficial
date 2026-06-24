export default function FinanzasPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pb-24 pt-8">

        <h1
          className="editorial-title"
          style={{ color: '#c6302c' }}
        >
          FINANZAS
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
          Studio
        </p>

        <div className="editorial-card text-center py-10">
          <p className="text-4xl mb-4">💰</p>

          <p className="customer-name mb-2">
            Próximamente
          </p>

          <p className="text-sm text-gray-500 leading-relaxed">
            Ingresos, gastos, utilidad, margen y
            comisiones llegarán en una siguiente
            versión.
          </p>
        </div>

      </div>
    </main>
  )
}
