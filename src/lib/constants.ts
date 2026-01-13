export const BRAND = {
  name: 'LGM Apparel',
  tagline: 'Premium Brands',
  established: 2020,
  facebook: 'https://www.facebook.com/profile.php?id=61585906553643',
}

export const COLORS = {
  navy: '#1a2744',
  gold: '#d4af37',
  white: '#ffffff',
  lightGray: '#f5f5f5',
}

export const NAV_LINKS = [
  { name: 'Shop', href: '/shop' },
  { name: 'Clothes', href: '/shop?category=clothes' },
  { name: 'Accessories', href: '/shop?category=accessories' },
  { name: 'Shoes', href: '/shop?category=shoes' },
  { name: 'AI Dresser', href: '/ai-dresser' },
]

export const CATEGORIES = [
  {
    id: 'clothes',
    name: 'Clothes',
    description: 'Premium branded apparel for every occasion',
    image: '/images/category-clothes.jpg',
    href: '/shop?category=clothes',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    description: 'Complete your look with designer accessories',
    image: '/images/category-accessories.jpg',
    href: '/shop?category=accessories',
  },
  {
    id: 'shoes',
    name: 'Shoes',
    description: 'Step out in style with premium footwear',
    image: '/images/category-shoes.jpg',
    href: '/shop?category=shoes',
  },
]

// Sample featured products (will be replaced with database data later)
export const FEATURED_PRODUCTS = []

export const REVIEWS = []

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(price)
}
