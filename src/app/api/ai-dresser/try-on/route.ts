import { NextRequest, NextResponse } from 'next/server'

const NANO_API_KEY = process.env.NANOBANANA_API_KEY!
const NANO_ENDPOINT = 'https://api.nanobananaapi.ai/api/v1/nanobanana/generate'

export async function POST(req: NextRequest) {
  try {
    const { productImageUrl, productName, productBrand, productColors, productCategory } = await req.json()

    if (!productImageUrl) {
      return NextResponse.json({ error: 'Product image URL is required' }, { status: 400 })
    }

    if (!NANO_API_KEY) {
      return NextResponse.json({ error: 'NanoBanana API key not configured' }, { status: 500 })
    }

    const colorStr = productColors?.length ? productColors.join(', ') : ''
    const prompt = `High quality fashion photography. A model wearing ${productBrand} ${productName}${colorStr ? ', ' + colorStr : ''}${productCategory ? ', ' + productCategory : ''}. Full body shot, professional studio lighting, clean background, premium fashion brand advertisement, photorealistic, 4K quality.`

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
        imageUrls: [productImageUrl],
        callBackUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://americabrandsbazaar.com',
      }),
    })

    const data = await res.json()

    if (!res.ok || data.code !== 200) {
      return NextResponse.json(
        { error: data.msg || 'NanoBanana submission failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ taskId: data.data.taskId })
  } catch (error: any) {
    console.error('Try-on submit error:', error)
    return NextResponse.json({ error: error.message || 'Failed to start try-on' }, { status: 500 })
  }
}
