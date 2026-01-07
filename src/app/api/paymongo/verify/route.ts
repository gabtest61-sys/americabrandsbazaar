import { NextRequest, NextResponse } from 'next/server'
import { getCheckoutSession } from '@/lib/paymongo'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const session = await getCheckoutSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const status = session.attributes?.status
    const paymentStatus = session.attributes?.payment_intent?.attributes?.status

    // Map PayMongo status to our status
    let finalStatus: 'paid' | 'pending' | 'failed' = 'pending'
    if (status === 'paid' || paymentStatus === 'succeeded') {
      finalStatus = 'paid'
    } else if (status === 'expired' || paymentStatus === 'failed') {
      finalStatus = 'failed'
    }

    return NextResponse.json({
      success: true,
      status: finalStatus,
      orderId: session.attributes?.metadata?.order_id,
      amount: session.attributes?.amount,
    })
  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    )
  }
}
