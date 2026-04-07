import { NextRequest, NextResponse } from 'next/server'
import { savePushSubscription, deletePushSubscription } from '@/lib/firestore'

export async function POST(request: NextRequest) {
  try {
    const { userId, subscription } = await request.json()
    if (!userId || !subscription?.endpoint) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }
    await savePushSubscription(userId, subscription)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscribe error:', error)
    return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, endpoint } = await request.json()
    if (!userId || !endpoint) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }
    await deletePushSubscription(userId, endpoint)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete subscription' }, { status: 500 })
  }
}
