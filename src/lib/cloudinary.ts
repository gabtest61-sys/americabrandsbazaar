import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  success: boolean
  url?: string
  publicId?: string
  error?: string
}

/**
 * Upload an image to Cloudinary
 * @param base64Image - Base64 encoded image string
 * @param folder - Folder to store the image in (default: 'products')
 * @returns Upload result with URL or error
 */
export const uploadToCloudinary = async (
  base64Image: string,
  folder: string = 'products'
): Promise<UploadResult> => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `lgm-apparel/${folder}`,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }, // Auto optimize
        { width: 1200, height: 1200, crop: 'limit' }, // Max size
      ],
    })

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    }
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Boolean indicating success
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    await cloudinary.uploader.destroy(publicId)
    return true
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return false
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
    const match = url.match(/\/v\d+\/(.+)\.[a-z]+$/i)
    return match ? match[1] : null
  } catch {
    return null
  }
}

export default cloudinary
