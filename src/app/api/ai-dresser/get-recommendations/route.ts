import { NextRequest, NextResponse } from 'next/server'
import { getFirestoreProducts } from '@/lib/firestore'
import { generateLocalRecommendations, QuizAnswers } from '@/lib/ai-dresser-engine'

// SOP 6.4 & 6.5: Get AI Recommendations
// POST /api/ai-dresser/get-recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, user_id, collected_data, products: clientProducts } = body

    const { purpose, gender, style, occasion, budget, color, sizes } = collected_data || {}

    // Build quiz answers from collected data
    const answers: QuizAnswers = {
      purpose: purpose || null,
      gender: gender || null,
      style: style || '',
      occasion: occasion || '',
      budget: budget || '10000',
      color: color || '',
      sizes: sizes
    }

    // Get products - prefer client-provided products, otherwise fetch from Firestore
    let allProducts = clientProducts || []

    if (!allProducts.length) {
      try {
        allProducts = await getFirestoreProducts()
      } catch (error) {
        console.error('Failed to fetch products from Firestore:', error)
        // Return error if no products available
        return NextResponse.json({
          success: false,
          error: 'No products available'
        }, { status: 500 })
      }
    }

    // Filter products by gender and stock
    let filteredProducts = allProducts.filter((p: { inStock?: boolean; stockQty?: number }) =>
      p.inStock !== false && (p.stockQty === undefined || p.stockQty > 0)
    )

    if (gender && gender !== 'unisex') {
      filteredProducts = filteredProducts.filter((p: { gender?: string }) =>
        p.gender === gender || p.gender === 'unisex'
      )
    }

    // Generate looks using the recommendation engine
    const looks = generateLocalRecommendations(answers, filteredProducts)

    if (looks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Not enough products to generate recommendations',
        session_id,
        user_id
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      session_id,
      user_id,
      stylist_message: `Here are ${looks.length} amazing ${style?.replace('-', ' ') || ''} looks curated just for you!`,
      looks,
      stats: {
        total_looks: looks.length,
        total_items: looks.reduce((sum, look) => sum + look.items.length, 0),
        average_look_price: Math.round(looks.reduce((sum, look) => sum + look.total_price, 0) / looks.length),
        products_analyzed: filteredProducts.length
      },
      based_on: collected_data,
      actions: {
        add_all_to_cart: {
          endpoint: '/api/cart/add-look',
          method: 'POST'
        },
        add_single_item: {
          endpoint: '/api/cart/add',
          method: 'POST'
        },
        save_to_wishlist: {
          endpoint: '/api/wishlist/save-look',
          method: 'POST'
        }
      }
    })
  } catch (error) {
    console.error('AI Dresser recommendations error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate recommendations'
    }, { status: 500 })
  }
}
