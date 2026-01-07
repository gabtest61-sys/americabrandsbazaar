'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Shirt } from 'lucide-react'

interface ProductImageProps {
  src: string
  alt: string
  brand?: string
  category?: string
  className?: string
  priority?: boolean
}

export default function ProductImage({
  src,
  alt,
  brand,
  category,
  className = '',
  priority = false
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Get category icon
  const getCategoryIcon = () => {
    switch (category?.toLowerCase()) {
      case 'shoes':
        return '👟'
      case 'accessories':
        return '👜'
      default:
        return null
    }
  }

  // Get brand initial for fallback
  const getBrandInitial = () => {
    if (brand) {
      return brand.charAt(0).toUpperCase()
    }
    return '?'
  }

  // Get gradient based on brand
  const getBrandGradient = () => {
    const brandLower = brand?.toLowerCase() || ''
    if (brandLower.includes('calvin') || brandLower.includes('ck')) {
      return 'from-gray-800 to-gray-900'
    }
    if (brandLower.includes('nike')) {
      return 'from-orange-500 to-red-600'
    }
    if (brandLower.includes('ralph') || brandLower.includes('polo')) {
      return 'from-navy to-blue-900'
    }
    if (brandLower.includes('michael kors') || brandLower.includes('mk')) {
      return 'from-amber-600 to-amber-800'
    }
    if (brandLower.includes('gap')) {
      return 'from-blue-600 to-blue-800'
    }
    return 'from-gray-700 to-gray-800'
  }

  // Check if it's a valid image URL
  const isValidSrc = src && src !== '' && !src.includes('undefined')

  if (!isValidSrc || hasError) {
    return (
      <div className={`relative aspect-square bg-gradient-to-br ${getBrandGradient()} flex flex-col items-center justify-center ${className}`}>
        {getCategoryIcon() ? (
          <span className="text-4xl mb-1">{getCategoryIcon()}</span>
        ) : (
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2">
            {brand ? (
              <span className="text-white font-bold text-2xl">{getBrandInitial()}</span>
            ) : (
              <Shirt className="w-8 h-8 text-white/50" />
            )}
          </div>
        )}
        {brand && (
          <span className="text-white/60 text-xs font-medium">{brand}</span>
        )}
      </div>
    )
  }

  return (
    <div className={`relative aspect-square overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
              <Shirt className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        sizes="(max-width: 768px) 50vw, 25vw"
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}
