import { NextRequest, NextResponse } from 'next/server'

// Mock product data - In production, this would come from the database via n8n webhook
const mockProducts = {
  clothes: [
    { product_id: '1', product_name: 'Calvin Klein Oversized Tee', category: 'clothes', price: 1899, image_url: '/products/ck-tee.jpg', product_url: '/shop/ck-tee', color: 'black', style: 'casual', gender: 'unisex' },
    { product_id: '2', product_name: 'Ralph Lauren Polo', category: 'clothes', price: 3299, image_url: '/products/rl-polo.jpg', product_url: '/shop/rl-polo', color: 'navy', style: 'smart-casual', gender: 'male' },
    { product_id: '3', product_name: 'GAP Slim Chinos', category: 'clothes', price: 2499, image_url: '/products/gap-chinos.jpg', product_url: '/shop/gap-chinos', color: 'khaki', style: 'smart-casual', gender: 'male' },
    { product_id: '4', product_name: 'Nike Tech Hoodie', category: 'clothes', price: 4299, image_url: '/products/nike-hoodie.jpg', product_url: '/shop/nike-hoodie', color: 'gray', style: 'athleisure', gender: 'unisex' },
    { product_id: '5', product_name: 'CK Slim Fit Shirt', category: 'clothes', price: 2899, image_url: '/products/ck-shirt.jpg', product_url: '/shop/ck-shirt', color: 'white', style: 'formal', gender: 'male' },
    { product_id: '6', product_name: 'Ralph Lauren Blazer', category: 'clothes', price: 8999, image_url: '/products/rl-blazer.jpg', product_url: '/shop/rl-blazer', color: 'navy', style: 'formal', gender: 'male' },
    { product_id: '7', product_name: 'GAP Joggers', category: 'clothes', price: 1999, image_url: '/products/gap-joggers.jpg', product_url: '/shop/gap-joggers', color: 'black', style: 'athleisure', gender: 'unisex' },
    { product_id: '8', product_name: 'CK Basic Tee (White)', category: 'clothes', price: 1299, image_url: '/products/ck-white-tee.jpg', product_url: '/shop/ck-white-tee', color: 'white', style: 'minimalist', gender: 'unisex' },
    { product_id: '9', product_name: 'GAP Black Jeans', category: 'clothes', price: 2799, image_url: '/products/gap-jeans.jpg', product_url: '/shop/gap-jeans', color: 'black', style: 'casual', gender: 'unisex' },
  ],
  accessories: [
    { product_id: '10', product_name: 'Michael Kors Crossbody', category: 'accessories', price: 4500, image_url: '/products/mk-bag.jpg', product_url: '/shop/mk-bag', color: 'brown', style: 'casual', gender: 'female' },
    { product_id: '11', product_name: 'CK Leather Belt', category: 'accessories', price: 1899, image_url: '/products/ck-belt.jpg', product_url: '/shop/ck-belt', color: 'black', style: 'formal', gender: 'male' },
    { product_id: '12', product_name: 'MK Leather Watch', category: 'accessories', price: 7500, image_url: '/products/mk-watch.jpg', product_url: '/shop/mk-watch', color: 'gold', style: 'formal', gender: 'unisex' },
    { product_id: '13', product_name: 'CK Minimalist Watch', category: 'accessories', price: 5999, image_url: '/products/ck-watch.jpg', product_url: '/shop/ck-watch', color: 'silver', style: 'minimalist', gender: 'unisex' },
    { product_id: '14', product_name: 'Ralph Lauren Cap', category: 'accessories', price: 1499, image_url: '/products/rl-cap.jpg', product_url: '/shop/rl-cap', color: 'navy', style: 'casual', gender: 'unisex' },
  ],
  shoes: [
    { product_id: '15', product_name: 'Nike Air Max 90', category: 'shoes', price: 6995, image_url: '/products/nike-airmax.jpg', product_url: '/shop/nike-airmax', color: 'white', style: 'casual', gender: 'unisex' },
    { product_id: '16', product_name: 'Nike Dunk Low', category: 'shoes', price: 5495, image_url: '/products/nike-dunk.jpg', product_url: '/shop/nike-dunk', color: 'black', style: 'casual', gender: 'unisex' },
    { product_id: '17', product_name: 'Nike White Sneakers', category: 'shoes', price: 4995, image_url: '/products/nike-white.jpg', product_url: '/shop/nike-white', color: 'white', style: 'minimalist', gender: 'unisex' },
    { product_id: '18', product_name: 'CK Leather Loafers', category: 'shoes', price: 5999, image_url: '/products/ck-loafers.jpg', product_url: '/shop/ck-loafers', color: 'brown', style: 'formal', gender: 'male' },
  ]
}

// SOP 6.4 & 6.5: Get AI Recommendations
// POST /api/ai-dresser/get-recommendations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, user_id, collected_data } = body

    const { purpose, gender, style, occasion, budget, color } = collected_data || {}

    // In production, this would:
    // 1. Call n8n webhook at /webhook/ai-dresser/get-recommendations
    // 2. n8n would query the database and use AI to generate looks
    // 3. Return the AI-generated recommendations

    // For now, generate mock recommendations based on preferences
    const looks = generateMockLooks(style, gender, parseInt(budget) || 10000)

    return NextResponse.json({
      success: true,
      session_id,
      user_id,
      stylist_message: `Here are 5 amazing ${style?.replace('-', ' ')} looks curated just for you!`,
      looks,
      stats: {
        total_looks: looks.length,
        total_items: looks.reduce((sum, look) => sum + look.items.length, 0),
        average_look_price: Math.round(looks.reduce((sum, look) => sum + look.total_price, 0) / looks.length),
        products_analyzed: Object.values(mockProducts).flat().length
      },
      based_on: collected_data,
      actions: {
        add_all_to_cart: {
          endpoint: '/api/cart/add-look',
          method: 'POST'
        },
        add_single_item: {
          endpoint: '/api/cart/add',
          method: 'POST'
        },
        save_to_wishlist: {
          endpoint: '/api/wishlist/save-look',
          method: 'POST'
        }
      }
    })
  } catch (error) {
    console.error('AI Dresser recommendations error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate recommendations'
    }, { status: 500 })
  }
}

function generateMockLooks(style: string, gender: string, budget: number) {
  // Simple mock look generation
  const looks = [
    {
      look_number: 1,
      look_name: 'Casual Street Style',
      look_description: 'Perfect for everyday adventures with a touch of urban edge',
      items: [
        { ...mockProducts.clothes[0], styling_note: 'Tuck the front for a relaxed look' },
        { ...mockProducts.shoes[0], styling_note: 'Classic silhouette that goes with everything' },
        { ...mockProducts.accessories[0], styling_note: 'Adds sophistication to casual fits' },
      ],
      total_price: mockProducts.clothes[0].price + mockProducts.shoes[0].price + mockProducts.accessories[0].price,
      style_tip: 'Roll up your sleeves slightly for extra style points'
    },
    {
      look_number: 2,
      look_name: 'Smart Casual Elegance',
      look_description: 'Effortlessly polished for work-to-dinner transitions',
      items: [
        { ...mockProducts.clothes[1], styling_note: 'Pop the collar for a preppy vibe' },
        { ...mockProducts.clothes[2], styling_note: 'Cuff at the ankle for a modern touch' },
        { ...mockProducts.accessories[1], styling_note: 'Match with your shoe color' },
      ],
      total_price: mockProducts.clothes[1].price + mockProducts.clothes[2].price + mockProducts.accessories[1].price,
      style_tip: 'Add a watch to complete the sophisticated look'
    },
    {
      look_number: 3,
      look_name: 'Weekend Wanderer',
      look_description: 'Comfortable yet stylish for your off-duty days',
      items: [
        { ...mockProducts.clothes[3], styling_note: 'Layer over a plain tee' },
        { ...mockProducts.clothes[6], styling_note: 'Tapered fit for a clean silhouette' },
        { ...mockProducts.shoes[1], styling_note: 'Iconic sneaker for any outfit' },
      ],
      total_price: mockProducts.clothes[3].price + mockProducts.clothes[6].price + mockProducts.shoes[1].price,
      style_tip: 'Keep accessories minimal for this athleisure look'
    },
    {
      look_number: 4,
      look_name: 'Date Night Ready',
      look_description: 'Make an impression with this refined ensemble',
      items: [
        { ...mockProducts.clothes[4], styling_note: 'Leave top button undone' },
        { ...mockProducts.clothes[5], styling_note: 'Push sleeves up for a relaxed feel' },
        { ...mockProducts.accessories[2], styling_note: 'Classic timepiece that elevates any look' },
      ],
      total_price: mockProducts.clothes[4].price + mockProducts.clothes[5].price + mockProducts.accessories[2].price,
      style_tip: 'A subtle cologne completes this ensemble'
    },
    {
      look_number: 5,
      look_name: 'Minimalist Modern',
      look_description: 'Less is more with this clean, contemporary style',
      items: [
        { ...mockProducts.clothes[7], styling_note: 'Perfect fit is key' },
        { ...mockProducts.clothes[8], styling_note: 'Slim fit for a sleek look' },
        { ...mockProducts.shoes[2], styling_note: 'Keep them clean!' },
        { ...mockProducts.accessories[3], styling_note: 'Simple elegance' },
      ],
      total_price: mockProducts.clothes[7].price + mockProducts.clothes[8].price + mockProducts.shoes[2].price + mockProducts.accessories[3].price,
      style_tip: 'Stick to a monochrome palette for maximum impact'
    },
  ]

  return looks
}
