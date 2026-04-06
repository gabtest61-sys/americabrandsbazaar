import { NextRequest, NextResponse } from 'next/server'

const NANO_API_KEY = process.env.NANOBANANA_API_KEY!

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=${taskId}`,
      {
        headers: { Authorization: `Bearer ${NANO_API_KEY}` },
      }
    )

    const data = await res.json()

    if (!res.ok || data.code !== 200) {
      return NextResponse.json({ error: 'Failed to fetch task status' }, { status: 500 })
    }

    const flag = data.data?.successFlag

    if (flag === 0) {
      return NextResponse.json({ status: 'pending' })
    }

    if (flag === 1) {
      const imageUrl = data.data?.response?.resultImageUrl
      return NextResponse.json({ status: 'done', imageUrl })
    }

    // flag 2 or 3 = failed
    return NextResponse.json({ status: 'failed', error: 'Image generation failed' })
  } catch (error: any) {
    console.error('Try-on status error:', error)
    return NextResponse.json({ error: error.message || 'Status check failed' }, { status: 500 })
  }
}
