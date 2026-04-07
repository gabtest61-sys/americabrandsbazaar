'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ShoppingCart, User, Search, ChevronRight, Loader2, Bell } from 'lucide-react'
import { NAV_LINKS, BRAND } from '@/lib/constants'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { getFirestoreProducts, FirestoreProduct, subscribeToNotifications, markAllNotificationsRead, markNotificationRead, OrderNotification } from '@/lib/firestore'
import AuthModal from '@/components/AuthModal'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoggedIn, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FirestoreProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { itemCount, toggleCart } = useCart()

  // Notifications
  const [notifications, setNotifications] = useState<OrderNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter(n => !n.read).length
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null)
  const [enablingPush, setEnablingPush] = useState(false)

  useEffect(() => {
    if (!isLoggedIn || !user?.id) { setNotifications([]); return }
    const unsub = subscribeToNotifications(user.id, setNotifications)
    return () => unsub()
  }, [isLoggedIn, user?.id])

  // Check current push permission state
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission)
    }
  }, [isLoggedIn])

  const enablePushNotifications = async () => {
    if (!user?.id || enablingPush) return
    setEnablingPush(true)
    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      if (permission !== 'granted') { setEnablingPush(false); return }

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, subscription: sub.toJSON() }),
      })
    } catch (e) {
      console.error('Push enable error:', e)
    }
    setEnablingPush(false)
  }

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    getFirestoreProducts().then(setAllProducts).catch(() => setAllProducts([]))
  }, [])

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus()
  }, [isSearchOpen])

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setIsSearching(true)
      const timer = setTimeout(() => {
        const q = searchQuery.toLowerCase().trim()
        setSearchResults(
          allProducts.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.tags?.some(t => t.toLowerCase().includes(q))
          ).slice(0, 6)
        )
        setIsSearching(false)
      }, 200)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, allProducts])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsSearchOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setIsMenuOpen(false) }, [pathname])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearchOpen(false)
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
    setIsMenuOpen(false)
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0f1e38]/95 backdrop-blur-xl shadow-2xl' : 'bg-[#0f1e38]'
      }`}>

        {/* Top accent line */}
        <div className="h-[3px] bg-gradient-to-r from-gold via-yellow-300 to-gold" />

        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center h-[68px] gap-8">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-gold/60 group-hover:ring-gold transition-all duration-300 shadow-lg shadow-gold/20">
                <Image src="/abblogo.jpg" alt={BRAND.name} fill className="object-cover" priority />
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-white font-bold text-[15px] tracking-wide">{BRAND.name}</p>
                <p className="text-gold/70 text-[9px] tracking-[0.25em] uppercase">{BRAND.tagline}</p>
              </div>
            </Link>

            {/* Desktop nav — centered */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap ${
                      active
                        ? 'text-navy bg-gold'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center text-white/70 hover:text-gold hover:bg-white/10 rounded-full transition-all"
                title="Search"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              {/* Account */}
              {isLoggedIn ? (
                <Link
                  href="/account"
                  className="hidden sm:flex w-9 h-9 items-center justify-center text-white/70 hover:text-gold hover:bg-white/10 rounded-full transition-all"
                  title={user?.name || 'My Account'}
                >
                  <User className="w-[18px] h-[18px]" />
                </Link>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="hidden sm:flex w-9 h-9 items-center justify-center text-white/70 hover:text-gold hover:bg-white/10 rounded-full transition-all"
                  title="Sign In"
                >
                  <User className="w-[18px] h-[18px]" />
                </button>
              )}

              {/* Notification bell — only for logged-in users */}
              {isLoggedIn && (
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(v => !v)
                      if (!showNotifications && unreadCount > 0 && user?.id) {
                        markAllNotificationsRead(user.id).then(() =>
                          setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                        )
                      }
                    }}
                    className="relative w-9 h-9 flex items-center justify-center text-white/70 hover:text-gold hover:bg-white/10 rounded-full transition-all"
                    title="Notifications"
                  >
                    <Bell className="w-[18px] h-[18px]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black min-w-[17px] h-[17px] rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-navy text-sm">Notifications</h3>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => {
                              if (user?.id) {
                                markAllNotificationsRead(user.id)
                                setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                              }
                            }}
                            className="text-xs text-gold hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Allow push notifications banner */}
                      {pushPermission !== 'granted' && pushPermission !== null && 'serviceWorker' in navigator && (
                        <div className="px-4 py-3 bg-navy/5 border-b border-gray-100 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-4 h-4 text-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-navy">Get order alerts</p>
                            <p className="text-[11px] text-gray-400 leading-tight">Allow notifications to be notified when your order status changes.</p>
                          </div>
                          <button
                            onClick={enablePushNotifications}
                            disabled={enablingPush || pushPermission === 'denied'}
                            className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
                              pushPermission === 'denied'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gold text-navy hover:bg-yellow-400'
                            }`}
                          >
                            {enablingPush ? '…' : pushPermission === 'denied' ? 'Blocked' : 'Allow'}
                          </button>
                        </div>
                      )}

                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map(n => {
                            const statusEmoji: Record<string, string> = {
                              confirmed: '✅', processing: '⚙️', shipped: '🚚',
                              delivered: '📦', cancelled: '❌', pending: '🕐',
                            }
                            return (
                              <button
                                key={n.id}
                                onClick={() => {
                                  if (n.id) markNotificationRead(n.id)
                                  setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                                  setShowNotifications(false)
                                  router.push('/account')
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!n.read ? 'bg-gold/5' : ''}`}
                              >
                                <span className="text-lg flex-shrink-0 mt-0.5">{statusEmoji[n.status] || '📋'}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-navy capitalize">{n.status} — Order #{n.orderId}</p>
                                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.message}</p>
                                </div>
                                {!n.read && <span className="w-2 h-2 bg-gold rounded-full flex-shrink-0 mt-1" />}
                              </button>
                            )
                          })
                        )}
                      </div>

                      <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                        <Link href="/account" onClick={() => setShowNotifications(false)} className="text-xs text-gold font-semibold hover:underline">
                          View all orders →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative w-9 h-9 flex items-center justify-center text-white/70 hover:text-gold hover:bg-white/10 rounded-full transition-all"
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold text-navy text-[9px] font-black min-w-[17px] h-[17px] rounded-full flex items-center justify-center leading-none">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center text-white/70 hover:text-gold hover:bg-white/10 rounded-full transition-all ml-1"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-[#0a1628] border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-gold text-navy'
                        : 'text-white/80 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {link.name}
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                )
              })}

              <div className="border-t border-white/10 pt-3 mt-2 space-y-1">
                {isLoggedIn ? (
                  <Link
                    href="/account"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/8 transition-all"
                  >
                    <User className="w-4 h-4" />
                    My Account
                  </Link>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openAuthModal('login')}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-all"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => openAuthModal('register')}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-navy bg-gold hover:bg-yellow-400 transition-all"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="relative max-w-2xl mx-auto mt-24 px-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, brands..."
                  className="w-full pl-14 pr-12 py-5 text-base text-navy placeholder-gray-400 focus:outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </form>

              {searchQuery.length > 1 && (
                <div className="border-t border-gray-100">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-gold animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {searchResults.filter(p => p.id).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => { setIsSearchOpen(false); setSearchQuery(''); router.push(`/shop/${product.id}`) }}
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">{product.brand.slice(0,2)}</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-gold font-semibold uppercase tracking-wide">{product.brand}</p>
                            <p className="text-sm font-medium text-navy truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">₱{product.price.toLocaleString()}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </button>
                      ))}
                      <button
                        onClick={handleSearchSubmit as any}
                        className="w-full py-3.5 text-center text-sm text-gold font-semibold hover:bg-gold/5 transition-colors"
                      >
                        See all results for &ldquo;{searchQuery}&rdquo;
                      </button>
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-gray-500 text-sm">No results for &ldquo;{searchQuery}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}

              {!searchQuery && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Popular</p>
                  <div className="flex flex-wrap gap-2">
                    {['Nike', 'Calvin Klein', 'Tommy Hilfiger', 'Sneakers', 'Hoodie'].map((term) => (
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
            <p className="text-center text-white/40 text-xs mt-3">
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">ESC</kbd> to close
            </p>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authModalMode} />
    </>
  )
}
