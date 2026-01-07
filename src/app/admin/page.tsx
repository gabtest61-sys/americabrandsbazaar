'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, ShoppingBag, Users, Package, TrendingUp,
  DollarSign, Eye, Clock, CheckCircle, XCircle, Truck,
  ChevronRight, Search, Filter, MoreVertical, LogOut, Download, Loader2,
  AlertTriangle, BarChart3, Plus, Edit2, Trash2, Save, X
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  getAllOrders,
  updateOrderStatus,
  getAllUsers,
  checkIsAdmin,
  FirestoreOrder,
  UserProfile
} from '@/lib/firestore'
import { products as allProducts, Product, brands, categories } from '@/lib/products'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

type TabType = 'orders' | 'customers' | 'inventory' | 'analytics' | 'products'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading, logout } = useAuth()
  const [orders, setOrders] = useState<FirestoreOrder[]>([])
  const [users, setUsers] = useState<(UserProfile & { id: string })[]>([])
  const [selectedOrder, setSelectedOrder] = useState<FirestoreOrder | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('orders')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Product management state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productFilter, setProductFilter] = useState({ category: '', brand: '' })

  // Check admin access and redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login?redirect=admin')
    }
  }, [isLoggedIn, isLoading, router])

  // Check if user is admin and fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      const adminStatus = await checkIsAdmin(user.id)
      setIsAdmin(adminStatus)

      if (adminStatus) {
        const [ordersData, usersData] = await Promise.all([
          getAllOrders(),
          getAllUsers()
        ])
        setOrders(ordersData)
        setUsers(usersData)
      }
      setIsLoadingData(false)
    }

    if (isLoggedIn && user) {
      fetchData()
    }
  }, [isLoggedIn, user])

  const filteredOrders = orders.filter(order => {
    if (filterStatus && order.status !== filterStatus) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.orderId.toLowerCase().includes(query) ||
        order.customerInfo.name.toLowerCase().includes(query) ||
        order.customerInfo.email.toLowerCase().includes(query)
      )
    }
    return true
  })

  // Calculate stats
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    totalCustomers: users.length,
  }

  // Inventory stats
  const lowStockProducts = allProducts.filter(p => p.stockQty < 20)
  const outOfStockProducts = allProducts.filter(p => p.stockQty === 0)
  const totalInventoryValue = allProducts.reduce((sum, p) => sum + (p.price * p.stockQty), 0)

  // Analytics data
  const categoryBreakdown = categories.map(cat => ({
    category: cat,
    count: allProducts.filter(p => p.category === cat).length,
    revenue: orders.reduce((sum, o) => {
      const catItems = o.items.filter(item => {
        const product = allProducts.find(p => p.id === item.productId)
        return product?.category === cat
      })
      return sum + catItems.reduce((s, i) => s + (i.price * i.quantity), 0)
    }, 0)
  }))

  const brandBreakdown = brands.map(brand => ({
    brand,
    count: allProducts.filter(p => p.brand === brand).length,
    products: allProducts.filter(p => p.brand === brand)
  }))

  // Filtered products for product management
  const filteredProducts = allProducts.filter(p => {
    if (productFilter.category && p.category !== productFilter.category) return false
    if (productFilter.brand && p.brand !== productFilter.brand) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
    }
    return true
  })

  const handleStatusChange = async (docId: string, newStatus: FirestoreOrder['status'], isGuestOrder: boolean = false) => {
    const success = await updateOrderStatus(docId, newStatus, isGuestOrder)
    if (success) {
      const ordersData = await getAllOrders()
      setOrders(ordersData)
      if (selectedOrder?.id === docId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }
    }
  }

  // Export users to CSV
  const exportUsersToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'AI Dresser Usage', 'Preferred Colors', 'Preferred Sizes', 'Preferred Styles']
    const rows = users.map(u => [
      u.name,
      u.email,
      u.phone || '',
      u.aiDresserUsage?.toString() || '0',
      u.preferences?.colors?.join('; ') || '',
      u.preferences?.sizes?.join('; ') || '',
      u.preferences?.styles?.join('; ') || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lgm-customers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export inventory to CSV
  const exportInventoryToCSV = () => {
    const headers = ['ID', 'Name', 'Brand', 'Category', 'Price', 'Stock', 'Status']
    const rows = allProducts.map(p => [
      p.id,
      p.name,
      p.brand,
      p.category,
      p.price.toString(),
      p.stockQty.toString(),
      p.stockQty === 0 ? 'Out of Stock' : p.stockQty < 20 ? 'Low Stock' : 'In Stock'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lgm-inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-navy mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">
            You don&apos;t have admin privileges. Contact support if you believe this is an error.
          </p>
          <Link
            href="/"
            className="inline-block bg-gold text-navy font-semibold px-6 py-3 rounded-full hover:bg-yellow-400 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-navy text-white p-6 hidden lg:block">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gold">LGM Admin</h1>
          <p className="text-white/50 text-sm">Mini CRM Dashboard</p>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'customers', icon: Users, label: 'Customers' },
            { id: 'inventory', icon: Package, label: 'Inventory' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'products', icon: LayoutDashboard, label: 'Products' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.id === 'inventory' && lowStockProducts.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {lowStockProducts.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="border-t border-white/10 pt-4">
            <p className="text-white/50 text-sm mb-2">Logged in as</p>
            <p className="text-white font-medium">{user?.name}</p>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="flex items-center gap-2 text-white/50 hover:text-white mt-3 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-6">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-navy">LGM Admin</h1>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="text-gray-500"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Tab Selector */}
        <div className="lg:hidden mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {[
              { id: 'orders', label: 'Orders' },
              { id: 'customers', label: 'Customers' },
              { id: 'inventory', label: 'Inventory' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'products', label: 'Products' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-gold text-navy' : 'bg-white text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy">{stats.totalOrders}</p>
            <p className="text-gray-500 text-sm">Total Orders</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              {stats.pendingOrders > 0 && (
                <span className="text-yellow-500 text-sm font-medium">Action</span>
              )}
            </div>
            <p className="text-2xl font-bold text-navy">{stats.pendingOrders}</p>
            <p className="text-gray-500 text-sm">Pending Orders</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy">₱{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-gray-500 text-sm">Total Revenue</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-navy">{stats.totalCustomers}</p>
            <p className="text-gray-500 text-sm">Total Customers</p>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-navy">Orders</h2>
                <div className="flex gap-3">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm text-navy">{order.orderId}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-navy">{order.customerInfo.name}</p>
                          <p className="text-sm text-gray-500">{order.customerInfo.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{order.items.length} item(s)</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-navy">₱{order.total.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-500">
                          {order.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-gold hover:text-yellow-600"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders found</p>
              </div>
            )}
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-navy">Customers ({users.length})</h2>
                <button
                  onClick={exportUsersToCSV}
                  className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">AI Dresser Usage</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Preferences</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-navy">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{customer.phone || '-'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{customer.aiDresserUsage || 0} sessions</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {customer.preferences?.styles?.slice(0, 2).map((style, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gold/10 text-gold text-xs rounded">
                              {style}
                            </span>
                          ))}
                          {!customer.preferences?.styles?.length && (
                            <span className="text-xs text-gray-400">No preferences set</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No customers yet</p>
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Inventory Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-navy">{allProducts.length}</p>
                <p className="text-gray-500 text-sm">Total Products</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-navy">{lowStockProducts.length}</p>
                <p className="text-gray-500 text-sm">Low Stock (&lt;20)</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-navy">{outOfStockProducts.length}</p>
                <p className="text-gray-500 text-sm">Out of Stock</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-navy">₱{(totalInventoryValue / 1000000).toFixed(1)}M</p>
                <p className="text-gray-500 text-sm">Inventory Value</p>
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <h3 className="font-bold text-yellow-800">Low Stock Alert</h3>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lowStockProducts.slice(0, 6).map(product => (
                    <div key={product.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-navy">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      </div>
                      <span className={`text-sm font-bold ${product.stockQty === 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {product.stockQty} left
                      </span>
                    </div>
                  ))}
                </div>
                {lowStockProducts.length > 6 && (
                  <p className="text-sm text-yellow-700 mt-3">
                    +{lowStockProducts.length - 6} more products with low stock
                  </p>
                )}
              </div>
            )}

            {/* Full Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-navy">Inventory</h2>
                  <button
                    onClick={exportInventoryToCSV}
                    className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Brand</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allProducts.slice(0, 20).map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <p className="font-medium text-navy">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.id}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">{product.brand}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600 capitalize">{product.category}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-navy">₱{product.price.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">{product.stockQty}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.stockQty === 0
                              ? 'bg-red-100 text-red-700'
                              : product.stockQty < 20
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {product.stockQty === 0 ? 'Out of Stock' : product.stockQty < 20 ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">Sales Analytics</h2>

            {/* Revenue by Category */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-navy mb-6">Revenue by Category</h3>
              <div className="space-y-4">
                {categoryBreakdown.map(cat => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{cat.category}</span>
                      <span className="text-sm text-gray-500">
                        ₱{cat.revenue.toLocaleString()} ({cat.count} products)
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gold rounded-full h-3 transition-all"
                        style={{
                          width: `${stats.totalRevenue > 0 ? (cat.revenue / stats.totalRevenue) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Products by Brand */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-navy mb-6">Products by Brand</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {brandBreakdown.map(b => (
                  <div key={b.brand} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-navy mb-1">{b.brand}</p>
                    <p className="text-2xl font-bold text-gold">{b.count}</p>
                    <p className="text-sm text-gray-500">products</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-navy mb-6">Order Status Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(status => {
                  const count = orders.filter(o => o.status === status).length
                  return (
                    <div key={status} className="text-center">
                      <div className={`w-12 h-12 rounded-full ${statusColors[status]} flex items-center justify-center mx-auto mb-2`}>
                        <span className="font-bold">{count}</span>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{status}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-navy">Product Management ({filteredProducts.length})</h2>
                <div className="flex gap-3 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                    />
                  </div>
                  <select
                    value={productFilter.category}
                    onChange={(e) => setProductFilter(prev => ({ ...prev, category: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                  </select>
                  <select
                    value={productFilter.brand}
                    onChange={(e) => setProductFilter(prev => ({ ...prev, brand: e.target.value }))}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                  >
                    <option value="">All Brands</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Brand</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Featured</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.slice(0, 30).map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-navy">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{product.brand}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600 capitalize">{product.category}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <span className="font-semibold text-navy">₱{product.price.toLocaleString()}</span>
                          {product.originalPrice && (
                            <span className="text-xs text-gray-400 line-through ml-2">
                              ₱{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-sm ${product.stockQty < 20 ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {product.stockQty}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          product.featured ? 'bg-gold/20 text-gold' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {product.featured ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/shop/${product.id}`}
                            target="_blank"
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length > 30 && (
              <div className="p-4 text-center text-sm text-gray-500">
                Showing 30 of {filteredProducts.length} products
              </div>
            )}
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-navy">Order Details</h3>
                  <p className="text-sm text-gray-500 font-mono">{selectedOrder.orderId}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="font-semibold text-navy mb-3">Customer Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p><span className="text-gray-500">Name:</span> {selectedOrder.customerInfo.name}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedOrder.customerInfo.email}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedOrder.customerInfo.phone}</p>
                  {selectedOrder.customerInfo.address && (
                    <p><span className="text-gray-500">Address:</span> {selectedOrder.customerInfo.address}, {selectedOrder.customerInfo.city}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-navy mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        IMG
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-navy">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.size && `Size: ${item.size}`} {item.color && `| Color: ${item.color}`}
                        </p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-navy">₱{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h4 className="font-semibold text-navy mb-3">Order Summary</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>₱{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span>{selectedOrder.shippingFee === 0 ? 'Free' : `₱${selectedOrder.shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-navy pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>₱{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="font-semibold text-navy mb-3">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedOrder.id!, status, !selectedOrder.userId)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                        selectedOrder.status === status
                          ? 'bg-gold text-navy'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
