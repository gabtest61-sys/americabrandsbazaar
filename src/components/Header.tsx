'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, ShoppingCart, User, Search, ChevronRight, Truck, Shield, RotateCcw, Loader2, LogIn } from 'lucide-react'
import { NAV_LINKS, BRAND } from '@/lib/constants'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { getFirestoreProducts, FirestoreProduct } from '@/lib/firestore'
import AuthModal from '@/components/AuthModal'

const promoMessages = [
  { icon: Truck, text: 'Free Shipping on Orders ₱2,000+' },
  { icon: Shield, text: '100% Authentic Products' },
  { icon: RotateCcw, text: 'Easy Returns within 7 Days' },
]

export default function Header() {
  const router = useRouter()
  const { isLoggedIn, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentPromo, setCurrentPromo] = useState(0)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FirestoreProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { itemCount, toggleCart } = useCart()

  // Load products from Firestore on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getFirestoreProducts()
        setAllProducts(products)
      } catch {
        setAllProducts([])
      }
    }
    loadProducts()
  }, [])

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Handle search
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setIsSearching(true)
      const timer = setTimeout(() => {
        const query = searchQuery.toLowerCase().trim()
        const results = allProducts.filter(product =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.subcategory?.toLowerCase().includes(query) ||
          product.tags?.some(tag => tag.toLowerCase().includes(query))
        )
        setSearchResults(results.slice(0, 6)) // Show top 6 results
        setIsSearching(false)
      }, 200)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, allProducts])

  // Close search on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearchOpen(false)
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleProductClick = (productId: string) => {
    setIsSearchOpen(false)
    setSearchQuery('')
    router.push(`/shop/${productId}`)
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
    setIsMenuOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promoMessages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const CurrentPromoIcon = promoMessages[currentPromo].icon

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Promo Banner */}
        <div className="bg-gold">
          <div className="container-max px-4">
            <div className="flex items-center justify-center h-9 text-navy text-sm font-medium overflow-hidden">
              <div className="flex items-center gap-2 animate-fade-in" key={currentPromo}>
                <CurrentPromoIcon className="w-4 h-4" />
                <span>{promoMessages[currentPromo].text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className={`transition-all duration-300 ${
          isScrolled
            ? 'bg-navy/95 backdrop-blur-lg shadow-xl'
            : 'bg-navy'
        }`}>
          <div className="container-max px-4 md:px-8">
            <div className="flex items-center justify-between h-24 md:h-28">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-3 group">
                <div className={`relative rounded-full overflow-hidden border-2 border-gold/80 group-hover:border-gold transition-all duration-300 shadow-lg bg-white ${
                  isScrolled ? 'w-14 h-14' : 'w-20 h-20 md:w-24 md:h-24'
                }`}>
                  <Image
                    src="/logo.png"
                    alt={BRAND.name}
                    fill
                    className="object-contain scale-125"
                    priority
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className={`text-white font-bold tracking-wide transition-all duration-300 ${
                    isScrolled ? 'text-lg' : 'text-xl'
                  }`}>
                    {BRAND.name}
                  </h1>
                  <p className="text-gold/80 text-[10px] tracking-[0.2em] uppercase">
                    {BRAND.tagline}
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="relative px-5 py-2 text-white/90 hover:text-white text-sm font-medium tracking-wide transition-colors group"
                  >
                    {link.name}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gold group-hover:w-8 transition-all duration-300 rounded-full" />
                  </Link>
                ))}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-1 md:gap-2">
                {/* Search */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2.5 text-white/80 hover:text-gold hover:bg-white/5 rounded-full transition-all"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Account / Login */}
                {isLoggedIn ? (
                  <Link
                    href="/account"
                    className="hidden sm:flex p-2.5 text-white/80 hover:text-gold hover:bg-white/5 rounded-full transition-all"
                    title={user?.name || 'My Account'}
                  >
                    <User className="w-5 h-5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => openAuthModal('login')}
                    className="hidden sm:flex p-2.5 text-white/80 hover:text-gold hover:bg-white/5 rounded-full transition-all"
                    title="Sign In"
                  >
                    <User className="w-5 h-5" />
                  </button>
                )}

                {/* Cart */}
                <button
                  onClick={toggleCart}
                  className="relative p-2.5 text-white/80 hover:text-gold hover:bg-white/5 rounded-full transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-gold text-navy text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center animate-scale-in">
                      {itemCount}
                    </span>
                  )}
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-2.5 text-white/80 hover:text-gold hover:bg-white/5 rounded-full transition-all ml-1"
                >
                  {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${
          isMenuOpen ? 'max-h-[500px]' : 'max-h-0'
        }`}>
          <nav className="bg-navy-800/95 backdrop-blur-lg border-t border-white/10">
            <div className="container-max px-4 py-3">
              {NAV_LINKS.map((link, index) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between py-3.5 px-4 text-white/90 hover:text-gold hover:bg-white/5 rounded-xl transition-all text-sm font-medium"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {link.name}
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
              ))}
              <div className="border-t border-white/10 mt-2 pt-2">
                {isLoggedIn ? (
                  <Link
                    href="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 py-3.5 px-4 text-white/90 hover:text-gold hover:bg-white/5 rounded-xl transition-all text-sm font-medium"
                  >
                    <User className="w-4 h-4" />
                    My Account
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => openAuthModal('login')}
                      className="w-full flex items-center gap-3 py-3.5 px-4 text-white/90 hover:text-gold hover:bg-white/5 rounded-xl transition-all text-sm font-medium"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                    <button
                      onClick={() => openAuthModal('register')}
                      className="w-full flex items-center gap-3 py-3.5 px-4 text-gold hover:bg-gold/10 rounded-xl transition-all text-sm font-medium"
                    >
                      <User className="w-4 h-4" />
                      Create Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* Search Modal */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsSearchOpen(false)}
            />

            {/* Search Container */}
            <div className="relative max-w-2xl mx-auto mt-20 px-4">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, brands..."
                    className="w-full pl-14 pr-14 py-5 text-lg text-navy placeholder-gray-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </form>

                {/* Search Results */}
                {searchQuery.length > 1 && (
                  <div className="border-t border-gray-100">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-gold animate-spin" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        {searchResults.filter(p => p.id).map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product.id!)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-400 text-xs">{product.brand.substring(0, 2)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gold font-medium">{product.brand}</p>
                              <p className="font-medium text-navy truncate">{product.name}</p>
                              <p className="text-sm text-gray-500">₱{product.price.toLocaleString()}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                          </button>
                        ))}

                        {/* View All Results */}
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full py-4 text-center text-gold font-medium hover:bg-gold/5 transition-colors border-t border-gray-100"
                        >
                          View all results for "{searchQuery}"
                        </button>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-500">No products found for "{searchQuery}"</p>
                        <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Links (when no search) */}
                {!searchQuery && (
                  <div className="border-t border-gray-100 p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Popular Searches</p>
                    <div className="flex flex-wrap gap-2">
                      {['Nike', 'Calvin Klein', 'Polo', 'Watch', 'Sneakers', 'Hoodie'].map((term) => (
                        <button
                          key={term}
                          onClick={() => setSearchQuery(term)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gold/10 hover:text-gold rounded-full text-sm text-gray-600 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Close hint */}
              <p className="text-center text-white/50 text-sm mt-4">
                Press <kbd className="px-2 py-0.5 bg-white/10 rounded">ESC</kbd> to close
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </>
  )
}
