'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard, ShoppingBag, Users, Package, TrendingUp,
  DollarSign, Eye, Clock, CheckCircle, XCircle, Truck,
  ChevronRight, Search, Filter, MoreVertical, LogOut, Download, Loader2,
  AlertTriangle, BarChart3, Plus, Edit2, Trash2, Save, X,
  Upload, ImageIcon, Calendar, ChevronLeft, ArrowUpDown,
  CheckSquare, Square, History,
  FileSpreadsheet, Tag, TrendingDown, ArrowUp, ArrowDown, GripVertical,
  Settings, Star, CreditCard, Wallet, BanknoteIcon, AlertCircle,
  Grid, List, LayoutGrid, Table2, Wand2, RefreshCw, Printer
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  getAllOrders,
  updateOrderStatus,
  updateOrderNotes,
  getAllUsers,
  checkIsAdmin,
  FirestoreOrder,
  UserProfile,
  getFirestoreProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  FirestoreProduct,
  getShippingSettings,
  updateShippingSettings,
  ShippingSettings,
  ShippingRate,
  getPaymentSettings,
  updatePaymentSettings,
  PaymentSettings,
  getAllReviews,
  deleteReview,
  Review,
  getAllTryOns,
  TryOnResult,
  createOrderNotification,
  deleteOrder,
  deleteTryOnResult
} from '@/lib/firestore'
import { products as staticProducts, Product, brands, categories } from '@/lib/products'
import { storage } from '@/lib/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

type TabType = 'dashboard' | 'orders' | 'customers' | 'inventory' | 'analytics' | 'products' | 'coupons' | 'reviews' | 'tryons' | 'settings'

// Coupon interface
interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minPurchase: number
  maxUses: number
  usedCount: number
  expiresAt: string
  active: boolean
}

// Size options for different categories
const clothesSizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const shoeSizeOptions = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']
const accessorySizeOptions = ['One Size', 'S', 'M', 'L']
const fragranceSizeOptions = ['30ml', '50ml', '75ml', '100ml', '150ml', '200ml']

// Subcategory options for each category
const subcategoryOptions: Record<string, string[]> = {
  clothes: ['t-shirts', 'shirts', 'polos', 'sweaters', 'hoodies', 'jackets', 'blazers', 'vests', 'pants', 'jeans', 'shorts', 'leggings', 'sportswear', 'underwear', 'dresses', 'skirts', 'coats'],
  accessories: ['watches', 'bags', 'wallets', 'belts', 'eyewear', 'hats', 'socks', 'ties', 'scarves', 'jewelry', 'gloves'],
  shoes: ['sneakers', 'running', 'loafers', 'oxfords', 'boots', 'sandals', 'flats', 'slip-ons', 'boat-shoes', 'heels', 'espadrilles'],
  fragrance: ['eau-de-parfum', 'eau-de-toilette', 'cologne', 'body-mist', 'perfume-oil', 'gift-set'],
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading, logout } = useAuth()
  const [orders, setOrders] = useState<FirestoreOrder[]>([])
  const [users, setUsers] = useState<(UserProfile & { id: string })[]>([])
  const [selectedOrder, setSelectedOrder] = useState<FirestoreOrder | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [ordersRefreshing, setOrdersRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  // Product management state
  const [firestoreProducts, setFirestoreProducts] = useState<FirestoreProduct[]>([])
  const [productFilter, setProductFilter] = useState({ category: '', brand: '' })
  const [productPage, setProductPage] = useState(1)
  const productsPerPage = 12
  const [productViewMode, setProductViewMode] = useState<'grid' | 'table'>('grid')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<FirestoreProduct | null>(null)
  const [productFormData, setProductFormData] = useState<Partial<FirestoreProduct>>({})
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [customProductId, setCustomProductId] = useState('')

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'price' | 'stockQty' | 'createdAt'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Date filter state
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({ from: '', to: '' })

  // Order notes modal
  const [orderNotesModal, setOrderNotesModal] = useState<{ order: FirestoreOrder; note: string } | null>(null)

  // Customer details view
  const [selectedCustomer, setSelectedCustomer] = useState<(UserProfile & { id: string }) | null>(null)

  // Search states for different tabs
  const [customerSearch, setCustomerSearch] = useState('')
  const [inventorySearch, setInventorySearch] = useState('')
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'all' | 'in-stock' | 'low' | 'out'>('all')
  const [productSearch, setProductSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)

  // Unified search
  const [globalSearch, setGlobalSearch] = useState('')

  // Coupon management
  const [coupons, setCoupons] = useState<Coupon[]>([
    { id: '1', code: 'WELCOME10', type: 'percentage', value: 10, minPurchase: 1000, maxUses: 100, usedCount: 23, expiresAt: '2025-12-31', active: true },
    { id: '2', code: 'FLAT500', type: 'fixed', value: 500, minPurchase: 3000, maxUses: 50, usedCount: 12, expiresAt: '2025-06-30', active: true },
  ])
  const [showCouponForm, setShowCouponForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [couponFormData, setCouponFormData] = useState<Partial<Coupon>>({})

  // Order print modal
  const [printOrder, setPrintOrder] = useState<FirestoreOrder | null>(null)

  // Delete order confirmation
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [deletingOrder, setDeletingOrder] = useState(false)

  // Product import
  const productImportRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Revenue chart period
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  // Inventory pagination state
  const [inventoryPage, setInventoryPage] = useState(1)
  const INVENTORY_PER_PAGE = 20

  // Shipping settings state
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null)
  const [editingShipping, setEditingShipping] = useState<ShippingSettings | null>(null)
  const [isSavingShipping, setIsSavingShipping] = useState(false)

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [editingPayment, setEditingPayment] = useState<PaymentSettings | null>(null)
  const [isSavingPayment, setIsSavingPayment] = useState(false)

  // Reviews management state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'verified' | 'unverified'>('all')

  // AI Try-Ons report state
  const [tryOns, setTryOns] = useState<TryOnResult[]>([])
  const [tryOnsLoading, setTryOnsLoading] = useState(false)
  const [tryOnProductFilter, setTryOnProductFilter] = useState('all')
  const [tryOnLightbox, setTryOnLightbox] = useState<string | null>(null)
  const [deletingTryOnId, setDeletingTryOnId] = useState<string | null>(null)
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | null>(null)

  // Payment filter state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('')

  // Bulk order selection
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

  // Low stock threshold setting
  const [lowStockThreshold, setLowStockThreshold] = useState(5)

  // Mobile more menu
  const [showMoreMenu, setShowMoreMenu] = useState(false)

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
        const [ordersData, usersData, productsData, shippingData, reviewsData, tryOnsData, paymentData] = await Promise.all([
          getAllOrders(),
          getAllUsers(),
          getFirestoreProducts(),
          getShippingSettings(),
          getAllReviews(),
          getAllTryOns(),
          getPaymentSettings()
        ])
        setOrders(ordersData)
        setUsers(usersData)
        setFirestoreProducts(productsData)
        setShippingSettings(shippingData)
        setReviews(reviewsData)
        setTryOns(tryOnsData)
        setPaymentSettings(paymentData)
      }
      setIsLoadingData(false)
    }

    if (isLoggedIn && user) {
      fetchData()
    }
  }, [isLoggedIn, user])

  const refreshOrders = useCallback(async () => {
    if (ordersRefreshing) return
    setOrdersRefreshing(true)
    try {
      const ordersData = await getAllOrders()
      setOrders(ordersData)
      setLastRefreshed(new Date())
    } catch (e) {
      console.error('Failed to refresh orders', e)
    }
    setOrdersRefreshing(false)
  }, [ordersRefreshing])

  // Auto-refresh orders every 2 minutes
  useEffect(() => {
    if (!isAdmin) return
    const interval = setInterval(refreshOrders, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isAdmin, refreshOrders])

  // Combined products - Firestore takes priority, fallback to static
  const allProducts = firestoreProducts.length > 0 ? firestoreProducts : staticProducts

  const filteredOrders = orders.filter(order => {
    // Date filter
    if (dateFilter.from) {
      const orderDate = order.createdAt?.toDate()
      if (!orderDate || orderDate < new Date(dateFilter.from)) return false
    }
    if (dateFilter.to) {
      const orderDate = order.createdAt?.toDate()
      if (!orderDate || orderDate > new Date(dateFilter.to + 'T23:59:59')) return false
    }
    // Status filter
    if (filterStatus && order.status !== filterStatus) return false
    // Payment status filter
    if (paymentStatusFilter && order.paymentStatus !== paymentStatusFilter) return false
    // Payment method filter
    if (paymentMethodFilter && order.paymentMethod !== paymentMethodFilter) return false
    // Search filter
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

  // Payment stats — gcash + bank = online; no more COD
  const gcashOrders = orders.filter(o => o.paymentMethod === 'gcash')
  const bankOrders = orders.filter(o => o.paymentMethod === 'bank')
  const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'processing' || o.status === 'shipped' || o.status === 'delivered')
  const paymentStats = {
    confirmedOrders: confirmedOrders.length,
    confirmedRevenue: confirmedOrders.reduce((sum, o) => sum + o.total, 0),
    pendingPayments: orders.filter(o => o.status === 'pending').length,
    pendingRevenue: orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.total, 0),
    gcashOrders: gcashOrders.length,
    gcashRevenue: gcashOrders.reduce((sum, o) => sum + o.total, 0),
    bankOrders: bankOrders.length,
    bankRevenue: bankOrders.reduce((sum, o) => sum + o.total, 0),
    // kept for backward compat in other parts
    paidOrders: confirmedOrders.length,
    paidRevenue: confirmedOrders.reduce((sum, o) => sum + o.total, 0),
    onlineOrders: gcashOrders.length + bankOrders.length,
    onlineRevenue: [...gcashOrders, ...bankOrders].reduce((sum, o) => sum + o.total, 0),
    codOrders: 0,
    codRevenue: 0,
  }

  // Inventory stats - Low stock threshold
  const LOW_STOCK_THRESHOLD = lowStockThreshold
  const lowStockProducts = allProducts.filter(p => p.stockQty > 0 && p.stockQty < LOW_STOCK_THRESHOLD)
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

  // Get all unique brands from actual products (includes custom brands)
  const uniqueBrands = [...new Set(allProducts.map(p => p.brand))].sort()
  const brandBreakdown = uniqueBrands.map(brand => ({
    brand,
    count: allProducts.filter(p => p.brand === brand).length,
    products: allProducts.filter(p => p.brand === brand)
  }))

  // Filtered products for product management with sorting
  const filteredProducts = allProducts
    .filter(p => {
      if (productFilter.category && p.category !== productFilter.category) return false
      if (productFilter.brand && p.brand !== productFilter.brand) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return p.name.toLowerCase().includes(query) || (p.id && p.id.toLowerCase().includes(query))
      }
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'price':
          comparison = a.price - b.price
          break
        case 'stockQty':
          comparison = a.stockQty - b.stockQty
          break
        case 'createdAt':
          const getTime = (val: unknown): number => {
            if (!val) return 0
            if (typeof val === 'object' && 'toMillis' in (val as object)) {
              return (val as { toMillis: () => number }).toMillis()
            }
            return 0
          }
          comparison = getTime(a.createdAt) - getTime(b.createdAt)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const STATUS_MESSAGES: Record<string, string> = {
    confirmed: 'Your order has been confirmed! Please complete your payment.',
    processing: 'Your order is being processed and packed.',
    shipped: '🚚 Your order is on its way!',
    delivered: '📦 Your order has been delivered. Thank you!',
    cancelled: 'Your order has been cancelled. Contact us for assistance.',
    pending: 'Your order is pending confirmation.',
  }

  const handleStatusChange = async (docId: string, newStatus: FirestoreOrder['status'], isGuestOrder: boolean = false) => {
    const success = await updateOrderStatus(docId, newStatus, isGuestOrder)
    if (success) {
      const ordersData = await getAllOrders()
      setOrders(ordersData)
      if (selectedOrder?.id === docId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
      }

      const order = ordersData.find(o => o.id === docId) || orders.find(o => o.id === docId)
      if (!order) return

      if (order.customerInfo.email) {
        const isPaymentMethod = order.paymentMethod === 'gcash' || order.paymentMethod === 'bank'

        if (newStatus === 'confirmed' && isPaymentMethod) {
          // Confirmed + gcash/bank → send payment instructions email
          fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'payment_instructions',
              orderId: order.orderId,
              customer: {
                name: order.customerInfo.name,
                email: order.customerInfo.email,
                phone: order.customerInfo.phone,
                address: order.customerInfo.address,
                city: order.customerInfo.city,
                houseNo: order.customerInfo.houseNo,
                street: order.customerInfo.street,
                barangay: order.customerInfo.barangay,
                province: order.customerInfo.province,
                zip: order.customerInfo.zip,
              },
              products: order.items.map(i => ({
                name: i.name,
                brand: i.brand,
                price: i.price,
                quantity: i.quantity,
                size: i.size,
                color: i.color,
              })),
              total: order.total,
              paymentMethod: order.paymentMethod,
              paymentSettings: paymentSettings ? {
                gcashNumber: paymentSettings.gcashNumber,
                gcashName: paymentSettings.gcashName,
                bankName: paymentSettings.bankName,
                bankAccount: paymentSettings.bankAccount,
                bankAccountName: paymentSettings.bankAccountName,
              } : undefined,
            }),
          }).catch(() => {})
        } else if (newStatus !== 'confirmed') {
          // All other statuses (processing, shipped, delivered, cancelled) → status update email
          fetch('/api/email/status-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.orderId,
              customerName: order.customerInfo.name,
              customerEmail: order.customerInfo.email,
              status: newStatus,
              items: order.items.map(i => ({
                name: i.name,
                brand: i.brand,
                price: i.price,
                quantity: i.quantity,
              })),
              total: order.total,
            }),
          }).catch(() => {})
        }
      }

      // Create in-app notification + push for registered users
      // Fall back to looking up userId by email if order.userId is missing
      const resolvedUserId = order.userId || users.find(u => u.email === order.customerInfo.email)?.id
      if (resolvedUserId) {
        const notifMessage = STATUS_MESSAGES[newStatus] || `Your order status has been updated to ${newStatus}.`
        createOrderNotification(resolvedUserId, order.orderId, newStatus, notifMessage).catch(() => {})
        fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: resolvedUserId,
            title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} — ${order.orderId}`,
            body: notifMessage,
            orderId: order.orderId,
            status: newStatus,
          }),
        }).catch(() => {})
      }
    }
  }

  const handleDeleteOrder = async (docId: string, isGuest: boolean) => {
    setDeletingOrder(true)
    try {
      const success = await deleteOrder(docId, isGuest)
      if (success) {
        setOrders(prev => prev.filter(o => o.id !== docId))
        if (selectedOrder?.id === docId) setSelectedOrder(null)
      } else {
        alert('Failed to delete order. Please try again.')
      }
    } catch (e) {
      console.error('Delete order error:', e)
      alert('Error deleting order.')
    }
    setDeleteOrderId(null)
    setDeletingOrder(false)
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
      p.stockQty === 0 ? 'Out of Stock' : p.stockQty < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock'
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

  // Open product form for create/edit
  const openProductForm = (product?: FirestoreProduct) => {
    setBrandSearch('')
    setShowBrandDropdown(false)
    if (product) {
      setEditingProduct(product)
      setProductFormData({ ...product })
      setCustomProductId('')
    } else {
      setEditingProduct(null)
      setProductFormData({
        name: '',
        brand: '',
        category: 'clothes',
        subcategory: '',
        price: 0,
        originalPrice: undefined,
        description: '',
        images: [],
        colors: [],
        sizes: [],
        gender: 'unisex',
        tags: [],
        inStock: true,
        stockQty: 0,
        featured: false,
        giftSuitable: true,
        occasions: [],
        style: []
      })
      setCustomProductId('')
    }
    setShowProductForm(true)
  }

  // Save product (create or update)
  const handleSaveProduct = async () => {
    if (!productFormData.name || !productFormData.brand) {
      alert('Please fill in required fields (Name, Brand)')
      return
    }

    setIsSavingProduct(true)

    try {
      if (editingProduct?.id) {
        // Update existing product
        const success = await updateProduct(editingProduct.id, productFormData)
        if (success) {
          setFirestoreProducts(prev =>
            prev.map(p => p.id === editingProduct.id ? { ...p, ...productFormData } : p)
          )
          setShowProductForm(false)
          setEditingProduct(null)
        } else {
          alert('Failed to update product')
        }
      } else {
        // Create new product (with optional custom ID)
        const result = await createProduct(
          productFormData as Omit<FirestoreProduct, 'id' | 'createdAt' | 'updatedAt'>,
          customProductId.trim() || undefined
        )
        if (result.success && result.id) {
          const newProduct = { ...productFormData, id: result.id } as FirestoreProduct
          setFirestoreProducts(prev => [newProduct, ...prev])
          setShowProductForm(false)
          setCustomProductId('')
        } else {
          alert(result.error || 'Failed to create product')
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('An error occurred while saving the product')
    }

    setIsSavingProduct(false)
  }

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    const success = await deleteProduct(productId)
    if (success) {
      setFirestoreProducts(prev => prev.filter(p => p.id !== productId))
      setDeleteConfirm(null)
    } else {
      alert('Failed to delete product')
    }
  }

  // Quick update product fields
  const handleQuickUpdate = async (productId: string, field: string, value: unknown) => {
    const success = await updateProduct(productId, { [field]: value })
    if (success) {
      setFirestoreProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, [field]: value } : p)
      )
    }
  }

  // Image upload — Cloudinary unsigned → /api/upload fallback → base64 preview
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingImages(true)
    setUploadError('')
    const currentImages = productFormData.images || []
    const newImages: string[] = []

    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dbbwll2i7'
    const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'products_unsigned'

    for (const file of Array.from(files)) {
      let uploaded = false

      // 1️⃣ Cloudinary unsigned upload (no API key needed — requires upload preset in Cloudinary dashboard)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', UPLOAD_PRESET)
        formData.append('folder', 'lgm-apparel/products')

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (data.secure_url) {
          console.log('[Upload] Cloudinary unsigned OK:', data.secure_url)
          newImages.push(data.secure_url)
          uploaded = true
        } else {
          throw new Error(data.error?.message || 'No URL returned')
        }
      } catch (err: any) {
        console.warn('[Upload] Cloudinary unsigned failed:', err.message)
      }

      if (uploaded) continue

      // 2️⃣ Server-side /api/upload (needs CLOUDINARY_API_KEY in .env.local)
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, folder: 'products' }),
        })
        const result = await res.json()
        if (result.success && result.url) {
          console.log('[Upload] /api/upload OK:', result.url)
          newImages.push(result.url)
          uploaded = true
        } else {
          throw new Error(result.error || 'Upload API failed')
        }
      } catch (err: any) {
        console.warn('[Upload] /api/upload failed:', err.message)
      }

      if (uploaded) continue

      // 3️⃣ Last resort: base64 preview (shows in form but won't survive page reload)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      newImages.push(base64)
      setUploadError('Using preview only. To save permanently, create an unsigned upload preset named "products_unsigned" in your Cloudinary dashboard (Settings → Upload → Upload Presets → Add unsigned preset).')
    }

    setProductFormData(prev => ({
      ...prev,
      images: [...currentImages, ...newImages]
    }))
    setUploadingImages(false)
  }

  // Remove image from product
  const handleRemoveImage = (index: number) => {
    setProductFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }))
  }

  // Sorting handler
  const handleSort = (field: 'name' | 'price' | 'stockQty' | 'createdAt') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // Bulk selection handlers
  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const selectAllProducts = () => {
    if (selectedProducts.size === paginatedProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(paginatedProducts.map(p => p.id!).filter(Boolean)))
    }
  }

  // Bulk delete products
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedProducts.size} products?`)) return

    let successCount = 0
    for (const productId of selectedProducts) {
      const success = await deleteProduct(productId)
      if (success) successCount++
    }

    if (successCount > 0) {
      setFirestoreProducts(prev => prev.filter(p => !p.id || !selectedProducts.has(p.id)))
      setSelectedProducts(new Set())
    }
    alert(`Deleted ${successCount} of ${selectedProducts.size} products`)
  }

  // Bulk update stock
  const handleBulkStockUpdate = async (inStock: boolean) => {
    let successCount = 0
    for (const productId of selectedProducts) {
      const success = await updateProduct(productId, { inStock })
      if (success) successCount++
    }

    if (successCount > 0) {
      setFirestoreProducts(prev =>
        prev.map(p => p.id && selectedProducts.has(p.id) ? { ...p, inStock } : p)
      )
    }
    alert(`Updated ${successCount} products`)
  }

  // Get customer orders
  const getCustomerOrders = (customerId: string) => {
    return orders.filter(o => o.userId === customerId)
  }

  // Calculate customer lifetime value
  const getCustomerLifetimeValue = (customerId: string) => {
    return getCustomerOrders(customerId).reduce((sum, o) => sum + o.total, 0)
  }

  // Export orders to CSV
  const exportOrdersToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Phone', 'Items', 'Subtotal', 'Shipping', 'Total', 'Status', 'Payment Method', 'Payment Status', 'Date', 'Notes']
    const rows = filteredOrders.map(o => [
      o.orderId,
      o.customerInfo.name,
      o.customerInfo.email,
      o.customerInfo.phone,
      o.items.map(i => `${i.name} x${i.quantity}`).join('; '),
      o.subtotal.toString(),
      o.shippingFee.toString(),
      o.total.toString(),
      o.status,
      o.paymentMethod || 'N/A',
      o.paymentStatus || 'N/A',
      o.createdAt?.toDate().toISOString().split('T')[0] || 'N/A',
      o.notes || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lgm-orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export products to CSV (for import template)
  const exportProductsToCSV = () => {
    const headers = ['ID', 'Name', 'Brand', 'Category', 'Subcategory', 'Price', 'Original Price', 'Stock', 'Description', 'Colors', 'Sizes', 'Tags', 'Gender', 'Featured', 'In Stock']
    const rows = allProducts.map(p => [
      p.id || '',
      p.name,
      p.brand,
      p.category,
      p.subcategory,
      p.price.toString(),
      p.originalPrice?.toString() || '',
      p.stockQty.toString(),
      p.description,
      p.colors.join(';'),
      p.sizes.join(';'),
      p.tags.join(';'),
      p.gender,
      p.featured ? 'true' : 'false',
      p.inStock ? 'true' : 'false'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lgm-products-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import products from CSV
  const handleProductImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())

        let importCount = 0
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const values = line.match(/("([^"]|"")*"|[^,]*)/g)?.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()) || []

          const getVal = (key: string) => values[headers.indexOf(key)] || ''

          const productData: Omit<FirestoreProduct, 'id' | 'createdAt' | 'updatedAt'> = {
            name: getVal('name'),
            brand: getVal('brand') || brands[0],
            category: (getVal('category') as 'clothes' | 'accessories' | 'shoes' | 'fragrance') || 'clothes',
            subcategory: getVal('subcategory'),
            price: parseFloat(getVal('price')) || 0,
            originalPrice: getVal('original price') ? parseFloat(getVal('original price')) : undefined,
            stockQty: parseInt(getVal('stock')) || 0,
            description: getVal('description'),
            colors: getVal('colors').split(';').filter(Boolean),
            sizes: getVal('sizes').split(';').filter(Boolean),
            tags: getVal('tags').split(';').filter(Boolean),
            gender: (getVal('gender') as 'male' | 'female' | 'unisex') || 'unisex',
            featured: getVal('featured') === 'true',
            inStock: getVal('in stock') !== 'false',
            images: [],
            occasions: [],
            style: [],
            giftSuitable: true
          }

          if (productData.name && productData.price > 0) {
            const result = await createProduct(productData)
            if (result.success) importCount++
          }
        }

        alert(`Successfully imported ${importCount} products`)
        const productsData = await getFirestoreProducts()
        setFirestoreProducts(productsData)
      } catch (error) {
        console.error('Import error:', error)
        alert('Error importing CSV. Please check the file format.')
      }
      setIsImporting(false)
    }

    reader.readAsText(file)
    e.target.value = ''
  }

  // Revenue chart data calculation
  const getRevenueChartData = () => {
    const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : 90
    const data: { date: string; revenue: number; orders: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayOrders = orders.filter(o => {
        const orderDate = o.createdAt?.toDate()
        return orderDate?.toISOString().split('T')[0] === dateStr
      })

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length
      })
    }
    return data
  }

  // Dashboard comparison stats (today vs yesterday, this week vs last week)
  const getDashboardComparisons = () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    const todayOrders = orders.filter(o => o.createdAt?.toDate().toDateString() === today.toDateString())
    const yesterdayOrders = orders.filter(o => o.createdAt?.toDate().toDateString() === yesterday.toDateString())

    const thisWeekOrders = orders.filter(o => {
      const d = o.createdAt?.toDate()
      return d && d >= startOfWeek && d <= today
    })
    const lastWeekOrders = orders.filter(o => {
      const d = o.createdAt?.toDate()
      return d && d >= startOfLastWeek && d < startOfWeek
    })

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0)
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0)
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + o.total, 0)
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + o.total, 0)

    return {
      today: { orders: todayOrders.length, revenue: todayRevenue },
      yesterday: { orders: yesterdayOrders.length, revenue: yesterdayRevenue },
      thisWeek: { orders: thisWeekOrders.length, revenue: thisWeekRevenue },
      lastWeek: { orders: lastWeekOrders.length, revenue: lastWeekRevenue },
      revenueChange: yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0,
      weeklyChange: lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100) : 0
    }
  }

  // Coupon handlers
  const openCouponForm = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setCouponFormData({ ...coupon })
    } else {
      setEditingCoupon(null)
      setCouponFormData({
        code: '',
        type: 'percentage',
        value: 10,
        minPurchase: 0,
        maxUses: 100,
        usedCount: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        active: true
      })
    }
    setShowCouponForm(true)
  }

  const handleSaveCoupon = () => {
    if (!couponFormData.code || !couponFormData.value) {
      alert('Please fill in required fields')
      return
    }

    if (editingCoupon) {
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? { ...c, ...couponFormData } as Coupon : c))
    } else {
      const newCoupon: Coupon = {
        ...couponFormData as Coupon,
        id: Date.now().toString(),
        usedCount: 0
      }
      setCoupons(prev => [...prev, newCoupon])
    }
    setShowCouponForm(false)
    setEditingCoupon(null)
  }

  const toggleCouponStatus = (couponId: string) => {
    setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, active: !c.active } : c))
  }

  const deleteCoupon = (couponId: string) => {
    if (confirm('Delete this coupon?')) {
      setCoupons(prev => prev.filter(c => c.id !== couponId))
    }
  }

  // Get chart data
  const chartData = getRevenueChartData()
  const comparisons = getDashboardComparisons()
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)

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
            className="inline-block bg-gold text-navy-900 font-semibold px-6 py-3 rounded-full hover:bg-gold-400 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-navy text-white p-6 hidden lg:flex lg:flex-col z-30">
        <div className="mb-6 flex items-center gap-2">
          <div className="relative w-8 h-8 bg-white rounded-full overflow-hidden flex-shrink-0">
            <Image
              src="/abblogo.jpg"
              alt="America Brands Bazaar Logo"
              fill
              className="object-contain scale-[1.75]"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gold">ABB Admin</h1>
          </div>
        </div>

        <nav className="space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'customers', icon: Users, label: 'Customers' },
            { id: 'inventory', icon: Package, label: 'Inventory' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'reviews', icon: Star, label: 'Reviews' },
            { id: 'tryons', icon: Wand2, label: 'AI Try-Ons' },
            { id: 'coupons', icon: Tag, label: 'Coupons' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id ? 'bg-gold/20 text-gold' : 'hover:bg-white/5 text-white/70'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.id === 'inventory' && lowStockProducts.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {lowStockProducts.length}
                </span>
              )}
              {tab.id === 'reviews' && reviews.length > 0 && (
                <span className="ml-auto bg-gold text-navy-900 text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {reviews.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm flex-shrink-0">
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              {user?.name && <p className="text-white font-medium text-sm truncate">{user.name}</p>}
              <p className="text-white/50 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-stretch h-16">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders', badge: stats.pendingOrders },
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'inventory', icon: BarChart3, label: 'Stock', badge: lowStockProducts.length },
          ].map(tab => {
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as TabType); setShowMoreMenu(false) }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                  active ? 'text-gold' : 'text-gray-400'
                }`}
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold rounded-full" />}
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {!!tab.badge && tab.badge > 0 && (
                  <span className="absolute top-2 right-1/4 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{tab.badge}</span>
                )}
              </button>
            )
          })}
          {/* More button */}
          <button
            onClick={() => setShowMoreMenu(v => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              showMoreMenu ? 'text-gold' : 'text-gray-400'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE MORE DRAWER ── */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-30" onClick={() => setShowMoreMenu(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-gray-100 shadow-xl rounded-t-2xl p-4" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'customers', icon: Users, label: 'Customers' },
                { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
                { id: 'reviews', icon: Star, label: 'Reviews', badge: reviews.length },
                { id: 'tryons', icon: Wand2, label: 'AI Try-Ons', badge: tryOns.length },
                { id: 'coupons', icon: Tag, label: 'Coupons' },
                { id: 'settings', icon: Settings, label: 'Settings' },
              ].map(tab => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as TabType); setShowMoreMenu(false) }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl relative transition-all ${
                      active ? 'bg-gold/10 text-gold' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{tab.label}</span>
                    {!!tab.badge && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gold text-navy text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{tab.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => { logout(); router.push('/') }}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-red-400 text-sm font-medium rounded-xl bg-red-50"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-6 min-h-screen pb-20 lg:pb-6">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-4 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 bg-white rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gold/40">
              <Image src="/abblogo.jpg" alt="ABB" fill className="object-contain scale-[1.75]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 leading-none">ABB Admin</p>
              <p className="text-sm font-bold text-navy leading-tight capitalize">{activeTab}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">{user?.name?.split(' ')[0] || 'Admin'}</span>
            <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm">
              {(user?.name || user?.email || '?')[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
                { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-50 text-yellow-600', alert: stats.pendingOrders > 0 },
                { label: 'Revenue', value: `₱${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
                { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'bg-purple-50 text-purple-600' },
              ].map((card) => (
                <div key={card.label} className="bg-white rounded-xl p-3 lg:p-5 shadow-sm relative">
                  <div className={`w-9 h-9 lg:w-11 lg:h-11 rounded-lg flex items-center justify-center mb-2 lg:mb-3 ${card.color}`}>
                    <card.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                  <p className="text-lg lg:text-2xl font-bold text-navy leading-none">{card.value}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{card.label}</p>
                  {card.alert && <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full" />}
                </div>
              ))}
            </div>

            {/* Payment Status Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Confirmed</p>
                    <p className="text-xl font-bold text-navy">{paymentStats.confirmedOrders}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xs text-green-600 mt-1">₱{paymentStats.confirmedRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-xl font-bold text-navy">{paymentStats.pendingPayments}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-xs text-yellow-600 mt-1">₱{paymentStats.pendingRevenue.toLocaleString()} awaiting</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">GCash</p>
                    <p className="text-xl font-bold text-navy">{paymentStats.gcashOrders}</p>
                  </div>
                  <span className="text-2xl">📱</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">₱{paymentStats.gcashRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Bank Transfer</p>
                    <p className="text-xl font-bold text-navy">{paymentStats.bankOrders}</p>
                  </div>
                  <span className="text-2xl">🏦</span>
                </div>
                <p className="text-xs text-purple-600 mt-1">₱{paymentStats.bankRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Quick Actions & Overview */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-navy">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-sm text-gold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="p-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-medium text-navy text-sm">#{order.id?.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{order.customerInfo?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-navy text-sm">₱{order.total.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No orders yet</p>
                  )}
                </div>
              </div>

              {/* Low Stock & Inventory Alerts */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-navy">Inventory Alerts</h3>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-sm text-gold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="p-4">
                  {lowStockProducts.slice(0, 5).map(product => (
                    <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-navy text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.brand}</p>
                        </div>
                      </div>
                      <span className="text-red-500 text-sm font-medium">
                        {product.stockQty} left
                      </span>
                    </div>
                  ))}
                  {lowStockProducts.length === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">All products in stock</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-navy">{allProducts.length}</p>
                    <p className="text-xs text-gray-500">Total Products</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-navy">{lowStockProducts.length}</p>
                    <p className="text-xs text-gray-500">Low Stock Items</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-navy">{reviews.length}</p>
                    <p className="text-xs text-gray-500">Reviews</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Tag className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold text-navy">{coupons.filter(c => c.active).length}</p>
                    <p className="text-xs text-gray-500">Active Coupons</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-3">

            {/* Search + Export */}
            <div className="bg-white rounded-2xl p-3 shadow-sm flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders, customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <button
                onClick={exportOrdersToCSV}
                className="flex items-center gap-1.5 bg-gold text-navy text-sm font-semibold px-3 py-2.5 rounded-xl whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>

            {/* Status chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                <button
                  key={s || 'all'}
                  onClick={() => setFilterStatus(s)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterStatus === s ? 'bg-navy text-white' : 'bg-white text-gray-500 shadow-sm'
                  }`}
                >
                  {s === '' ? `All (${orders.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${orders.filter(o => o.status === s).length})`}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input type="date" value={dateFilter.from} onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))} className="flex-1 min-w-0 px-2 py-1.5 bg-gray-50 rounded-lg text-xs border-0 focus:outline-none" />
              <span className="text-gray-300 text-xs">→</span>
              <input type="date" value={dateFilter.to} onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))} className="flex-1 min-w-0 px-2 py-1.5 bg-gray-50 rounded-lg text-xs border-0 focus:outline-none" />
              {(dateFilter.from || dateFilter.to) && (
                <button onClick={() => setDateFilter({ from: '', to: '' })} className="text-xs text-red-400 font-medium">Clear</button>
              )}
            </div>

            <div className="flex items-center gap-3 px-1">
              <p className="text-xs text-gray-400">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found</p>
              <button
                onClick={refreshOrders}
                disabled={ordersRefreshing}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-navy transition-colors disabled:opacity-50"
                title="Refresh orders"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ordersRefreshing ? 'animate-spin' : ''}`} />
                {lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Refresh'}
              </button>
            </div>

            {/* Mobile: card list */}
            <div className="lg:hidden space-y-2">
              {filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden" onClick={() => setSelectedOrder(order)}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-navy text-sm font-mono">{order.orderId}</p>
                        <p className="text-xs text-gray-400">{order.createdAt?.toDate().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) || 'N/A'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${statusColors[order.status as keyof typeof statusColors]}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-navy/10 text-navy flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {order.customerInfo.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy truncate">{order.customerInfo.name}</p>
                        <p className="text-xs text-gray-400 truncate">{order.customerInfo.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-navy">₱{order.total.toLocaleString()}</span>
                        <span className="text-xs text-gray-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {order.paymentMethod === 'gcash' ? '📱 GCash' : order.paymentMethod === 'bank' ? '🏦 Bank' : order.paymentMethod?.toUpperCase() || '—'} · {order.status}
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteOrderId(order.id!) }} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Quick status change */}
                  <div className="border-t border-gray-50 px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
                    {(['pending','confirmed','processing','shipped','delivered','cancelled'] as const).map(s => (
                      <button
                        key={s}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id!, s, !order.userId) }}
                        className={`flex-shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all ${order.status === s ? 'bg-navy text-white' : 'bg-gray-50 text-gray-400'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex gap-3 p-4 border-b border-gray-100 flex-wrap">
                <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold">
                  <option value="">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold">
                  <option value="">All Methods</option>
                  <option value="gcash">📱 GCash</option>
                  <option value="bank">🏦 Bank Transfer</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>{['Order ID','Customer','Total','Payment','Status','Date','Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4"><span className="font-mono text-sm text-navy">{order.orderId}</span><p className="text-xs text-gray-400">{order.items.length} item(s)</p></td>
                        <td className="py-4 px-4"><p className="font-medium text-navy">{order.customerInfo.name}</p><p className="text-xs text-gray-500">{order.customerInfo.email}</p></td>
                        <td className="py-4 px-4 font-semibold text-navy">₱{order.total.toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${order.paymentMethod === 'gcash' ? 'bg-blue-100 text-blue-700' : order.paymentMethod === 'bank' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                              {order.paymentMethod === 'gcash' ? <>📱 GCash</> : order.paymentMethod === 'bank' ? <>🏦 Bank</> : order.paymentMethod?.toUpperCase() || '—'}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${order.status === 'confirmed' || order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <select value={order.status} onChange={(e) => handleStatusChange(order.id!, e.target.value as FirestoreOrder['status'], !order.userId)} className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${statusColors[order.status as keyof typeof statusColors]}`}>
                            {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">{order.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedOrder(order)} className="text-gold hover:text-gold-600" title="View"><Eye className="w-5 h-5" /></button>
                            <button onClick={() => setDeleteOrderId(order.id!)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredOrders.length === 0 && (
              <div className="bg-white rounded-2xl text-center py-16 shadow-sm">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No orders found</p>
              </div>
            )}
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <div className="space-y-3">
            {/* Top bar */}
            <div className="bg-white rounded-2xl p-3 shadow-sm flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <button
                onClick={exportUsersToCSV}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-500 flex-shrink-0"
                title="Export CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const filteredUsers = users.filter(u =>
                !customerSearch ||
                u.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                u.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                u.phone?.toLowerCase().includes(customerSearch.toLowerCase())
              )

              if (users.length === 0) return (
                <div className="bg-white rounded-2xl text-center py-16 shadow-sm">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400">No customers yet</p>
                </div>
              )

              return (
                <>
                  {/* Mobile: card list */}
                  <div className="lg:hidden space-y-2">
                    {filteredUsers.map(customer => {
                      const customerOrders = getCustomerOrders(customer.id)
                      const lifetimeValue = getCustomerLifetimeValue(customer.id)
                      const initials = (customer.name || customer.email || '?').slice(0, 2).toUpperCase()
                      return (
                        <div key={customer.id} className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-11 h-11 rounded-full bg-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {initials}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-navy truncate">{customer.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400 truncate">{customer.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{customerOrders.length} orders</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${lifetimeValue > 5000 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>₱{lifetimeValue.toLocaleString()}</span>
                            </div>
                          </div>
                          {/* Action */}
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="w-9 h-9 flex items-center justify-center bg-gold/10 rounded-xl text-gold flex-shrink-0"
                            title="View History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Phone</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Orders</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Lifetime Value</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">AI Dresser</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(customer => {
                          const customerOrders = getCustomerOrders(customer.id)
                          const lifetimeValue = getCustomerLifetimeValue(customer.id)
                          return (
                            <tr key={customer.id} className="hover:bg-gray-50">
                              <td className="py-4 px-6">
                                <p className="font-medium text-navy">{customer.name}</p>
                                <p className="text-sm text-gray-500">{customer.email}</p>
                              </td>
                              <td className="py-4 px-6"><span className="text-sm text-gray-600">{customer.phone || '-'}</span></td>
                              <td className="py-4 px-6"><span className="text-sm font-medium text-navy">{customerOrders.length}</span></td>
                              <td className="py-4 px-6">
                                <span className={`text-sm font-semibold ${lifetimeValue > 5000 ? 'text-green-600' : 'text-navy'}`}>
                                  ₱{lifetimeValue.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-4 px-6"><span className="text-sm text-gray-600">{customer.aiDresserUsage || 0}</span></td>
                              <td className="py-4 px-6">
                                <button onClick={() => setSelectedCustomer(customer)} className="flex items-center gap-1.5 text-sm text-gold">
                                  <History className="w-4 h-4" />View History
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-3">

            {/* Stats — 2×2 on mobile, 4 cols on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: Package, bg: 'bg-blue-100', color: 'text-blue-600', value: allProducts.length, label: 'Total' },
                { icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600', value: allProducts.filter(p => p.stockQty >= LOW_STOCK_THRESHOLD).length, label: 'In Stock' },
                { icon: AlertTriangle, bg: 'bg-yellow-100', color: 'text-yellow-600', value: lowStockProducts.length, label: 'Low Stock' },
                { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600', value: outOfStockProducts.length, label: 'Out of Stock' },
              ].map(({ icon: Icon, bg, color, value, label }) => (
                <div key={label} className="bg-white rounded-2xl p-3 lg:p-5 shadow-sm flex items-center gap-3">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-navy leading-tight">{value}</p>
                    <p className="text-gray-500 text-[11px]">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Inventory Value banner */}
            <div className="bg-navy rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider">Total Inventory Value</p>
                <p className="text-white text-2xl font-bold mt-0.5">₱{totalInventoryValue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-gold" />
              </div>
            </div>

            {/* Alerts: Out of stock + Low stock quick list */}
            {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-bold text-navy">Needs Attention</span>
                  </div>
                  <span className="text-xs text-gray-400">{outOfStockProducts.length + lowStockProducts.length} items</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {[...outOfStockProducts, ...lowStockProducts]
                    .sort((a, b) => a.stockQty - b.stockQty)
                    .map(product => {
                      const isOut = product.stockQty === 0
                      const isCritical = !isOut && product.stockQty <= 5
                      return (
                        <div key={product.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {product.images?.[0]
                              ? <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                              : <div className="flex items-center justify-center h-full"><Package className="w-4 h-4 text-gray-300" /></div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-navy truncate">{product.name}</p>
                            <p className="text-[10px] text-gray-400">{product.brand} · {product.category}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                              isOut ? 'bg-red-100 text-red-600' : isCritical ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {isOut ? 'OUT' : `${product.stockQty} left`}
                            </span>
                            <button
                              onClick={() => { setActiveTab('products'); openProductForm(product as FirestoreProduct) }}
                              className="w-8 h-8 flex items-center justify-center bg-gold/10 rounded-xl text-gold"
                              title="Edit stock"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
              <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-700">All products well stocked</p>
                  <p className="text-xs text-green-500">No low or out-of-stock items</p>
                </div>
              </div>
            )}

            {/* Search + export */}
            <div className="bg-white rounded-2xl p-3 shadow-sm flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={inventorySearch}
                  onChange={(e) => { setInventorySearch(e.target.value); setInventoryPage(1) }}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <button onClick={exportInventoryToCSV} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-500 flex-shrink-0" title="Export CSV">
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>

            {/* Status filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {([
                { key: 'all', label: `All (${allProducts.length})` },
                { key: 'in-stock', label: `In Stock (${allProducts.filter(p => p.stockQty >= LOW_STOCK_THRESHOLD).length})` },
                { key: 'low', label: `Low (${lowStockProducts.length})` },
                { key: 'out', label: `Out (${outOfStockProducts.length})` },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => { setInventoryStatusFilter(key); setInventoryPage(1) }}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    inventoryStatusFilter === key
                      ? key === 'out' ? 'bg-red-500 text-white'
                        : key === 'low' ? 'bg-yellow-400 text-navy'
                        : 'bg-navy text-white'
                      : 'bg-white text-gray-500 shadow-sm'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Product list */}
            {(() => {
              const filtered = allProducts.filter(p => {
                const matchSearch = !inventorySearch ||
                  p.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                  p.brand?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                  p.category?.toLowerCase().includes(inventorySearch.toLowerCase())
                const matchStatus = inventoryStatusFilter === 'all' ? true
                  : inventoryStatusFilter === 'out' ? p.stockQty === 0
                  : inventoryStatusFilter === 'low' ? p.stockQty > 0 && p.stockQty < LOW_STOCK_THRESHOLD
                  : p.stockQty >= LOW_STOCK_THRESHOLD
                return matchSearch && matchStatus
              })
              const totalInvPages = Math.ceil(filtered.length / INVENTORY_PER_PAGE)
              const pagedItems = filtered.slice((inventoryPage - 1) * INVENTORY_PER_PAGE, inventoryPage * INVENTORY_PER_PAGE)

              if (filtered.length === 0) return (
                <div className="bg-white rounded-2xl text-center py-12 shadow-sm">
                  <Package className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-gray-400 text-sm">No products match</p>
                </div>
              )

              return (
                <>
                  {/* Mobile: card list */}
                  <div className="lg:hidden space-y-2">
                    {pagedItems.map(product => {
                      const isOut = product.stockQty === 0
                      const isCritical = !isOut && product.stockQty <= 5
                      const isLow = !isOut && !isCritical && product.stockQty < LOW_STOCK_THRESHOLD
                      const stockMax = 50
                      const pct = Math.min(100, (product.stockQty / stockMax) * 100)
                      const barColor = isOut ? 'bg-red-400' : isCritical ? 'bg-orange-400' : isLow ? 'bg-yellow-400' : 'bg-green-400'
                      const badgeCls = isOut ? 'bg-red-100 text-red-600' : isCritical ? 'bg-orange-100 text-orange-600' : isLow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      const badgeLabel = isOut ? 'Out' : isCritical ? 'Critical' : isLow ? 'Low' : 'Good'
                      return (
                        <div key={product.id} className={`bg-white rounded-2xl shadow-sm p-3 ${isOut ? 'ring-1 ring-red-100' : isCritical ? 'ring-1 ring-orange-100' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              {product.images?.[0]
                                ? <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="48px" />
                                : <div className="flex items-center justify-center h-full"><Package className="w-5 h-5 text-gray-300" /></div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-gold font-bold uppercase tracking-wide">{product.brand}</p>
                              <p className="text-sm font-semibold text-navy truncate">{product.name}</p>
                              <p className="text-[11px] text-gray-400 capitalize">{product.category}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badgeLabel}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-navy leading-none">{product.stockQty}</span>
                                <button
                                  onClick={() => { setActiveTab('products'); openProductForm(product as FirestoreProduct) }}
                                  className="w-8 h-8 flex items-center justify-center bg-gold/10 rounded-xl text-gold"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Stock bar */}
                          <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden lg:block bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Brand</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pagedItems.map(product => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="py-4 px-6">
                              <p className="font-medium text-navy">{product.name}</p>
                              <p className="text-xs text-gray-400">{product.id}</p>
                            </td>
                            <td className="py-4 px-6"><span className="text-sm text-gray-600">{product.brand}</span></td>
                            <td className="py-4 px-6"><span className="text-sm text-gray-600 capitalize">{product.category}</span></td>
                            <td className="py-4 px-6"><span className="font-semibold text-navy">₱{product.price.toLocaleString()}</span></td>
                            <td className="py-4 px-6"><span className="text-sm font-bold text-navy">{product.stockQty}</span></td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                product.stockQty === 0 ? 'bg-red-100 text-red-700'
                                  : product.stockQty < LOW_STOCK_THRESHOLD ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {product.stockQty === 0 ? 'Out of Stock' : product.stockQty < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <button
                                onClick={() => { setActiveTab('products'); openProductForm(product as FirestoreProduct) }}
                                className="flex items-center gap-1.5 text-sm text-gold"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalInvPages > 1 && (
                    <div className="flex items-center justify-between">
                      <button onClick={() => setInventoryPage(p => Math.max(1, p - 1))} disabled={inventoryPage === 1} className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-sm font-medium text-navy shadow-sm disabled:opacity-40">
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <span className="text-sm text-gray-500">{inventoryPage} / {totalInvPages}</span>
                      <button onClick={() => setInventoryPage(p => Math.min(totalInvPages, p + 1))} disabled={inventoryPage === totalInvPages} className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-sm font-medium text-navy shadow-sm disabled:opacity-40">
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-navy">Sales Analytics</h2>

            {/* Dashboard Comparison Widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Today&apos;s Revenue</p>
                <p className="text-2xl font-bold text-navy">₱{comparisons.today.revenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  {comparisons.revenueChange >= 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${comparisons.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(comparisons.revenueChange).toFixed(1)}% vs yesterday
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Today&apos;s Orders</p>
                <p className="text-2xl font-bold text-navy">{comparisons.today.orders}</p>
                <p className="text-sm text-gray-400 mt-2">{comparisons.yesterday.orders} yesterday</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">This Week Revenue</p>
                <p className="text-2xl font-bold text-navy">₱{comparisons.thisWeek.revenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-2">
                  {comparisons.weeklyChange >= 0 ? (
                    <ArrowUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${comparisons.weeklyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(comparisons.weeklyChange).toFixed(1)}% vs last week
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-gray-500 mb-1">This Week Orders</p>
                <p className="text-2xl font-bold text-navy">{comparisons.thisWeek.orders}</p>
                <p className="text-sm text-gray-400 mt-2">{comparisons.lastWeek.orders} last week</p>
              </div>
            </div>

            {/* Payment Analytics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-500">Confirmed Orders</p>
                </div>
                <p className="text-2xl font-bold text-navy">{paymentStats.confirmedOrders}</p>
                <p className="text-sm text-green-600 mt-1">₱{paymentStats.confirmedRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="text-sm text-gray-500">Pending Orders</p>
                </div>
                <p className="text-2xl font-bold text-navy">{paymentStats.pendingPayments}</p>
                <p className="text-sm text-yellow-600 mt-1">₱{paymentStats.pendingRevenue.toLocaleString()} awaiting</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">📱</span>
                  </div>
                  <p className="text-sm text-gray-500">GCash Orders</p>
                </div>
                <p className="text-2xl font-bold text-navy">{paymentStats.gcashOrders}</p>
                <p className="text-sm text-blue-600 mt-1">₱{paymentStats.gcashRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">🏦</span>
                  </div>
                  <p className="text-sm text-gray-500">Bank Transfer Orders</p>
                </div>
                <p className="text-2xl font-bold text-navy">{paymentStats.bankOrders}</p>
                <p className="text-sm text-purple-600 mt-1">₱{paymentStats.bankRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-navy mb-4">Payment Method Breakdown</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">📱 GCash</span>
                    <span className="font-semibold text-navy">
                      {stats.totalOrders > 0 ? Math.round((paymentStats.gcashOrders / stats.totalOrders) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${stats.totalOrders > 0 ? (paymentStats.gcashOrders / stats.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{paymentStats.gcashOrders} orders • ₱{paymentStats.gcashRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">🏦 Bank Transfer</span>
                    <span className="font-semibold text-navy">
                      {stats.totalOrders > 0 ? Math.round((paymentStats.bankOrders / stats.totalOrders) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${stats.totalOrders > 0 ? (paymentStats.bankOrders / stats.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{paymentStats.bankOrders} orders • ₱{paymentStats.bankRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-navy">Revenue Trends</h3>
                <div className="flex gap-2">
                  {(['7d', '30d', '90d'] as const).map(period => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        chartPeriod === period
                          ? 'bg-gold text-navy-900'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64 flex items-end gap-1">
                {chartData.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full bg-gold/80 hover:bg-gold rounded-t transition-colors cursor-pointer"
                      style={{ height: `${maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0}%`, minHeight: day.revenue > 0 ? '4px' : '0' }}
                    />
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-navy text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {day.date}: ₱{day.revenue.toLocaleString()} ({day.orders} orders)
                    </div>
                    {chartPeriod === '7d' && (
                      <span className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">
                        {day.date.split(' ')[0]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-sm text-gray-500">
                <span>{chartData[0]?.date}</span>
                <span>{chartData[chartData.length - 1]?.date}</span>
              </div>
            </div>

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

            {/* Top Selling Products */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-navy mb-6">Top Selling Products</h3>
              {(() => {
                // Calculate product sales from orders
                const productSales: Record<string, { name: string; brand: string; quantity: number; revenue: number; image?: string }> = {}
                orders.filter(o => o.status !== 'cancelled').forEach(order => {
                  order.items.forEach(item => {
                    const productId = item.productId || item.name
                    if (!productSales[productId]) {
                      productSales[productId] = {
                        name: item.name,
                        brand: item.brand || 'Unknown',
                        quantity: 0,
                        revenue: 0,
                        image: item.image
                      }
                    }
                    productSales[productId].quantity += item.quantity
                    productSales[productId].revenue += item.price * item.quantity
                  })
                })

                const topProducts = Object.entries(productSales)
                  .sort((a, b) => b[1].revenue - a[1].revenue)
                  .slice(0, 10)

                return topProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No sales data yet</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map(([id, product], index) => (
                      <div key={id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-gold font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} width={48} height={48} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.brand}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-navy">₱{product.revenue.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{product.quantity} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Conversion Metrics */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-navy mb-6">Conversion Metrics</h3>
              {(() => {
                const completedOrders = orders.filter(o => o.status === 'delivered').length
                const totalOrders = orders.filter(o => o.status !== 'cancelled').length
                const cancelledOrders = orders.filter(o => o.status === 'cancelled').length
                const fulfillmentRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
                const cancellationRate = orders.length > 0 ? (cancelledOrders / orders.length) * 100 : 0
                const avgOrderValue = totalOrders > 0
                  ? orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0) / totalOrders
                  : 0
                const repeatCustomers = new Set(orders.filter(o => {
                  const customerOrders = orders.filter(ord => ord.customerInfo.email === o.customerInfo.email)
                  return customerOrders.length > 1
                }).map(o => o.customerInfo.email)).size
                const totalCustomers = new Set(orders.map(o => o.customerInfo.email)).size
                const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-1">Fulfillment Rate</p>
                      <p className="text-2xl font-bold text-green-600">{fulfillmentRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">{completedOrders} delivered of {totalOrders}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-1">Cancellation Rate</p>
                      <p className="text-2xl font-bold text-red-600">{cancellationRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">{cancelledOrders} cancelled</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
                      <p className="text-2xl font-bold text-navy">₱{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      <p className="text-xs text-gray-400">Per order</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500 mb-1">Repeat Customer Rate</p>
                      <p className="text-2xl font-bold text-blue-600">{repeatRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">{repeatCustomers} of {totalCustomers} customers</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-3">

            {/* Top bar: search + add */}
            <div className="bg-white rounded-2xl p-3 shadow-sm flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setProductPage(1) }}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-xl text-sm border-0 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <button
                onClick={() => openProductForm()}
                className="flex items-center gap-1.5 bg-gold text-navy text-sm font-bold px-3 py-2.5 rounded-xl whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              <button
                onClick={() => productImportRef.current?.click()}
                disabled={isImporting}
                className="flex items-center gap-1.5 bg-navy text-white text-sm font-semibold px-3 py-2.5 rounded-xl whitespace-nowrap disabled:opacity-50"
                title="Import CSV"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="hidden sm:inline">{isImporting ? 'Importing...' : 'Import'}</span>
              </button>
              <button onClick={exportProductsToCSV} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-500 flex-shrink-0" title="Export CSV">
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <input ref={productImportRef} type="file" accept=".csv" onChange={handleProductImport} className="hidden" />
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {['', ...([...new Set(allProducts.map(p => p.category))].sort())].map(cat => (
                <button
                  key={cat || 'all'}
                  onClick={() => { setProductFilter(prev => ({ ...prev, category: cat })); setProductPage(1) }}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                    productFilter.category === cat ? 'bg-navy text-white' : 'bg-white text-gray-500 shadow-sm'
                  }`}
                >
                  {cat === '' ? `All (${allProducts.length})` : `${cat} (${allProducts.filter(p => p.category === cat).length})`}
                </button>
              ))}
            </div>

            {/* Bulk actions */}
            {selectedProducts.size > 0 && (
              <div className="bg-gold/10 border border-gold/30 rounded-2xl p-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-navy flex-shrink-0">{selectedProducts.size} selected</span>
                <button onClick={() => handleBulkStockUpdate(true)} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium">In Stock</button>
                <button onClick={() => handleBulkStockUpdate(false)} className="text-xs px-3 py-1.5 bg-yellow-600 text-white rounded-lg font-medium">Out of Stock</button>
                <button onClick={handleBulkDelete} className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg font-medium">Delete</button>
                <button onClick={() => setSelectedProducts(new Set())} className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg font-medium ml-auto">Clear</button>
              </div>
            )}

            {/* Product list */}
            {(() => {
              const fp = allProducts.filter(p => {
                if (productFilter.category && p.category !== productFilter.category) return false
                if (productFilter.brand && p.brand !== productFilter.brand) return false
                if (productSearch) {
                  const s = productSearch.toLowerCase()
                  return p.name?.toLowerCase().includes(s) || p.brand?.toLowerCase().includes(s) || p.id?.toLowerCase().includes(s)
                }
                return true
              })
              const tp = Math.ceil(fp.length / productsPerPage)
              const si = (productPage - 1) * productsPerPage
              const pp = fp.slice(si, si + productsPerPage)

              if (fp.length === 0) return (
                <div className="bg-white rounded-2xl text-center py-16 shadow-sm">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-gray-400">No products found</p>
                </div>
              )

              return (
                <>
                  {/* Select all row */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      onClick={() => selectedProducts.size === pp.length ? setSelectedProducts(new Set()) : setSelectedProducts(new Set(pp.map(p => p.id!).filter(Boolean)))}
                      className="flex items-center gap-2 text-xs text-gray-500"
                    >
                      {selectedProducts.size === pp.length && pp.length > 0 ? <CheckSquare className="w-4 h-4 text-gold" /> : <Square className="w-4 h-4" />}
                      Select all ({pp.length})
                    </button>
                    <span className="text-xs text-gray-400">{si + 1}–{Math.min(si + productsPerPage, fp.length)} of {fp.length}</span>
                  </div>

                  {/* Mobile: compact list */}
                  <div className="lg:hidden space-y-2">
                    {pp.map(product => (
                      <div key={product.id} className={`bg-white rounded-2xl shadow-sm flex items-center gap-3 p-3 ${selectedProducts.has(product.id!) ? 'ring-2 ring-gold/50' : ''}`}>
                        {/* Checkbox */}
                        <button onClick={() => toggleSelectProduct(product.id!)} className="flex-shrink-0">
                          {selectedProducts.has(product.id!) ? <CheckSquare className="w-5 h-5 text-gold" /> : <Square className="w-5 h-5 text-gray-300" />}
                        </button>
                        {/* Image */}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="56px" />
                          ) : (
                            <div className="flex items-center justify-center h-full"><Package className="w-6 h-6 text-gray-300" /></div>
                          )}
                          {product.featured && <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-gold rounded-full flex items-center justify-center"><Star className="w-2 h-2 text-navy" /></span>}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gold font-bold uppercase tracking-wide">{product.brand}</p>
                          <p className="text-sm font-semibold text-navy truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-bold text-navy">₱{product.price.toLocaleString()}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${product.stockQty > 20 ? 'bg-green-100 text-green-700' : product.stockQty > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {product.stockQty > 0 ? `${product.stockQty} left` : 'Out'}
                            </span>
                            <span className="text-[10px] text-gray-300 capitalize">{product.category}</span>
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button onClick={() => openProductForm(product as FirestoreProduct)} className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteConfirm(product.id || null)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: grid */}
                  <div className="hidden lg:grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {pp.map(product => (
                      <div key={product.id} className={`bg-gray-50 rounded-xl overflow-hidden border transition-colors group ${selectedProducts.has(product.id!) ? 'border-gold ring-2 ring-gold/30' : 'border-gray-100 hover:border-gold/50'}`}>
                        <div className="relative aspect-square bg-white">
                          {product.images?.[0] ? <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="25vw" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-300"><Package className="w-12 h-12" /></div>}
                          <button onClick={() => toggleSelectProduct(product.id!)} className={`absolute top-2 right-2 w-6 h-6 rounded flex items-center justify-center z-10 ${selectedProducts.has(product.id!) ? 'bg-gold text-navy' : 'bg-white/90 text-gray-400 opacity-0 group-hover:opacity-100'}`}>
                            {selectedProducts.has(product.id!) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </button>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button onClick={() => openProductForm(product as FirestoreProduct)} className="p-2 bg-white rounded-lg hover:bg-gold transition-colors"><Edit2 className="w-4 h-4 text-navy" /></button>
                            <button onClick={() => setDeleteConfirm(product.id || null)} className="p-2 bg-white rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          {product.featured && <span className="absolute top-2 left-2 px-2 py-0.5 bg-gold text-navy text-xs font-bold rounded">Featured</span>}
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-gold font-medium mb-0.5">{product.brand}</p>
                          <p className="text-sm font-medium text-navy truncate">{product.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm font-bold text-navy">₱{product.price.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded ${product.stockQty > 20 ? 'bg-green-100 text-green-700' : product.stockQty > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{product.stockQty} left</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {tp > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <button onClick={() => setProductPage(p => Math.max(1, p - 1))} disabled={productPage === 1} className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-sm font-medium text-navy shadow-sm disabled:opacity-40">
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      <span className="text-sm text-gray-500">{productPage} / {tp}</span>
                      <button onClick={() => setProductPage(p => Math.min(tp, p + 1))} disabled={productPage === tp} className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-sm font-medium text-navy shadow-sm disabled:opacity-40">
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-navy">Coupon Management</h2>
                  <p className="text-sm text-gray-500">{coupons.length} coupons configured</p>
                </div>
                <button
                  onClick={() => openCouponForm()}
                  className="flex items-center gap-2 bg-gold hover:bg-gold-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Coupon
                </button>
              </div>
            </div>

            {/* Coupons List */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Discount</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Min Purchase</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Usage</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Expires</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coupons.map(coupon => (
                      <tr key={coupon.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm font-bold text-navy bg-gray-100 px-2 py-1 rounded">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            coupon.type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {coupon.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-navy">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : `₱${coupon.value}`}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">₱{coupon.minPurchase.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">{coupon.usedCount} / {coupon.maxUses}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-sm ${new Date(coupon.expiresAt) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                            {new Date(coupon.expiresAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => toggleCouponStatus(coupon.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              coupon.active
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {coupon.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openCouponForm(coupon)}
                              className="p-1.5 text-gray-400 hover:text-gold hover:bg-gold/10 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCoupon(coupon.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {coupons.length === 0 && (
                <div className="text-center py-12">
                  <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No coupons created yet</p>
                  <button
                    onClick={() => openCouponForm()}
                    className="mt-4 text-gold hover:text-gold-600 font-medium"
                  >
                    Create your first coupon
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-3 lg:p-5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0"><Star className="w-4 h-4 text-gray-500" /></div>
                <div><p className="text-xl font-bold text-navy">{reviews.length}</p><p className="text-xs text-gray-500">Total</p></div>
              </div>
              <div className="bg-white rounded-2xl p-3 lg:p-5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 text-green-600" /></div>
                <div><p className="text-xl font-bold text-green-600">{reviews.filter(r => r.verified).length}</p><p className="text-xs text-gray-500">Verified</p></div>
              </div>
              <div className="bg-white rounded-2xl p-3 lg:p-5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0"><Star className="w-4 h-4 text-yellow-500" /></div>
                <div><p className="text-xl font-bold text-yellow-600">{reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0'}</p><p className="text-xs text-gray-500">Avg Rating</p></div>
              </div>
              <div className="bg-white rounded-2xl p-3 lg:p-5 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><Star className="w-4 h-4 text-blue-500" /></div>
                <div><p className="text-xl font-bold text-blue-600">{reviews.filter(r => r.rating === 5).length}</p><p className="text-xs text-gray-500">5-Star</p></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4">
              {/* Filter chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                {(['all', 'verified', 'unverified'] as const).map(f => (
                  <button key={f} onClick={() => setReviewFilter(f)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${reviewFilter === f ? 'bg-navy text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {f === 'all' ? 'All' : f === 'verified' ? 'Verified' : 'Unverified'}
                  </button>
                ))}
                <div className="w-px bg-gray-200 flex-shrink-0 my-1" />
                {[null, 5, 4, 3, 2, 1].map(r => (
                  <button key={r ?? 'all'} onClick={() => setReviewRatingFilter(r)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${reviewRatingFilter === r ? 'bg-gold text-navy' : 'bg-gray-100 text-gray-500'}`}>
                    {r === null ? 'All Stars' : `${r}★`}
                  </button>
                ))}
              </div>

              {/* Reviews list */}
              <div className="space-y-3">
                {reviews
                  .filter(review => {
                    if (reviewFilter === 'verified' && !review.verified) return false
                    if (reviewFilter === 'unverified' && review.verified) return false
                    if (reviewRatingFilter && review.rating !== reviewRatingFilter) return false
                    return true
                  })
                  .map(review => {
                    const product = firestoreProducts.find(p => p.id === review.productId)
                    return (
                      <div key={review.id} className="border border-gray-100 rounded-2xl p-3 hover:border-gold/40 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Product Link */}
                            {product && (
                              <Link
                                href={`/shop/${product.id}`}
                                className="text-sm text-gold hover:text-gold-600 font-medium mb-1 inline-block"
                              >
                                {product.name} by {product.brand}
                              </Link>
                            )}
                            {!product && (
                              <p className="text-sm text-gray-400 mb-1">Product ID: {review.productId}</p>
                            )}

                            {/* Rating & Verified Badge */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                              {review.verified && (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified Purchase
                                </span>
                              )}
                            </div>

                            {/* Review Title & Content */}
                            <h4 className="font-semibold text-navy">{review.title}</h4>
                            <p className="text-gray-600 text-sm mt-1">{review.comment}</p>

                            {/* Review Meta */}
                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              <span>By: {review.userName}</span>
                              <span>•</span>
                              <span>{review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                              <span>•</span>
                              <span>{review.helpful} found helpful</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {reviewToDelete === review.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    const success = await deleteReview(review.id!)
                                    if (success) {
                                      setReviews(prev => prev.filter(r => r.id !== review.id))
                                    }
                                    setReviewToDelete(null)
                                  }}
                                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setReviewToDelete(null)}
                                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReviewToDelete(review.id!)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Review"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>

              {/* Empty State */}
              {reviews.length === 0 && (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No reviews yet</p>
                  <p className="text-sm text-gray-400 mt-1">Reviews will appear here when customers leave feedback</p>
                </div>
              )}

              {/* No Results */}
              {reviews.length > 0 && reviews.filter(r => {
                if (reviewFilter === 'verified' && !r.verified) return false
                if (reviewFilter === 'unverified' && r.verified) return false
                if (reviewRatingFilter && r.rating !== reviewRatingFilter) return false
                return true
              }).length === 0 && (
                <div className="text-center py-12">
                  <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No reviews match your filters</p>
                  <button
                    onClick={() => { setReviewFilter('all'); setReviewRatingFilter(null); }}
                    className="mt-2 text-gold hover:text-gold-600 font-medium text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Try-Ons Tab */}
        {activeTab === 'tryons' && (() => {
          const productMap = Object.fromEntries(firestoreProducts.map(p => [p.id, p]))
          const userMap = Object.fromEntries(users.map(u => [u.id, u]))
          const filtered = tryOnProductFilter === 'all'
            ? tryOns
            : tryOns.filter(t => t.productId === tryOnProductFilter)

          // Stats
          const uniqueProducts = new Set(tryOns.map(t => t.productId)).size
          const uniqueCustomers = new Set(tryOns.filter(t => t.userId !== 'anonymous').map(t => t.userId)).size
          const todayCount = tryOns.filter(t => {
            if (!t.createdAt) return false
            const d = (t.createdAt as any).toDate?.() || new Date(t.createdAt as any)
            return new Date().toDateString() === d.toDateString()
          }).length

          // Unique products for filter dropdown
          const usedProductIds = [...new Set(tryOns.map(t => t.productId))]

          return (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-navy">AI Try-On Report</h2>
                  <p className="text-sm text-gray-400">Customer-generated virtual try-on activity</p>
                </div>
                <div className="text-xs text-gray-400">{tryOns.length} total generations</div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Try-Ons', value: tryOns.length, color: 'text-gold', bg: 'bg-gold/10' },
                  { label: 'Today', value: todayCount, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Unique Customers', value: uniqueCustomers, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Products Tried', value: uniqueProducts, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center mb-2`}>
                      <Wand2 className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Filter by product */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setTryOnProductFilter('all')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tryOnProductFilter === 'all' ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  All Products
                </button>
                {usedProductIds.map(pid => {
                  const p = productMap[pid]
                  return (
                    <button
                      key={pid}
                      onClick={() => setTryOnProductFilter(pid)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tryOnProductFilter === pid ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {p ? p.name : pid.slice(0, 8)}
                    </button>
                  )
                })}
              </div>

              {/* Table — desktop */}
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <Wand2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-medium">No try-ons yet</p>
                  <p className="text-xs text-gray-300 mt-1">Generated images will appear here</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Generated Image</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filtered.map(tryon => {
                          const product = productMap[tryon.productId]
                          const customer = userMap[tryon.userId]
                          const date = tryon.createdAt ? ((tryon.createdAt as any).toDate?.() || new Date(tryon.createdAt as any)) : null
                          return (
                            <tr key={tryon.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <button onClick={() => setTryOnLightbox(tryon.imageUrl)} className="relative w-12 h-16 rounded-lg overflow-hidden bg-gray-100 block hover:opacity-80 transition-opacity">
                                  <Image src={tryon.imageUrl} alt="Try-on" fill className="object-cover" sizes="48px" />
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                {product ? (
                                  <div className="flex items-center gap-2.5">
                                    {product.images?.[0] && (
                                      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="32px" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-navy text-xs">{product.name}</p>
                                      <p className="text-[10px] text-gold uppercase">{product.brand}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 font-mono">{tryon.productId.slice(0, 10)}…</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {tryon.userId === 'anonymous' ? (
                                  <span className="text-xs text-gray-400 italic">Guest</span>
                                ) : customer ? (
                                  <div>
                                    <p className="font-medium text-navy text-xs">{customer.name}</p>
                                    <p className="text-[10px] text-gray-400">{customer.email}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 font-mono">{tryon.userId.slice(0, 10)}…</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400">
                                {date ? date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={async () => {
                                    if (!tryon.id) return
                                    setDeletingTryOnId(tryon.id)
                                    const ok = await deleteTryOnResult(tryon.id)
                                    if (ok) setTryOns(prev => prev.filter(t => t.id !== tryon.id))
                                    setDeletingTryOnId(null)
                                  }}
                                  disabled={deletingTryOnId === tryon.id}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                                  title="Delete"
                                >
                                  {deletingTryOnId === tryon.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {filtered.map(tryon => {
                      const product = productMap[tryon.productId]
                      const customer = userMap[tryon.userId]
                      const date = tryon.createdAt ? ((tryon.createdAt as any).toDate?.() || new Date(tryon.createdAt as any)) : null
                      return (
                        <div key={tryon.id} className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-3 items-start">
                          <button onClick={() => setTryOnLightbox(tryon.imageUrl)} className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 hover:opacity-80 transition-opacity">
                            <Image src={tryon.imageUrl} alt="Try-on" fill className="object-cover" sizes="64px" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-navy text-sm truncate">{product?.name || 'Unknown product'}</p>
                            <p className="text-[10px] text-gold uppercase mb-1">{product?.brand || ''}</p>
                            <p className="text-xs text-gray-500">
                              {tryon.userId === 'anonymous' ? 'Guest' : customer?.name || tryon.userId.slice(0, 8)}
                            </p>
                            <p className="text-[10px] text-gray-300 mt-0.5">
                              {date ? date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              if (!tryon.id) return
                              setDeletingTryOnId(tryon.id)
                              const ok = await deleteTryOnResult(tryon.id)
                              if (ok) setTryOns(prev => prev.filter(t => t.id !== tryon.id))
                              setDeletingTryOnId(null)
                            }}
                            disabled={deletingTryOnId === tryon.id}
                            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-40"
                          >
                            {deletingTryOnId === tryon.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Lightbox */}
              {tryOnLightbox && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={() => setTryOnLightbox(null)}>
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="relative max-h-[90dvh] max-w-sm w-full rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    <Image src={tryOnLightbox} alt="Try-on" width={480} height={640} className="w-full h-auto object-contain" />
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Shipping Rates Section */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-navy">Shipping Settings</h2>
                  <p className="text-sm text-gray-500">Configure shipping rates by region</p>
                </div>
                {!editingShipping && (
                  <button
                    onClick={() => setEditingShipping(shippingSettings ? { ...shippingSettings } : null)}
                    className="flex items-center gap-2 bg-gold hover:bg-gold-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Rates
                  </button>
                )}
              </div>

              {/* View Mode */}
              {!editingShipping && shippingSettings && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-navy mb-3">Shipping Rates by Region</h3>
                    <div className="space-y-2">
                      {shippingSettings.rates.map(rate => (
                        <div key={rate.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                          <span className="text-gray-700">{rate.region}</span>
                          <span className="font-semibold text-navy">₱{rate.fee.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-green-800">Free Shipping Threshold</h3>
                        <p className="text-sm text-green-600">Orders above this amount get free shipping</p>
                      </div>
                      <span className="text-xl font-bold text-green-700">₱{shippingSettings.freeShippingThreshold.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Mode */}
              {editingShipping && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-navy">Shipping Rates by Region</h3>
                    {editingShipping.rates.map((rate, index) => (
                      <div key={rate.id} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Region Name</label>
                          <input
                            type="text"
                            value={rate.region}
                            onChange={(e) => {
                              const newRates = [...editingShipping.rates]
                              newRates[index] = { ...rate, region: e.target.value }
                              setEditingShipping({ ...editingShipping, rates: newRates })
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fee (₱)</label>
                          <input
                            type="number"
                            value={rate.fee}
                            onChange={(e) => {
                              const newRates = [...editingShipping.rates]
                              newRates[index] = { ...rate, fee: parseInt(e.target.value) || 0 }
                              setEditingShipping({ ...editingShipping, rates: newRates })
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                          />
                        </div>
                        {editingShipping.rates.length > 1 && (
                          <button
                            onClick={() => {
                              const newRates = editingShipping.rates.filter((_, i) => i !== index)
                              setEditingShipping({ ...editingShipping, rates: newRates })
                            }}
                            className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newRate: ShippingRate = {
                          id: `region-${Date.now()}`,
                          region: 'New Region',
                          fee: 100
                        }
                        setEditingShipping({
                          ...editingShipping,
                          rates: [...editingShipping.rates, newRate]
                        })
                      }}
                      className="flex items-center gap-2 text-gold hover:text-gold-600 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add Region
                    </button>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <label className="block font-medium text-green-800 mb-2">Free Shipping Threshold (₱)</label>
                    <input
                      type="number"
                      value={editingShipping.freeShippingThreshold}
                      onChange={(e) => setEditingShipping({
                        ...editingShipping,
                        freeShippingThreshold: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:border-green-500"
                    />
                    <p className="text-sm text-green-600 mt-1">Orders above this amount will get free shipping</p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={async () => {
                        setIsSavingShipping(true)
                        const success = await updateShippingSettings(editingShipping)
                        if (success) {
                          setShippingSettings(editingShipping)
                          setEditingShipping(null)
                        } else {
                          alert('Failed to save shipping settings')
                        }
                        setIsSavingShipping(false)
                      }}
                      disabled={isSavingShipping}
                      className="flex items-center gap-2 bg-gold hover:bg-gold-400 text-navy font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSavingShipping ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingShipping(null)}
                      className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {!shippingSettings && !editingShipping && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin" />
                  <p className="text-gray-500">Loading shipping settings...</p>
                </div>
              )}
            </div>

            {/* Payment Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-navy">Payment Settings</h2>
                  <p className="text-sm text-gray-500">GCash and bank transfer details shown in order confirmation emails</p>
                </div>
                {!editingPayment && (
                  <button
                    onClick={() => setEditingPayment(paymentSettings ? { ...paymentSettings } : { gcashNumber: '', gcashName: '', bankName: '', bankAccount: '', bankAccountName: '' })}
                    className="flex items-center gap-2 bg-gold hover:bg-yellow-500 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>

              {/* View mode */}
              {!editingPayment && paymentSettings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">📱</span>
                      <h3 className="font-semibold text-navy">GCash</h3>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Number:</span>
                        <span className="font-medium text-navy">{paymentSettings.gcashNumber || <span className="text-gray-300 italic">Not set</span>}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Name:</span>
                        <span className="font-medium text-navy">{paymentSettings.gcashName || <span className="text-gray-300 italic">Not set</span>}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🏦</span>
                      <h3 className="font-semibold text-navy">Bank Transfer</h3>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bank:</span>
                        <span className="font-medium text-navy">{paymentSettings.bankName || <span className="text-gray-300 italic">Not set</span>}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account No.:</span>
                        <span className="font-medium text-navy">{paymentSettings.bankAccount || <span className="text-gray-300 italic">Not set</span>}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account Name:</span>
                        <span className="font-medium text-navy">{paymentSettings.bankAccountName || <span className="text-gray-300 italic">Not set</span>}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit mode */}
              {editingPayment && (
                <div className="space-y-6">
                  {/* GCash */}
                  <div className="bg-blue-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">📱</span>
                      <h3 className="font-semibold text-navy">GCash</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">GCash Number</label>
                        <input
                          type="text"
                          value={editingPayment.gcashNumber}
                          onChange={(e) => setEditingPayment({ ...editingPayment, gcashNumber: e.target.value })}
                          placeholder="09XX-XXX-XXXX"
                          className="w-full px-3 py-2.5 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Account Name</label>
                        <input
                          type="text"
                          value={editingPayment.gcashName}
                          onChange={(e) => setEditingPayment({ ...editingPayment, gcashName: e.target.value })}
                          placeholder="Juan Dela Cruz"
                          className="w-full px-3 py-2.5 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer */}
                  <div className="bg-green-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🏦</span>
                      <h3 className="font-semibold text-navy">Bank Transfer</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bank Name</label>
                        <input
                          type="text"
                          value={editingPayment.bankName}
                          onChange={(e) => setEditingPayment({ ...editingPayment, bankName: e.target.value })}
                          placeholder="BDO / BPI / UnionBank"
                          className="w-full px-3 py-2.5 border border-green-200 rounded-lg focus:outline-none focus:border-green-400 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Account Number</label>
                        <input
                          type="text"
                          value={editingPayment.bankAccount}
                          onChange={(e) => setEditingPayment({ ...editingPayment, bankAccount: e.target.value })}
                          placeholder="1234-5678-9012"
                          className="w-full px-3 py-2.5 border border-green-200 rounded-lg focus:outline-none focus:border-green-400 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Account Name</label>
                        <input
                          type="text"
                          value={editingPayment.bankAccountName}
                          onChange={(e) => setEditingPayment({ ...editingPayment, bankAccountName: e.target.value })}
                          placeholder="Juan Dela Cruz"
                          className="w-full px-3 py-2.5 border border-green-200 rounded-lg focus:outline-none focus:border-green-400 bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-gray-200">
                    <button
                      onClick={async () => {
                        setIsSavingPayment(true)
                        const success = await updatePaymentSettings(editingPayment)
                        if (success) {
                          setPaymentSettings(editingPayment)
                          setEditingPayment(null)
                        } else {
                          alert('Failed to save payment settings')
                        }
                        setIsSavingPayment(false)
                      }}
                      disabled={isSavingPayment}
                      className="flex items-center gap-2 bg-gold hover:bg-yellow-500 text-navy font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSavingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingPayment(null)}
                      className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!paymentSettings && !editingPayment && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-gray-300 mx-auto mb-2 animate-spin" />
                  <p className="text-gray-500">Loading payment settings...</p>
                </div>
              )}
            </div>

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

              {/* Payment Information */}
              <div>
                <h4 className="font-semibold text-navy mb-3">Payment Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payment Method</span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.paymentMethod === 'gcash' ? 'bg-blue-100 text-blue-700' :
                      selectedOrder.paymentMethod === 'bank' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedOrder.paymentMethod === 'gcash' ? <>📱 GCash</> :
                       selectedOrder.paymentMethod === 'bank' ? <>🏦 Bank Transfer</> :
                       selectedOrder.paymentMethod?.toUpperCase() || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payment Status</span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                      selectedOrder.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                      selectedOrder.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedOrder.paymentStatus === 'paid' ? (
                        <><CheckCircle className="w-4 h-4" /> Paid</>
                      ) : selectedOrder.paymentStatus === 'failed' ? (
                        <><XCircle className="w-4 h-4" /> Failed</>
                      ) : selectedOrder.paymentStatus === 'refunded' ? (
                        <><BanknoteIcon className="w-4 h-4" /> Refunded</>
                      ) : (
                        <><Clock className="w-4 h-4" /> Pending</>
                      )}
                    </span>
                  </div>
                  {selectedOrder.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment ID</span>
                      <span className="font-mono text-sm">{selectedOrder.paymentId}</span>
                    </div>
                  )}
                  {selectedOrder.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Paid At</span>
                      <span>{selectedOrder.paidAt.toDate().toLocaleString()}</span>
                    </div>
                  )}
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
                          ? 'bg-gold text-navy-900'
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

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProductForm(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-4xl h-[95svh] sm:max-h-[90vh] flex flex-col">

            {/* Drag handle (mobile only) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-navy">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 truncate max-w-[220px]">
                  {editingProduct ? editingProduct.name : 'Fill in the product details'}
                </p>
              </div>
              <button onClick={() => setShowProductForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Product ID (only for new products) */}
              {!editingProduct && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Product ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={customProductId}
                    onChange={(e) => setCustomProductId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'))}
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                    placeholder="e.g. ck-logo-tshirt-black (auto-generated if empty)"
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    Leave empty to auto-generate. Use lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
              )}

              {/* Show current ID when editing */}
              {editingProduct?.id && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Product ID</label>
                  <p className="font-mono text-sm text-navy bg-white px-3 py-2 rounded-lg border border-gray-200">
                    {editingProduct.id}
                  </p>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-3 sm:gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    value={productFormData.name || ''}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold"
                    placeholder="e.g. Classic Logo T-Shirt"
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Brand *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={brandSearch || productFormData.brand || ''}
                      onChange={(e) => {
                        setBrandSearch(e.target.value)
                        setShowBrandDropdown(true)
                      }}
                      onFocus={() => setShowBrandDropdown(true)}
                      placeholder="Search or enter brand..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {showBrandDropdown && (() => {
                    // Combine static brands with custom brands from existing products
                    const allAvailableBrands = [...new Set([
                      ...brands.filter(b => b !== 'Other'),
                      ...uniqueBrands
                    ])].sort()
                    const filteredBrandsList = allAvailableBrands.filter(b =>
                      b.toLowerCase().includes((brandSearch || '').toLowerCase())
                    )
                    const isCustomBrand = brandSearch && !allAvailableBrands.some(b =>
                      b.toLowerCase() === brandSearch.toLowerCase()
                    )

                    return (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredBrandsList.map(brand => (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => {
                              setProductFormData(prev => ({ ...prev, brand }))
                              setBrandSearch('')
                              setShowBrandDropdown(false)
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-gold/10 transition-colors ${
                              productFormData.brand === brand ? 'bg-gold/20 font-medium' : ''
                            }`}
                          >
                            {brand}
                            {!brands.includes(brand) && (
                              <span className="ml-2 text-xs text-gray-400">(custom)</span>
                            )}
                          </button>
                        ))}
                      {isCustomBrand && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductFormData(prev => ({ ...prev, brand: brandSearch }))
                            setBrandSearch('')
                            setShowBrandDropdown(false)
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-gold/10 transition-colors text-gold font-medium border-t border-gray-100"
                        >
                          + Add &quot;{brandSearch}&quot; as custom brand
                        </button>
                      )}
                      {!brandSearch && filteredBrandsList.length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">No brands available</div>
                      )}
                    </div>
                  )})()}
                  {productFormData.brand && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: <span className="font-medium text-navy">{productFormData.brand}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Category *</label>
                  <select
                    value={productFormData.category || 'clothes'}
                    onChange={(e) => {
                      const newCategory = e.target.value as 'clothes' | 'accessories' | 'shoes' | 'fragrance'
                      // Set default sizes based on category
                      let defaultSizes: string[] = []
                      if (newCategory === 'shoes') {
                        defaultSizes = ['38', '39', '40', '41', '42', '43', '44', '45']
                      } else if (newCategory === 'clothes') {
                        defaultSizes = ['S', 'M', 'L', 'XL']
                      } else if (newCategory === 'fragrance') {
                        defaultSizes = ['50ml', '100ml']
                      }
                      setProductFormData(prev => ({
                        ...prev,
                        category: newCategory,
                        subcategory: '', // Reset subcategory when category changes
                        sizes: prev.sizes && prev.sizes.length > 0 ? prev.sizes : defaultSizes
                      }))
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Subcategory</label>
                  <select
                    value={productFormData.subcategory || ''}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    className="w-full px-2 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold"
                  >
                    <option value="">Select subcategory</option>
                    {(subcategoryOptions[productFormData.category || 'clothes'] || []).map(sub => (
                      <option key={sub} value={sub} className="capitalize">{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Gender</label>
                  <select
                    value={productFormData.gender || 'unisex'}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'unisex' }))}
                    className="w-full px-2 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-2xl p-3 sm:p-4">
                <h4 className="font-semibold text-navy text-sm mb-3">Pricing & Inventory</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Price (₱) *</label>
                    <input
                      type="number"
                      value={productFormData.price || ''}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Original Price (₱)</label>
                    <input
                      type="number"
                      value={productFormData.originalPrice || ''}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold"
                      placeholder="Sale price"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Leave empty if no sale</p>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-gray-50 rounded-2xl p-3 sm:p-4">
                <h4 className="font-semibold text-navy text-sm mb-3">Product Images</h4>

                {/* Current Images */}
                {productFormData.images && productFormData.images.length > 0 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3 mb-4">
                    {productFormData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-white border border-gray-200">
                          <Image
                            src={img}
                            alt={`Product ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-gold text-navy-900 text-[10px] rounded font-medium">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload error */}
                {uploadError && (
                  <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Upload / Camera buttons */}
                {uploadingImages ? (
                  <div className="border-2 border-dashed border-gold/40 rounded-xl p-6 flex items-center justify-center gap-3 bg-gold/5">
                    <Loader2 className="w-5 h-5 animate-spin text-gold" />
                    <span className="text-sm text-gray-600 font-medium">Uploading images…</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Upload from file */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-gold hover:bg-gold/5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-7 h-7 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Upload Files</span>
                      <span className="text-xs text-gray-400">PNG, JPG, WEBP</span>
                    </button>

                    {/* Open camera — label directly linked to input for max mobile compatibility */}
                    <label
                      htmlFor="admin-camera-input"
                      className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-navy hover:bg-navy/5 transition-colors cursor-pointer"
                    >
                      <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-600">Take Photo</span>
                      <span className="text-xs text-gray-400">Use camera</span>
                    </label>
                  </div>
                )}

                {/* File input — browse */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                />
                {/* Camera input — opacity-0 (NOT display:none) so iOS Safari allows label trigger */}
                <input
                  id="admin-camera-input"
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                <textarea
                  value={productFormData.description || ''}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold resize-none"
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              {/* Colors + Tags side by side on mobile */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Colors</label>
                  <input
                    type="text"
                    defaultValue={(productFormData.colors || []).join(', ')}
                    key={`colors-${editingProduct?.id || 'new'}`}
                    onBlur={(e) => setProductFormData(prev => ({
                      ...prev,
                      colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold"
                    placeholder="Black, White"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tags</label>
                  <input
                    type="text"
                    defaultValue={(productFormData.tags || []).join(', ')}
                    key={`tags-${editingProduct?.id || 'new'}`}
                    onBlur={(e) => setProductFormData(prev => ({
                      ...prev,
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gold"
                    placeholder="casual, cotton"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 sm:p-4">
                <h4 className="font-semibold text-navy text-sm mb-1">Sizes & Stock per Size</h4>
                <p className="text-xs text-gray-400 mb-3">Select sizes and enter stock quantity</p>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {(productFormData.category === 'shoes'
                    ? shoeSizeOptions
                    : productFormData.category === 'accessories'
                    ? accessorySizeOptions
                    : productFormData.category === 'fragrance'
                    ? fragranceSizeOptions
                    : clothesSizeOptions
                  ).map(size => {
                    const isSelected = (productFormData.sizes || []).includes(size)
                    const stockForSize = productFormData.stockBySize?.[size] || 0

                    return (
                      <div
                        key={size}
                        className={`border-2 rounded-xl p-2 transition-all ${
                          isSelected
                            ? 'border-gold bg-gold/5'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <label className="flex items-center gap-1.5 cursor-pointer mb-1.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSizes = e.target.checked
                                ? [...(productFormData.sizes || []), size]
                                : (productFormData.sizes || []).filter(s => s !== size)

                              const newStockBySize = { ...(productFormData.stockBySize || {}) }
                              if (!e.target.checked) {
                                delete newStockBySize[size]
                              }

                              const totalStock = Object.values(newStockBySize).reduce((sum, qty) => sum + qty, 0)

                              setProductFormData(prev => ({
                                ...prev,
                                sizes: newSizes,
                                stockBySize: newStockBySize,
                                stockQty: totalStock,
                                inStock: totalStock > 0
                              }))
                            }}
                            className="w-4 h-4 accent-gold"
                          />
                          <span className={`text-xs font-semibold ${isSelected ? 'text-navy' : 'text-gray-500'}`}>
                            {size}
                          </span>
                        </label>

                        {isSelected && (
                          <input
                            type="number"
                            min="0"
                            value={stockForSize}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 0
                              const newStockBySize = {
                                ...(productFormData.stockBySize || {}),
                                [size]: qty
                              }
                              const totalStock = Object.values(newStockBySize).reduce((sum, q) => sum + q, 0)

                              setProductFormData(prev => ({
                                ...prev,
                                stockBySize: newStockBySize,
                                stockQty: totalStock,
                                inStock: totalStock > 0
                              }))
                            }}
                            placeholder="0"
                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-center"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Total Stock Summary */}
                {(() => {
                  const total = Object.values(productFormData.stockBySize || {}).reduce((sum, qty) => sum + qty, 0) || productFormData.stockQty || 0
                  return (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Stock</span>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                        total > 20 ? 'bg-green-100 text-green-700' :
                        total > 0 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {total > 0 && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        )}
                        {total} {total === 0 ? '— Out of Stock' : total === 1 ? 'unit' : 'units'}
                      </span>
                    </div>
                  )
                })()}
              </div>


            </div>
            </div>{/* end flex-1 overflow-y-auto */}

            {/* Footer */}
            <div className="flex-shrink-0 bg-white px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowProductForm(false)}
                  className="flex-1 sm:flex-none sm:px-6 py-3 border border-gray-200 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={isSavingProduct}
                  className="flex-1 sm:flex-none sm:px-8 flex items-center justify-center gap-2 py-3 bg-gold text-navy font-bold rounded-2xl hover:bg-yellow-400 transition-colors disabled:opacity-50 text-sm"
                >
                  {isSavingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-navy">Customer Details</h3>
                  <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-navy">{selectedCustomer.name}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-navy">{selectedCustomer.phone || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Lifetime Value</p>
                  <p className="font-bold text-green-600 text-lg">
                    ₱{getCustomerLifetimeValue(selectedCustomer.id).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">AI Dresser Sessions</p>
                  <p className="font-medium text-navy">{selectedCustomer.aiDresserUsage || 0}</p>
                </div>
              </div>

              {/* Preferences */}
              {selectedCustomer.preferences && (
                <div>
                  <h4 className="font-semibold text-navy mb-3">Style Preferences</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.preferences.styles?.map((style, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gold/10 text-gold rounded-full text-sm">
                        {style}
                      </span>
                    ))}
                    {selectedCustomer.preferences.colors?.map((color, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm">
                        {color}
                      </span>
                    ))}
                    {!selectedCustomer.preferences.styles?.length && !selectedCustomer.preferences.colors?.length && (
                      <span className="text-sm text-gray-400">No preferences set</span>
                    )}
                  </div>
                </div>
              )}

              {/* Order History */}
              <div>
                <h4 className="font-semibold text-navy mb-3">Order History ({getCustomerOrders(selectedCustomer.id).length})</h4>
                <div className="space-y-3">
                  {getCustomerOrders(selectedCustomer.id).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No orders yet</p>
                  ) : (
                    getCustomerOrders(selectedCustomer.id).map(order => (
                      <div key={order.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm text-navy">{order.orderId}</p>
                          <p className="text-xs text-gray-500">
                            {order.createdAt?.toDate().toLocaleDateString()} | {order.items.length} item(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-navy">₱{order.total.toLocaleString()}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Notes Modal */}
      {orderNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOrderNotesModal(null)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-navy">Order Notes</h3>
                  <p className="text-sm text-gray-500 font-mono">{orderNotesModal.order.orderId}</p>
                </div>
                <button onClick={() => setOrderNotesModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <textarea
                value={orderNotesModal.note}
                onChange={(e) => setOrderNotesModal(prev => prev ? { ...prev, note: e.target.value } : null)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold resize-none"
                rows={4}
                placeholder="Add internal notes about this order..."
              />
              <p className="text-xs text-gray-400 mt-2">Notes are only visible to admins</p>
            </div>

            <div className="p-6 border-t border-gray-100">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setOrderNotesModal(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (orderNotesModal && orderNotesModal.order.id) {
                      const isGuestOrder = !orderNotesModal.order.userId
                      const success = await updateOrderNotes(orderNotesModal.order.id, orderNotesModal.note, isGuestOrder)
                      if (success) {
                        // Update local state
                        setOrders(prev => prev.map(o =>
                          o.id === orderNotesModal.order.id ? { ...o, notes: orderNotesModal.note } : o
                        ))
                        setOrderNotesModal(null)
                      } else {
                        alert('Failed to save note')
                      }
                    }
                  }}
                  className="px-4 py-2 bg-gold text-navy-900 font-semibold rounded-lg hover:bg-gold-400"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal */}
      {deleteOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteOrderId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-navy mb-2">Delete Order?</h3>
            <p className="text-sm text-gray-500 mb-6">This will permanently remove the order from your records. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteOrderId(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const order = orders.find(o => o.id === deleteOrderId)
                  if (order) handleDeleteOrder(deleteOrderId, !order.userId)
                }}
                disabled={deletingOrder}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deletingOrder ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Print Modal */}
      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPrintOrder(null)} />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
            <div className="p-6 border-b border-gray-100 print:border-0">
              <div className="flex items-center justify-between print:hidden">
                <h3 className="text-lg font-bold text-navy">Print Order / Packing Slip</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-gold hover:bg-gold-400 text-navy font-semibold px-4 py-2 rounded-lg"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button onClick={() => setPrintOrder(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 print:p-8" id="print-content">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-navy">America Brands Bazaar</h1>
                <p className="text-gray-500">Order Receipt / Packing Slip</p>
              </div>

              {/* Order Info */}
              <div className="flex justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono font-bold text-navy">{printOrder.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-navy">{printOrder.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 print:bg-white print:border print:border-gray-200">
                <h4 className="font-semibold text-navy mb-2">Ship To:</h4>
                <p className="font-medium">{printOrder.customerInfo.name}</p>
                {printOrder.customerInfo.address && (
                  <p className="text-gray-600">{printOrder.customerInfo.address}</p>
                )}
                {printOrder.customerInfo.city && (
                  <p className="text-gray-600">{printOrder.customerInfo.city}</p>
                )}
                <p className="text-gray-600">{printOrder.customerInfo.phone}</p>
              </div>

              {/* Items */}
              <table className="w-full mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-500">Item</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-500">Size/Color</th>
                    <th className="text-center py-2 text-sm font-medium text-gray-500">Qty</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-500">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {printOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3">{item.name}</td>
                      <td className="py-3 text-center text-gray-600 text-sm">
                        {item.size && item.size} {item.color && `/ ${item.color}`}
                      </td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">₱{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Subtotal</span>
                  <span>₱{printOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">Shipping</span>
                  <span>{printOrder.shippingFee === 0 ? 'Free' : `₱${printOrder.shippingFee}`}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-navy pt-2 border-t">
                  <span>Total</span>
                  <span>₱{printOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500 print:mt-12">
                <p>Thank you for shopping with America Brands Bazaar!</p>
                <p>For questions, contact us via Facebook or our website.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Form Modal */}
      {showCouponForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCouponForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-navy">
                  {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
                </h3>
                <button onClick={() => setShowCouponForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code *</label>
                <input
                  type="text"
                  value={couponFormData.code || ''}
                  onChange={(e) => setCouponFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold font-mono uppercase"
                  placeholder="e.g. SUMMER20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                  <select
                    value={couponFormData.type || 'percentage'}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, type: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₱)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value {couponFormData.type === 'percentage' ? '(%)' : '(₱)'} *
                  </label>
                  <input
                    type="number"
                    value={couponFormData.value || ''}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Purchase (₱)</label>
                  <input
                    type="number"
                    value={couponFormData.minPurchase || ''}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, minPurchase: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Uses</label>
                  <input
                    type="number"
                    value={couponFormData.maxUses || ''}
                    onChange={(e) => setCouponFormData(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 100 }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={couponFormData.expiresAt || ''}
                  onChange={(e) => setCouponFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={couponFormData.active !== false}
                  onChange={(e) => setCouponFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-sm font-medium">Active (coupon can be used)</span>
              </label>
            </div>

            <div className="p-6 border-t border-gray-100">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCouponForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCoupon}
                  className="px-4 py-2 bg-gold text-navy-900 font-semibold rounded-lg hover:bg-gold-400"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}