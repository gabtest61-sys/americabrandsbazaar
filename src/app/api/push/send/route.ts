import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { getPushSubscriptions } from '@/lib/firestore'

webpush.setVapidDetails(
  'mailto:gabriel@murphyconsulting.us',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, orderId, status } = await request.json()
    if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 })

    const subscriptions = await getPushSubscriptions(userId)
    if (subscriptions.length === 0) return NextResponse.json({ success: true, sent: 0 })

    const payload = JSON.stringify({
      title: title || 'Order Update',
      body: body || 'Your order status has been updated.',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: orderId || 'order-update',
      data: { url: '/account', orderId, status },
    })

    const results = await Promise.allSettled(
      subscriptions.map(sub => webpush.sendNotification(sub as webpush.PushSubscription, payload))
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send push' }, { status: 500 })
  }
}
