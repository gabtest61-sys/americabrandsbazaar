import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, toCentavos, PayMongoLineItem } from '@/lib/paymongo'
import { createOrder, OrderItem, updateOrderPayment } from '@/lib/firestore'

interface CheckoutRequestBody {
  items: Array<{
    id: string
    name: string
    brand: string
    price: number
    quantity: number
    selectedSize?: string
    selectedColor?: string
  }>
  customerInfo: {
    fullName: string
    email: string
    phone: string
    address?: string
    city?: string
  }
  userId?: string
  notes?: string
  shippingFee: number
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequestBody = await request.json()
    const { items, customerInfo, userId, notes, shippingFee } = body

    // Validate required fields
    if (!customerInfo?.fullName || !customerInfo?.email || !customerInfo?.phone) {
      return NextResponse.json(
        { error: 'Missing required customer information' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    // First, create the order in Firestore with pending payment status
    const orderItems: OrderItem[] = items.map((item) => ({
      productId: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor,
    }))

    const orderResult = await createOrder(
      orderItems,
      {
        name: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address,
        city: customerInfo.city,
      },
      userId,
      notes,
      'online', // payment method
      'pending' // payment status
    )

    if (!orderResult.success || !orderResult.orderId) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Prepare line items for PayMongo
    const lineItems: PayMongoLineItem[] = items.map((item) => ({
      amount: toCentavos(item.price),
      currency: 'PHP',
      name: `${item.brand} - ${item.name}`,
      quantity: item.quantity,
      description: [item.selectedSize, item.selectedColor].filter(Boolean).join(', ') || undefined,
    }))

    // Add shipping fee if applicable
    if (shippingFee > 0) {
      lineItems.push({
        amount: toCentavos(shippingFee),
        currency: 'PHP',
        name: 'Shipping Fee',
        quantity: 1,
      })
    }

    // Create PayMongo checkout session
    const checkoutResult = await createCheckoutSession({
      lineItems,
      customerEmail: customerInfo.email,
      customerName: customerInfo.fullName,
      customerPhone: customerInfo.phone,
      orderId: orderResult.orderId,
      description: `America Brands Bazaar Order #${orderResult.orderId}`,
    })

    if (!checkoutResult.success || !checkoutResult.checkoutUrl) {
      // Update order with failed payment
      await updateOrderPayment(orderResult.orderId, {
        paymentStatus: 'failed',
        paymentError: checkoutResult.error,
      })

      return NextResponse.json(
        { error: checkoutResult.error || 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    // Update order with checkout session ID
    await updateOrderPayment(orderResult.orderId, {
      checkoutSessionId: checkoutResult.checkoutSessionId,
    })

    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      checkoutUrl: checkoutResult.checkoutUrl,
      checkoutSessionId: checkoutResult.checkoutSessionId,
    })
  } catch (error) {
    console.error('PayMongo checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    )
  }
}
