export const BRAND = {
  name: 'LGM Apparel',
  tagline: 'Premium Brands',
  established: 2020,
  facebook: 'https://www.facebook.com/profile.php?id=61585906553643',
  logo: '/logo.jpg',
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

export const REVIEWS = [
  {
    id: '1',
    name: 'Maria Santos',
    rating: 5,
    comment: 'Amazing quality! The Calvin Klein shirt I bought looks exactly like the photos. Fast delivery too!',
    date: '2024-12-15',
  },
  {
    id: '2',
    name: 'Juan Dela Cruz',
    rating: 5,
    comment: 'Best place to buy authentic branded items. The AI Dresser feature helped me pick the perfect outfit!',
    date: '2024-12-10',
  },
  {
    id: '3',
    name: 'Anna Reyes',
    rating: 5,
    comment: 'Super satisfied with my Nike sneakers! Original and at a great price. Will definitely buy again.',
    date: '2024-12-05',
  },
  {
    id: '4',
    name: 'Mike Tan',
    rating: 4,
    comment: 'Great selection of premium brands. Customer service was very helpful and responsive.',
    date: '2024-11-28',
  },
]

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(price)
}
