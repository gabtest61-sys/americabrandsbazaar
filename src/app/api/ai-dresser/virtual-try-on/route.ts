import { NextRequest, NextResponse } from 'next/server'

// Virtual Try-On API using Gemini
// POST /api/ai-dresser/virtual-try-on
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userPhoto, productImages, lookNumber } = body

    if (!userPhoto) {
      return NextResponse.json({
        success: false,
        error: 'User photo is required'
      }, { status: 400 })
    }

    // Check if Gemini API key is configured
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY not configured, returning placeholder')
      return NextResponse.json({
        success: false,
        message: 'Virtual try-on feature coming soon',
        tryOnImage: null
      })
    }

    // Call Gemini API for virtual try-on generation
    // Using Gemini 2.0 Flash with image generation capability
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are a virtual fashion stylist AI. Given the user's full body photo and the clothing/accessory items, create a realistic visualization of how these items would look on the person.

Maintain the person's body shape, pose, and facial features while realistically placing the clothing items on them. The result should look natural and fashionable.

Product items to visualize on the person:
${productImages.map((p: { name: string, category: string }, i: number) => `${i + 1}. ${p.name} (${p.category})`).join('\n')}

Generate a realistic try-on image.`
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: userPhoto.replace(/^data:image\/\w+;base64,/, '')
                }
              },
              ...productImages.slice(0, 4).map((p: { imageUrl: string }) => ({
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: p.imageUrl?.replace(/^data:image\/\w+;base64,/, '') || ''
                }
              })).filter((p: { inlineData: { data: string } }) => p.inlineData.data)
            ]
          }],
          generationConfig: {
            responseModalities: ['image', 'text'],
            responseMimeType: 'image/jpeg'
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)

      return NextResponse.json({
        success: false,
        message: 'Virtual try-on generation failed',
        tryOnImage: null
      })
    }

    const data = await response.json()

    // Extract the generated image from response
    const generatedImage = data.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { data: string, mimeType: string } }) => part.inlineData?.mimeType?.startsWith('image/')
    )

    if (generatedImage?.inlineData?.data) {
      return NextResponse.json({
        success: true,
        lookNumber,
        tryOnImage: `data:${generatedImage.inlineData.mimeType};base64,${generatedImage.inlineData.data}`
      })
    }

    // If no image generated, return placeholder status
    return NextResponse.json({
      success: false,
      message: 'Could not generate try-on image',
      tryOnImage: null
    })

  } catch (error) {
    console.error('Virtual try-on error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate virtual try-on'
    }, { status: 500 })
  }
}
