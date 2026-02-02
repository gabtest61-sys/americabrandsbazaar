import { WebhookPayload, CartItem, CheckoutFormData } from './types'

// n8n webhook URL - Replace with your actual n8n webhook URL
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''

export async function sendWebhook(payload: WebhookPayload): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) {
    console.warn('n8n webhook URL not configured')
    return false
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('Webhook failed:', response.statusText)
      return false
    }

    console.log('Webhook sent successfully')
    return true
  } catch (error) {
    console.error('Webhook error:', error)
    return false
  }
}

// Admin email addresses for order notifications
const ADMIN_EMAILS = 'flowpilot25@gmail.com, americabrandsbazaar@gmail.com'

export async function sendOrderNotification(payload: WebhookPayload): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) {
    console.warn('n8n webhook URL not configured')
    return false
  }

  // Build the order-notification webhook URL
  const orderWebhookUrl = N8N_WEBHOOK_URL.replace(/\/?$/, '') + '/order-notification'

  try {
    const response = await fetch(orderWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        notifyEmails: ADMIN_EMAILS,
      }),
    })

    if (!response.ok) {
      console.error('Order notification webhook failed:', response.statusText)
      return false
    }

    console.log('Order notification sent successfully')
    return true
  } catch (error) {
    console.error('Order notification webhook error:', error)
    return false
  }
}

export function createAddToCartPayload(
  items: CartItem[],
  customerName?: string
): WebhookPayload {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return {
    event: 'add_to_cart',
    customer: {
      name: customerName || 'Guest',
      email: '',
      phone: '',
    },
    products: items.map((item) => ({
      name: item.product.name,
      brand: item.product.brand,
      price: item.product.price,
      quantity: item.quantity,
    })),
    total,
    timestamp: new Date().toISOString(),
  }
}

export function createCheckoutPayload(
  items: CartItem[],
  customer: CheckoutFormData
): WebhookPayload {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return {
    event: 'checkout_started',
    customer: {
      name: customer.fullName,
      email: customer.email,
      phone: customer.phone,
    },
    products: items.map((item) => ({
      name: item.product.name,
      brand: item.product.brand,
      price: item.product.price,
      quantity: item.quantity,
    })),
    total,
    timestamp: new Date().toISOString(),
  }
}

export function createOrderCompletedPayload(
  items: CartItem[],
  customer: CheckoutFormData,
  orderId?: string
): WebhookPayload {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return {
    event: 'order_completed',
    orderId,
    customer: {
      name: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      facebook: customer.facebook,
    },
    products: items.map((item) => ({
      name: item.product.name,
      brand: item.product.brand,
      price: item.product.price,
      quantity: item.quantity,
    })),
    total,
    timestamp: new Date().toISOString(),
  }
}

// Format webhook message for Facebook Messenger (used by n8n)
export function formatMessengerMessage(payload: WebhookPayload): string {
  const eventLabels = {
    add_to_cart: 'New Cart Activity',
    checkout_started: 'Checkout Started',
    order_completed: 'New Order!',
  }

  const productList = payload.products
    .map((p) => `• ${p.name} (${p.brand}) x${p.quantity} - ₱${p.price.toLocaleString()}`)
    .join('\n')

  const orderIdLine = payload.orderId ? `\n📋 Order ID: ${payload.orderId}` : ''
  const addressLine = payload.customer.address ? `\n📍 Address: ${payload.customer.address}, ${payload.customer.city || ''}` : ''
  const facebookLine = payload.customer.facebook ? `\n💬 Facebook: ${payload.customer.facebook}` : ''

  return `
🛒 ${eventLabels[payload.event]}${orderIdLine}

👤 Customer: ${payload.customer.name}
📧 Email: ${payload.customer.email || 'Not provided'}
📱 Phone: ${payload.customer.phone || 'Not provided'}${facebookLine}${addressLine}

📦 Products:
${productList}

💰 Total: ₱${payload.total.toLocaleString()}

🕐 Time: ${new Date(payload.timestamp).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
  })}
`.trim()
}
