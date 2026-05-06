export default function ClientesLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
            <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
