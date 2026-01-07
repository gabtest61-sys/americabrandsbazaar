import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, PayMongoWebhookEvent } from '@/lib/paymongo'
import { updateOrderPayment } from '@/lib/firestore'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('paymongo-signature')

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const event: PayMongoWebhookEvent = JSON.parse(payload)
    const { type, data } = event

    console.log('PayMongo webhook received:', type)

    // Handle different event types
    switch (type) {
      case 'checkout_session.payment.paid': {
        // Payment successful
        const checkoutSession = data.attributes
        const orderId = checkoutSession.metadata?.order_id

        if (orderId) {
          // Get the payment ID from the checkout session
          const paymentId = checkoutSession.payments?.[0]?.id

          await updateOrderPayment(orderId, {
            paymentStatus: 'paid',
            paymentId: paymentId,
            checkoutSessionId: data.id,
          })

          console.log(`Order ${orderId} payment confirmed`)

          // Send notification about successful payment
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
            await fetch(`${baseUrl}/api/webhook/notify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'payment_received',
                data: {
                  orderId,
                  amount: checkoutSession.amount,
                  paymentMethod: checkoutSession.payment_method_types?.join(', '),
                }
              })
            })
          } catch (notifyError) {
            console.error('Failed to send payment notification:', notifyError)
          }
        }
        break
      }

      case 'checkout_session.payment.failed': {
        // Payment failed
        const checkoutSession = data.attributes
        const orderId = checkoutSession.metadata?.order_id

        if (orderId) {
          await updateOrderPayment(orderId, {
            paymentStatus: 'failed',
            checkoutSessionId: data.id,
            paymentError: 'Payment failed',
          })

          console.log(`Order ${orderId} payment failed`)
        }
        break
      }

      case 'payment.paid': {
        // Direct payment paid (for non-checkout session payments)
        console.log('Direct payment received:', data.id)
        break
      }

      case 'payment.failed': {
        // Direct payment failed
        console.log('Direct payment failed:', data.id)
        break
      }

      case 'payment.refunded': {
        // Payment refunded
        const payment = data.attributes
        console.log('Payment refunded:', data.id, payment)
        // Note: Would need to track payment IDs to orders to update here
        break
      }

      default:
        console.log('Unhandled webhook event type:', type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Note: Next.js App Router handles raw body automatically for route handlers
// No config export needed - use request.text() to get raw body
