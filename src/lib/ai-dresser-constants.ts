// AI Dresser Constants
// Quiz options, mappings, and scoring weights

export const styleOptions = [
  { id: 'casual-street', label: 'Casual Street', icon: '🛹', description: 'Relaxed, urban vibes' },
  { id: 'smart-casual', label: 'Smart Casual', icon: '👔', description: 'Polished yet comfortable' },
  { id: 'formal-elegant', label: 'Formal Elegant', icon: '🎩', description: 'Sophisticated & refined' },
  { id: 'athleisure', label: 'Athleisure', icon: '🏃', description: 'Sporty & stylish' },
  { id: 'minimalist', label: 'Minimalist', icon: '⬜', description: 'Clean & simple' },
  { id: 'trendy', label: 'Trendy', icon: '✨', description: 'Latest fashion forward' },
]

export const occasionOptions = [
  { id: 'daily-wear', label: 'Daily Wear', icon: '☀️' },
  { id: 'work-office', label: 'Work / Office', icon: '💼' },
  { id: 'date-night', label: 'Date Night', icon: '💕' },
  { id: 'wedding-event', label: 'Wedding / Event', icon: '🎊' },
  { id: 'vacation', label: 'Vacation', icon: '🏖️' },
  { id: 'party', label: 'Party / Night Out', icon: '🎉' },
]

export const budgetOptions = [
  { id: '2000', label: 'Under ₱2,000', range: 'Budget-friendly' },
  { id: '5000', label: '₱2,000 - ₱5,000', range: 'Mid-range' },
  { id: '10000', label: '₱5,000 - ₱10,000', range: 'Premium' },
  { id: '999999', label: '₱10,000+', range: 'Luxury' },
]

export const colorOptions = [
  { id: 'neutrals', label: 'Neutrals', colors: ['#000', '#fff', '#888', '#d4b896'] },
  { id: 'dark', label: 'Dark Colors', colors: ['#1a2744', '#2d3748', '#1a1a2e', '#16213e'] },
  { id: 'earth', label: 'Earth Tones', colors: ['#8b4513', '#d2691e', '#556b2f', '#8fbc8f'] },
  { id: 'bright', label: 'Bright & Bold', colors: ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a'] },
  { id: 'pastels', label: 'Soft Pastels', colors: ['#ffb6c1', '#b0e0e6', '#98fb98', '#dda0dd'] },
]

export const recipientOptions = [
  { id: 'partner', label: 'Partner / Spouse', icon: '💑' },
  { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧' },
  { id: 'friend', label: 'Friend', icon: '🤝' },
  { id: 'sibling', label: 'Sibling', icon: '👫' },
  { id: 'colleague', label: 'Colleague', icon: '💼' },
]

export const giftOccasionOptions = [
  { id: 'birthday', label: 'Birthday', icon: '🎂' },
  { id: 'anniversary', label: 'Anniversary', icon: '💍' },
  { id: 'christmas', label: 'Christmas', icon: '🎄' },
  { id: 'valentines', label: "Valentine's Day", icon: '❤️' },
  { id: 'graduation', label: 'Graduation', icon: '🎓' },
  { id: 'just-because', label: 'Just Because', icon: '🎁' },
]

// Color Matching Rules (Fashion Color Theory)
export const colorHarmony: Record<string, string[]> = {
  neutrals: ['black', 'white', 'gray', 'beige', 'navy', 'brown'],
  dark: ['black', 'navy', 'charcoal', 'burgundy', 'forest', 'brown'],
  earth: ['brown', 'tan', 'olive', 'rust', 'beige', 'forest'],
  bright: ['red', 'blue', 'yellow', 'orange', 'green', 'pink'],
  pastels: ['pink', 'blue', 'lavender', 'mint', 'peach', 'cream'],
}

// Style to Product Tag Mapping
export const styleMapping: Record<string, string[]> = {
  'casual-street': ['casual', 'streetwear', 'urban', 'relaxed', 'everyday'],
  'smart-casual': ['smart', 'business', 'polished', 'refined', 'classic'],
  'formal-elegant': ['formal', 'elegant', 'sophisticated', 'dressy', 'luxury'],
  'athleisure': ['athletic', 'sporty', 'active', 'comfort', 'performance'],
  'minimalist': ['minimal', 'simple', 'clean', 'basic', 'essential'],
  'trendy': ['trendy', 'fashion', 'modern', 'contemporary', 'statement'],
}

// Occasion to Tags Mapping
export const occasionMapping: Record<string, string[]> = {
  'daily-wear': ['everyday', 'casual', 'daily', 'versatile'],
  'work-office': ['office', 'business', 'professional', 'work'],
  'date-night': ['date', 'evening', 'romantic', 'special'],
  'wedding-event': ['wedding', 'formal', 'event', 'party'],
  'vacation': ['vacation', 'travel', 'resort', 'leisure'],
  'party': ['party', 'night', 'club', 'celebration'],
  'birthday': ['gift', 'special', 'celebration'],
  'anniversary': ['gift', 'romantic', 'special', 'luxury'],
  'christmas': ['gift', 'holiday', 'festive'],
  'valentines': ['gift', 'romantic', 'love'],
  'graduation': ['gift', 'celebration', 'formal'],
  'just-because': ['gift', 'versatile', 'everyday'],
}

// Scoring Weights (Enhanced for Phase 3)
export const scoringWeights = {
  styleMatch: 18,      // Up from 15
  occasionMatch: 14,   // Up from 12
  colorHarmony: 12,    // Up from 10
  colorVariety: 5,     // New: bonus for color variety
  outfitBalance: 10,   // New: category balance
  brandDiversity: 6,   // New: avoid same brand
  subcategoryDiversity: 8, // New: avoid 2 t-shirts
  giftSuitable: 20,
  premiumBrand: 8,
  featured: 8,
  goodValue: 5,
  premiumPick: 3,
  randomVariety: 5,
}

// Premium brands for gift recommendations
export const premiumBrands = ['Calvin Klein', 'Ralph Lauren', 'Michael Kors']

// Look name configurations
export const personalLooks = [
  { name: 'Everyday Essential', desc: 'Your go-to outfit for daily adventures' },
  { name: 'Signature Style', desc: 'A look that defines your fashion identity' },
  { name: 'Weekend Ready', desc: 'Comfortable yet stylish for off-duty days' },
  { name: 'Statement Maker', desc: 'Turn heads with this bold ensemble' },
  { name: 'Classic Refined', desc: 'Timeless elegance that never goes out of style' },
]

export const giftSets = [
  { name: 'Premium Gift Set', desc: 'A luxurious collection they\'ll treasure' },
  { name: 'Style Starter Kit', desc: 'Everything needed to elevate their wardrobe' },
  { name: 'Occasion Perfect', desc: 'Curated for your special celebration' },
  { name: 'Thoughtful Collection', desc: 'A meaningful gift they\'ll love' },
  { name: 'Complete Look Gift', desc: 'Head-to-toe style in one package' },
]

export const occasionSpecificNames: Record<string, { name: string; desc: string }> = {
  'date-night': { name: 'Date Night Perfection', desc: 'Make a lasting impression' },
  'work-office': { name: 'Office Ready', desc: 'Professional yet stylish' },
  'wedding-event': { name: 'Event Elegance', desc: 'Stand out at any occasion' },
  'vacation': { name: 'Vacation Vibes', desc: 'Travel in style' },
  'party': { name: 'Party Mode', desc: 'Ready to celebrate' },
}
