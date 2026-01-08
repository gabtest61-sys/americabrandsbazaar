import { NextRequest, NextResponse } from 'next/server'

// SOP 6.6: Add to Cart from AI Dresser
// POST /api/ai-dresser/add-to-cart
// Note: The actual cart is managed client-side via CartContext.
// This endpoint logs the action and sends admin notifications.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, user_id, action_type, look_number, look_name, items, total_price, user_name, user_email } = body

    // Validate request
    if (!items || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No items provided'
      }, { status: 400 })
    }

    // Log the action (useful for analytics)
    console.log('AI Dresser cart action:', {
      session_id,
      user_id,
      action_type,
      look_number,
      look_name,
      items_count: items.length,
      total_price
    })

    // Send notification to admin via webhook
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/webhook/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ai_dresser_cart',
          data: {
            customerName: user_name || 'Guest',
            customerEmail: user_email || 'Not provided',
            lookName: look_name,
            lookNumber: look_number,
            items: items.map((item: { product_name: string; brand: string; price: number }) => ({
              name: item.product_name,
              brand: item.brand,
              price: item.price
            })),
            totalPrice: total_price || items.reduce((sum: number, item: { price: number }) => sum + item.price, 0),
            actionType: action_type,
            source: 'AI Dresser',
            sessionId: session_id
          }
        })
      })
    } catch (notifyError) {
      // Don't fail the request if notification fails
      console.error('Failed to send AI Dresser notification:', notifyError)
    }

    // Return success - client handles actual cart addition
    return NextResponse.json({
      success: true,
      message: action_type === 'add_all'
        ? `${items.length} items ready for cart!`
        : 'Item ready for cart!',
      cart_summary: {
        items_count: items.length,
        look_name: look_name,
        total_value: total_price || items.reduce((sum: number, item: { price: number, quantity?: number }) =>
          sum + (item.price * (item.quantity || 1)), 0)
      },
      next_actions: {
        view_cart: '/cart',
        continue_shopping: '/shop',
        checkout: '/checkout'
      },
      source: 'ai_dresser',
      session_id
    })
  } catch (error) {
    console.error('AI Dresser add to cart error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process cart request'
    }, { status: 500 })
  }
}
