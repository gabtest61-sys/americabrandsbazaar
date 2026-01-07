'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronRight,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Ruler,
  X,
  Star,
  Shirt,
  ZoomIn,
  Loader2
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ReviewSection from '@/components/ReviewSection'
import { getProductById, Product } from '@/lib/products'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { getWishlist, addToWishlist, removeFromWishlist, getFirestoreProductById, getFirestoreProducts, FirestoreProduct } from '@/lib/firestore'

// Size guide data
const sizeGuideData = {
  clothes: {
    headers: ['Size', 'Chest (in)', 'Waist (in)', 'Hip (in)'],
    rows: [
      ['XS', '32-34', '26-28', '34-36'],
      ['S', '34-36', '28-30', '36-38'],
      ['M', '38-40', '32-34', '40-42'],
      ['L', '42-44', '36-38', '44-46'],
      ['XL', '46-48', '40-42', '48-50'],
      ['XXL', '50-52', '44-46', '52-54'],
    ]
  },
  shoes: {
    headers: ['US', 'UK', 'EU', 'CM'],
    rows: [
      ['6', '5.5', '39', '24'],
      ['7', '6.5', '40', '25'],
      ['8', '7.5', '41', '26'],
      ['9', '8.5', '42', '27'],
      ['10', '9.5', '43', '28'],
      ['11', '10.5', '44', '29'],
      ['12', '11.5', '45', '30'],
    ]
  },
  accessories: {
    headers: ['Size', 'Waist (in)'],
    rows: [
      ['S', '28-30'],
      ['M', '32-34'],
      ['L', '36-38'],
      ['XL', '40-42'],
    ]
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const { user } = useAuth()

  const [product, setProduct] = useState<Product | FirestoreProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState<FirestoreProduct[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<FirestoreProduct[]>([])

  useEffect(() => {
    const loadProduct = async () => {
      const productId = params.id as string
      setLoading(true)

      // Try Firestore first, then fallback to static products
      let foundProduct: Product | FirestoreProduct | null = await getFirestoreProductById(productId)

      if (!foundProduct) {
        foundProduct = getProductById(productId) || null
      }

      if (foundProduct) {
        setProduct(foundProduct)
        setSelectedColor(foundProduct.colors?.[0] || '')
        setSelectedSize(foundProduct.sizes?.[0] || '')
        setSelectedImageIndex(0)

        // Get related products from Firestore (same category, different product)
        const allFirestoreProducts = await getFirestoreProducts()
        const related = allFirestoreProducts
          .filter(p => p.category === foundProduct!.category && p.id !== foundProduct!.id)
          .slice(0, 4)
        setRelatedProducts(related)

        // Save to recently viewed (localStorage)
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
        const filtered = viewed.filter((id: string) => id !== productId)
        const updated = [productId, ...filtered].slice(0, 8)
        localStorage.setItem('recentlyViewed', JSON.stringify(updated))

        // Load recently viewed products from Firestore
        const recentIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]') as string[]
        const recentProds = allFirestoreProducts
          .filter(p => p.id && recentIds.includes(p.id) && p.id !== productId)
          .slice(0, 4)
        setRecentlyViewed(recentProds)

        // Check if wishlisted (from Firestore if logged in, otherwise localStorage)
        if (user) {
          const wishlist = await getWishlist(user.id)
          setIsWishlisted(wishlist.includes(productId))
        } else {
          const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
          setIsWishlisted(wishlist.includes(productId))
        }
      }

      setLoading(false)
    }

    loadProduct()
  }, [params.id, user])

  const handleAddToCart = () => {
    if (!product || !product.id) return

    const cartProduct = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.images?.[0] || '/placeholder.jpg',
      category: product.category,
      sizes: product.sizes || [],
      colors: product.colors || [],
    }

    addItem(cartProduct, quantity, selectedSize, selectedColor)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const toggleWishlist = async () => {
    if (!product || !product.id) return

    const productId = product.id

    if (user) {
      // Use Firestore for logged in users
      if (isWishlisted) {
        await removeFromWishlist(user.id, productId)
      } else {
        await addToWishlist(user.id, productId)
      }
    } else {
      // Use localStorage for guests
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      let updated: string[]

      if (isWishlisted) {
        updated = wishlist.filter((id: string) => id !== productId)
      } else {
        updated = [...wishlist, productId]
      }

      localStorage.setItem('wishlist', JSON.stringify(updated))
    }

    setIsWishlisted(!isWishlisted)
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </main>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pt-24">
          <div className="container-max px-4 py-16 text-center">
            <Shirt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy mb-2">Product Not Found</h1>
            <p className="text-gray-500 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/shop" className="text-gold hover:underline">
              Back to Shop
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const hasImages = product.images && product.images.length > 0 && product.images[0]

  const sizeGuide = sizeGuideData[product.category] || sizeGuideData.clothes

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24">
        {/* Breadcrumbs */}
        <div className="bg-white border-b">
          <div className="container-max px-4 md:px-8 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gold">Home</Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link href="/shop" className="text-gray-500 hover:text-gold">Shop</Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link href={`/shop?category=${product.category}`} className="text-gray-500 hover:text-gold capitalize">
                {product.category}
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-navy font-medium truncate max-w-[200px]">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="container-max px-4 md:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image */}
            <div className="space-y-4">
              <div
                className="relative aspect-square bg-white rounded-2xl overflow-hidden cursor-zoom-in group"
                onClick={() => setShowZoom(true)}
              >
                {hasImages ? (
                  <Image
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                        <span className="text-navy font-bold text-5xl">{product.brand.charAt(0)}</span>
                      </div>
                      <span className="text-gray-400 text-lg font-medium">{product.brand}</span>
                    </div>
                  </div>
                )}

                {/* Sale Badge */}
                {product.originalPrice && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full z-10">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </span>
                )}

                {/* Zoom Icon */}
                <div className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10">
                  <ZoomIn className="w-5 h-5 text-navy" />
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {hasImages && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx ? 'border-gold' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Brand & Name */}
              <div>
                <p className="text-gold font-semibold text-sm tracking-wider uppercase mb-2">
                  {product.brand}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-navy mb-3">
                  {product.name}
                </h1>
                <p className="text-gray-600">{product.description}</p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-navy">
                  ₱{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    ₱{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Color Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-navy">Color: {selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedColor === color
                          ? 'border-gold bg-gold/10 text-navy'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-navy">Size: {selectedSize}</span>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="flex items-center gap-1 text-sm text-gold hover:text-yellow-600"
                  >
                    <Ruler className="w-4 h-4" />
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedSize === size
                          ? 'border-gold bg-gold/10 text-navy'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <span className="text-sm font-medium text-navy mb-3 block">Quantity</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.stockQty} items available
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdded}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-full font-semibold transition-all ${
                    isAdded
                      ? 'bg-green-500 text-white'
                      : 'bg-gold text-navy hover:bg-yellow-400'
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
                <button
                  onClick={toggleWishlist}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all ${
                    isWishlisted
                      ? 'bg-red-50 border-red-500 text-red-500'
                      : 'border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-gold" />
                  <p className="text-xs text-gray-600">Free Shipping</p>
                  <p className="text-xs text-gray-400">Orders over ₱2,000</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-gold" />
                  <p className="text-xs text-gray-600">Authentic</p>
                  <p className="text-xs text-gray-400">100% Original</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-gold" />
                  <p className="text-xs text-gray-600">Easy Returns</p>
                  <p className="text-xs text-gray-400">7-day policy</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-4">
                {product.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-navy mb-6">Related Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((item) => {
                  const itemHasImage = item.images && item.images.length > 0 && item.images[0]
                  return (
                    <Link
                      key={item.id}
                      href={`/shop/${item.id}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                        {itemHasImage ? (
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                              <span className="text-navy font-bold text-xl">{item.brand.charAt(0)}</span>
                            </div>
                          </div>
                        )}
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                            SALE
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-gold font-medium mb-1">{item.brand}</p>
                        <h3 className="text-sm font-medium text-navy line-clamp-2 mb-2 group-hover:text-gold transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy">₱{item.price.toLocaleString()}</span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-xs text-gray-400 line-through">
                              ₱{item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-navy mb-6">Recently Viewed</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentlyViewed.map((item) => {
                  const itemHasImage = item.images && item.images.length > 0 && item.images[0]
                  return (
                    <Link
                      key={item.id}
                      href={`/shop/${item.id}`}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                        {itemHasImage ? (
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                              <span className="text-navy font-bold text-xl">{item.brand.charAt(0)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-gold font-medium mb-1">{item.brand}</p>
                        <h3 className="text-sm font-medium text-navy line-clamp-2 mb-2 group-hover:text-gold transition-colors">
                          {item.name}
                        </h3>
                        <span className="font-bold text-navy">₱{item.price.toLocaleString()}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Reviews Section */}
          {product.id && <ReviewSection productId={product.id} />}
        </div>

        {/* Size Guide Modal */}
        {showSizeGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowSizeGuide(false)} />
            <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-navy">Size Guide</h3>
                <button onClick={() => setShowSizeGuide(false)}>
                  <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      {sizeGuide.headers.map((header) => (
                        <th key={header} className="px-4 py-3 text-left font-semibold text-navy">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGuide.rows.map((row, i) => (
                      <tr key={i} className="border-b">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-3">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                * Measurements are approximate. For best fit, please refer to specific product measurements when available.
              </p>
            </div>
          </div>
        )}

        {/* Image Zoom Modal */}
        {showZoom && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-zoom-out"
            onClick={() => setShowZoom(false)}
          >
            <button
              className="absolute top-4 right-4 text-white z-10"
              onClick={() => setShowZoom(false)}
            >
              <X className="w-8 h-8" />
            </button>
            {hasImages ? (
              <div className="relative w-[90vmin] h-[90vmin] max-w-4xl max-h-4xl">
                <Image
                  src={product.images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="90vmin"
                />
              </div>
            ) : (
              <div className="w-[80vmin] h-[80vmin] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-48 h-48 rounded-full bg-white shadow-xl flex items-center justify-center mb-6 mx-auto">
                    <span className="text-navy font-bold text-7xl">{product.brand.charAt(0)}</span>
                  </div>
                  <span className="text-gray-500 text-2xl font-medium">{product.brand}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
