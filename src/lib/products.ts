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

export const products: Product[] = []

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

export const brands = [
  // Premium Brands
  'Calvin Klein',
  'Ralph Lauren',
  'Michael Kors',
  'Tommy Hilfiger',
  'Coach',
  'Kate Spade',
  'Guess',
  // Athletic/Sportswear
  'Nike',
  'Adidas',
  'Puma',
  'Under Armour',
  'New Balance',
  'Reebok',
  'Fila',
  // Casual/Fast Fashion
  'GAP',
  'H&M',
  'Zara',
  'Uniqlo',
  'Mango',
  'Forever 21',
  // Denim
  'Levi\'s',
  'Wrangler',
  'Lee',
  // Luxury
  'Lacoste',
  'Fred Perry',
  'Hugo Boss',
  // Classic
  'Penguin',
  // Other
  'Other'
]
export const categories = ['clothes', 'accessories', 'shoes'] as const
