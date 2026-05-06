export default function TarefasLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="bg-gray-50 rounded-xl p-3 space-y-3">
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} className="bg-white rounded-lg p-3 space-y-2 border border-gray-200">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
