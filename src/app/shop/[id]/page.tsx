'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
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
  Wand2,
} from 'lucide-react'
import AIChatBubble from '@/components/AIChatBubble'
import ProductTryOn from '@/components/ProductTryOn'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ReviewSection from '@/components/ReviewSection'
import Breadcrumb from '@/components/Breadcrumb'
import { ProductDetailSkeleton } from '@/components/ProductSkeleton'
import { Product } from '@/lib/products'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { getWishlist, addToWishlist, removeFromWishlist, getFirestoreProductById, getFirestoreProducts, getProductTryOns, FirestoreProduct, TryOnResult } from '@/lib/firestore'

const COLOR_MAP: Record<string, string> = {
  black: '#1a1a1a', white: '#f5f5f5', red: '#e53935', blue: '#1e3a8a',
  navy: '#0f2044', green: '#2e7d32', yellow: '#fdd835', orange: '#ef6c00',
  pink: '#e91e8c', purple: '#7b1fa2', gray: '#757575', grey: '#757575',
  brown: '#5d4037', beige: '#d7c4a3', cream: '#f5f0e8', gold: '#c9a84c',
  silver: '#9e9e9e', khaki: '#c8b400', olive: '#6d6b2e', maroon: '#800000',
  teal: '#00695c', coral: '#ff6f61', tan: '#d2b48c', lavender: '#b39ddb',
  mint: '#98f0c3', charcoal: '#36454f', ivory: '#fffff0', rose: '#f06292',
}

const sizeGuideData = {
  clothes: {
    headers: ['Size', 'Chest (in)', 'Waist (in)', 'Hip (in)'],
    rows: [
      ['XS', '32-34', '26-28', '34-36'], ['S', '34-36', '28-30', '36-38'],
      ['M', '38-40', '32-34', '40-42'], ['L', '42-44', '36-38', '44-46'],
      ['XL', '46-48', '40-42', '48-50'], ['XXL', '50-52', '44-46', '52-54'],
    ]
  },
  shoes: {
    headers: ['US', 'UK', 'EU', 'CM'],
    rows: [
      ['6', '5.5', '39', '24'], ['7', '6.5', '40', '25'], ['8', '7.5', '41', '26'],
      ['9', '8.5', '42', '27'], ['10', '9.5', '43', '28'], ['11', '10.5', '44', '29'],
      ['12', '11.5', '45', '30'],
    ]
  },
  accessories: {
    headers: ['Size', 'Waist (in)'],
    rows: [['S', '28-30'], ['M', '32-34'], ['L', '36-38'], ['XL', '40-42']]
  }
}

export default function ProductDetailPage() {
  const params = useParams()
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
  const [customerTryOns, setCustomerTryOns] = useState<TryOnResult[]>([])
  const [tryOnLightbox, setTryOnLightbox] = useState<string | null>(null)
  const [triggerTryOn, setTriggerTryOn] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      const productId = params.id as string
      setLoading(true)
      const foundProduct: Product | FirestoreProduct | null = await getFirestoreProductById(productId)
      if (foundProduct) {
        setProduct(foundProduct)
        setSelectedColor(foundProduct.colors?.[0] || '')
        setSelectedSize(foundProduct.sizes?.[0] || '')
        setSelectedImageIndex(0)
        const allFirestoreProducts = await getFirestoreProducts()
        const related = allFirestoreProducts
          .filter(p => p.category === foundProduct!.category && p.id !== foundProduct!.id)
          .slice(0, 4)
        setRelatedProducts(related)
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
        const filtered = viewed.filter((id: string) => id !== productId)
        const updated = [productId, ...filtered].slice(0, 8)
        localStorage.setItem('recentlyViewed', JSON.stringify(updated))
        const recentIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]') as string[]
        const recentProds = allFirestoreProducts
          .filter(p => p.id && recentIds.includes(p.id) && p.id !== productId)
          .slice(0, 4)
        setRecentlyViewed(recentProds)
        const tryOns = await getProductTryOns(productId)
        setCustomerTryOns(tryOns)
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
    if (!product.inStock || product.stockQty === 0) return
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.images?.[0] || '/placeholder.jpg',
      category: product.category as 'clothes' | 'accessories' | 'shoes',
      sizes: product.sizes || [],
      colors: product.colors || [],
    }, quantity, selectedSize, selectedColor)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const toggleWishlist = async () => {
    if (!product || !product.id) return
    const productId = product.id
    if (user) {
      if (isWishlisted) await removeFromWishlist(user.id, productId)
      else await addToWishlist(user.id, productId)
    } else {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      const updated = isWishlisted ? wishlist.filter((id: string) => id !== productId) : [...wishlist, productId]
      localStorage.setItem('wishlist', JSON.stringify(updated))
    }
    setIsWishlisted(!isWishlisted)
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white pt-[72px]">
          <ProductDetailSkeleton />
        </main>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white pt-[72px]">
          <div className="container-max px-4 py-20 text-center">
            <Shirt className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-navy mb-2">Product Not Found</h1>
            <p className="text-gray-400 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/shop" className="text-gold hover:underline font-medium">← Back to Shop</Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const hasImages = product.images && product.images.length > 0 && product.images[0]
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.originalPrice!) * 100) : 0
  const sizeGuide = sizeGuideData[product.category as keyof typeof sizeGuideData] || sizeGuideData.clothes

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white pt-[72px] md:pt-[100px]">

        {/* ── PRODUCT HERO ── */}
        <div className="container-max px-4 md:px-8 py-4 md:py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb
              items={[
                { label: 'Shop', href: '/shop' },
                { label: product.category.charAt(0).toUpperCase() + product.category.slice(1), href: `/shop?category=${product.category}` },
                { label: product.name }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 md:gap-8 lg:gap-14 items-start">

            {/* LEFT — image */}
            <div className="space-y-3">
              <div
                className="relative w-full aspect-[4/5] bg-[#f5f3f0] rounded-2xl overflow-hidden cursor-zoom-in group"
                onClick={() => setShowZoom(true)}
              >
                {hasImages ? (
                  <Image
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-28 h-28 rounded-full bg-white shadow flex items-center justify-center mb-3 mx-auto">
                        <span className="text-navy font-bold text-5xl">{product.brand.charAt(0)}</span>
                      </div>
                      <span className="text-gray-400 font-medium">{product.brand}</span>
                    </div>
                  </div>
                )}
                {hasDiscount && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10">
                    -{discountPct}% OFF
                  </span>
                )}
                <div className="absolute bottom-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow z-10">
                  <ZoomIn className="w-4 h-4 text-navy" />
                </div>
              </div>

              {/* Thumbnails */}
              {hasImages && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImageIndex === idx ? 'border-gold' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

          {/* RIGHT — info */}
          <div className="space-y-6">

              {/* Brand + Name */}
              <div>
                <p className="text-gold text-xs font-bold tracking-[0.25em] uppercase mb-2">{product.brand}</p>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-navy leading-tight mb-3 capitalize">{product.name}</h1>
                {product.description && (
                  <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl md:text-3xl font-bold text-navy">₱{product.price.toLocaleString()}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-300 line-through">₱{product.originalPrice!.toLocaleString()}</span>
                    <span className="text-xs font-bold bg-red-50 text-red-500 px-2.5 py-1 rounded-full">
                      Save ₱{(product.originalPrice! - product.price).toLocaleString()}
                    </span>
                  </>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Color */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-navy">Color</span>
                    <span className="text-sm text-gray-400">— {selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((color) => {
                      const cssColor = COLOR_MAP[color.toLowerCase()] || null
                      const isSelected = selectedColor === color
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                          className={`group relative flex items-center gap-2 rounded-full border-2 transition-all ${
                            isSelected ? 'border-navy' : 'border-gray-200 hover:border-gray-300'
                          } ${cssColor ? 'p-1 pr-3' : 'px-4 py-2'}`}
                        >
                          {cssColor && (
                            <span
                              className={`w-5 h-5 rounded-full border flex-shrink-0 ${isSelected ? 'ring-2 ring-offset-1 ring-navy' : ''}`}
                              style={{ backgroundColor: cssColor, borderColor: cssColor === '#f5f5f5' ? '#d1d5db' : cssColor }}
                            />
                          )}
                          <span className={`text-xs font-medium capitalize ${isSelected ? 'text-navy' : 'text-gray-500'}`}>
                            {color}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-navy" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Size */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-navy">Size</span>
                      <span className="text-sm text-gray-400">— {selectedSize}</span>
                    </div>
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 font-medium"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[44px] h-11 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          selectedSize === size
                            ? 'border-navy bg-navy text-white'
                            : 'border-gray-200 text-gray-600 hover:border-navy/40'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <span className="text-sm font-semibold text-navy mb-3 block">Quantity</span>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-navy" />
                    </button>
                    <span className="w-12 text-center font-bold text-navy">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-navy" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-400">{product.stockQty} in stock</span>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-2.5 pt-1">
              <ProductTryOn product={product as any} triggerOpen={triggerTryOn} onTriggerHandled={() => setTriggerTryOn(false)} />
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdded || !product.inStock || product.stockQty === 0}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-base transition-all shadow-sm ${
                    isAdded
                      ? 'bg-green-500 text-white shadow-green-200'
                      : !product.inStock || product.stockQty === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-navy text-white hover:bg-navy/90 shadow-navy/20 active:scale-[0.98]'
                  }`}
                >
                  {isAdded ? (
                    <><Check className="w-5 h-5" /> Added to Cart</>
                  ) : !product.inStock || product.stockQty === 0 ? (
                    <>Out of Stock</>
                  ) : (
                    <><ShoppingBag className="w-5 h-5" /> Add to Cart</>
                  )}
                </button>
                <button
                  onClick={toggleWishlist}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isWishlisted
                      ? 'bg-red-50 border-red-400 text-red-500'
                      : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
              </div>{/* end CTA */}

              {/* Trust strip */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                <div className="flex flex-col items-center gap-1 py-3 px-1 md:gap-1.5 md:py-4 md:px-2">
                  <Truck className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                  <p className="text-[10px] md:text-xs font-semibold text-navy text-center">Free Shipping</p>
                  <p className="text-[9px] md:text-[11px] text-gray-400 text-center hidden sm:block">Orders over ₱2,000</p>
                </div>
                <div className="flex flex-col items-center gap-1 py-3 px-1 md:gap-1.5 md:py-4 md:px-2">
                  <Shield className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                  <p className="text-[10px] md:text-xs font-semibold text-navy text-center">100% Authentic</p>
                  <p className="text-[9px] md:text-[11px] text-gray-400 text-center hidden sm:block">Guaranteed original</p>
                </div>
                <div className="flex flex-col items-center gap-1 py-3 px-1 md:gap-1.5 md:py-4 md:px-2">
                  <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                  <p className="text-[10px] md:text-xs font-semibold text-navy text-center">Easy Returns</p>
                  <p className="text-[9px] md:text-[11px] text-gray-400 text-center hidden sm:block">7-day policy</p>
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-400 text-xs rounded-full border border-gray-100 capitalize">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
          </div>{/* end right info */}
          </div>{/* end grid */}
        </div>{/* end container */}

        {/* ── LOWER SECTIONS ── */}
        <div className="container-max px-4 md:px-8 py-6 md:py-12">

          {/* ── CUSTOMER TRY-ONS ── */}
          <section className="mt-10 md:mt-16">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Wand2 className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h2 className="text-base md:text-xl font-bold text-navy leading-tight">Customer Try-Ons</h2>
                  <p className="text-xs text-gray-400">Real people wearing this with AI</p>
                </div>
              </div>
              {customerTryOns.length > 0 && (
                <span className="text-xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-full">
                  {customerTryOns.length} look{customerTryOns.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {customerTryOns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 md:py-14 px-6 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-navy text-sm">No try-ons yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">Be the first! Try this on and your look will appear here.</p>
                </div>
                <button
                  onClick={() => setTriggerTryOn(true)}
                  className="mt-1 inline-flex items-center gap-2 bg-navy text-white text-xs font-semibold px-5 py-2.5 rounded-full hover:bg-navy/90 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Try It On
                </button>
              </div>
            ) : (
              /* Scrollable row on mobile, wrapped grid on desktop */
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-4 lg:grid-cols-5 md:overflow-visible md:pb-0">
                {customerTryOns.map((tryon) => (
                  <button
                    key={tryon.id}
                    onClick={() => setTryOnLightbox(tryon.imageUrl)}
                    className="group relative flex-shrink-0 w-36 md:w-auto aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Image
                      src={tryon.imageUrl}
                      alt="Customer try-on"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 144px, 20vw"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-white/90 text-navy text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <ZoomIn className="w-3 h-3" /> View
                      </span>
                    </div>
                    {/* AI badge */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-black/50 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-gold fill-gold" /> AI
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── RELATED PRODUCTS ── */}
          {relatedProducts.length > 0 && (
            <section className="mt-10 md:mt-20">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-navy">You May Also Like</h2>
                <Link href={`/shop?category=${product.category}`} className="text-sm text-gold hover:underline font-medium">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((item) => {
                  const itemHasImage = item.images && item.images.length > 0 && item.images[0]
                  const itemDiscount = item.originalPrice && item.originalPrice > item.price
                  return (
                    <Link
                      key={item.id}
                      href={`/shop/${item.id}`}
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                        {itemHasImage ? (
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                              <span className="text-navy font-bold text-xl">{item.brand.charAt(0)}</span>
                            </div>
                          </div>
                        )}
                        {itemDiscount && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
                            -{Math.round((1 - item.price / item.originalPrice!) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="p-3.5">
                        <p className="text-[10px] text-gold font-bold tracking-wider uppercase mb-1">{item.brand}</p>
                        <h3 className="text-sm font-medium text-navy line-clamp-2 mb-2 group-hover:text-gold transition-colors leading-snug">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy text-sm">₱{item.price.toLocaleString()}</span>
                          {itemDiscount && (
                            <span className="text-xs text-gray-300 line-through">₱{item.originalPrice!.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}



          {/* ── RECENTLY VIEWED ── */}
          {recentlyViewed.length > 0 && (
            <section className="mt-10 md:mt-16">
              <h2 className="text-lg md:text-xl font-bold text-navy mb-4 md:mb-6">Recently Viewed</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentlyViewed.map((item) => {
                  const itemHasImage = item.images && item.images.length > 0 && item.images[0]
                  return (
                    <Link
                      key={item.id}
                      href={`/shop/${item.id}`}
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                        {itemHasImage ? (
                          <Image src={item.images[0]} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center">
                              <span className="text-navy font-bold text-xl">{item.brand.charAt(0)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-3.5">
                        <p className="text-[10px] text-gold font-bold tracking-wider uppercase mb-1">{item.brand}</p>
                        <h3 className="text-sm font-medium text-navy line-clamp-2 mb-2 group-hover:text-gold transition-colors leading-snug">{item.name}</h3>
                        <span className="font-bold text-navy text-sm">₱{item.price.toLocaleString()}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Reviews */}
          {product.id && <ReviewSection productId={product.id} />}

        </div>{/* end lower sections */}

        {/* ── SIZE GUIDE MODAL ── */}
        {showSizeGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSizeGuide(false)} />
            <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-navy">Size Guide</h3>
                <button onClick={() => setShowSizeGuide(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy/5">
                      {sizeGuide.headers.map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-navy">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeGuide.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-3 text-gray-600">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-4">* Measurements are approximate.</p>
            </div>
          </div>
        )}

        {/* ── ZOOM MODAL ── */}
        {showZoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 cursor-zoom-out" onClick={() => setShowZoom(false)}>
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-10 transition-colors">
              <X className="w-5 h-5" />
            </button>
            {hasImages ? (
              <div className="relative w-[90vmin] h-[90vmin] max-w-4xl">
                <Image src={product.images[selectedImageIndex]} alt={product.name} fill className="object-contain" sizes="90vmin" />
              </div>
            ) : (
              <div className="w-[70vmin] h-[70vmin] bg-white/5 rounded-3xl flex items-center justify-center">
                <span className="text-white font-bold text-8xl">{product.brand.charAt(0)}</span>
              </div>
            )}
          </div>
        )}
        {/* ── TRY-ON LIGHTBOX ── */}
        {tryOnLightbox && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setTryOnLightbox(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-10 transition-colors"
              onClick={() => setTryOnLightbox(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <div
              className="relative max-h-[90dvh] max-w-sm w-full rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={tryOnLightbox}
                alt="Customer try-on"
                width={480}
                height={640}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
      <AIChatBubble />
    </>
  )
}
