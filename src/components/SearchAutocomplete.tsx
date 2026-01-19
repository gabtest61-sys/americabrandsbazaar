'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, TrendingUp, Clock, Shirt } from 'lucide-react'
import { getFirestoreProducts, FirestoreProduct } from '@/lib/firestore'

interface SearchAutocompleteProps {
  onClose?: () => void
  className?: string
  showTrending?: boolean
}

const trendingSearches = [
  'Nike sneakers',
  'Calvin Klein',
  'Ralph Lauren polo',
  'Air Max',
  'Leather belt'
]

export default function SearchAutocomplete({
  onClose,
  className = '',
  showTrending = true
}: SearchAutocompleteProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FirestoreProduct[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([])

  useEffect(() => {
    // Load products from Firestore
    const loadProducts = async () => {
      try {
        const products = await getFirestoreProducts()
        setAllProducts(products)
      } catch {
        setAllProducts([])
      }
    }
    loadProducts()

    // Load recent searches from localStorage
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    setRecentSearches(recent)

    // Focus input
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (query.length >= 2) {
      const searchQuery = query.toLowerCase().trim()
      const searchResults = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery) ||
        product.brand.toLowerCase().includes(searchQuery) ||
        product.category.toLowerCase().includes(searchQuery) ||
        product.subcategory?.toLowerCase().includes(searchQuery) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchQuery))
      ).slice(0, 6)
      setResults(searchResults)
      setIsOpen(true)
      setSelectedIndex(-1)
    } else {
      setResults([])
      setIsOpen(query.length === 0 && (recentSearches.length > 0 || showTrending))
    }
  }, [query, recentSearches, showTrending, allProducts])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveSearch = (searchQuery: string) => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    const updated = [searchQuery, ...recent.filter((s: string) => s !== searchQuery)].slice(0, 5)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
    setRecentSearches(updated)
  }

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    saveSearch(searchQuery.trim())
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
    onClose?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        router.push(`/shop/${results[selectedIndex].id}`)
        onClose?.()
      } else {
        handleSearch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Escape') {
      onClose?.()
    }
  }

  const clearRecentSearches = () => {
    localStorage.removeItem('recentSearches')
    setRecentSearches([])
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products, brands..."
          className="w-full pl-12 pr-12 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 focus:bg-white transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {/* Search Results */}
          {results.length > 0 && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">Products</p>
              {results.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/shop/${product.id}`}
                  onClick={() => {
                    saveSearch(query)
                    onClose?.()
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedIndex === index ? 'bg-gold/10' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                      <span className="text-navy font-bold text-xs">{product.brand.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.brand} - ₱{product.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              <button
                onClick={() => handleSearch()}
                className="w-full px-3 py-2 text-sm text-gold hover:text-gold-600 text-center font-medium"
              >
                View all results for &quot;{query}&quot;
              </button>
            </div>
          )}

          {/* No Results */}
          {query.length >= 2 && results.length === 0 && (
            <div className="p-8 text-center">
              <Shirt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No products found for &quot;{query}&quot;</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}

          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-2 border-b">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-medium text-gray-400 uppercase">Recent Searches</p>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => {
                    setQuery(search)
                    handleSearch(search)
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Trending Searches */}
          {query.length === 0 && showTrending && (
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">Trending</p>
              {trendingSearches.map((search) => (
                <button
                  key={search}
                  onClick={() => {
                    setQuery(search)
                    handleSearch(search)
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TrendingUp className="w-4 h-4 text-gold" />
                  <span className="text-sm text-gray-700">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
