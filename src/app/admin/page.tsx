'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, ShoppingBag, Users, Package, TrendingUp,
  DollarSign, Eye, Clock, CheckCircle, XCircle, Truck,
  ChevronRight, Search, Filter, MoreVertical, LogOut, Download, Loader2
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

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading, logout } = useAuth()
  const [orders, setOrders] = useState<FirestoreOrder[]>([])
  const [users, setUsers] = useState<(UserProfile & { id: string })[]>([])
  const [selectedOrder, setSelectedOrder] = useState<FirestoreOrder | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    totalCustomers: users.length,
  }

  const handleStatusChange = async (docId: string, newStatus: FirestoreOrder['status'], isGuestOrder: boolean = false) => {
    const success = await updateOrderStatus(docId, newStatus, isGuestOrder)
    if (success) {
      // Refresh orders
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
            You don't have admin privileges. Contact support if you believe this is an error.
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
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'orders' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'customers' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70'
            }`}
          >
            <Users className="w-5 h-5" />
            Customers
          </button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-green-500 text-sm font-medium">+12%</span>
            </div>
            <p className="text-2xl font-bold text-navy">{stats.totalOrders}</p>
            <p className="text-gray-500 text-sm">Total Orders</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-yellow-500 text-sm font-medium">Action</span>
            </div>
            <p className="text-2xl font-bold text-navy">{stats.pendingOrders}</p>
            <p className="text-gray-500 text-sm">Pending Orders</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-500 text-sm font-medium">+8%</span>
            </div>
            <p className="text-2xl font-bold text-navy">₱{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-gray-500 text-sm">Total Revenue</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-green-500 text-sm font-medium">+5%</span>
            </div>
            <p className="text-2xl font-bold text-navy">{stats.totalCustomers}</p>
            <p className="text-gray-500 text-sm">Total Customers</p>
          </div>
        </div>

        {/* Orders Section */}
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

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Type</th>
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${order.userId ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {order.userId ? 'Member' : 'Guest'}
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

        {/* Customers Section */}
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
                  {!selectedOrder.userId && (
                    <span className="inline-block px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">Guest Order</span>
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
