// Order Management System
// In production, this would use a database

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  size?: string
  color?: string
  image: string
}

export interface Order {
  id: string
  userId?: string
  customerInfo: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
    notes?: string
  }
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentMethod: 'cod' | 'gcash' | 'bank'
  paymentStatus: 'pending' | 'paid' | 'failed'
  isGuest: boolean
  createdAt: string
  updatedAt: string
}

// In-memory storage (replace with database in production)
let orders: Order[] = []

export function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const order: Order = {
    ...orderData,
    id: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  orders.push(order)
  return order
}

export function getOrderById(id: string): Order | undefined {
  return orders.find(o => o.id === id)
}

export function getOrdersByUserId(userId: string): Order[] {
  return orders.filter(o => o.userId === userId).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getAllOrders(): Order[] {
  return [...orders].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function updateOrderStatus(id: string, status: Order['status']): Order | undefined {
  const order = orders.find(o => o.id === id)
  if (order) {
    order.status = status
    order.updatedAt = new Date().toISOString()
  }
  return order
}

export function updatePaymentStatus(id: string, paymentStatus: Order['paymentStatus']): Order | undefined {
  const order = orders.find(o => o.id === id)
  if (order) {
    order.paymentStatus = paymentStatus
    order.updatedAt = new Date().toISOString()
  }
  return order
}

// Demo orders for testing
export function seedDemoOrders() {
  if (orders.length === 0) {
    orders = [
      {
        id: 'ORD-DEMO-001',
        userId: 'user_admin_001',
        customerInfo: {
          fullName: 'Juan Dela Cruz',
          email: 'juan@email.com',
          phone: '09171234567',
          address: '123 Main St, Barangay San Antonio',
          city: 'Makati City',
          postalCode: '1234',
        },
        items: [
          { productId: 'ck-001', name: 'Classic Logo T-Shirt', price: 1899, quantity: 2, size: 'M', color: 'Black', image: '/products/ck-tee-black.jpg' },
          { productId: 'nike-shoe-001', name: 'Air Max 90', price: 6995, quantity: 1, size: '10', color: 'White', image: '/products/nike-airmax90.jpg' },
        ],
        subtotal: 10793,
        shipping: 150,
        total: 10943,
        status: 'delivered',
        paymentMethod: 'gcash',
        paymentStatus: 'paid',
        isGuest: false,
        createdAt: '2024-01-28T10:30:00Z',
        updatedAt: '2024-01-30T14:00:00Z',
      },
      {
        id: 'ORD-DEMO-002',
        customerInfo: {
          fullName: 'Maria Santos',
          email: 'maria@email.com',
          phone: '09189876543',
          address: '456 Oak Ave, Village Heights',
          city: 'Quezon City',
          postalCode: '1100',
        },
        items: [
          { productId: 'mk-001', name: 'Lexington Chronograph Watch', price: 7500, quantity: 1, size: 'One Size', color: 'Gold', image: '/products/mk-watch-gold.jpg' },
        ],
        subtotal: 7500,
        shipping: 0,
        total: 7500,
        status: 'processing',
        paymentMethod: 'bank',
        paymentStatus: 'paid',
        isGuest: true,
        createdAt: '2024-01-30T15:45:00Z',
        updatedAt: '2024-01-30T15:45:00Z',
      },
      {
        id: 'ORD-DEMO-003',
        customerInfo: {
          fullName: 'Pedro Reyes',
          email: 'pedro@email.com',
          phone: '09161112233',
          address: '789 Pine Rd, Green Meadows',
          city: 'Pasig City',
          postalCode: '1600',
        },
        items: [
          { productId: 'rl-001', name: 'Classic Fit Polo Shirt', price: 3299, quantity: 1, size: 'L', color: 'Navy', image: '/products/rl-polo.jpg' },
          { productId: 'gap-001', name: 'Slim Fit Chinos', price: 2499, quantity: 1, size: '32', color: 'Khaki', image: '/products/gap-chinos.jpg' },
          { productId: 'ck-acc-001', name: 'Reversible Leather Belt', price: 1899, quantity: 1, size: '34', color: 'Black/Brown', image: '/products/ck-belt.jpg' },
        ],
        subtotal: 7697,
        shipping: 150,
        total: 7847,
        status: 'pending',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        isGuest: false,
        createdAt: '2024-01-31T09:00:00Z',
        updatedAt: '2024-01-31T09:00:00Z',
      },
    ]
  }
}

// Initialize demo orders
seedDemoOrders()
