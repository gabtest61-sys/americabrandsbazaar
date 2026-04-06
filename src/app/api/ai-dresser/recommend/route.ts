import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!

interface ProductInput {
  id: string
  name: string
  brand: string
  category: string
  subcategory?: string
  colors: string[]
  price: number
  tags: string[]
  gender?: string
  inStock: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { gender, style, occasion, products } = await req.json()

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 })
    }

    const productList = (products as ProductInput[])
      .filter((p) => p.inStock)
      .map(
        (p) =>
          `ID:${p.id} | ${p.brand} - ${p.name} | ${p.category}${p.subcategory ? '/' + p.subcategory : ''} | Colors: ${p.colors.join(', ')} | $${p.price} | Tags: ${p.tags.slice(0, 6).join(', ')}${p.gender ? ' | ' + p.gender : ''}`
      )
      .join('\n')

    const prompt = `You are a professional fashion stylist for America Brands Bazaar, a premium clothing store.

A customer wants outfit recommendations with these preferences:
- Shopping for: ${gender}
- Style vibe: ${style}
- Occasion: ${occasion}

From the product catalog below, select exactly 8 products that would create the best, most cohesive wardrobe for this customer. Try to include a mix of categories (tops, bottoms, shoes, accessories) when available.

Product Catalog:
${productList}

Respond ONLY with valid JSON in this exact format, no markdown or extra text:
{
  "recommendedProductIds": ["id1", "id2", "id3", "id4", "id5", "id6", "id7", "id8"],
  "styleNote": "One sentence explaining why these picks suit this style profile"
}`

    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`DeepSeek error: ${err}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) throw new Error('Empty response from AI')

    const parsed = JSON.parse(content)

    return NextResponse.json({
      recommendedProductIds: parsed.recommendedProductIds,
      styleNote: parsed.styleNote,
    })
  } catch (error: any) {
    console.error('AI recommend error:', error)
    return NextResponse.json({ error: error.message || 'AI recommendation failed' }, { status: 500 })
  }
}
