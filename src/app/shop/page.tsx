'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, X, ShoppingBag, Heart, ChevronDown, Grid, List, Shirt, Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCart } from '@/context/CartContext'
import { products, brands, categories, filterProducts, Product } from '@/lib/products'

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

function ShopContent() {
  const searchParams = useSearchParams()
  const urlSearchQuery = searchParams.get('search') || ''

  const { addItem } = useCart()
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery)

  // Update search when URL changes
  useEffect(() => {
    setSearchQuery(urlSearchQuery)
  }, [urlSearchQuery])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRanges[0])
  const [sortBy, setSortBy] = useState('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

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

    // Brand filter
    if (selectedBrand) {
      result = result.filter(p => p.brand === selectedBrand)
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
        result = [...result].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    }

    return result
  }, [searchQuery, selectedCategory, selectedBrand, selectedPriceRange, sortBy])

  const handleAddToCart = (product: Product) => {
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
    setAddedItems(prev => new Set([...prev, product.id]))
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }, 2000)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedBrand('')
    setSelectedPriceRange(priceRanges[0])
  }

  const activeFiltersCount = [
    selectedCategory,
    selectedBrand,
    selectedPriceRange.min > 0 || selectedPriceRange.max < Infinity
  ].filter(Boolean).length

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24">
        {/* Hero Banner */}
        <div className="bg-navy text-white py-12">
          <div className="container-max px-4 md:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Shop All Products</h1>
            <p className="text-white/60">
              Discover premium brands: Calvin Klein, Nike, GAP, Ralph Lauren & Michael Kors
            </p>
          </div>
        </div>

        <div className="container-max px-4 md:px-8 py-8">
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
                  <h3 className="text-sm font-medium text-navy mb-3">Brand</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedBrand('')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        !selectedBrand ? 'bg-gold/10 text-gold' : 'hover:bg-gray-100'
                      }`}
                    >
                      All Brands
                    </button>
                    {brands.map(brand => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedBrand === brand ? 'bg-gold/10 text-gold' : 'hover:bg-gray-100'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

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
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                    />
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
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </div>

              {/* Products Grid */}
              {filteredProducts.length > 0 ? (
                <div className={`grid gap-4 ${
                  viewMode === 'grid'
                    ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}>
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm group hover:shadow-md transition-shadow ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      {/* Image */}
                      <Link
                        href={`/shop/${product.id}`}
                        className={`relative block bg-gray-100 ${
                          viewMode === 'list' ? 'w-40 flex-shrink-0' : 'aspect-[3/4]'
                        }`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                          <Shirt className="w-16 h-16" />
                        </div>
                        {product.originalPrice && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            SALE
                          </span>
                        )}
                        <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-gray-50">
                          <Heart className="w-4 h-4 text-gray-600" />
                        </button>
                      </Link>

                      {/* Info */}
                      <div className={`p-4 ${viewMode === 'list' ? 'flex-1 flex flex-col justify-between' : ''}`}>
                        <div>
                          <p className="text-xs text-gold font-medium mb-1">{product.brand}</p>
                          <Link href={`/shop/${product.id}`}>
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
                            disabled={addedItems.has(product.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              addedItems.has(product.id)
                                ? 'bg-green-500 text-white'
                                : 'bg-gold text-navy hover:bg-yellow-400'
                            }`}
                          >
                            {addedItems.has(product.id) ? '✓' : <ShoppingBag className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  <h3 className="text-sm font-medium text-navy mb-3">Brand</h3>
                  <div className="space-y-2">
                    {['', ...brands].map(brand => (
                      <button
                        key={brand}
                        onClick={() => setSelectedBrand(brand)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedBrand === brand ? 'bg-gold/10 text-gold' : 'hover:bg-gray-100'
                        }`}
                      >
                        {brand || 'All Brands'}
                      </button>
                    ))}
                  </div>
                </div>

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
      </main>
      <Footer />
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
