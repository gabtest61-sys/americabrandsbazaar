'use client'

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-square bg-gradient-to-br from-white/5 to-white/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-3">
        {/* Brand */}
        <div className="h-3 bg-white/10 rounded w-16 mb-1" />
        {/* Product name */}
        <div className="h-4 bg-white/10 rounded w-full mb-2" />
        {/* Price */}
        <div className="h-5 bg-gold/20 rounded w-20 mb-2" />
        {/* Styling note */}
        <div className="h-3 bg-white/10 rounded w-full mb-1" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
      </div>
    </div>
  )
}
