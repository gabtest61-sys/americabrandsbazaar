'use client'

import ProductCardSkeleton from './ProductCardSkeleton'

export default function ResultsSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Stylist message skeleton */}
      <div className="text-center mb-8">
        <div className="h-6 bg-white/10 rounded-lg w-64 mx-auto mb-2" />
        <div className="h-4 bg-white/10 rounded-lg w-96 mx-auto" />
      </div>

      {/* Look tabs skeleton */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-24 h-10 bg-white/10 rounded-full"
          />
        ))}
      </div>

      {/* Look card skeleton */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
        {/* Look header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="h-6 bg-white/10 rounded w-48 mb-2" />
            <div className="h-4 bg-white/10 rounded w-72" />
          </div>
          <div className="h-8 bg-white/10 rounded w-24" />
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>

        {/* Style tip skeleton */}
        <div className="bg-gold/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-gold/30 rounded" />
            <div className="h-4 bg-gold/30 rounded w-20" />
          </div>
          <div className="h-4 bg-gold/20 rounded w-full mb-1" />
          <div className="h-4 bg-gold/20 rounded w-3/4" />
        </div>

        {/* Actions skeleton */}
        <div className="flex flex-wrap gap-3 justify-center">
          <div className="h-12 bg-gold/30 rounded-full w-48" />
          <div className="h-12 bg-white/10 rounded-full w-32" />
          <div className="h-12 bg-white/10 rounded-full w-32" />
        </div>
      </div>
    </div>
  )
}
