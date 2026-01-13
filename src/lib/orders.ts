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
