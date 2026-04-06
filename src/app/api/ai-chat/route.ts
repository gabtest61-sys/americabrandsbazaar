import { NextRequest, NextResponse } from 'next/server'

interface ProductSummary {
  id: string
  name: string
  brand: string
  category: string
  price: number
  colors?: string[]
  tags?: string[]
  inStock: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { messages, products } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // Build product catalog section for system prompt
    let catalogSection = ''
    if (products && Array.isArray(products) && products.length > 0) {
      const inStock = (products as ProductSummary[]).filter((p) => p.inStock)
      const lines = inStock.map((p) => {
        const colors = p.colors?.length ? ` | Colors: ${p.colors.slice(0, 3).join(', ')}` : ''
        const tags = p.tags?.length ? ` | Tags: ${p.tags.slice(0, 4).join(', ')}` : ''
        return `- [${p.name}] by ${p.brand} | Category: ${p.category} | Price: ₱${p.price.toLocaleString()} | Link: /shop/${p.id}${colors}${tags}`
      })
      catalogSection = `\n\nCURRENT PRODUCT CATALOG (${inStock.length} items in stock):\n${lines.join('\n')}`
    }

    const systemPrompt = `You are ABB Style Assistant, the AI fashion designer for America Brands Bazaar — a premium clothing store in the Philippines.

Your job is to help customers find outfits and specific products from our actual catalog below.

When recommending products:
- Always mention the exact product name and brand
- Always include the product link formatted as /shop/PRODUCT_ID (e.g. /shop/abc123)
- Mention the price in Philippine Peso (₱)
- Group suggestions by category (Top, Bottom, Footwear, Accessories)
- Keep it friendly, concise, and fashion-forward ✨
- Use occasional style emojis

For styling tips, consider Filipino climate (hot & humid), local culture, and occasions.
Never recommend products not in the catalog below.${catalogSection}`

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 700,
        temperature: 0.75,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('DeepSeek error:', err)
      return NextResponse.json({ error: 'AI service error' }, { status: 500 })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('AI chat error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
