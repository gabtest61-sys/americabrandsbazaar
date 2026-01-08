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
  CheckSquare, Square, History, MessageSquare, Printer,
  FileSpreadsheet, Tag, TrendingDown, ArrowUp, ArrowDown, GripVertical,
  Settings, Star, CreditCard, Wallet, BanknoteIcon, AlertCircle
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
  seedProductsToFirestore,
  FirestoreProduct,
  getShippingSettings,
  updateShippingSettings,
  ShippingSettings,
  ShippingRate,
  getAllReviews,
  deleteReview,
  Review
} from '@/lib/firestore'
import { products as staticProducts, Product, brands, categories } from '@/lib/products'
import { sampleProducts } from '@/lib/sample-products'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

type TabType = 'dashboard' | 'orders' | 'customers' | 'inventory' | 'analytics' | 'products' | 'coupons' | 'reviews' | 'settings'

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

  // Product management state
  const [firestoreProducts, setFirestoreProducts] = useState<FirestoreProduct[]>([])
  const [productFilter, setProductFilter] = useState({ category: '', brand: '' })
  const [productPage, setProductPage] = useState(1)
  const productsPerPage = 12
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<FirestoreProduct | null>(null)
  const [productFormData, setProductFormData] = useState<Partial<FirestoreProduct>>({})
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [customProductId, setCustomProductId] = useState('')

  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Reviews management state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | null>(null)

  // Payment filter state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('')

  // Bulk order selection
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

  // Low stock threshold setting
  const [lowStockThreshold, setLowStockThreshold] = useState(5)

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
        const [ordersData, usersData, productsData, shippingData, reviewsData] = await Promise.all([
          getAllOrders(),
          getAllUsers(),
          getFirestoreProducts(),
          getShippingSettings(),
          getAllReviews()
        ])
        setOrders(ordersData)
        setUsers(usersData)
        setFirestoreProducts(productsData)
        setShippingSettings(shippingData)
        setReviews(reviewsData)
      }
      setIsLoadingData(false)
    }

    if (isLoggedIn && user) {
      fetchData()
    }
  }, [isLoggedIn, user])

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

  // Payment stats
  const paymentStats = {
    paidOrders: orders.filter(o => o.paymentStatus === 'paid').length,
    pendingPayments: orders.filter(o => o.paymentStatus === 'pending').length,
    failedPayments: orders.filter(o => o.paymentStatus === 'failed').length,
    paidRevenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0),
    codOrders: orders.filter(o => o.paymentMethod === 'cod').length,
    onlineOrders: orders.filter(o => o.paymentMethod === 'online').length,
    codRevenue: orders.filter(o => o.paymentMethod === 'cod').reduce((sum, o) => sum + o.total, 0),
    onlineRevenue: orders.filter(o => o.paymentMethod === 'online').reduce((sum, o) => sum + o.total, 0),
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

  // Seed static products to Firestore
  const handleSeedProducts = async () => {
    if (!confirm('This will copy all static products to Firestore. Continue?')) return

    setIsSeeding(true)
    const result = await seedProductsToFirestore(staticProducts)
    if (result.success) {
      alert(`Successfully seeded ${result.count} products to Firestore`)
      const productsData = await getFirestoreProducts()
      setFirestoreProducts(productsData)
    } else {
      alert(result.error || 'Failed to seed products')
    }
    setIsSeeding(false)
  }

  // Seed sample products (52 diverse products for AI Dresser testing)
  const handleSeedSampleProducts = async () => {
    if (!confirm(`This will add ${sampleProducts.length} sample products to Firestore. Continue?`)) return

    setIsSeeding(true)
    let successCount = 0
    let errorCount = 0

    for (const product of sampleProducts) {
      const result = await createProduct(product)
      if (result.success) {
        successCount++
      } else {
        errorCount++
        console.error(`Failed to create ${product.name}:`, result.error)
      }
    }

    if (successCount > 0) {
      alert(`Successfully added ${successCount} products${errorCount > 0 ? ` (${errorCount} failed)` : ''}`)
      const productsData = await getFirestoreProducts()
      setFirestoreProducts(productsData)
    } else {
      alert('Failed to add products')
    }
    setIsSeeding(false)
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

  // Image upload handler - using Cloudinary
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadingImages(true)
    const currentImages = productFormData.images || []
    const newImages: string[] = []

    for (const file of Array.from(files)) {
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        // Upload to Cloudinary via API route
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, folder: 'products' }),
        })

        const result = await response.json()
        if (result.success && result.url) {
          newImages.push(result.url)
        } else {
          console.error('Upload failed:', result.error)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
      }
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
            category: (getVal('category') as 'clothes' | 'accessories' | 'shoes') || 'clothes',
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
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'customers', icon: Users, label: 'Customers' },
            { id: 'inventory', icon: Package, label: 'Inventory' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'reviews', icon: Star, label: 'Reviews' },
            { id: 'coupons', icon: Tag, label: 'Coupons' },
            { id: 'settings', icon: Settings, label: 'Settings' },
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
              {tab.id === 'reviews' && reviews.length > 0 && (
                <span className="ml-auto bg-gold text-navy text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {reviews.length}
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
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'orders', label: 'Orders' },
              { id: 'customers', label: 'Customers' },
              { id: 'inventory', label: 'Inventory' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'products', label: 'Products' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'coupons', label: 'Coupons' },
              { id: 'settings', label: 'Settings' },
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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
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

            {/* Payment Status Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Paid</p>
                    <p className="text-xl font-bold text-navy">{paymentStats.paidOrders}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-xs text-green-600 mt-1">₱{paymentStats.paidRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending Payment</p>
                    <p className="text-xl font-bold text-navy">{paymentStats.pendingPayments}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-xs text-yellow-600 mt-1">Awaiting payment</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Online Payments</p>
                    <p className="text-xl font-bold text-navy">{paymentStats.onlineOrders}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-xs text-blue-600 mt-1">₱{paymentStats.onlineRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-amber-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">COD Orders</p>
                    <p className="text-xl font-bold text-navy">{paymentStats.codOrders}</p>
                  </div>
                  <Wallet className="w-8 h-8 text-amber-500" />
                </div>
                <p className="text-xs text-amber-600 mt-1">₱{paymentStats.codRevenue.toLocaleString()}</p>
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
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-navy">Orders ({filteredOrders.length})</h2>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={exportOrdersToCSV}
                      className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
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
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                    >
                      <option value="">All Payments</option>
                      <option value="pending">Payment Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                    <select
                      value={paymentMethodFilter}
                      onChange={(e) => setPaymentMethodFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                    >
                      <option value="">All Methods</option>
                      <option value="online">Online Payment</option>
                      <option value="cod">COD</option>
                    </select>
                  </div>
                </div>

                {/* Date Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">From:</span>
                    <input
                      type="date"
                      value={dateFilter.from}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">To:</span>
                    <input
                      type="date"
                      value={dateFilter.to}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                    />
                  </div>
                  {(dateFilter.from || dateFilter.to) && (
                    <button
                      onClick={() => setDateFilter({ from: '', to: '' })}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Clear dates
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Order ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-navy">{order.orderId}</span>
                        <p className="text-xs text-gray-400">{order.items.length} item(s)</p>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-navy">{order.customerInfo.name}</p>
                          <p className="text-xs text-gray-500">{order.customerInfo.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-navy">₱{order.total.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            order.paymentMethod === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {order.paymentMethod === 'online' ? (
                              <><CreditCard className="w-3 h-3" /> Online</>
                            ) : (
                              <><Wallet className="w-3 h-3" /> COD</>
                            )}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                            order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                            order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.paymentStatus === 'paid' ? (
                              <><CheckCircle className="w-3 h-3" /> Paid</>
                            ) : order.paymentStatus === 'failed' ? (
                              <><XCircle className="w-3 h-3" /> Failed</>
                            ) : order.paymentStatus === 'refunded' ? (
                              <><BanknoteIcon className="w-3 h-3" /> Refunded</>
                            ) : (
                              <><Clock className="w-3 h-3" /> Pending</>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-500">
                          {order.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-gold hover:text-yellow-600"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setOrderNotesModal({ order, note: order.notes || '' })}
                            className="text-gray-400 hover:text-blue-600"
                            title="Add Note"
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setPrintOrder(order)}
                            className="text-gray-400 hover:text-green-600"
                            title="Print Order"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                        </div>
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
                <h2 className="text-lg font-bold text-navy">Customers ({users.filter(u =>
                  !customerSearch ||
                  u.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  u.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  u.phone?.toLowerCase().includes(customerSearch.toLowerCase())
                ).length})</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold w-64"
                    />
                  </div>
                  <button
                    onClick={exportUsersToCSV}
                    className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
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
                  {users.filter(u =>
                    !customerSearch ||
                    u.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    u.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    u.phone?.toLowerCase().includes(customerSearch.toLowerCase())
                  ).map(customer => {
                    const customerOrders = getCustomerOrders(customer.id)
                    const lifetimeValue = getCustomerLifetimeValue(customer.id)
                    return (
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
                          <span className="text-sm font-medium text-navy">{customerOrders.length}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-sm font-semibold ${lifetimeValue > 5000 ? 'text-green-600' : 'text-navy'}`}>
                            ₱{lifetimeValue.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-600">{customer.aiDresserUsage || 0}</span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => setSelectedCustomer(customer)}
                            className="flex items-center gap-1.5 text-sm text-gold hover:text-yellow-600"
                          >
                            <History className="w-4 h-4" />
                            View History
                          </button>
                        </td>
                      </tr>
                    )
                  })}
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

            {/* Low Stock Products Card */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy">Low Stock Products</h3>
                      <p className="text-sm text-gray-500">Products with stock below 20 units</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    {lowStockProducts.length} items
                  </span>
                </div>
              </div>

              {lowStockProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">All products are well stocked!</p>
                  <p className="text-gray-400 text-sm">No products below 20 units</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {lowStockProducts
                    .sort((a, b) => a.stockQty - b.stockQty)
                    .map(product => (
                    <div key={product.id} className="p-4 hover:bg-gray-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {product.images && product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-navy truncate">{product.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{product.brand}</span>
                            <span>•</span>
                            <span className="capitalize">{product.category}</span>
                            <span>•</span>
                            <span>₱{product.price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            product.stockQty === 0 ? 'text-red-600' :
                            product.stockQty <= 5 ? 'text-orange-600' :
                            'text-yellow-600'
                          }`}>
                            {product.stockQty}
                          </p>
                          <p className="text-xs text-gray-500">in stock</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          product.stockQty === 0
                            ? 'bg-red-100 text-red-700'
                            : product.stockQty <= 5
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {product.stockQty === 0 ? 'Out of Stock' : product.stockQty <= 5 ? 'Critical' : 'Low'}
                        </span>
                        <button
                          onClick={() => {
                            setActiveTab('products')
                            openProductForm(product as FirestoreProduct)
                          }}
                          className="p-2 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Full Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-navy">Inventory</h2>
                    <p className="text-sm text-gray-500">
                      {(() => {
                        const filtered = allProducts.filter(p =>
                          !inventorySearch ||
                          p.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          p.brand?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          p.category?.toLowerCase().includes(inventorySearch.toLowerCase())
                        )
                        return `Showing ${((inventoryPage - 1) * INVENTORY_PER_PAGE) + 1}-${Math.min(inventoryPage * INVENTORY_PER_PAGE, filtered.length)} of ${filtered.length} products`
                      })()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search inventory..."
                        value={inventorySearch}
                        onChange={(e) => {
                          setInventorySearch(e.target.value)
                          setInventoryPage(1)
                        }}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold w-64"
                      />
                    </div>
                    <button
                      onClick={exportInventoryToCSV}
                      className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
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
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allProducts
                      .filter(p =>
                        !inventorySearch ||
                        p.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                        p.brand?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                        p.category?.toLowerCase().includes(inventorySearch.toLowerCase())
                      )
                      .slice((inventoryPage - 1) * INVENTORY_PER_PAGE, inventoryPage * INVENTORY_PER_PAGE)
                      .map(product => (
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
                              : product.stockQty < LOW_STOCK_THRESHOLD
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {product.stockQty === 0 ? 'Out of Stock' : product.stockQty < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Inventory Pagination */}
              {Math.ceil(allProducts.length / INVENTORY_PER_PAGE) > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setInventoryPage(prev => Math.max(1, prev - 1))}
                    disabled={inventoryPage === 1}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                      inventoryPage === 1
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 text-navy hover:bg-gold hover:border-gold'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: Math.min(5, Math.ceil(allProducts.length / INVENTORY_PER_PAGE)) }, (_, i) => {
                    const totalPages = Math.ceil(allProducts.length / INVENTORY_PER_PAGE)
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (inventoryPage <= 3) {
                      pageNum = i + 1
                    } else if (inventoryPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = inventoryPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setInventoryPage(pageNum)}
                        className={`flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg border transition-colors ${
                          inventoryPage === pageNum
                            ? 'bg-gold border-gold text-navy font-bold'
                            : 'border-gray-200 text-navy hover:bg-gold hover:border-gold'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => setInventoryPage(prev => Math.min(Math.ceil(allProducts.length / INVENTORY_PER_PAGE), prev + 1))}
                    disabled={inventoryPage === Math.ceil(allProducts.length / INVENTORY_PER_PAGE)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors ${
                      inventoryPage === Math.ceil(allProducts.length / INVENTORY_PER_PAGE)
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 text-navy hover:bg-gold hover:border-gold'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
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
                  <p className="text-sm text-gray-500">Paid Orders</p>
                </div>
                <p className="text-2xl font-bold text-navy">{paymentStats.paidOrders}</p>
                <p className="text-sm text-green-600 mt-1">₱{paymentStats.paidRevenue.toLocaleString()} confirmed</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <p className="text-sm text-gray-500">Pending Payments</p>
                </div>
                <p className="text-2xl font-bold text-navy">{paymentStats.pendingPayments}</p>
                <p className="text-sm text-yellow-600 mt-1">Awaiting payment</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-500">Online Payments</p>
                </div>
                <p className="text-2xl font-bold text-navy">{paymentStats.onlineOrders}</p>
                <p className="text-sm text-blue-600 mt-1">₱{paymentStats.onlineRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-sm text-gray-500">COD Orders</p>
                </div>
                <p className="text-2xl font-bold text-navy">{paymentStats.codOrders}</p>
                <p className="text-sm text-amber-600 mt-1">₱{paymentStats.codRevenue.toLocaleString()}</p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-navy mb-4">Payment Method Breakdown</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Online Payments</span>
                    <span className="font-semibold text-navy">
                      {stats.totalOrders > 0 ? Math.round((paymentStats.onlineOrders / stats.totalOrders) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${stats.totalOrders > 0 ? (paymentStats.onlineOrders / stats.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{paymentStats.onlineOrders} orders • ₱{paymentStats.onlineRevenue.toLocaleString()}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Cash on Delivery</span>
                    <span className="font-semibold text-navy">
                      {stats.totalOrders > 0 ? Math.round((paymentStats.codOrders / stats.totalOrders) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${stats.totalOrders > 0 ? (paymentStats.codOrders / stats.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{paymentStats.codOrders} orders • ₱{paymentStats.codRevenue.toLocaleString()}</p>
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
                          ? 'bg-gold text-navy'
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
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-navy">Product Management</h2>
                  <p className="text-sm text-gray-500">
                    {firestoreProducts.length > 0
                      ? `${firestoreProducts.length} products in database`
                      : `Using ${staticProducts.length} static products (seed to enable editing)`
                    }
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => openProductForm()}
                    className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                  <button
                    onClick={() => productImportRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isImporting ? 'Importing...' : 'Import CSV'}
                  </button>
                  <input
                    ref={productImportRef}
                    type="file"
                    accept=".csv"
                    onChange={handleProductImport}
                    className="hidden"
                  />
                  <button
                    onClick={exportProductsToCSV}
                    className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export CSV
                  </button>
                  {firestoreProducts.length === 0 && (
                    <button
                      onClick={handleSeedProducts}
                      disabled={isSeeding}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {isSeeding ? 'Seeding...' : 'Seed Products'}
                    </button>
                  )}
                  <button
                    onClick={handleSeedSampleProducts}
                    disabled={isSeeding}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    title="Add 52 sample products for AI Dresser testing"
                  >
                    {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isSeeding ? 'Adding...' : 'Add Sample Products (52)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-semibold text-navy">All Products</h3>
                  <div className="flex gap-3 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value)
                          setProductPage(1)
                        }}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold w-48"
                      />
                    </div>
                    <select
                      value={productFilter.category}
                      onChange={(e) => {
                        setProductFilter(prev => ({ ...prev, category: e.target.value }))
                        setProductPage(1)
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat} className="capitalize">{cat}</option>
                      ))}
                    </select>
                    <select
                      value={productFilter.brand}
                      onChange={(e) => {
                        setProductFilter(prev => ({ ...prev, brand: e.target.value }))
                        setProductPage(1)
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                    >
                      <option value="">All Brands</option>
                      {/* Show all unique brands from products (includes custom brands) */}
                      {[...new Set([...brands.filter(b => b !== 'Other'), ...allProducts.map(p => p.brand)])].sort().map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="p-6">
                {(() => {
                  const filteredProducts = allProducts.filter(p => {
                    if (productFilter.category && p.category !== productFilter.category) return false
                    if (productFilter.brand && p.brand !== productFilter.brand) return false
                    if (productSearch) {
                      const search = productSearch.toLowerCase()
                      return p.name?.toLowerCase().includes(search) ||
                             p.brand?.toLowerCase().includes(search) ||
                             p.id?.toLowerCase().includes(search)
                    }
                    return true
                  })
                  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
                  const startIndex = (productPage - 1) * productsPerPage
                  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage)

                  return (
                    <>
                      {filteredProducts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No products found. {productFilter.category || productFilter.brand ? 'Try adjusting filters.' : 'Add your first product or seed from static data.'}</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {paginatedProducts.map(product => (
                              <div
                                key={product.id}
                                className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-gold/50 transition-colors group"
                              >
                                {/* Product Image */}
                                <div className="relative aspect-square bg-white">
                                  {product.images && product.images[0] ? (
                                    <Image
                                      src={product.images[0]}
                                      alt={product.name}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 50vw, 25vw"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                      <Package className="w-12 h-12" />
                                    </div>
                                  )}
                                  {/* Actions overlay */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    <button
                                      onClick={() => openProductForm(product as FirestoreProduct)}
                                      className="p-2 bg-white rounded-lg hover:bg-gold transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-4 h-4 text-navy" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(product.id || null)}
                                      className="p-2 bg-white rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {/* Featured badge */}
                                  {product.featured && (
                                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-gold text-navy text-xs font-bold rounded">
                                      Featured
                                    </span>
                                  )}
                                </div>

                                {/* Product Info */}
                                <div className="p-3">
                                  <p className="text-xs text-gold font-medium mb-0.5">{product.brand}</p>
                                  <p className="text-sm font-medium text-navy truncate" title={product.name}>
                                    {product.name}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <p className="text-sm font-bold text-navy">₱{product.price.toLocaleString()}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      product.stockQty > 20 ? 'bg-green-100 text-green-700' :
                                      product.stockQty > 0 ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}>
                                      {product.stockQty} in stock
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1 font-mono truncate" title={product.id}>
                                    ID: {product.id}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                              <p className="text-sm text-gray-500">
                                Showing {startIndex + 1}-{Math.min(startIndex + productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setProductPage(1)}
                                  disabled={productPage === 1}
                                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  First
                                </button>
                                <button
                                  onClick={() => setProductPage(p => Math.max(1, p - 1))}
                                  disabled={productPage === 1}
                                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum
                                    if (totalPages <= 5) {
                                      pageNum = i + 1
                                    } else if (productPage <= 3) {
                                      pageNum = i + 1
                                    } else if (productPage >= totalPages - 2) {
                                      pageNum = totalPages - 4 + i
                                    } else {
                                      pageNum = productPage - 2 + i
                                    }
                                    return (
                                      <button
                                        key={pageNum}
                                        onClick={() => setProductPage(pageNum)}
                                        className={`w-8 h-8 text-sm rounded-lg ${
                                          productPage === pageNum
                                            ? 'bg-gold text-navy font-semibold'
                                            : 'border border-gray-200 hover:bg-gray-50'
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    )
                                  })}
                                </div>
                                <button
                                  onClick={() => setProductPage(p => Math.min(totalPages, p + 1))}
                                  disabled={productPage === totalPages}
                                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setProductPage(totalPages)}
                                  disabled={productPage === totalPages}
                                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Last
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

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
                  className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
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
                    className="mt-4 text-gold hover:text-yellow-600 font-medium"
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
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-navy">Product Reviews</h2>
                  <p className="text-sm text-gray-500">Manage and moderate customer reviews</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Verified Filter */}
                  <select
                    value={reviewFilter}
                    onChange={(e) => setReviewFilter(e.target.value as 'all' | 'verified' | 'unverified')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="all">All Reviews</option>
                    <option value="verified">Verified Only</option>
                    <option value="unverified">Unverified Only</option>
                  </select>
                  {/* Rating Filter */}
                  <select
                    value={reviewRatingFilter ?? ''}
                    onChange={(e) => setReviewRatingFilter(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
              </div>

              {/* Reviews Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Total Reviews</p>
                  <p className="text-2xl font-bold text-navy">{reviews.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{reviews.filter(r => r.verified).length}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0'}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">5-Star Reviews</p>
                  <p className="text-2xl font-bold text-blue-600">{reviews.filter(r => r.rating === 5).length}</p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
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
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:border-gold/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Product Link */}
                            {product && (
                              <Link
                                href={`/shop/${product.id}`}
                                className="text-sm text-gold hover:text-yellow-600 font-medium mb-1 inline-block"
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
                    className="mt-2 text-gold hover:text-yellow-600 font-medium text-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
                    className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-4 py-2 rounded-lg transition-colors"
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
                      className="flex items-center gap-2 text-gold hover:text-yellow-600 font-medium"
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
                      className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
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
                      selectedOrder.paymentMethod === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedOrder.paymentMethod === 'online' ? (
                        <><CreditCard className="w-4 h-4" /> Online Payment</>
                      ) : (
                        <><Wallet className="w-4 h-4" /> Cash on Delivery</>
                      )}
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

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowProductForm(false)} />
          <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-navy">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {editingProduct ? `Editing: ${editingProduct.name}` : 'Fill in the product details'}
                  </p>
                </div>
                <button onClick={() => setShowProductForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
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
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={productFormData.name || ''}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                    placeholder="e.g. Classic Logo T-Shirt"
                  />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
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
                  {showBrandDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {brands
                        .filter(b => b !== 'Other' && b.toLowerCase().includes((brandSearch || '').toLowerCase()))
                        .map(brand => (
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
                          </button>
                        ))}
                      {brandSearch && !brands.includes(brandSearch) && (
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
                      {!brandSearch && brands.filter(b => b !== 'Other').length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">No brands available</div>
                      )}
                    </div>
                  )}
                  {productFormData.brand && (
                    <p className="mt-1 text-xs text-gray-500">
                      Selected: <span className="font-medium text-navy">{productFormData.brand}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={productFormData.category || 'clothes'}
                    onChange={(e) => {
                      const newCategory = e.target.value as 'clothes' | 'accessories' | 'shoes'
                      // Set default sizes based on category
                      let defaultSizes: string[] = []
                      if (newCategory === 'shoes') {
                        defaultSizes = ['38', '39', '40', '41', '42', '43', '44', '45']
                      } else if (newCategory === 'clothes') {
                        defaultSizes = ['S', 'M', 'L', 'XL']
                      }
                      setProductFormData(prev => ({
                        ...prev,
                        category: newCategory,
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                  <input
                    type="text"
                    value={productFormData.subcategory || ''}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                    placeholder="e.g. t-shirts, sneakers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={productFormData.gender || 'unisex'}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'unisex' }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-navy mb-4">Pricing & Inventory</h4>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱) *</label>
                    <input
                      type="number"
                      value={productFormData.price || ''}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₱)</label>
                    <input
                      type="number"
                      value={productFormData.originalPrice || ''}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                      placeholder="Leave empty if not on sale"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set to enable sale pricing</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Stock</label>
                    <div className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600">
                      {Object.values(productFormData.stockBySize || {}).reduce((sum, qty) => sum + qty, 0) || productFormData.stockQty || 0}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated from sizes</p>
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productFormData.inStock !== false}
                        onChange={(e) => setProductFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                        className="w-4 h-4 accent-gold"
                      />
                      <span className="text-sm">In Stock</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-navy mb-4">Product Images</h4>

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
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-gold text-navy text-[10px] rounded font-medium">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-gold transition-colors"
                >
                  {uploadingImages ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-gold" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">Click to upload images</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 5MB each</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={productFormData.description || ''}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold resize-none"
                  rows={3}
                  placeholder="Product description..."
                />
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Colors (comma separated)</label>
                <input
                  type="text"
                  defaultValue={(productFormData.colors || []).join(', ')}
                  key={`colors-${editingProduct?.id || 'new'}`}
                  onBlur={(e) => setProductFormData(prev => ({
                    ...prev,
                    colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                  placeholder="Black, White, Navy"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-navy mb-4">Sizes & Stock per Size</h4>
                <p className="text-sm text-gray-500 mb-4">Select available sizes and enter stock quantity for each</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(productFormData.category === 'shoes'
                    ? shoeSizeOptions
                    : productFormData.category === 'accessories'
                    ? accessorySizeOptions
                    : clothesSizeOptions
                  ).map(size => {
                    const isSelected = (productFormData.sizes || []).includes(size)
                    const stockForSize = productFormData.stockBySize?.[size] || 0

                    return (
                      <div
                        key={size}
                        className={`border-2 rounded-xl p-3 transition-all ${
                          isSelected
                            ? 'border-gold bg-gold/5'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
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
                          <span className={`font-medium ${isSelected ? 'text-navy' : 'text-gray-500'}`}>
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
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  defaultValue={(productFormData.tags || []).join(', ')}
                  key={`tags-${editingProduct?.id || 'new'}`}
                  onBlur={(e) => setProductFormData(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gold"
                  placeholder="casual, cotton, trendy"
                />
              </div>

              {/* Flags */}
              <div className="bg-gold/10 rounded-xl p-4">
                <h4 className="font-semibold text-navy mb-4">Display Options</h4>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productFormData.featured || false}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-sm font-medium">Featured Product</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productFormData.giftSuitable !== false}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, giftSuitable: e.target.checked }))}
                      className="w-4 h-4 accent-gold"
                    />
                    <span className="text-sm font-medium">Gift Suitable</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-100">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowProductForm(false)}
                  className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  disabled={isSavingProduct}
                  className="flex items-center gap-2 px-6 py-3 bg-gold text-navy font-semibold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50"
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
                  className="px-4 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-yellow-400"
                >
                  Save Note
                </button>
              </div>
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
                    className="flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-semibold px-4 py-2 rounded-lg"
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
                <h1 className="text-2xl font-bold text-navy">LGM Apparel</h1>
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
                <p>Thank you for shopping with LGM Apparel!</p>
                <p>For questions, contact us at support@lgmapparel.com</p>
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
                  className="px-4 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-yellow-400"
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
