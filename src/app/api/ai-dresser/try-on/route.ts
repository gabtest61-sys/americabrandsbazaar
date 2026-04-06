import { NextRequest, NextResponse } from 'next/server'

const NANO_API_KEY = process.env.NANOBANANA_API_KEY!
const NANO_ENDPOINT = 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate'

export async function POST(req: NextRequest) {
  try {
    const { personImageUrl, productImageUrl, productName, productBrand, productColors } = await req.json()

    if (!productImageUrl) {
      return NextResponse.json({ error: 'Product image URL is required' }, { status: 400 })
    }

    if (!NANO_API_KEY) {
      return NextResponse.json({ error: 'NanoBanana API key not configured' }, { status: 500 })
    }

    const colorStr = productColors?.length ? productColors.join(', ') : ''
    const prompt = `Virtual try-on: dress the person in the photo with the ${productBrand} ${productName}${colorStr ? ' in ' + colorStr : ''}. Keep the person's face, body, and pose exactly as in the original photo. Only change the clothing to the product. Photorealistic, high quality, 4K.`

    // imageUrls: person photo first (subject), product image second (garment)
    const imageUrls = personImageUrl
      ? [personImageUrl, productImageUrl]
      : [productImageUrl]

    const res = await fetch(NANO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NANO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        type: 'IMAGETOIAMGE',
        numImages: 1,
        image_size: '3:4',
        imageUrls,
        callBackUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://americabrandsbazaar.com',
      }),
    })

    const data = await res.json()
    console.log('[NanoBanana] Response:', JSON.stringify(data))

    if (!res.ok || data.code !== 200) {
      return NextResponse.json(
        { error: data.msg || `NanoBanana error: ${JSON.stringify(data)}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ taskId: data.data.taskId })
  } catch (error: any) {
    console.error('Try-on submit error:', error)
    return NextResponse.json({ error: error.message || 'Failed to start try-on' }, { status: 500 })
  }
}
