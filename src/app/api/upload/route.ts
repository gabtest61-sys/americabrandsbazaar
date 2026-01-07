import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, folder = 'products' } = body

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(image, folder)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'No URL provided' },
        { status: 400 }
      )
    }

    const publicId = getPublicIdFromUrl(url)

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'Invalid Cloudinary URL' },
        { status: 400 }
      )
    }

    const success = await deleteFromCloudinary(publicId)

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
