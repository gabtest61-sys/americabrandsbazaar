export interface Product {
  id: string
  name: string
  brand: string
  price: number
  originalPrice: number
  image: string
  category: 'clothes' | 'accessories' | 'shoes'
  description?: string
  sizes?: string[]
  colors?: string[]
}

export interface CartItem {
  product: Product
  quantity: number
  size?: string
  color?: string
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
}

export interface CheckoutFormData {
  fullName: string
  email: string
  phone: string
  address?: string
  city?: string
  notes?: string
  createAccount: boolean
  password?: string
}

export interface OrderData {
  id: string
  items: CartItem[]
  customer: CheckoutFormData
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered'
  createdAt: Date
}

export interface WebhookPayload {
  event: 'add_to_cart' | 'checkout_started' | 'order_completed'
  customer: {
    name: string
    email: string
    phone: string
  }
  products: {
    name: string
    brand: string
    price: number
    quantity: number
  }[]
  total: number
  timestamp: string
}
