import { NextRequest, NextResponse } from 'next/server'
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  FirestoreOrder,
  OrderItem
} from '@/lib/firestore'

// GET /api/orders - Get all orders (admin) or user's orders
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const orderId = searchParams.get('orderId')

  if (orderId) {
    const order = await getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(order)
  }

  if (userId) {
    // Return orders for specific user
    const orders = await getOrdersByUser(userId)
    return NextResponse.json(orders)
  }

  // Return all orders (admin)
  const orders = await getAllOrders()
  return NextResponse.json(orders)
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      userId,
      customerInfo,
      items,
    } = body

    // Validate required fields
    if (!customerInfo?.fullName || !customerInfo?.email || !customerInfo?.phone) {
      return NextResponse.json({
        error: 'Missing required customer information'
      }, { status: 400 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        error: 'Order must contain at least one item'
      }, { status: 400 })
    }

    // Transform items to Firestore format
    const orderItems: OrderItem[] = items.map((item: {
      id: string
      name: string
      brand: string
      price: number
      quantity: number
      selectedSize?: string
      selectedColor?: string
    }) => ({
      productId: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor
    }))

    // Transform customer info to Firestore format
    const firestoreCustomerInfo: FirestoreOrder['customerInfo'] = {
      name: customerInfo.fullName,
      email: customerInfo.email,
      phone: customerInfo.phone,
      address: customerInfo.address,
      city: customerInfo.city
    }

    // Create the order in Firestore
    const result = await createOrder(
      orderItems,
      firestoreCustomerInfo,
      userId || undefined
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to create order'
      }, { status: 500 })
    }

    // Send notification webhook
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/webhook/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_placed',
          data: {
            orderId: result.orderId,
            customerName: customerInfo.fullName,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            items: items.map((item: { name: string; price: number; quantity: number }) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity
            })),
            total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
          }
        })
      })
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError)
      // Don't fail the order if notification fails
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({
      error: 'Failed to create order'
    }, { status: 500 })
  }
}
