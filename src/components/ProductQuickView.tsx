'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, Minus, Plus, ShoppingBag, Heart, Shirt, ChevronLeft, ChevronRight } from 'lucide-react'
import { Product } from '@/lib/products'
import { FirestoreProduct } from '@/lib/firestore'

interface ProductQuickViewProps {
  product: Product | FirestoreProduct
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product | FirestoreProduct, quantity: number, size: string, color: string) => void
  onToggleWishlist: (productId: string) => void
  isWishlisted: boolean
}

export default function ProductQuickView({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onToggleWishlist,
  isWishlisted
}: ProductQuickViewProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '')
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '')
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAdded, setIsAdded] = useState(false)

  if (!isOpen) return null

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedSize, selectedColor)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const nextImage = () => {
    if (product.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
    }
  }

  const prevImage = () => {
    if (product.images && product.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[900px] md:max-w-[90vw] md:max-h-[85vh] bg-white rounded-2xl z-50 overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center z-10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex flex-col md:flex-row h-full max-h-[calc(100vh-2rem)] md:max-h-[85vh]">
          {/* Image Section */}
          <div className="relative w-full md:w-1/2 bg-gray-100">
            <div className="aspect-square md:aspect-auto md:h-full relative">
              {product.images && product.images[currentImageIndex] ? (
                <Image
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shirt className="w-24 h-24 text-gray-300" />
                </div>
              )}

              {/* Image Navigation */}
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentImageIndex ? 'bg-gold' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Sale Badge */}
              {product.originalPrice && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SALE
                </span>
              )}

              {/* Low Stock Badge */}
              {product.stockQty > 0 && product.stockQty <= 5 && (
                <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Only {product.stockQty} left!
                </span>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              {/* Brand & Name */}
              <div>
                <p className="text-gold font-medium text-sm">{product.brand}</p>
                <h2 className="text-2xl font-bold text-navy">{product.name}</h2>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-navy">
                  ₱{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ₱{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {product.description}
              </p>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-navy mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          selectedSize === size
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-navy mb-2">Color: {selectedColor}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                          selectedColor === color
                            ? 'border-gold bg-gold/10 text-gold font-medium'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="text-sm font-medium text-navy mb-2">Quantity</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {product.stockQty > 0 && (
                    <span className="text-sm text-gray-500">
                      {product.stockQty} available
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || product.stockQty === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
                    isAdded
                      ? 'bg-green-500 text-white'
                      : !product.inStock || product.stockQty === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gold text-navy hover:bg-yellow-400'
                  }`}
                >
                  {isAdded ? (
                    <>Added to Cart!</>
                  ) : !product.inStock || product.stockQty === 0 ? (
                    <>Out of Stock</>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      Add to Cart
                    </>
                  )}
                </button>
                <button
                  onClick={() => onToggleWishlist(product.id!)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
                    isWishlisted
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* View Full Details Link */}
              <Link
                href={`/shop/${product.id}`}
                onClick={onClose}
                className="block text-center text-gold hover:text-yellow-600 font-medium text-sm py-2"
              >
                View Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
