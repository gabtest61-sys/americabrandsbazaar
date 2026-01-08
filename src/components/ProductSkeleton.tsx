'use client'

// Skeleton loader for product cards
export function ProductCardSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm flex animate-pulse">
        <div className="w-40 h-40 bg-gray-200 flex-shrink-0" />
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-1" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="h-6 bg-gray-200 rounded w-24" />
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[3/4] bg-gray-200" />
      <div className="p-4">
        <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Multiple skeleton cards
export function ProductGridSkeleton({ count = 8, viewMode = 'grid' }: { count?: number; viewMode?: 'grid' | 'list' }) {
  return (
    <div className={`grid gap-4 ${
      viewMode === 'grid'
        ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
        : 'grid-cols-1'
    }`}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  )
}

// Skeleton for product detail page
export function ProductDetailSkeleton() {
  return (
    <div className="container-max px-4 md:px-8 py-8 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image Gallery Skeleton */}
        <div className="lg:w-1/2">
          <div className="aspect-square bg-gray-200 rounded-2xl" />
          <div className="flex gap-2 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Details Skeleton */}
        <div className="lg:w-1/2 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />

          <div className="pt-4">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-12 h-10 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="pt-4">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-10 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <div className="flex-1 h-14 bg-gray-200 rounded-xl" />
            <div className="w-14 h-14 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton for order cards
export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-24" />
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="h-5 bg-gray-200 rounded w-28" />
        <div className="h-10 bg-gray-200 rounded-lg w-24" />
      </div>
    </div>
  )
}
