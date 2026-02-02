'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Package, Heart, Settings, LogOut, ChevronRight,
  ShoppingBag, Sparkles, Clock, CheckCircle, Truck, XCircle,
  Shirt, Trash2, Edit2, Save, X, Loader2, AlertTriangle, RotateCcw, MapPin
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { getOrdersByUser, getWishlist, removeFromWishlist, updateUserProfile, getFirestoreProductById, FirestoreProduct, FirestoreOrder, getSavedLooks, deleteSavedLook, SavedLook } from '@/lib/firestore'

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
}

const statusColors = {
  pending: 'text-yellow-500 bg-yellow-50',
  confirmed: 'text-blue-500 bg-blue-50',
  processing: 'text-purple-500 bg-purple-50',
  shipped: 'text-indigo-500 bg-indigo-50',
  delivered: 'text-green-500 bg-green-50',
  cancelled: 'text-red-500 bg-red-50',
}

export default function AccountPage() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading, logout, deleteAccount, updateUser } = useAuth()
  const { addItem } = useCart()
  const [orders, setOrders] = useState<FirestoreOrder[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'saved-looks' | 'address' | 'settings'>('orders')
  const [wishlistProducts, setWishlistProducts] = useState<FirestoreProduct[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([])
  const [savedLooksLoading, setSavedLooksLoading] = useState(false)

  // Settings editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)

  // Address editing state
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [editAddress, setEditAddress] = useState('')
  const [editCity, setEditCity] = useState('')
  const [savingAddress, setSavingAddress] = useState(false)

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=account')
    }
  }, [isLoggedIn, isLoading, router])

  useEffect(() => {
    const loadOrders = async () => {
      if (user) {
        const userOrders = await getOrdersByUser(user.id)
        setOrders(userOrders)
        setEditName(user.name || '')
        setEditPhone(user.phone || '')
        setEditAddress(user.address || '')
        setEditCity(user.city || '')
      }
    }
    loadOrders()
  }, [user])

  // Load wishlist when tab is active
  useEffect(() => {
    const loadWishlist = async () => {
      if (user && activeTab === 'wishlist') {
        setWishlistLoading(true)
        try {
          const wishlistIds = await getWishlist(user.id)
          // Load products from Firestore
          const products: FirestoreProduct[] = []
          for (const id of wishlistIds) {
            const product = await getFirestoreProductById(id)
            if (product) {
              products.push(product)
            }
          }
          setWishlistProducts(products)
        } catch (error) {
          console.error('Error loading wishlist:', error)
        }
        setWishlistLoading(false)
      }
    }
    loadWishlist()
  }, [user, activeTab])

  // Load saved looks when tab is active
  useEffect(() => {
    const loadSavedLooks = async () => {
      if (user && activeTab === 'saved-looks') {
        setSavedLooksLoading(true)
        try {
          const looks = await getSavedLooks(user.id)
          setSavedLooks(looks)
        } catch (error) {
          console.error('Error loading saved looks:', error)
        }
        setSavedLooksLoading(false)
      }
    }
    loadSavedLooks()
  }, [user, activeTab])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user) return
    await removeFromWishlist(user.id, productId)
    setWishlistProducts(prev => prev.filter(p => p.id !== productId))
  }

  const handleAddToCart = (product: FirestoreProduct) => {
    if (!product.id) return
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
    }, 1, product.sizes?.[0] || '', product.colors?.[0] || '')
  }

  const handleDeleteSavedLook = async (lookId: string) => {
    const deleted = await deleteSavedLook(lookId)
    if (deleted) {
      setSavedLooks(prev => prev.filter(look => look.id !== lookId))
    }
  }

  const handleAddLookToCart = (look: SavedLook) => {
    look.items.forEach(item => {
      addItem({
        id: item.productId,
        name: item.productName,
        brand: item.brand,
        price: item.price,
        originalPrice: item.price,
        image: item.imageUrl || '/placeholder.jpg',
        category: item.category as 'clothes' | 'accessories' | 'shoes',
        sizes: [],
        colors: [],
      }, 1)
    })
  }

  // Reorder - add all items from an order to cart
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  const handleReorder = (order: FirestoreOrder) => {
    const orderId = order.id || order.orderId
    setReorderingId(orderId)

    order.items.forEach(item => {
      addItem({
        id: item.productId || `reorder-${Date.now()}`,
        name: item.name,
        brand: item.brand || 'Unknown',
        price: item.price,
        originalPrice: item.price,
        image: item.image || '/placeholder.jpg',
        category: 'clothes' as const,
        sizes: [],
        colors: [],
      }, item.quantity, item.size || '', item.color || '')
    })

    // Reset after animation
    setTimeout(() => setReorderingId(null), 2000)
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    const success = await updateUserProfile(user.id, {
      name: editName,
      phone: editPhone,
    })
    if (success && updateUser) {
      updateUser({ ...user, name: editName, phone: editPhone })
    }
    setSaving(false)
    setIsEditing(false)
  }

  const cancelEditing = () => {
    setEditName(user?.name || '')
    setEditPhone(user?.phone || '')
    setIsEditing(false)
  }

  const handleSaveAddress = async () => {
    if (!user) return
    setSavingAddress(true)
    const success = await updateUserProfile(user.id, {
      address: editAddress,
      city: editCity,
    })
    if (success && updateUser) {
      updateUser({ ...user, address: editAddress, city: editCity })
    }
    setSavingAddress(false)
    setIsEditingAddress(false)
  }

  const cancelEditingAddress = () => {
    setEditAddress(user?.address || '')
    setEditCity(user?.city || '')
    setIsEditingAddress(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm')
      return
    }

    setDeleting(true)
    setDeleteError('')

    const result = await deleteAccount()

    if (result.success) {
      router.push('/')
    } else {
      setDeleteError(result.error || 'Failed to delete account')
      setDeleting(false)
    }
  }

  const openDeleteModal = () => {
    setShowDeleteModal(true)
    setDeleteConfirmText('')
    setDeleteError('')
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setDeleteConfirmText('')
    setDeleteError('')
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
        </main>
        <Footer />
      </>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container-max px-4 md:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                {/* Profile */}
                <div className="text-center mb-6 pb-6 border-b border-gray-100">
                  <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-gold" />
                  </div>
                  <h2 className="font-bold text-navy">{user?.name}</h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeTab === 'orders' ? 'bg-gold/10 text-gold' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Package className="w-5 h-5" />
                    <span className="font-medium">My Orders</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                  <button
                    onClick={() => setActiveTab('wishlist')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeTab === 'wishlist' ? 'bg-gold/10 text-gold' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                    <span className="font-medium">Wishlist</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                  <button
                    onClick={() => setActiveTab('saved-looks')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeTab === 'saved-looks' ? 'bg-gold/10 text-gold' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="font-medium">Saved Looks</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                  <button
                    onClick={() => setActiveTab('address')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeTab === 'address' ? 'bg-gold/10 text-gold' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Address</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeTab === 'settings' ? 'bg-gold/10 text-gold' : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                </nav>

                {/* AI Dresser CTA */}
                <div className="mt-6 p-4 bg-navy rounded-xl text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-gold" />
                    <span className="font-semibold">AI Dresser</span>
                  </div>
                  <p className="text-sm text-white/70 mb-3">Get personalized outfit recommendations</p>
                  <Link
                    href="/ai-dresser"
                    className="block text-center bg-gold text-navy font-semibold py-2 rounded-lg hover:bg-gold-400 transition-colors"
                  >
                    Try Now
                  </Link>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeTab === 'orders' && (
                <div>
                  <h1 className="text-2xl font-bold text-navy mb-6">My Orders</h1>

                  {orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map(order => {
                        const StatusIcon = statusIcons[order.status]
                        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date()
                        return (
                          <div key={order.id || order.orderId} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            {/* Order Header */}
                            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <p className="font-mono text-sm text-gray-500">{order.orderId}</p>
                                <p className="text-sm text-gray-400">
                                  {orderDate.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusColors[order.status]}`}>
                                <StatusIcon className="w-4 h-4" />
                                <span className="text-sm font-medium capitalize">{order.status}</span>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-4">
                              <div className="flex flex-wrap gap-4 mb-4">
                                {order.items.slice(0, 3).map((item, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <ShoppingBag className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-navy text-sm">{item.name}</p>
                                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="flex items-center">
                                    <span className="text-sm text-gray-500">+{order.items.length - 3} more</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div>
                                  <span className="text-gray-500 text-sm">Total: </span>
                                  <span className="font-bold text-navy">₱{order.total.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleReorder(order)}
                                    disabled={reorderingId === (order.id || order.orderId)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                                      reorderingId === (order.id || order.orderId)
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gold/10 text-gold hover:bg-gold hover:text-navy'
                                    }`}
                                  >
                                    <RotateCcw className={`w-4 h-4 ${reorderingId === (order.id || order.orderId) ? 'animate-spin' : ''}`} />
                                    {reorderingId === (order.id || order.orderId) ? 'Added!' : 'Reorder'}
                                  </button>
                                  <button className="text-gold font-medium text-sm hover:text-gold-600">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-navy mb-2">No orders yet</h3>
                      <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-6 py-3 rounded-full hover:bg-gold-400 transition-colors"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Browse Products
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div>
                  <h1 className="text-2xl font-bold text-navy mb-6">My Wishlist</h1>
                  {wishlistLoading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-gold" />
                    </div>
                  ) : wishlistProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wishlistProducts.map(product => {
                        const hasImage = product.images && product.images.length > 0 && product.images[0]
                        return (
                          <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex">
                            <Link href={`/shop/${product.id}`} className="w-32 h-32 bg-gray-100 flex-shrink-0 relative overflow-hidden">
                              {hasImage ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                  sizes="128px"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Shirt className="w-12 h-12 text-gray-300" />
                                </div>
                              )}
                            </Link>
                            <div className="flex-1 p-4 flex flex-col justify-between">
                              <div>
                                <p className="text-xs text-gold font-medium">{product.brand}</p>
                                <Link href={`/shop/${product.id}`}>
                                  <h3 className="font-medium text-navy hover:text-gold transition-colors line-clamp-1">
                                    {product.name}
                                  </h3>
                                </Link>
                                <p className="font-bold text-navy mt-1">₱{product.price.toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  className="flex-1 flex items-center justify-center gap-1 bg-gold text-navy text-sm font-medium py-2 rounded-lg hover:bg-gold-400 transition-colors"
                                >
                                  <ShoppingBag className="w-4 h-4" />
                                  Add to Cart
                                </button>
                                <button
                                  onClick={() => product.id && handleRemoveFromWishlist(product.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-navy mb-2">Your wishlist is empty</h3>
                      <p className="text-gray-500 mb-6">Save items you love for later</p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-6 py-3 rounded-full hover:bg-gold-400 transition-colors"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Browse Products
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'saved-looks' && (
                <div>
                  <h1 className="text-2xl font-bold text-navy mb-6">Saved Looks</h1>
                  {savedLooksLoading ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-gold" />
                    </div>
                  ) : savedLooks.length > 0 ? (
                    <div className="space-y-6">
                      {savedLooks.map(look => (
                        <div key={look.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                          {/* Look Header */}
                          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-navy to-navy/90">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-white">{look.lookName}</h3>
                                <p className="text-white/60 text-sm">{look.lookDescription}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white/60 text-xs">Total</p>
                                <p className="text-xl font-bold text-gold">₱{look.totalPrice.toLocaleString()}</p>
                              </div>
                            </div>
                          </div>

                          {/* Look Items */}
                          <div className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              {look.items.map((item, index) => (
                                <Link
                                  key={index}
                                  href={item.productUrl || `/shop/${item.productId}`}
                                  className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                                >
                                  <div className="aspect-square relative bg-gray-100">
                                    {item.imageUrl ? (
                                      <Image
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        fill
                                        className="object-cover"
                                        sizes="150px"
                                      />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <Shirt className="w-8 h-8 text-gray-300" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-2">
                                    <p className="text-xs text-gold font-medium">{item.brand}</p>
                                    <p className="text-sm font-medium text-navy truncate">{item.productName}</p>
                                    <p className="text-sm font-bold text-navy">₱{item.price.toLocaleString()}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>

                            {/* Style Tip */}
                            {look.styleTip && (
                              <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 mb-4">
                                <p className="text-xs text-gold font-medium mb-1">Style Tip</p>
                                <p className="text-sm text-gray-700">{look.styleTip}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleAddLookToCart(look)}
                                className="flex-1 flex items-center justify-center gap-2 bg-gold text-navy font-semibold py-3 rounded-xl hover:bg-gold-400 transition-colors"
                              >
                                <ShoppingBag className="w-4 h-4" />
                                Add All to Cart
                              </button>
                              <button
                                onClick={() => look.id && handleDeleteSavedLook(look.id)}
                                className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-navy mb-2">No saved looks yet</h3>
                      <p className="text-gray-500 mb-6">Save your favorite AI Dresser outfits to view them here</p>
                      <Link
                        href="/ai-dresser"
                        className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-6 py-3 rounded-full hover:bg-gold-400 transition-colors"
                      >
                        <Sparkles className="w-5 h-5" />
                        Try AI Dresser
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'address' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-navy">Shipping Address</h1>
                    {!isEditingAddress ? (
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="flex items-center gap-2 text-gold hover:text-gold-600 font-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Address
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelEditingAddress}
                          className="flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveAddress}
                          disabled={savingAddress}
                          className="flex items-center gap-1 px-4 py-1.5 bg-gold text-navy rounded-lg font-medium hover:bg-gold-400 disabled:opacity-50"
                        >
                          {savingAddress ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                        <input
                          type="text"
                          value={isEditingAddress ? editAddress : (user?.address || '')}
                          onChange={(e) => setEditAddress(e.target.value)}
                          disabled={!isEditingAddress}
                          placeholder={isEditingAddress ? 'Street address, barangay' : 'Not set'}
                          className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                            isEditingAddress
                              ? 'border-gold bg-white focus:outline-none focus:ring-2 focus:ring-gold/20'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City / Municipality</label>
                        <input
                          type="text"
                          value={isEditingAddress ? editCity : (user?.city || '')}
                          onChange={(e) => setEditCity(e.target.value)}
                          disabled={!isEditingAddress}
                          placeholder={isEditingAddress ? 'City / Municipality' : 'Not set'}
                          className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                            isEditingAddress
                              ? 'border-gold bg-white focus:outline-none focus:ring-2 focus:ring-gold/20'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Info note */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-700">
                        This address will be used as your default shipping address during checkout.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-navy">Account Settings</h1>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-gold hover:text-gold-600 font-medium"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelEditing}
                          className="flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="flex items-center gap-1 px-4 py-1.5 bg-gold text-navy rounded-lg font-medium hover:bg-gold-400 disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={isEditing ? editName : (user?.name || '')}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                            isEditing
                              ? 'border-gold bg-white focus:outline-none focus:ring-2 focus:ring-gold/20'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                        />
                        <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={isEditing ? editPhone : (user?.phone || '')}
                          onChange={(e) => setEditPhone(e.target.value)}
                          disabled={!isEditing}
                          placeholder={isEditing ? 'Enter phone number' : 'Not set'}
                          className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                            isEditing
                              ? 'border-gold bg-white focus:outline-none focus:ring-2 focus:ring-gold/20'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <input
                          type="text"
                          value={user?.username || ''}
                          disabled
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                        />
                        <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-600 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={openDeleteModal}
                      className="flex items-center gap-2 bg-red-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteModal}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">Delete Account</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete your account? This will permanently remove:
              </p>
              <ul className="text-sm text-gray-500 space-y-1 mb-4">
                <li>• Your profile information</li>
                <li>• Your wishlist</li>
                <li>• Your AI Dresser preferences</li>
              </ul>
              <p className="text-sm text-gray-600 mb-2">
                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-red-500"
              />
              {deleteError && (
                <p className="text-sm text-red-600 mt-2">{deleteError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
