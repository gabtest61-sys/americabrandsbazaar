import { NextRequest, NextResponse } from 'next/server'

// SOP 6.6: Add to Cart from AI Dresser
// POST /api/ai-dresser/add-to-cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, user_id, action_type, look_number, look_name, items, total_price } = body

    // Validate request
    if (!items || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No items provided'
      }, { status: 400 })
    }

    // In production, this would:
    // 1. Add items to user's cart in database
    // 2. Send FB Messenger notification to admin (SOP 6.6)
    // 3. Log the action to CRM

    // Mock success response
    return NextResponse.json({
      success: true,
      message: action_type === 'add_all'
        ? `Added ${items.length} items to cart!`
        : 'Item added to cart!',
      cart_summary: {
        items_added: items.length,
        look_name: look_name,
        total_added: total_price || items.reduce((sum: number, item: { price: number, quantity?: number }) =>
          sum + (item.price * (item.quantity || 1)), 0)
      },
      next_actions: {
        view_cart: '/cart',
        continue_shopping: '/shop',
        checkout: '/checkout'
      },
      source: 'ai_dresser'
    })
  } catch (error) {
    console.error('AI Dresser add to cart error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add items to cart'
    }, { status: 500 })
  }
}
