import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are ABB Style Assistant, the AI fashion designer for America Brands Bazaar — a premium clothing store in the Philippines.
You help customers with:
- Outfit ideas and style advice
- Brand recommendations (we carry Nike, Calvin Klein, GAP, Ralph Lauren, Michael Kors, and more)
- Size and fit guidance
- Occasion-based outfit suggestions (casual, formal, date night, office, etc.)
- Product category suggestions (clothes, shoes, accessories, fragrance)
- Styling tips for Filipino climate and culture

Keep replies concise, friendly, and fashion-forward. Use occasional style-relevant emojis.
If asked to shop specific items, suggest they use the /shop page or the AI Dresser feature.
Never make up specific product stock or prices — direct them to browse the shop.`,
          },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.8,
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
