import { NextRequest, NextResponse } from 'next/server'
import { saveAIDresserLook, isLookSaved, deleteSavedLook } from '@/lib/firestore'

// Save Look to Wishlist
// POST /api/ai-dresser/save-wishlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, user_id, look_number, look_name, look_description, items, total_price, style_tip, action } = body

    // Validate request
    if (!user_id) {
      return NextResponse.json({
        success: false,
        error: 'User ID required'
      }, { status: 401 })
    }

    if (!look_number || !items) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data'
      }, { status: 400 })
    }

    // Check if look is already saved
    const existingLookId = await isLookSaved(user_id, session_id, look_number)

    // Handle unsave action
    if (action === 'unsave' && existingLookId) {
      const deleted = await deleteSavedLook(existingLookId)
      return NextResponse.json({
        success: deleted,
        message: deleted ? 'Look removed from wishlist' : 'Failed to remove look',
        action: 'removed'
      })
    }

    // If already saved, return existing
    if (existingLookId) {
      return NextResponse.json({
        success: true,
        message: 'Look already saved!',
        look_id: existingLookId,
        action: 'already_saved'
      })
    }

    // Save the look to Firestore
    const lookId = await saveAIDresserLook(user_id, {
      sessionId: session_id,
      lookNumber: look_number,
      lookName: look_name || `Look #${look_number}`,
      lookDescription: look_description || '',
      items: items.map((item: {
        product_id: string
        product_name: string
        brand: string
        category: string
        price: number
        image_url: string
        product_url: string
        styling_note?: string
      }) => ({
        productId: item.product_id,
        productName: item.product_name,
        brand: item.brand,
        category: item.category,
        price: item.price,
        imageUrl: item.image_url,
        productUrl: item.product_url,
        stylingNote: item.styling_note || ''
      })),
      totalPrice: total_price || items.reduce((sum: number, item: { price: number }) => sum + item.price, 0),
      styleTip: style_tip || ''
    })

    if (!lookId) {
      return NextResponse.json({
        success: false,
        error: 'Failed to save look'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Look saved to wishlist!',
      look_id: lookId,
      wishlist_item: {
        look_name: look_name,
        items_count: items.length,
        total_price: total_price
      },
      next_actions: {
        view_saved_looks: '/account?tab=saved-looks',
        continue_browsing: '/ai-dresser'
      }
    })
  } catch (error) {
    console.error('AI Dresser save wishlist error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save look to wishlist'
    }, { status: 500 })
  }
}
