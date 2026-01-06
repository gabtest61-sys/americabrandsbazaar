import { NextRequest, NextResponse } from 'next/server'

// Facebook Messenger Webhook Notification
// This sends alerts to admin when orders are placed or cart actions occur

interface NotificationPayload {
  type: 'order_placed' | 'cart_action' | 'checkout_started' | 'ai_dresser_action'
  data: {
    orderId?: string
    customerName: string
    customerEmail: string
    customerPhone?: string
    items: { name: string; price: number; quantity: number }[]
    total: number
    source?: string
    lookName?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: NotificationPayload = await request.json()

    // Build notification message
    const message = buildNotificationMessage(payload)

    // In production, send to Facebook Messenger using the Graph API
    // For now, we'll log it and return success
    console.log('📱 FB Messenger Notification:', message)

    // If FB credentials are configured, send to Messenger
    const fbPageAccessToken = process.env.FB_PAGE_ACCESS_TOKEN
    const adminPsid = process.env.ADMIN_PSID

    if (fbPageAccessToken && adminPsid) {
      await sendMessengerNotification(adminPsid, message, fbPageAccessToken)
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      notificationPreview: message
    })
  } catch (error) {
    console.error('Webhook notification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send notification'
    }, { status: 500 })
  }
}

function buildNotificationMessage(payload: NotificationPayload): string {
  const { type, data } = payload

  const itemsList = data.items
    .map(item => `• ${item.name} x${item.quantity} - ₱${(item.price * item.quantity).toLocaleString()}`)
    .join('\n')

  switch (type) {
    case 'order_placed':
      return `🛒 NEW ORDER!\n\n` +
        `📋 Order: ${data.orderId}\n` +
        `👤 Customer: ${data.customerName}\n` +
        `📧 Email: ${data.customerEmail}\n` +
        `📱 Phone: ${data.customerPhone || 'Not provided'}\n\n` +
        `📦 Items:\n${itemsList}\n\n` +
        `💰 Total: ₱${data.total.toLocaleString()}\n\n` +
        `⏰ ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`

    case 'checkout_started':
      return `🔔 CHECKOUT STARTED!\n\n` +
        `👤 Customer: ${data.customerName}\n` +
        `📧 Email: ${data.customerEmail}\n\n` +
        `📦 Cart Items:\n${itemsList}\n\n` +
        `💰 Cart Total: ₱${data.total.toLocaleString()}\n\n` +
        `💡 Follow up if order not completed!`

    case 'cart_action':
      return `🛍️ CART ACTION!\n\n` +
        `👤 Customer: ${data.customerName}\n` +
        `📦 Items Added:\n${itemsList}\n\n` +
        `💰 Total: ₱${data.total.toLocaleString()}`

    case 'ai_dresser_action':
      return `✨ AI DRESSER CART!\n\n` +
        `👤 Customer: ${data.customerName}\n` +
        `🎨 Look: ${data.lookName || 'Custom Look'}\n` +
        `📦 Items:\n${itemsList}\n\n` +
        `💰 Total: ₱${data.total.toLocaleString()}\n\n` +
        `🏷️ Source: AI Stylist`

    default:
      return `📢 Notification: ${type}\n${JSON.stringify(data, null, 2)}`
  }
}

async function sendMessengerNotification(recipientId: string, message: string, accessToken: string) {
  const fbApiUrl = `https://graph.facebook.com/v18.0/me/messages`

  try {
    const response = await fetch(fbApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: 'MESSAGE_TAG',
        tag: 'CONFIRMED_EVENT_UPDATE',
        access_token: accessToken,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('FB Messenger API error:', error)
      throw new Error('Failed to send Messenger notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending Messenger notification:', error)
    throw error
  }
}
