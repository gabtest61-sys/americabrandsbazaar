// Product Database for LGM Apparel
// In production, this would come from a database/CMS

export interface Product {
  id: string
  name: string
  brand: string
  category: 'clothes' | 'accessories' | 'shoes'
  subcategory: string
  price: number
  originalPrice?: number
  description: string
  images: string[]
  colors: string[]
  sizes: string[]
  gender: 'male' | 'female' | 'unisex'
  tags: string[]
  inStock: boolean
  stockQty: number
  featured: boolean
  giftSuitable: boolean
  occasions: string[]
  style: string[]
  createdAt: string
}

export const products: Product[] = [
  // CLOTHES - Calvin Klein
  {
    id: 'ck-001',
    name: 'Classic Logo T-Shirt',
    brand: 'Calvin Klein',
    category: 'clothes',
    subcategory: 't-shirts',
    price: 1899,
    originalPrice: 2499,
    description: 'Iconic Calvin Klein logo tee in premium cotton. Perfect for everyday casual wear.',
    images: ['/products/ck-tee-black.jpg'],
    colors: ['Black', 'White', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    gender: 'unisex',
    tags: ['casual', 'logo', 'cotton'],
    inStock: true,
    stockQty: 50,
    featured: true,
    giftSuitable: true,
    occasions: ['daily-wear', 'casual'],
    style: ['casual-street', 'minimalist'],
    createdAt: '2024-01-15'
  },
  {
    id: 'ck-002',
    name: 'Slim Fit Dress Shirt',
    brand: 'Calvin Klein',
    category: 'clothes',
    subcategory: 'shirts',
    price: 2899,
    originalPrice: 3499,
    description: 'Elegant slim fit dress shirt. Perfect for office and formal occasions.',
    images: ['/products/ck-shirt-white.jpg'],
    colors: ['White', 'Light Blue', 'Pink'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    gender: 'male',
    tags: ['formal', 'office', 'slim-fit'],
    inStock: true,
    stockQty: 35,
    featured: true,
    giftSuitable: true,
    occasions: ['work-office', 'date-night', 'wedding-event'],
    style: ['formal-elegant', 'smart-casual'],
    createdAt: '2024-01-10'
  },
  {
    id: 'ck-003',
    name: 'Performance Boxer Briefs (3-Pack)',
    brand: 'Calvin Klein',
    category: 'clothes',
    subcategory: 'underwear',
    price: 1599,
    description: 'Premium comfort boxer briefs. Signature CK waistband.',
    images: ['/products/ck-boxers.jpg'],
    colors: ['Black/Grey/White'],
    sizes: ['S', 'M', 'L', 'XL'],
    gender: 'male',
    tags: ['underwear', 'comfort', 'essentials'],
    inStock: true,
    stockQty: 100,
    featured: false,
    giftSuitable: true,
    occasions: ['daily-wear'],
    style: ['minimalist'],
    createdAt: '2024-01-05'
  },

  // CLOTHES - Nike
  {
    id: 'nike-001',
    name: 'Tech Fleece Hoodie',
    brand: 'Nike',
    category: 'clothes',
    subcategory: 'hoodies',
    price: 4299,
    originalPrice: 5499,
    description: 'Lightweight warmth in Nike Tech Fleece. Modern slim fit with premium comfort.',
    images: ['/products/nike-hoodie-grey.jpg'],
    colors: ['Grey', 'Black', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    gender: 'unisex',
    tags: ['athleisure', 'hoodie', 'tech-fleece'],
    inStock: true,
    stockQty: 40,
    featured: true,
    giftSuitable: true,
    occasions: ['daily-wear', 'vacation', 'casual'],
    style: ['athleisure', 'casual-street'],
    createdAt: '2024-01-20'
  },
  {
    id: 'nike-002',
    name: 'Dri-FIT Training Joggers',
    brand: 'Nike',
    category: 'clothes',
    subcategory: 'pants',
    price: 2499,
    description: 'Sweat-wicking joggers for training and everyday comfort.',
    images: ['/products/nike-joggers.jpg'],
    colors: ['Black', 'Grey'],
    sizes: ['S', 'M', 'L', 'XL'],
    gender: 'unisex',
    tags: ['training', 'joggers', 'dri-fit'],
    inStock: true,
    stockQty: 60,
    featured: false,
    giftSuitable: true,
    occasions: ['daily-wear', 'gym'],
    style: ['athleisure'],
    createdAt: '2024-01-18'
  },
  {
    id: 'nike-003',
    name: 'Sportswear Club T-Shirt',
    brand: 'Nike',
    category: 'clothes',
    subcategory: 't-shirts',
    price: 1299,
    description: 'Classic Nike swoosh tee. Soft cotton for all-day comfort.',
    images: ['/products/nike-tee.jpg'],
    colors: ['White', 'Black', 'Red', 'Blue'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    gender: 'unisex',
    tags: ['casual', 'swoosh', 'cotton'],
    inStock: true,
    stockQty: 80,
    featured: false,
    giftSuitable: true,
    occasions: ['daily-wear', 'casual', 'gym'],
    style: ['casual-street', 'athleisure'],
    createdAt: '2024-01-12'
  },

  // CLOTHES - GAP
  {
    id: 'gap-001',
    name: 'Slim Fit Chinos',
    brand: 'GAP',
    category: 'clothes',
    subcategory: 'pants',
    price: 2499,
    originalPrice: 2999,
    description: 'Versatile slim fit chinos. Perfect for smart casual looks.',
    images: ['/products/gap-chinos.jpg'],
    colors: ['Khaki', 'Navy', 'Black', 'Olive'],
    sizes: ['28', '30', '32', '34', '36'],
    gender: 'male',
    tags: ['chinos', 'smart-casual', 'versatile'],
    inStock: true,
    stockQty: 45,
    featured: true,
    giftSuitable: true,
    occasions: ['work-office', 'date-night', 'daily-wear'],
    style: ['smart-casual', 'minimalist'],
    createdAt: '2024-01-08'
  },
  {
    id: 'gap-002',
    name: 'Vintage Soft Hoodie',
    brand: 'GAP',
    category: 'clothes',
    subcategory: 'hoodies',
    price: 1999,
    description: 'Super soft hoodie with vintage GAP logo. Ultimate comfort.',
    images: ['/products/gap-hoodie.jpg'],
    colors: ['Navy', 'Grey', 'Burgundy'],
    sizes: ['S', 'M', 'L', 'XL'],
    gender: 'unisex',
    tags: ['hoodie', 'vintage', 'soft'],
    inStock: true,
    stockQty: 55,
    featured: false,
    giftSuitable: true,
    occasions: ['daily-wear', 'casual', 'vacation'],
    style: ['casual-street'],
    createdAt: '2024-01-14'
  },
  {
    id: 'gap-003',
    name: 'Straight Fit Jeans',
    brand: 'GAP',
    category: 'clothes',
    subcategory: 'jeans',
    price: 2799,
    description: 'Classic straight fit jeans in premium denim.',
    images: ['/products/gap-jeans.jpg'],
    colors: ['Dark Indigo', 'Medium Wash', 'Black'],
    sizes: ['28', '30', '32', '34', '36'],
    gender: 'male',
    tags: ['jeans', 'denim', 'classic'],
    inStock: true,
    stockQty: 40,
    featured: true,
    giftSuitable: true,
    occasions: ['daily-wear', 'casual', 'date-night'],
    style: ['casual-street', 'minimalist'],
    createdAt: '2024-01-06'
  },

  // CLOTHES - Ralph Lauren
  {
    id: 'rl-001',
    name: 'Classic Fit Polo Shirt',
    brand: 'Ralph Lauren',
    category: 'clothes',
    subcategory: 'polos',
    price: 3299,
    originalPrice: 3999,
    description: 'Iconic Ralph Lauren polo with signature pony logo. Timeless style.',
    images: ['/products/rl-polo.jpg'],
    colors: ['Navy', 'White', 'Red', 'Green'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    gender: 'male',
    tags: ['polo', 'classic', 'preppy'],
    inStock: true,
    stockQty: 35,
    featured: true,
    giftSuitable: true,
    occasions: ['work-office', 'daily-wear', 'date-night'],
    style: ['smart-casual', 'formal-elegant'],
    createdAt: '2024-01-22'
  },
  {
    id: 'rl-002',
    name: 'Wool Blend Blazer',
    brand: 'Ralph Lauren',
    category: 'clothes',
    subcategory: 'blazers',
    price: 8999,
    originalPrice: 10999,
    description: 'Premium wool blend blazer. Perfect for formal occasions.',
    images: ['/products/rl-blazer.jpg'],
    colors: ['Navy', 'Charcoal'],
    sizes: ['S', 'M', 'L', 'XL'],
    gender: 'male',
    tags: ['blazer', 'formal', 'wool'],
    inStock: true,
    stockQty: 15,
    featured: true,
    giftSuitable: true,
    occasions: ['wedding-event', 'work-office', 'date-night'],
    style: ['formal-elegant'],
    createdAt: '2024-01-25'
  },
  {
    id: 'rl-003',
    name: 'Cable Knit Sweater',
    brand: 'Ralph Lauren',
    category: 'clothes',
    subcategory: 'sweaters',
    price: 4599,
    description: 'Classic cable knit sweater in soft cotton blend.',
    images: ['/products/rl-sweater.jpg'],
    colors: ['Cream', 'Navy', 'Grey'],
    sizes: ['S', 'M', 'L', 'XL'],
    gender: 'unisex',
    tags: ['sweater', 'cable-knit', 'classic'],
    inStock: true,
    stockQty: 25,
    featured: false,
    giftSuitable: true,
    occasions: ['daily-wear', 'date-night', 'vacation'],
    style: ['smart-casual', 'formal-elegant'],
    createdAt: '2024-01-16'
  },

  // ACCESSORIES - Michael Kors
  {
    id: 'mk-001',
    name: 'Lexington Chronograph Watch',
    brand: 'Michael Kors',
    category: 'accessories',
    subcategory: 'watches',
    price: 7500,
    originalPrice: 8999,
    description: 'Stunning chronograph watch with gold-tone finish. Statement piece.',
    images: ['/products/mk-watch-gold.jpg'],
    colors: ['Gold', 'Silver', 'Rose Gold'],
    sizes: ['One Size'],
    gender: 'unisex',
    tags: ['watch', 'chronograph', 'luxury'],
    inStock: true,
    stockQty: 20,
    featured: true,
    giftSuitable: true,
    occasions: ['date-night', 'wedding-event', 'work-office'],
    style: ['formal-elegant', 'smart-casual'],
    createdAt: '2024-01-28'
  },
  {
    id: 'mk-002',
    name: 'Jet Set Crossbody Bag',
    brand: 'Michael Kors',
    category: 'accessories',
    subcategory: 'bags',
    price: 4500,
    originalPrice: 5499,
    description: 'Chic crossbody bag in signature MK print. Perfect everyday accessory.',
    images: ['/products/mk-bag.jpg'],
    colors: ['Brown/Tan', 'Black', 'Navy'],
    sizes: ['One Size'],
    gender: 'female',
    tags: ['bag', 'crossbody', 'signature'],
    inStock: true,
    stockQty: 30,
    featured: true,
    giftSuitable: true,
    occasions: ['daily-wear', 'work-office', 'date-night'],
    style: ['smart-casual', 'formal-elegant'],
    createdAt: '2024-01-26'
  },
  {
    id: 'mk-003',
    name: 'Leather Card Holder',
    brand: 'Michael Kors',
    category: 'accessories',
    subcategory: 'wallets',
    price: 1899,
    description: 'Slim leather card holder. Compact and stylish.',
    images: ['/products/mk-cardholder.jpg'],
    colors: ['Black', 'Brown', 'Navy'],
    sizes: ['One Size'],
    gender: 'unisex',
    tags: ['wallet', 'card-holder', 'leather'],
    inStock: true,
    stockQty: 50,
    featured: false,
    giftSuitable: true,
    occasions: ['daily-wear'],
    style: ['minimalist', 'smart-casual'],
    createdAt: '2024-01-20'
  },

  // ACCESSORIES - Calvin Klein
  {
    id: 'ck-acc-001',
    name: 'Reversible Leather Belt',
    brand: 'Calvin Klein',
    category: 'accessories',
    subcategory: 'belts',
    price: 1899,
    originalPrice: 2299,
    description: 'Reversible leather belt with signature CK buckle. Two looks in one.',
    images: ['/products/ck-belt.jpg'],
    colors: ['Black/Brown'],
    sizes: ['32', '34', '36', '38', '40'],
    gender: 'male',
    tags: ['belt', 'leather', 'reversible'],
    inStock: true,
    stockQty: 45,
    featured: true,
    giftSuitable: true,
    occasions: ['work-office', 'daily-wear', 'date-night'],
    style: ['smart-casual', 'formal-elegant'],
    createdAt: '2024-01-18'
  },
  {
    id: 'ck-acc-002',
    name: 'Minimal Watch',
    brand: 'Calvin Klein',
    category: 'accessories',
    subcategory: 'watches',
    price: 5999,
    description: 'Sleek minimalist watch with mesh strap. Swiss movement.',
    images: ['/products/ck-watch.jpg'],
    colors: ['Silver', 'Gold', 'Black'],
    sizes: ['One Size'],
    gender: 'unisex',
    tags: ['watch', 'minimal', 'swiss'],
    inStock: true,
    stockQty: 25,
    featured: true,
    giftSuitable: true,
    occasions: ['daily-wear', 'work-office', 'date-night'],
    style: ['minimalist', 'smart-casual'],
    createdAt: '2024-01-24'
  },

  // SHOES - Nike
  {
    id: 'nike-shoe-001',
    name: 'Air Max 90',
    brand: 'Nike',
    category: 'shoes',
    subcategory: 'sneakers',
    price: 6995,
    originalPrice: 7995,
    description: 'Iconic Air Max 90 with visible Air unit. Legendary comfort and style.',
    images: ['/products/nike-airmax90.jpg'],
    colors: ['White', 'Black', 'Grey'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    gender: 'unisex',
    tags: ['sneakers', 'air-max', 'iconic'],
    inStock: true,
    stockQty: 30,
    featured: true,
    giftSuitable: true,
    occasions: ['daily-wear', 'casual'],
    style: ['casual-street', 'athleisure'],
    createdAt: '2024-01-30'
  },
  {
    id: 'nike-shoe-002',
    name: 'Dunk Low Retro',
    brand: 'Nike',
    category: 'shoes',
    subcategory: 'sneakers',
    price: 5495,
    description: 'Classic Dunk Low in retro colorway. Street style essential.',
    images: ['/products/nike-dunk.jpg'],
    colors: ['Panda (Black/White)', 'Grey Fog', 'University Red'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    gender: 'unisex',
    tags: ['sneakers', 'dunk', 'retro'],
    inStock: true,
    stockQty: 25,
    featured: true,
    giftSuitable: true,
    occasions: ['daily-wear', 'casual', 'party'],
    style: ['casual-street', 'trendy'],
    createdAt: '2024-01-29'
  },
  {
    id: 'nike-shoe-003',
    name: 'Court Vision Low',
    brand: 'Nike',
    category: 'shoes',
    subcategory: 'sneakers',
    price: 3995,
    description: 'Clean court-inspired sneaker. Versatile everyday style.',
    images: ['/products/nike-court.jpg'],
    colors: ['White', 'White/Black'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    gender: 'unisex',
    tags: ['sneakers', 'court', 'clean'],
    inStock: true,
    stockQty: 40,
    featured: false,
    giftSuitable: true,
    occasions: ['daily-wear', 'casual', 'work-office'],
    style: ['minimalist', 'smart-casual'],
    createdAt: '2024-01-22'
  },

  // SHOES - Ralph Lauren
  {
    id: 'rl-shoe-001',
    name: 'Leather Penny Loafers',
    brand: 'Ralph Lauren',
    category: 'shoes',
    subcategory: 'loafers',
    price: 6999,
    description: 'Classic penny loafers in premium leather. Timeless sophistication.',
    images: ['/products/rl-loafers.jpg'],
    colors: ['Brown', 'Black', 'Burgundy'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    gender: 'male',
    tags: ['loafers', 'leather', 'classic'],
    inStock: true,
    stockQty: 20,
    featured: true,
    giftSuitable: true,
    occasions: ['work-office', 'date-night', 'wedding-event'],
    style: ['formal-elegant', 'smart-casual'],
    createdAt: '2024-01-27'
  },
  {
    id: 'rl-shoe-002',
    name: 'Canvas Sneakers',
    brand: 'Ralph Lauren',
    category: 'shoes',
    subcategory: 'sneakers',
    price: 2999,
    description: 'Casual canvas sneakers with signature pony logo.',
    images: ['/products/rl-canvas.jpg'],
    colors: ['White', 'Navy', 'Grey'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    gender: 'unisex',
    tags: ['sneakers', 'canvas', 'casual'],
    inStock: true,
    stockQty: 35,
    featured: false,
    giftSuitable: true,
    occasions: ['daily-wear', 'casual', 'vacation'],
    style: ['smart-casual', 'casual-street'],
    createdAt: '2024-01-19'
  },
]

// Helper functions
export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id)
}

export function getProductsByCategory(category: Product['category']): Product[] {
  return products.filter(p => p.category === category)
}

export function getProductsByBrand(brand: string): Product[] {
  return products.filter(p => p.brand === brand)
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured)
}

export function getGiftSuitableProducts(): Product[] {
  return products.filter(p => p.giftSuitable)
}

export function searchProducts(query: string): Product[] {
  const lowerQuery = query.toLowerCase()
  return products.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.brand.toLowerCase().includes(lowerQuery) ||
    p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
    p.description.toLowerCase().includes(lowerQuery)
  )
}

export function filterProducts(filters: {
  category?: string
  brand?: string
  gender?: string
  minPrice?: number
  maxPrice?: number
  style?: string
  occasion?: string
}): Product[] {
  return products.filter(p => {
    if (filters.category && p.category !== filters.category) return false
    if (filters.brand && p.brand !== filters.brand) return false
    if (filters.gender && p.gender !== filters.gender && p.gender !== 'unisex') return false
    if (filters.minPrice && p.price < filters.minPrice) return false
    if (filters.maxPrice && p.price > filters.maxPrice) return false
    if (filters.style && !p.style.includes(filters.style)) return false
    if (filters.occasion && !p.occasions.includes(filters.occasion)) return false
    return true
  })
}

export const brands = ['Calvin Klein', 'Nike', 'GAP', 'Ralph Lauren', 'Michael Kors']
export const categories = ['clothes', 'accessories', 'shoes'] as const
