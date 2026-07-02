export default function ProcessosV2Loading() {
  return (
    <div className="page-enter px-6 py-8 xl:px-10 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-3">
          <div className="h-3 w-32 skeleton-shimmer rounded" />
          <div className="h-8 w-48 skeleton-shimmer rounded" />
          <div className="h-3 w-72 skeleton-shimmer rounded" />
        </div>
        <div className="h-10 w-40 skeleton-shimmer rounded-xl" />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-3xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="h-11 w-11 skeleton-shimmer rounded-2xl" />
              <div className="h-3 w-16 skeleton-shimmer rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-20 skeleton-shimmer rounded" />
              <div className="h-3 w-28 skeleton-shimmer rounded" />
            </div>
            <div className="h-1.5 w-full skeleton-shimmer rounded-full" />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex gap-3">
          <div className="h-10 flex-1 skeleton-shimmer rounded-xl" />
          <div className="h-10 w-44 skeleton-shimmer rounded-xl" />
          <div className="h-10 w-20 skeleton-shimmer rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-28 skeleton-shimmer rounded-full" />
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="border-b border-white/8 px-5 py-4 flex items-center justify-between">
          <div className="h-4 w-44 skeleton-shimmer rounded" />
          <div className="h-3 w-32 skeleton-shimmer rounded" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/[0.05] px-5 py-4">
            <div className="h-4 w-4 skeleton-shimmer rounded" />
            <div className="h-9 w-9 skeleton-shimmer rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-40 skeleton-shimmer rounded" />
              <div className="h-3 w-56 skeleton-shimmer rounded" />
            </div>
            <div className="h-6 w-24 skeleton-shimmer rounded-full hidden md:block" />
            <div className="h-6 w-28 skeleton-shimmer rounded-full hidden lg:block" />
            <div className="h-6 w-24 skeleton-shimmer rounded-full" />
            <div className="h-7 w-16 skeleton-shimmer rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
