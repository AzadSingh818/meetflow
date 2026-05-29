export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Greeting skeleton */}
      <div>
        <div className="h-7 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-40" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex-shrink-0" />
            <div>
              <div className="h-7 w-12 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Calendar skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
        <div className="h-96 bg-gray-100 rounded-lg" />
      </div>
    </div>
  )
}
