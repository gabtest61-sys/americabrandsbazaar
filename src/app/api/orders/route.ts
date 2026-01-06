import { NextRequest, NextResponse } from 'next/server'
import { createOrder, getAllOrders, getOrderById, Order } from '@/lib/orders'

// GET /api/orders - Get all orders (admin) or user's orders
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const orderId = searchParams.get('orderId')

  if (orderId) {
    const order = getOrderById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(order)
  }

  // For now, return all orders (in production, add auth check)
  const orders = getAllOrders()
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
      subtotal,
      shipping,
      total,
      paymentMethod,
      isGuest
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

    // Create the order
    const order = createOrder({
      userId,
      customerInfo,
      items,
      subtotal,
      shipping: shipping || 0,
      total,
      status: 'pending',
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: 'pending',
      isGuest: isGuest ?? true,
    })

    // Send notification webhook
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/webhook/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order_placed',
          data: {
            orderId: order.id,
            customerName: customerInfo.fullName,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            items: items.map((item: { name: string; price: number; quantity: number }) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity
            })),
            total: order.total
          }
        })
      })
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError)
      // Don't fail the order if notification fails
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({
      error: 'Failed to create order'
    }, { status: 500 })
  }
}
