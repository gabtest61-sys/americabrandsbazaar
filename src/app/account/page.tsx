'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  User, Package, Heart, Settings, LogOut, ChevronRight,
  ShoppingBag, Sparkles, Clock, CheckCircle, Truck, XCircle,
  Shirt, Trash2, Edit2, Save, X, Loader2
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { getOrdersByUserId, Order } from '@/lib/orders'
import { getWishlist, removeFromWishlist, updateUserProfile } from '@/lib/firestore'
import { getProductById, Product } from '@/lib/products'

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
  const { user, isLoggedIn, isLoading, logout, updateUser } = useAuth()
  const { addItem } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'settings'>('orders')
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Settings editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=account')
    }
  }, [isLoggedIn, isLoading, router])

  useEffect(() => {
    if (user) {
      setOrders(getOrdersByUserId(user.id))
      setEditName(user.name || '')
      setEditPhone(user.phone || '')
    }
  }, [user])

  // Load wishlist when tab is active
  useEffect(() => {
    const loadWishlist = async () => {
      if (user && activeTab === 'wishlist') {
        setWishlistLoading(true)
        try {
          const wishlistIds = await getWishlist(user.id)
          const products = wishlistIds
            .map(id => getProductById(id))
            .filter((p): p is Product => p !== undefined)
          setWishlistProducts(products)
        } catch (error) {
          console.error('Error loading wishlist:', error)
        }
        setWishlistLoading(false)
      }
    }
    loadWishlist()
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

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: product.images[0] || '/placeholder.jpg',
      category: product.category as 'clothes' | 'accessories' | 'shoes',
      sizes: product.sizes,
      colors: product.colors,
    }, 1, product.sizes[0], product.colors[0])
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
                    className="block text-center bg-gold text-navy font-semibold py-2 rounded-lg hover:bg-yellow-400 transition-colors"
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
                        return (
                          <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            {/* Order Header */}
                            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <p className="font-mono text-sm text-gray-500">{order.id}</p>
                                <p className="text-sm text-gray-400">
                                  {new Date(order.createdAt).toLocaleDateString('en-US', {
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
                                <button className="text-gold font-medium text-sm hover:text-yellow-600">
                                  View Details
                                </button>
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
                        className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-6 py-3 rounded-full hover:bg-yellow-400 transition-colors"
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
                      {wishlistProducts.map(product => (
                        <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex">
                          <Link href={`/shop/${product.id}`} className="w-32 h-32 bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            <Shirt className="w-12 h-12 text-gray-300" />
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
                                className="flex-1 flex items-center justify-center gap-1 bg-gold text-navy text-sm font-medium py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                              >
                                <ShoppingBag className="w-4 h-4" />
                                Add to Cart
                              </button>
                              <button
                                onClick={() => handleRemoveFromWishlist(product.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-navy mb-2">Your wishlist is empty</h3>
                      <p className="text-gray-500 mb-6">Save items you love for later</p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-6 py-3 rounded-full hover:bg-yellow-400 transition-colors"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Browse Products
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-navy">Account Settings</h1>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-gold hover:text-yellow-600 font-medium"
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
                          className="flex items-center gap-1 px-4 py-1.5 bg-gold text-navy rounded-lg font-medium hover:bg-yellow-400 disabled:opacity-50"
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
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
