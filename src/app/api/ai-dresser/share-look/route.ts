import { NextRequest, NextResponse } from 'next/server'

// Share Look via Social Media
// POST /api/ai-dresser/share-look
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, user_id, look_number, look_name, items, total_price, channel } = body

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://americabrandsbazaar.com'
    const shareUrl = `${baseUrl}/shared-look/${session_id}/${look_number}`

    // Generate share message
    const shareMessage = `Check out this ${look_name} from America Brands Bazaar! ${items?.map((i: { product_name: string, price: number }) =>
      `${i.product_name} - ₱${i.price}`).join(', ')} Total: ₱${total_price} ${shareUrl}`

    // In production, this would:
    // 1. Log the share action to CRM
    // 2. Generate proper share images/previews

    return NextResponse.json({
      success: true,
      message: 'Share link generated!',
      share_options: {
        messenger: {
          url: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&redirect_uri=${encodeURIComponent(baseUrl + '/share-complete')}`,
          label: 'Share via Messenger'
        },
        whatsapp: {
          url: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
          label: 'Share via WhatsApp'
        },
        copy_link: {
          url: shareUrl,
          label: 'Copy Link'
        }
      },
      preview: {
        look_name: look_name,
        message_preview: shareMessage.substring(0, 100) + '...'
      }
    })
  } catch (error) {
    console.error('AI Dresser share look error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate share link'
    }, { status: 500 })
  }
}
