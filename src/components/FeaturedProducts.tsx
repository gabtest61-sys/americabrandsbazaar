'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Heart, Check, ArrowRight, Loader2 } from 'lucide-react'
import { FEATURED_PRODUCTS, formatPrice } from '@/lib/constants'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/components/Toast'
import { Product } from '@/lib/types'
import { getFirestoreProducts, FirestoreProduct } from '@/lib/firestore'

export default function FeaturedProducts() {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())
  const [featuredProducts, setFeaturedProducts] = useState<(FirestoreProduct | typeof FEATURED_PRODUCTS[0])[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const firestoreProducts = await getFirestoreProducts()
        // Filter for featured products from Firestore only
        const featured = firestoreProducts.filter(p => p.featured === true)
        setFeaturedProducts(featured.slice(0, 8))
      } catch {
        setFeaturedProducts([])
      }
      setLoading(false)
    }

    loadFeaturedProducts()
  }, [])

  const handleAddToCart = (product: FirestoreProduct | typeof FEATURED_PRODUCTS[0]) => {
    const productData: Product = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.images?.[0] || '/placeholder.jpg',
      category: product.category as 'clothes' | 'accessories' | 'shoes',
      sizes: product.sizes || [],
      colors: product.colors || [],
    }
    addItem(productData)

    setAddedProducts((prev) => new Set(prev).add(product.id))
    setTimeout(() => {
      setAddedProducts((prev) => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 2000)

    showToast('Added to cart', 'cart', product.name)
  }

  const toggleLike = (productId: string) => {
    setLikedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
        showToast('Removed from wishlist', 'success')
      } else {
        next.add(productId)
        showToast('Added to wishlist', 'success')
      }
      return next
    })
  }

  return (
    <section id="featured-products" className="section-padding bg-white">
      <div className="container-max">
        {/* Section Header */}
        <div className="mb-10">
          <span className="text-gold font-semibold text-sm tracking-wider uppercase mb-2 block">
            Curated Selection
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-navy">
            Featured Products
          </h2>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No featured products yet
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => {
              const isAdded = addedProducts.has(product.id)
              const isLiked = likedProducts.has(product.id)
              const hasImage = product.images && product.images.length > 0 && product.images[0]

              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.id}`}
                  className="group relative bg-gray-50 rounded-2xl overflow-hidden"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {hasImage ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
                          <span className="text-navy font-bold text-2xl">{product.brand.charAt(0)}</span>
                        </div>
                        <span className="text-gray-400 text-sm font-medium">
                          {product.brand}
                        </span>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="absolute top-3 left-3 bg-navy text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        toggleLike(product.id)
                      }}
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-10 ${
                        isLiked
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-white/90 backdrop-blur-sm text-gray-400 shadow-md opacity-0 group-hover:opacity-100 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>

                    {/* Quick Add Button */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleAddToCart(product)
                        }}
                        disabled={isAdded}
                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                          isAdded
                            ? 'bg-green-500 text-white'
                            : 'bg-navy text-white hover:bg-gold hover:text-navy'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-5 h-5" />
                            Added to Cart
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-5 h-5" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <span className="text-gold text-xs font-semibold tracking-wider uppercase">
                      {product.brand}
                    </span>
                    <h3 className="text-navy font-medium text-sm mt-1 line-clamp-2 min-h-[2.5rem] group-hover:text-gold transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-navy font-bold text-lg">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-gray-400 text-sm line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-3 bg-navy text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 hover:bg-gold hover:text-navy hover:shadow-xl"
          >
            Browse All Products
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
