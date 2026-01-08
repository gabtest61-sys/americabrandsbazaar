'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, X, ShoppingBag, Heart, ChevronDown, Grid, List, Shirt, Loader2, ChevronLeft, ChevronRight, Eye, Clock } from 'lucide-react'
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
    // Convert to the Product type expected by CartContext
    const cartProduct = {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.images[0] || '/placeholder.jpg',
      category: product.category as 'clothes' | 'accessories' | 'shoes',
      sizes: product.sizes,
      colors: product.colors,
    }
    addItem(cartProduct, 1, product.sizes[0], product.colors[0])
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
      image: product.images[0] || '/placeholder.jpg',
      category: product.category as 'clothes' | 'accessories' | 'shoes',
      sizes: product.sizes,
      colors: product.colors,
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

  // Get all available brands (static + custom from products)
  const availableBrands = useMemo(() => {
    const brandSet = new Set<string>([...brands])
    products.forEach(p => {
      if (p.brand) brandSet.add(p.brand)
    })
    return Array.from(brandSet).sort()
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
      <main className="min-h-screen bg-gray-50 pt-24">
        {/* Hero Banner */}
        <div className="bg-navy text-white py-12">
          <div className="container-max px-4 md:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {selectedCategory ? `Shop ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}` : 'Shop All Products'}
            </h1>
            <p className="text-white/60">
              Discover premium brands like Calvin Klein, Nike, GAP, Ralph Lauren, Michael Kors, and more
            </p>
          </div>
        </div>

        <div className="container-max px-4 md:px-8 py-8">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Shop', href: selectedCategory ? '/shop' : undefined },
              ...(selectedCategory ? [{ label: selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) }] : [])
            ]}
            className="mb-6"
          />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-28">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-navy">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gold hover:text-yellow-600"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-navy mb-3">Category</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        !selectedCategory ? 'bg-gold/10 text-gold' : 'hover:bg-gray-100'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                          selectedCategory === cat ? 'bg-gold/10 text-gold' : 'hover:bg-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand Filter */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-navy">Brand</h3>
                    {selectedBrands.length > 0 && (
                      <button
                        onClick={() => setSelectedBrands([])}
                        className="text-xs text-gold hover:text-yellow-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
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

                {/* Color Filter */}
                {availableColors.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-navy">Color</h3>
                      {selectedColors.length > 0 && (
                        <button
                          onClick={() => setSelectedColors([])}
                          className="text-xs text-gold hover:text-yellow-600"
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

                {/* Price Filter */}
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
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:border-gold bg-white"
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
                <div className={`grid gap-4 ${
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
                        className={`relative block bg-gray-100 overflow-hidden ${
                          viewMode === 'list' ? 'w-40 h-40 flex-shrink-0' : 'aspect-[3/4]'
                        }`}
                      >
                        {product.images && product.images.length > 0 && product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes={viewMode === 'list' ? '160px' : '(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw'}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                            <Shirt className="w-16 h-16" />
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                          {product.originalPrice && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              SALE
                            </span>
                          )}
                          {product.stockQty === 0 && (
                            <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                              Out of Stock
                            </span>
                          )}
                          {product.stockQty > 0 && product.stockQty <= 5 && (
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              Only {product.stockQty} left
                            </span>
                          )}
                        </div>
                        {/* Action buttons */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                          <button
                            onClick={(e) => toggleWishlist(productId, e)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
                              wishlist.has(productId)
                                ? 'bg-pink-500 text-white opacity-100'
                                : 'bg-white text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-gray-50'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${wishlist.has(productId) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => openQuickView(product, e)}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md bg-white text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-gold hover:text-navy"
                            title="Quick View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </Link>

                      {/* Info */}
                      <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                        <div>
                          <p className="text-xs text-gold font-medium mb-1">{product.brand}</p>
                          <Link href={`/shop/${productId}`}>
                            <h3 className="font-medium text-navy hover:text-gold transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </Link>
                          {viewMode === 'list' && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                          )}
                        </div>

                        <div className={`flex items-center justify-between ${viewMode === 'list' ? 'mt-4' : 'mt-3'}`}>
                          <div>
                            <span className="font-bold text-navy">₱{product.price.toLocaleString()}</span>
                            {product.originalPrice && (
                              <span className="text-sm text-gray-400 line-through ml-2">
                                ₱{product.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={addedItems.has(productId)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              addedItems.has(productId)
                                ? 'bg-green-500 text-white'
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
                    className="text-gold hover:text-yellow-600 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
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
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
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
                        className="text-xs text-gold hover:text-yellow-600"
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
                          className="text-xs text-gold hover:text-yellow-600"
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
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}

