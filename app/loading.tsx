export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50/60" aria-busy="true">
      <div className="max-w-md md:max-w-3xl lg:max-w-7xl mx-auto px-5 lg:px-8 pt-10 pb-24">
        <p role="status" className="text-sm font-semibold text-gray-600">Cargando…</p>
        <div aria-hidden="true" className="animate-pulse mt-6 space-y-5">
          <div className="h-10 w-2/3 max-w-sm rounded-lg bg-gray-200" />
          <div className="h-12 rounded-xl bg-gray-100" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl border border-gray-200 bg-white" />)}
          </div>
          <div className="h-64 rounded-2xl border border-gray-200 bg-white" />
        </div>
      </div>
    </main>
  )
}
