// PayMongo Payment Gateway Integration
// Documentation: https://developers.paymongo.com/

export interface PayMongoLineItem {
  amount: number // Amount in centavos
  currency: 'PHP'
  name: string
  quantity: number
  description?: string
}

export interface PayMongoCheckoutData {
  lineItems: PayMongoLineItem[]
  customerEmail: string
  customerName: string
  customerPhone?: string
  orderId: string
  description?: string
}

export interface PayMongoCheckoutResponse {
  success: boolean
  checkoutUrl?: string
  checkoutSessionId?: string
  error?: string
}

export interface PayMongoWebhookEvent {
  id: string
  type: string
  data: {
    id: string
    type: string
    attributes: {
      amount: number
      billing?: {
        address?: {
          city?: string
          country?: string
          line1?: string
          line2?: string
          postal_code?: string
          state?: string
        }
        email?: string
        name?: string
        phone?: string
      }
      checkout_url?: string
      client_key?: string
      currency: string
      description?: string
      line_items?: Array<{
        amount: number
        currency: string
        description?: string
        name: string
        quantity: number
      }>
      livemode: boolean
      merchant?: string
      metadata?: Record<string, string>
      payment_intent?: {
        id: string
        type: string
        attributes: {
          amount: number
          capture_type: string
          client_key: string
          currency: string
          description?: string
          livemode: boolean
          metadata?: Record<string, string>
          payment_method_allowed: string[]
          payments: Array<{
            id: string
            type: string
            attributes: {
              amount: number
              billing?: Record<string, unknown>
              currency: string
              description?: string
              fee: number
              livemode: boolean
              net_amount: number
              payout?: unknown
              source: {
                id: string
                type: string
              }
              statement_descriptor: string
              status: string
            }
          }>
          setup_future_usage?: string
          status: string
        }
      }
      payment_method_types: string[]
      payments: Array<{
        id: string
        type: string
        attributes: {
          amount: number
          currency: string
          status: string
        }
      }>
      reference_number?: string
      send_email_receipt: boolean
      show_description: boolean
      show_line_items: boolean
      status: string
      success_url?: string
      created_at: number
      updated_at: number
      paid_at?: number
    }
  }
}

const PAYMONGO_API_URL = 'https://api.paymongo.com/v1'

// Get the secret key from environment
const getSecretKey = () => {
  const secretKey = process.env.PAYMONGO_SECRET_KEY
  if (!secretKey) {
    throw new Error('PAYMONGO_SECRET_KEY is not configured')
  }
  return secretKey
}

// Create authorization header
const getAuthHeader = () => {
  const secretKey = getSecretKey()
  return `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
}

// Create a PayMongo Checkout Session
export const createCheckoutSession = async (
  data: PayMongoCheckoutData
): Promise<PayMongoCheckoutResponse> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const response = await fetch(`${PAYMONGO_API_URL}/checkout_sessions`, {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              email: data.customerEmail,
              name: data.customerName,
              phone: data.customerPhone,
            },
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: data.description || `Order ${data.orderId}`,
            line_items: data.lineItems,
            payment_method_types: [
              'gcash',
              'grab_pay',
              'paymaya',
              'card',
              'dob',
              'dob_ubp',
            ],
            success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${data.orderId}`,
            cancel_url: `${baseUrl}/checkout?cancelled=true`,
            metadata: {
              order_id: data.orderId,
            },
          },
        },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('PayMongo API error:', result)
      return {
        success: false,
        error: result.errors?.[0]?.detail || 'Failed to create checkout session',
      }
    }

    return {
      success: true,
      checkoutUrl: result.data.attributes.checkout_url,
      checkoutSessionId: result.data.id,
    }
  } catch (error) {
    console.error('PayMongo checkout error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Retrieve a checkout session
export const getCheckoutSession = async (sessionId: string) => {
  try {
    const response = await fetch(`${PAYMONGO_API_URL}/checkout_sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('PayMongo API error:', result)
      return null
    }

    return result.data
  } catch (error) {
    console.error('PayMongo get session error:', error)
    return null
  }
}

// Verify webhook signature
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  webhookSecretKey: string
): boolean => {
  try {
    const crypto = require('crypto')

    // PayMongo sends signature in format: t=timestamp,te=test_signature,li=live_signature
    const signatureParts = signature.split(',')
    const timestampPart = signatureParts.find(p => p.startsWith('t='))
    const testSigPart = signatureParts.find(p => p.startsWith('te='))
    const liveSigPart = signatureParts.find(p => p.startsWith('li='))

    if (!timestampPart) {
      return false
    }

    const timestamp = timestampPart.replace('t=', '')
    const signatureToVerify = liveSigPart?.replace('li=', '') || testSigPart?.replace('te=', '')

    if (!signatureToVerify) {
      return false
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecretKey)
      .update(signedPayload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signatureToVerify),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

// Convert PHP amount to centavos (PayMongo uses centavos)
export const toCentavos = (amount: number): number => {
  return Math.round(amount * 100)
}

// Convert centavos back to PHP
export const fromCentavos = (centavos: number): number => {
  return centavos / 100
}
