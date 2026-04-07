'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, X, ShoppingBag, Heart, ChevronDown, Grid, List, Shirt, Loader2, ChevronLeft, ChevronRight, Eye, Clock, Tag } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductQuickView from '@/components/ProductQuickView'
import { ProductGridSkeleton } from '@/components/ProductSkeleton'
import Breadcrumb from '@/components/Breadcrumb'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { products as staticProducts, brands, categories, Product } from '@/lib/products'
import { getWishlist, addToWishlist, removeFromWishlist, getFirestoreProducts, FirestoreProduct } from '@/lib/firestore'

// Recently viewed storage key
const RECENTLY_VIEWED_KEY = 'lgm_recently_viewed'
const MAX_RECENTLY_VIEWED = 8

const priceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ₱2,000', min: 0, max: 2000 },
  { label: '₱2,000 - ₱5,000', min: 2000, max: 5000 },
  { label: '₱5,000 - ₱10,000', min: 5000, max: 10000 },
  { label: 'Over ₱10,000', min: 10000, max: Infinity },
]

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name: A-Z', value: 'name-asc' },
]

const PRODUCTS_PER_PAGE = 20

// Color name to hex mapping for accurate swatches
const colorMap: Record<string, string> = {
  white: '#FFFFFF',
  black: '#000000',
  red: '#DC2626',
  blue: '#2563EB',
  navy: '#1E3A5F',
  green: '#16A34A',
  yellow: '#EAB308',
  gold: '#D4AF37',
  orange: '#EA580C',
  pink: '#EC4899',
  purple: '#9333EA',
  gray: '#6B7280',
  grey: '#6B7280',
  brown: '#92400E',
  beige: '#D4C4A8',
  cream: '#FFFDD0',
  maroon: '#800000',
  burgundy: '#800020',
  olive: '#808000',
  teal: '#0D9488',
  coral: '#FF7F50',
  salmon: '#FA8072',
  tan: '#D2B48C',
  khaki: '#C3B091',
  charcoal: '#36454F',
  silver: '#C0C0C0',
  ivory: '#FFFFF0',
  lavender: '#E6E6FA',
  mint: '#98FF98',
  peach: '#FFCBA4',
  rust: '#B7410E',
  wine: '#722F37',
  camel: '#C19A6B',
  sand: '#C2B280',
  denim: '#1560BD',
  indigo: '#4B0082',
  turquoise: '#40E0D0',
  aqua: '#00FFFF',
  cyan: '#00FFFF',
  magenta: '#FF00FF',
  rose: '#FF007F',
  blush: '#DE5D83',
  mustard: '#FFDB58',
  nude: '#E3BC9A',
  taupe: '#483C32',
  slate: '#708090',
  forest: '#228B22',
  emerald: '#50C878',
  sapphire: '#0F52BA',
  ruby: '#E0115F',
}

const getColorHex = (colorName: string): string => {
  const normalized = colorName.toLowerCase().trim()
  return colorMap[normalized] || colorName.toLowerCase()
}

function ShopContent() {
  const searchParams = useSearchParams()
  const urlSearchQuery = searchParams.get('search') || ''
  const urlCategory = searchParams.get('category') || ''

  const { addItem } = useCart()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery)

  // Update search and category when URL changes
  useEffect(() => {
    setSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])

  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRanges[0])

  // Toggle brand selection
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  // Toggle color selection
  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    )
  }
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [firestoreProducts, setFirestoreProducts] = useState<(Product | FirestoreProduct)[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Quick view state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | FirestoreProduct | null>(null)

  // Recently viewed state
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])

  // Search autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Brand filter search state
  const [brandSearch, setBrandSearch] = useState('')

  // Load recently viewed from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored))
      } catch {
        setRecentlyViewed([])
      }
    }
  }, [])

  // Load products from Firestore only
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const dbProducts = await getFirestoreProducts()
        setFirestoreProducts(dbProducts)
      } catch {
        setFirestoreProducts([])
      }
      setProductsLoading(false)
    }
    loadProducts()
  }, [])

  // Use only Firestore products
  const products = firestoreProducts

  // Update category when URL changes
  useEffect(() => {
    setSelectedCategory(urlCategory)
  }, [urlCategory])

  // Load wishlist
  useEffect(() => {
    const loadWishlist = async () => {
      if (user) {
        const items = await getWishlist(user.id)
        setWishlist(new Set(items))
      } else {
        const items = JSON.parse(localStorage.getItem('wishlist') || '[]')
        setWishlist(new Set(items))
      }
    }
    loadWishlist()
  }, [user])

  const toggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const isWishlisted = wishlist.has(productId)

    if (user) {
      if (isWishlisted) {
        await removeFromWishlist(user.id, productId)
      } else {
        await addToWishlist(user.id, productId)
      }
    } else {
      const items = JSON.parse(localStorage.getItem('wishlist') || '[]')
      if (isWishlisted) {
        const updated = items.filter((id: string) => id !== productId)
        localStorage.setItem('wishlist', JSON.stringify(updated))
      } else {
        localStorage.setItem('wishlist', JSON.stringify([...items, productId]))
      }
    }

    setWishlist(prev => {
      const newSet = new Set(prev)
      if (isWishlisted) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const filteredProducts = useMemo(() => {
    let result = products

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory)
    }

    // Brand filter (multi-select)
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand))
    }

    // Color filter (multi-select)
    if (selectedColors.length > 0) {
      result = result.filter(p =>
        p.colors?.some(c => selectedColors.some(sc => c.toLowerCase() === sc.toLowerCase()))
      )
    }

    // Price filter
    result = result.filter(p =>
      p.price >= selectedPriceRange.min && p.price <= selectedPriceRange.max
    )

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price)
        break
      case 'name-asc':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
      default:
        result = [...result].sort((a, b) => {
          const getTime = (val: unknown): number => {
            if (!val) return 0
            if (typeof val === 'string') return new Date(val).getTime()
            if (typeof val === 'object' && 'toDate' in (val as object)) {
              return ((val as { toDate: () => Date }).toDate()).getTime()
            }
            return 0
          }
          return getTime(b.createdAt) - getTime(a.createdAt)
        })
    }

    return result
  }, [products, searchQuery, selectedCategory, selectedBrands, selectedColors, selectedPriceRange, sortBy])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedBrands, selectedColors, selectedPriceRange, sortBy])

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE)
  }, [filteredProducts, currentPage])

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i)
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handleAddToCart = (product: Product | FirestoreProduct) => {
    if (!product.id) return
    if (!product.inStock || product.stockQty === 0) return
    // Convert to the Product type expected by CartContext
    const cartProduct = {
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
    addItem(cartProduct, 1, product.sizes?.[0] || '', product.colors?.[0] || '')
    setAddedItems(prev => new Set([...prev, product.id!]))
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id!)
        return newSet
      })
    }, 2000)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedBrands([])
    setSelectedColors([])
    setSelectedPriceRange(priceRanges[0])
  }

  // Track recently viewed products
  const trackRecentlyViewed = (productId: string) => {
    const updated = [productId, ...recentlyViewed.filter(id => id !== productId)].slice(0, MAX_RECENTLY_VIEWED)
    setRecentlyViewed(updated)
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated))
  }

  // Handle quick view open
  const openQuickView = (product: Product | FirestoreProduct, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setQuickViewProduct(product)
    if (product.id) trackRecentlyViewed(product.id)
  }

  // Handle add to cart from quick view
  const handleQuickViewAddToCart = (product: Product | FirestoreProduct, quantity: number, size: string, color: string) => {
    if (!product.id) return
    const cartProduct = {
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
    addItem(cartProduct, quantity, size, color)
  }

  // Handle wishlist toggle from quick view
  const handleQuickViewWishlistToggle = async (productId: string) => {
    const isWishlisted = wishlist.has(productId)

    if (user) {
      if (isWishlisted) {
        await removeFromWishlist(user.id, productId)
      } else {
        await addToWishlist(user.id, productId)
      }
    } else {
      const items = JSON.parse(localStorage.getItem('wishlist') || '[]')
      if (isWishlisted) {
        const updated = items.filter((id: string) => id !== productId)
        localStorage.setItem('wishlist', JSON.stringify(updated))
      } else {
        localStorage.setItem('wishlist', JSON.stringify([...items, productId]))
      }
    }

    setWishlist(prev => {
      const newSet = new Set(prev)
      if (isWishlisted) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  // Get recently viewed products
  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewed
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product | FirestoreProduct => p !== undefined)
  }, [recentlyViewed, products])

  // Get all unique colors from products
  const availableColors = useMemo(() => {
    const colorSet = new Set<string>()
    products.forEach(p => {
      p.colors?.forEach(c => colorSet.add(c))
    })
    return Array.from(colorSet).sort()
  }, [products])

  // Get all available brands from Firestore products
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>()
    products.forEach(p => { if (p.brand) brandSet.add(p.brand) })
    return Array.from(brandSet).sort()
  }, [products])

  // Get categories directly from Firestore data
  const availableCategories = useMemo(() => {
    const catSet = new Set<string>()
    products.forEach(p => { if (p.category) catSet.add(p.category) })
    return Array.from(catSet).sort()
  }, [products])

  // Search autocomplete suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []

    const query = searchQuery.toLowerCase()
    const suggestions: { type: 'product' | 'brand' | 'category'; label: string; value: string; image?: string }[] = []

    // Product name matches (limit to 5)
    const productMatches = products
      .filter(p => p.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map(p => ({
        type: 'product' as const,
        label: p.name,
        value: p.name,
        image: p.images?.[0]
      }))
    suggestions.push(...productMatches)

    // Brand matches
    const brandMatches = availableBrands
      .filter(b => b.toLowerCase().includes(query))
      .slice(0, 3)
      .map(b => ({
        type: 'brand' as const,
        label: b,
        value: b
      }))
    suggestions.push(...brandMatches)

    // Category matches
    const categoryMatches = categories
      .filter(c => c.toLowerCase().includes(query))
      .map(c => ({
        type: 'category' as const,
        label: c.charAt(0).toUpperCase() + c.slice(1),
        value: c
      }))
    suggestions.push(...categoryMatches)

    return suggestions.slice(0, 8)
  }, [searchQuery, products, availableBrands])

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: typeof searchSuggestions[0]) => {
    if (suggestion.type === 'category') {
      setSelectedCategory(suggestion.value)
      setSearchQuery('')
    } else if (suggestion.type === 'brand') {
      setSelectedBrands([suggestion.value])
      setSearchQuery('')
    } else {
      setSearchQuery(suggestion.value)
    }
    setShowSuggestions(false)
  }

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    selectedBrands.length +
    selectedColors.length +
    (selectedPriceRange.min > 0 || selectedPriceRange.max < Infinity ? 1 : 0)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 ">
        {/* Hero Banner */}
        <div className="pt-[72px]" style={{ background: '#0f1e38' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
            <nav className="hidden md:flex items-center gap-2 text-sm text-white/40 mb-6">
              <a href="/" className="hover:text-white/70 transition-colors">Home</a>
              <span className="text-white/20">›</span>
              {selectedCategory ? (
                <>
                  <a href="/shop" className="hover:text-white/70 transition-colors">Shop</a>
                  <span className="text-white/20">›</span>
                  <span className="text-gold/80 capitalize">{selectedCategory}</span>
                </>
              ) : (
                <span className="text-gold/80">Shop</span>
              )}
            </nav>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-gold" />
              </div>
              <span className="text-gold text-xs font-semibold uppercase tracking-[0.2em]">
                {selectedCategory ? selectedCategory : 'All Products'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
              {selectedCategory ? `Shop ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}` : 'Shop All Products'}
            </h1>
            <p className="text-white/50 text-sm md:text-base max-w-xl">
              Discover premium brands like Calvin Klein, Nike, GAP, Ralph Lauren, Michael Kors, and more
            </p>
          </div>
          <div className="h-[3px] bg-gradient-to-r from-gold/40 via-gold to-gold/40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Shop', href: selectedCategory ? '/shop' : undefined },
              ...(selectedCategory ? [{ label: selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) }] : [])
            ]}
            className="mb-6"
          />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── SIDEBAR FILTERS ── */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28 bg-white border border-gray-100 rounded-2xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-navy" />
                    <span className="font-bold text-navy text-sm tracking-wide">Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="bg-gold text-navy text-[10px] font-bold px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
                    )}
                  </div>
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium">
                      Reset
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-50 max-h-[calc(100vh-160px)] overflow-y-auto scrollbar-hide">

                  {/* Active chips */}
                  {activeFiltersCount > 0 && (
                    <div className="px-4 py-3 flex flex-wrap gap-1.5">
                      {selectedCategory && (
                        <button onClick={() => setSelectedCategory('')} className="inline-flex items-center gap-1 bg-navy text-white text-[11px] px-2.5 py-1 rounded-full capitalize font-medium">
                          {selectedCategory} <X className="w-3 h-3" />
                        </button>
                      )}
                      {selectedBrands.map(b => (
                        <button key={b} onClick={() => toggleBrand(b)} className="inline-flex items-center gap-1 bg-navy text-white text-[11px] px-2.5 py-1 rounded-full font-medium">
                          {b} <X className="w-3 h-3" />
                        </button>
                      ))}
                      {selectedColors.map(c => (
                        <button key={c} onClick={() => toggleColor(c)} className="inline-flex items-center gap-1.5 bg-navy text-white text-[11px] px-2.5 py-1 rounded-full font-medium">
                          <span className="w-2.5 h-2.5 rounded-full border border-white/30 flex-shrink-0" style={{ backgroundColor: getColorHex(c) }} />
                          {c} <X className="w-3 h-3" />
                        </button>
                      ))}
                      {(selectedPriceRange.min > 0 || selectedPriceRange.max < Infinity) && (
                        <button onClick={() => setSelectedPriceRange(priceRanges[0])} className="inline-flex items-center gap-1 bg-navy text-white text-[11px] px-2.5 py-1 rounded-full font-medium">
                          {selectedPriceRange.label} <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── CATEGORY ── */}
                  <div className="px-4 py-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">Category</p>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          !selectedCategory ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-navy'
                        }`}
                      >
                        <span>All</span>
                        <span className={`text-xs tabular-nums ${!selectedCategory ? 'text-white/60' : 'text-gray-300'}`}>{products.length}</span>
                      </button>
                      {availableCategories.map(cat => {
                        const count = products.filter(p => p.category === cat).length
                        const isActive = selectedCategory === cat
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                              isActive ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-navy'
                            }`}
                          >
                            <span>{cat}</span>
                            <span className={`text-xs tabular-nums ${isActive ? 'text-white/60' : 'text-gray-300'}`}>{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* ── BRAND ── */}
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Brand</p>
                      {selectedBrands.length > 0 && (
                        <button onClick={() => setSelectedBrands([])} className="text-[11px] text-gold font-semibold">Clear</button>
                      )}
                    </div>
                    <div className="relative mb-2.5">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                      <input
                        type="text"
                        placeholder="Search brands..."
                        value={brandSearch}
                        onChange={e => setBrandSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:border-gold focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-0.5 max-h-48 overflow-y-auto scrollbar-hide">
                      {availableBrands
                        .filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))
                        .map(brand => {
                          const checked = selectedBrands.includes(brand)
                          const count = products.filter(p => p.brand === brand).length
                          return (
                            <button
                              key={brand}
                              onClick={() => toggleBrand(brand)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all group ${
                                checked ? 'text-navy' : 'text-gray-500 hover:text-navy'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                                checked ? 'bg-navy border-navy' : 'border-gray-200 group-hover:border-navy/40'
                              }`}>
                                {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/></svg>}
                              </span>
                              <span className="flex-1 truncate text-left text-xs font-medium">{brand}</span>
                              <span className="text-[10px] text-gray-300 tabular-nums">{count}</span>
                            </button>
                          )
                        })}
                    </div>
                  </div>

                  {/* ── COLOR ── */}
                  {availableColors.length > 0 && (
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Color</p>
                        {selectedColors.length > 0 && (
                          <button onClick={() => setSelectedColors([])} className="text-[11px] text-gold font-semibold">Clear</button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map(color => {
                          const hex = getColorHex(color)
                          const isSelected = selectedColors.includes(color)
                          const isLight = ['white', 'ivory', 'cream', 'beige', 'nude', 'peach', 'lavender', 'mint', 'aqua', 'cyan'].includes(color.toLowerCase())
                          return (
                            <button
                              key={color}
                              onClick={() => toggleColor(color)}
                              title={color}
                              className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${
                                isSelected
                                  ? 'ring-2 ring-offset-2 ring-navy scale-110'
                                  : isLight ? 'border border-gray-200' : ''
                              }`}
                              style={{ backgroundColor: hex }}
                            >
                              {isSelected && (
                                <svg className={`w-3.5 h-3.5 mx-auto ${isLight ? 'text-navy' : 'text-white'}`} fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5"/>
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                      {selectedColors.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-2.5 capitalize">{selectedColors.join(' · ')}</p>
                      )}
                    </div>
                  )}

                  {/* ── PRICE ── */}
                  <div className="px-4 py-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">Price</p>
                    <div className="space-y-1">
                      {priceRanges.map((range, i) => {
                        const isActive = selectedPriceRange === range
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedPriceRange(range)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              isActive ? 'bg-gold/10 text-navy' : 'text-gray-500 hover:bg-gray-50 hover:text-navy'
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                isActive ? 'border-navy' : 'border-gray-300'
                              }`}>
                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-navy block" />}
                              </span>
                              {range.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Search & Controls */}
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search with Autocomplete */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <input
                      type="text"
                      placeholder="Search products, brands, categories..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => {
                        if (searchQuery.length >= 2) setShowSuggestions(true)
                      }}
                      onBlur={() => {
                        // Delay hiding to allow clicking suggestions
                        setTimeout(() => setShowSuggestions(false), 200)
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                    />
                    {/* Clear button */}
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setShowSuggestions(false)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Autocomplete Suggestions Dropdown */}
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                        {searchSuggestions.map((suggestion, idx) => (
                          <button
                            key={`${suggestion.type}-${suggestion.value}-${idx}`}
                            onClick={() => handleSuggestionSelect(suggestion)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                          >
                            {suggestion.type === 'product' && suggestion.image ? (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={suggestion.image}
                                  alt={suggestion.label}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                suggestion.type === 'brand' ? 'bg-gold/10 text-gold' :
                                suggestion.type === 'category' ? 'bg-navy/10 text-navy' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                {suggestion.type === 'brand' && <span className="font-bold text-sm">{suggestion.label.charAt(0)}</span>}
                                {suggestion.type === 'category' && <Shirt className="w-5 h-5" />}
                                {suggestion.type === 'product' && <Shirt className="w-5 h-5" />}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-navy truncate">{suggestion.label}</p>
                              <p className="text-xs text-gray-400 capitalize">{suggestion.type}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl"
                  >
                    <Filter className="w-5 h-5" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="bg-gold text-navy text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {/* Sort */}
                  <div className="relative w-full md:w-auto">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none w-full md:w-auto px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:border-gold bg-white"
                    >
                      {sortOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>

                  {/* View Toggle */}
                  <div className="hidden md:flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 ${viewMode === 'grid' ? 'bg-gold text-navy' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 ${viewMode === 'list' ? 'bg-gold text-navy' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-500">
                {productsLoading ? (
                  <span className="inline-block w-48 h-4 bg-gray-200 rounded animate-pulse" />
                ) : filteredProducts.length > 0 ? (
                  <>Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1}-{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</>
                ) : (
                  <>No products found</>
                )}
              </div>

              {/* Products Grid */}
              {productsLoading ? (
                <ProductGridSkeleton count={8} viewMode={viewMode} />
              ) : paginatedProducts.length > 0 ? (
                <div className={`grid gap-3 ${
                  viewMode === 'grid'
                    ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}>
                  {paginatedProducts.filter(p => p.id).map(product => {
                    const productId = product.id!
                    return (
                    <div
                      key={productId}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      {/* Image */}
                      <Link
                        href={`/shop/${productId}`}
                        className={`relative block bg-[#f5f3f0] overflow-hidden ${
                          viewMode === 'list' ? 'w-36 h-36 flex-shrink-0' : 'aspect-square'
                        }`}
                      >
                        {product.images && product.images.length > 0 && product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes={viewMode === 'list' ? '144px' : '(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw'}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                            <Shirt className="w-12 h-12" />
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
                              SALE
                            </span>
                          )}
                          {product.stockQty === 0 && (
                            <span className="bg-gray-800/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
                              Sold Out
                            </span>
                          )}
                          {product.stockQty > 0 && product.stockQty <= 5 && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
                              Only {product.stockQty} left
                            </span>
                          )}
                        </div>
                        {/* Wishlist button — always visible on mobile, hover on desktop */}
                        <button
                          onClick={(e) => toggleWishlist(productId, e)}
                          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow z-10 ${
                            wishlist.has(productId)
                              ? 'bg-pink-500 text-white'
                              : 'bg-white/90 text-gray-400 md:opacity-0 md:group-hover:opacity-100'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${wishlist.has(productId) ? 'fill-current' : ''}`} />
                        </button>
                      </Link>

                      {/* Info */}
                      <div className={`p-2.5 md:p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                        <div>
                          <p className="text-[10px] md:text-xs text-gold font-semibold uppercase tracking-wide mb-0.5">{product.brand}</p>
                          <Link href={`/shop/${productId}`}>
                            <h3 className="text-sm font-semibold text-navy hover:text-gold transition-colors line-clamp-1 leading-snug">
                              {product.name}
                            </h3>
                          </Link>
                          {viewMode === 'list' && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                          )}
                        </div>

                        <div className={`flex items-center justify-between gap-1 ${viewMode === 'list' ? 'mt-4' : 'mt-2'}`}>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-navy leading-none">₱{product.price.toLocaleString()}</p>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <p className="text-[10px] text-gray-400 line-through leading-none mt-0.5">
                                ₱{product.originalPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={addedItems.has(productId) || !product.inStock || product.stockQty === 0}
                            title={!product.inStock || product.stockQty === 0 ? 'Out of Stock' : 'Add to Cart'}
                            className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                              addedItems.has(productId)
                                ? 'bg-green-500 text-white'
                                : !product.inStock || product.stockQty === 0
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : 'bg-gold text-navy hover:bg-yellow-400'
                            }`}
                          >
                            {addedItems.has(productId) ? '✓' : <ShoppingBag className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )})}

                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl">
                  <Shirt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-navy mb-2">No products found</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
                  <button
                    onClick={clearFilters}
                    className="text-gold hover:text-gold-600 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 md:gap-2 mt-6 md:mt-8 flex-wrap">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 text-navy hover:bg-gold hover:border-gold hover:text-navy'
                    }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={page === '...'}
                      className={`flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg border transition-colors ${
                        page === currentPage
                          ? 'bg-gold border-gold text-navy font-bold'
                          : page === '...'
                          ? 'border-transparent text-gray-400 cursor-default'
                          : 'border-gray-200 text-navy hover:bg-gold hover:border-gold'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 text-navy hover:bg-gold hover:border-gold hover:text-navy'
                    }`}
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Modal */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-[min(320px,90vw)] bg-white p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-navy">Filters</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile filters content - same as desktop */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-navy mb-3">Category</h3>
                  <div className="space-y-2">
                    {['', ...categories].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                          selectedCategory === cat ? 'bg-gold/10 text-gold' : 'hover:bg-gray-100'
                        }`}
                      >
                        {cat || 'All Categories'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-navy">Brand</h3>
                    {selectedBrands.length > 0 && (
                      <button
                        onClick={() => setSelectedBrands([])}
                        className="text-xs text-gold hover:text-gold-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableBrands.map(brand => (
                      <label
                        key={brand}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="w-4 h-4 accent-gold rounded"
                        />
                        {brand}
                      </label>
                    ))}
                  </div>
                </div>

                {availableColors.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-navy">Color</h3>
                      {selectedColors.length > 0 && (
                        <button
                          onClick={() => setSelectedColors([])}
                          className="text-xs text-gold hover:text-gold-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                      {availableColors.map(color => (
                        <label
                          key={color}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedColors.includes(color)}
                            onChange={() => toggleColor(color)}
                            className="w-3.5 h-3.5 accent-gold rounded"
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: getColorHex(color) }}
                          />
                          <span className="truncate">{color}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-navy mb-3">Price Range</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPriceRange(range)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedPriceRange === range ? 'bg-gold/10 text-gold' : 'hover:bg-gray-100'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 border border-gray-200 rounded-xl font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 bg-gold text-navy rounded-xl font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recently Viewed Section */}
        {recentlyViewedProducts.length > 0 && (
          <div className="container-max px-4 md:px-8 pb-12">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-bold text-navy">Recently Viewed</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {recentlyViewedProducts.slice(0, 8).map(product => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    className="group"
                  >
                    <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
                      {product.images && product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="120px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Shirt className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gold font-medium">{product.brand}</p>
                    <p className="text-sm font-medium text-navy truncate">{product.name}</p>
                    <p className="text-sm font-bold text-navy">₱{product.price.toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleQuickViewAddToCart}
          onToggleWishlist={handleQuickViewWishlistToggle}
          isWishlisted={wishlist.has(quickViewProduct.id!)}
        />
      )}
    </>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50  flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}

