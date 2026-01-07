'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, ArrowLeft, Lock, ShoppingBag,
  Clock, Heart, Share2, Plus, Check,
  User, Gift, Shirt, Wallet, Loader2, MessageCircle, Copy, X
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { incrementAIDresserUsage, updateUserPreferences } from '@/lib/firestore'
import { products as allProducts, getProductById } from '@/lib/products'
import {
  checkAIDresserAccess,
  getRecommendations,
  addLookToCart,
  saveLookToWishlist,
  getShareUrls,
  Look,
  LookItem,
  CollectedData,
  AIDresserAccessResponse
} from '@/lib/ai-dresser'

// Quiz step types
type Purpose = 'personal' | 'gift' | null
type Gender = 'male' | 'female' | 'unisex' | null

interface QuizAnswers {
  purpose: Purpose
  gender: Gender
  recipient?: string
  relationship?: string
  style: string
  occasion: string
  budget: string
  color: string
}

// Quiz configuration based on n8n workflow
const styleOptions = [
  { id: 'casual-street', label: 'Casual Street', icon: '🛹', description: 'Relaxed, urban vibes' },
  { id: 'smart-casual', label: 'Smart Casual', icon: '👔', description: 'Polished yet comfortable' },
  { id: 'formal-elegant', label: 'Formal Elegant', icon: '🎩', description: 'Sophisticated & refined' },
  { id: 'athleisure', label: 'Athleisure', icon: '🏃', description: 'Sporty & stylish' },
  { id: 'minimalist', label: 'Minimalist', icon: '⬜', description: 'Clean & simple' },
  { id: 'trendy', label: 'Trendy', icon: '✨', description: 'Latest fashion forward' },
]

const occasionOptions = [
  { id: 'daily-wear', label: 'Daily Wear', icon: '☀️' },
  { id: 'work-office', label: 'Work / Office', icon: '💼' },
  { id: 'date-night', label: 'Date Night', icon: '💕' },
  { id: 'wedding-event', label: 'Wedding / Event', icon: '🎊' },
  { id: 'vacation', label: 'Vacation', icon: '🏖️' },
  { id: 'party', label: 'Party / Night Out', icon: '🎉' },
]

const budgetOptions = [
  { id: '2000', label: 'Under ₱2,000', range: 'Budget-friendly' },
  { id: '5000', label: '₱2,000 - ₱5,000', range: 'Mid-range' },
  { id: '10000', label: '₱5,000 - ₱10,000', range: 'Premium' },
  { id: '999999', label: '₱10,000+', range: 'Luxury' },
]

const colorOptions = [
  { id: 'neutrals', label: 'Neutrals', colors: ['#000', '#fff', '#888', '#d4b896'] },
  { id: 'dark', label: 'Dark Colors', colors: ['#1a2744', '#2d3748', '#1a1a2e', '#16213e'] },
  { id: 'earth', label: 'Earth Tones', colors: ['#8b4513', '#d2691e', '#556b2f', '#8fbc8f'] },
  { id: 'bright', label: 'Bright & Bold', colors: ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a'] },
  { id: 'pastels', label: 'Soft Pastels', colors: ['#ffb6c1', '#b0e0e6', '#98fb98', '#dda0dd'] },
]

const recipientOptions = [
  { id: 'partner', label: 'Partner / Spouse', icon: '💑' },
  { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧' },
  { id: 'friend', label: 'Friend', icon: '🤝' },
  { id: 'sibling', label: 'Sibling', icon: '👫' },
  { id: 'colleague', label: 'Colleague', icon: '💼' },
]

const giftOccasionOptions = [
  { id: 'birthday', label: 'Birthday', icon: '🎂' },
  { id: 'anniversary', label: 'Anniversary', icon: '💍' },
  { id: 'christmas', label: 'Christmas', icon: '🎄' },
  { id: 'valentines', label: "Valentine's Day", icon: '❤️' },
  { id: 'graduation', label: 'Graduation', icon: '🎓' },
  { id: 'just-because', label: 'Just Because', icon: '🎁' },
]


// SOP 7.1 - Color Matching Rules (Fashion Color Theory)
const colorHarmony: Record<string, string[]> = {
  neutrals: ['black', 'white', 'gray', 'beige', 'navy', 'brown'],
  dark: ['black', 'navy', 'charcoal', 'burgundy', 'forest', 'brown'],
  earth: ['brown', 'tan', 'olive', 'rust', 'beige', 'forest'],
  bright: ['red', 'blue', 'yellow', 'orange', 'green', 'pink'],
  pastels: ['pink', 'blue', 'lavender', 'mint', 'peach', 'cream'],
}

// SOP 7.1 - Style to Product Tag Mapping
const styleMapping: Record<string, string[]> = {
  'casual-street': ['casual', 'streetwear', 'urban', 'relaxed', 'everyday'],
  'smart-casual': ['smart', 'business', 'polished', 'refined', 'classic'],
  'formal-elegant': ['formal', 'elegant', 'sophisticated', 'dressy', 'luxury'],
  'athleisure': ['athletic', 'sporty', 'active', 'comfort', 'performance'],
  'minimalist': ['minimal', 'simple', 'clean', 'basic', 'essential'],
  'trendy': ['trendy', 'fashion', 'modern', 'contemporary', 'statement'],
}

// SOP 7.1 - Occasion to Tags Mapping
const occasionMapping: Record<string, string[]> = {
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

// SOP 7.2 - Scoring function for product relevance
interface ProductScore {
  product: typeof allProducts[0]
  score: number
  reasons: string[]
}

const scoreProduct = (
  product: typeof allProducts[0],
  answers: QuizAnswers,
  usedColors: Set<string>
): ProductScore => {
  let score = 0
  const reasons: string[] = []

  // Style matching (SOP 7.1)
  const styleKeywords = styleMapping[answers.style] || []
  const productTags = product.tags?.map(t => t.toLowerCase()) || []
  const productStyles = product.style?.map(s => s.toLowerCase()) || []

  for (const keyword of styleKeywords) {
    const styleMatch = productStyles.some(s => s.includes(keyword))
    if (productTags.some(t => t.includes(keyword)) || styleMatch) {
      score += 15
      reasons.push(`Style match: ${keyword}`)
      break
    }
  }

  // Occasion matching (SOP 7.1)
  const occasionKeywords = occasionMapping[answers.occasion] || []
  const productOccasions = product.occasions?.map(o => o.toLowerCase()) || []

  for (const keyword of occasionKeywords) {
    if (productOccasions.some(o => o.includes(keyword)) || productTags.some(t => t.includes(keyword))) {
      score += 12
      reasons.push(`Occasion match: ${keyword}`)
      break
    }
  }

  // Color harmony matching (SOP 7.1)
  const preferredColors = colorHarmony[answers.color] || []
  const productColors = product.colors?.map(c => c.toLowerCase()) || []

  for (const color of productColors) {
    if (preferredColors.some(pc => color.includes(pc) || pc.includes(color))) {
      score += 10
      reasons.push(`Color match: ${color}`)
      // Bonus for color variety in outfit
      if (!usedColors.has(color)) {
        score += 3
      }
      break
    }
  }

  // Gift suitability (SOP 7.1 - Gift logic)
  if (answers.purpose === 'gift') {
    if (product.giftSuitable) {
      score += 20
      reasons.push('Gift suitable')
    }
    // Prefer premium brands for gifts
    if (['Calvin Klein', 'Ralph Lauren', 'Michael Kors'].includes(product.brand)) {
      score += 8
      reasons.push('Premium brand')
    }
  }

  // Featured products bonus (popularity indicator)
  if (product.featured) {
    score += 8
    reasons.push('Featured/Popular')
  }

  // Price balance scoring (SOP 7.2)
  const budget = parseInt(answers.budget) || 10000
  const priceRatio = product.price / budget

  if (priceRatio >= 0.3 && priceRatio <= 0.6) {
    // Sweet spot for good value
    score += 5
    reasons.push('Good value')
  } else if (priceRatio > 0.8) {
    // Premium item for upsell
    score += 3
    reasons.push('Premium pick')
  }

  // Brand variety bonus
  score += Math.random() * 5 // Small random factor for variety

  return { product, score, reasons }
}

// SOP 7.3 - Generate look names based on context
const generateLookName = (
  index: number,
  answers: QuizAnswers,
  items: LookItem[]
): { name: string; desc: string } => {
  const isGift = answers.purpose === 'gift'

  const personalLooks = [
    { name: 'Everyday Essential', desc: 'Your go-to outfit for daily adventures' },
    { name: 'Signature Style', desc: 'A look that defines your fashion identity' },
    { name: 'Weekend Ready', desc: 'Comfortable yet stylish for off-duty days' },
    { name: 'Statement Maker', desc: 'Turn heads with this bold ensemble' },
    { name: 'Classic Refined', desc: 'Timeless elegance that never goes out of style' },
  ]

  const giftSets = [
    { name: 'Premium Gift Set', desc: 'A luxurious collection they\'ll treasure' },
    { name: 'Style Starter Kit', desc: 'Everything needed to elevate their wardrobe' },
    { name: 'Occasion Perfect', desc: 'Curated for your special celebration' },
    { name: 'Thoughtful Collection', desc: 'A meaningful gift they\'ll love' },
    { name: 'Complete Look Gift', desc: 'Head-to-toe style in one package' },
  ]

  const occasionSpecific: Record<string, { name: string; desc: string }> = {
    'date-night': { name: 'Date Night Perfection', desc: 'Make a lasting impression' },
    'work-office': { name: 'Office Ready', desc: 'Professional yet stylish' },
    'wedding-event': { name: 'Event Elegance', desc: 'Stand out at any occasion' },
    'vacation': { name: 'Vacation Vibes', desc: 'Travel in style' },
    'party': { name: 'Party Mode', desc: 'Ready to celebrate' },
  }

  // Use occasion-specific names when available
  if (!isGift && occasionSpecific[answers.occasion] && index === 0) {
    return occasionSpecific[answers.occasion]
  }

  return isGift ? giftSets[index] : personalLooks[index]
}

// SOP 7.1-7.3 - Main recommendation engine
const generateLocalRecommendations = (answers: QuizAnswers): Look[] => {
  // Step 1: Filter base products by gender and budget
  let filtered = [...allProducts].filter(p => p.inStock && p.stockQty > 0)

  if (answers.gender && answers.gender !== 'unisex') {
    filtered = filtered.filter(p =>
      p.gender === answers.gender || p.gender === 'unisex'
    )
  }

  if (answers.budget) {
    const maxBudget = parseInt(answers.budget)
    filtered = filtered.filter(p => p.price <= maxBudget)
  }

  // Step 2: Separate and score by category
  const clothes = filtered.filter(p => p.category === 'clothes')
  const accessories = filtered.filter(p => p.category === 'accessories')
  const shoes = filtered.filter(p => p.category === 'shoes')

  const looks: Look[] = []
  const usedProducts = new Set<string>()

  // Step 3: Generate 5 complete looks (SOP 7.3)
  for (let i = 0; i < 5; i++) {
    const items: LookItem[] = []
    const usedColors = new Set<string>()
    let lookBudget = parseInt(answers.budget) || 10000

    // Score and sort available clothes
    const scoredClothes = clothes
      .filter(p => !usedProducts.has(p.id))
      .map(p => scoreProduct(p, answers, usedColors))
      .sort((a, b) => b.score - a.score)

    // Pick 1-2 clothing items (balance premium + affordable for SOP 7.2)
    const clothesToPick = Math.min(2, scoredClothes.length)
    let pickedClothes = 0
    let pickPremium = i % 2 === 0 // Alternate premium/affordable focus

    for (const scored of scoredClothes) {
      if (pickedClothes >= clothesToPick) break
      if (scored.product.price > lookBudget * 0.7) continue // Leave room for other items

      // Alternate between premium and affordable (SOP 7.2)
      const isPremium = scored.product.price > lookBudget * 0.3
      if (pickedClothes === 0 || (pickPremium === isPremium)) {
        usedProducts.add(scored.product.id)
        scored.product.colors?.forEach(c => usedColors.add(c.toLowerCase()))

        items.push({
          product_id: scored.product.id,
          product_name: scored.product.name,
          category: 'clothes',
          price: scored.product.price,
          image_url: scored.product.images[0] || '/placeholder.jpg',
          product_url: `/shop/${scored.product.id}`,
          styling_note: scored.reasons[0] || `${scored.product.brand} signature piece`
        })

        lookBudget -= scored.product.price
        pickedClothes++
        pickPremium = !pickPremium
      }
    }

    // Score and pick 1 accessory with color harmony
    const scoredAccessories = accessories
      .filter(p => !usedProducts.has(p.id) && p.price <= lookBudget * 0.5)
      .map(p => scoreProduct(p, answers, usedColors))
      .sort((a, b) => b.score - a.score)

    if (scoredAccessories.length > 0) {
      const accessory = scoredAccessories[0]
      usedProducts.add(accessory.product.id)

      items.push({
        product_id: accessory.product.id,
        product_name: accessory.product.name,
        category: 'accessories',
        price: accessory.product.price,
        image_url: accessory.product.images[0] || '/placeholder.jpg',
        product_url: `/shop/${accessory.product.id}`,
        styling_note: accessory.reasons[0] || 'The perfect finishing touch'
      })

      lookBudget -= accessory.product.price
    }

    // Score and pick 1 shoe with color harmony
    const scoredShoes = shoes
      .filter(p => !usedProducts.has(p.id) && p.price <= lookBudget)
      .map(p => scoreProduct(p, answers, usedColors))
      .sort((a, b) => b.score - a.score)

    if (scoredShoes.length > 0) {
      const shoe = scoredShoes[0]
      usedProducts.add(shoe.product.id)

      items.push({
        product_id: shoe.product.id,
        product_name: shoe.product.name,
        category: 'shoes',
        price: shoe.product.price,
        image_url: shoe.product.images[0] || '/placeholder.jpg',
        product_url: `/shop/${shoe.product.id}`,
        styling_note: shoe.reasons[0] || 'Completes the look perfectly'
      })
    }

    // Create look if we have items (SOP 7.2 - complete purchasable sets)
    if (items.length >= 2) {
      const { name, desc } = generateLookName(i, answers, items)
      const totalPrice = items.reduce((sum, item) => sum + item.price, 0)

      // Generate contextual style tip
      const styleTips = [
        `This ${answers.style?.replace('-', ' ')} look pairs perfectly together`,
        items.length >= 3 ? 'A complete head-to-toe ensemble' : 'Mix and match with your existing wardrobe',
        answers.purpose === 'gift' ? 'A thoughtful gift they\'ll love' : 'Perfect for ' + answers.occasion?.replace('-', ' '),
        'Each piece complements the others beautifully',
        `Curated for your ${answers.color} color preference`,
      ]

      looks.push({
        look_number: i + 1,
        look_name: name,
        look_description: desc,
        items,
        total_price: totalPrice,
        style_tip: styleTips[i] || styleTips[0]
      })
    }
  }

  // Ensure we return at least some looks even if scoring filtered too much
  if (looks.length === 0) {
    // Fallback: create basic looks without scoring
    return generateFallbackLooks(filtered, answers)
  }

  return looks
}

// Fallback function if scoring is too restrictive
const generateFallbackLooks = (products: typeof allProducts, answers: QuizAnswers): Look[] => {
  const clothes = products.filter(p => p.category === 'clothes')
  const accessories = products.filter(p => p.category === 'accessories')
  const shoes = products.filter(p => p.category === 'shoes')

  const looks: Look[] = []
  const used = new Set<string>()

  for (let i = 0; i < Math.min(5, Math.ceil(clothes.length / 2)); i++) {
    const items: LookItem[] = []

    // Pick clothes
    for (const c of clothes) {
      if (!used.has(c.id) && items.filter(x => x.category === 'clothes').length < 2) {
        used.add(c.id)
        items.push({
          product_id: c.id,
          product_name: c.name,
          category: 'clothes',
          price: c.price,
          image_url: c.images[0] || '/placeholder.jpg',
          product_url: `/shop/${c.id}`,
          styling_note: `${c.brand} quality`
        })
      }
    }

    // Pick accessory
    for (const a of accessories) {
      if (!used.has(a.id)) {
        used.add(a.id)
        items.push({
          product_id: a.id,
          product_name: a.name,
          category: 'accessories',
          price: a.price,
          image_url: a.images[0] || '/placeholder.jpg',
          product_url: `/shop/${a.id}`,
          styling_note: 'Adds style'
        })
        break
      }
    }

    // Pick shoe
    for (const s of shoes) {
      if (!used.has(s.id)) {
        used.add(s.id)
        items.push({
          product_id: s.id,
          product_name: s.name,
          category: 'shoes',
          price: s.price,
          image_url: s.images[0] || '/placeholder.jpg',
          product_url: `/shop/${s.id}`,
          styling_note: 'Completes the look'
        })
        break
      }
    }

    if (items.length > 0) {
      looks.push({
        look_number: i + 1,
        look_name: answers.purpose === 'gift' ? `Gift Set #${i + 1}` : `Look #${i + 1}`,
        look_description: 'A curated selection just for you',
        items,
        total_price: items.reduce((sum, item) => sum + item.price, 0),
        style_tip: 'A versatile combination'
      })
    }
  }

  return looks
}

export default function AIDresserPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth()
  const { addItem } = useCart()
  const [sessionId, setSessionId] = useState<string>('')
  const [hasAccess, setHasAccess] = useState(true)
  const [, setAccessInfo] = useState<AIDresserAccessResponse | null>(null)
  const [currentStep, setCurrentStep] = useState(0) // 0 = intro, 1-6 = quiz steps, 7 = loading, 8 = results
  const [answers, setAnswers] = useState<QuizAnswers>({
    purpose: null,
    gender: null,
    style: '',
    occasion: '',
    budget: '',
    color: '',
  })
  const [looks, setLooks] = useState<Look[]>([])
  const [activeLook, setActiveLook] = useState(0)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [savedLooks, setSavedLooks] = useState<Set<number>>(new Set())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrls, setShareUrls] = useState<{ messenger?: string; whatsapp?: string; copy?: string } | null>(null)

  // Check access when user logs in
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        // Generate session ID
        const newSessionId = `ai_session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
        setSessionId(newSessionId)

        // Try n8n webhook first, fallback to always allowing access
        try {
          const response = await checkAIDresserAccess('', user.id)
          setAccessInfo(response)
          setHasAccess(response.access_granted)
        } catch {
          // If n8n not configured, allow access
          setHasAccess(true)
        }
      }
    }
    checkAccess()
  }, [user])

  // Generate recommendations
  const generateRecommendations = async () => {
    setCurrentStep(7) // Loading state

    // Track AI Dresser usage and save preferences
    if (user?.id) {
      await Promise.all([
        incrementAIDresserUsage(user.id),
        updateUserPreferences(user.id, {
          styles: answers.style ? [answers.style] : [],
          colors: answers.color ? [answers.color] : [],
        })
      ])
    }

    // Prepare collected data for API
    const collectedData: CollectedData = {
      purpose: answers.purpose || undefined,
      gender: answers.gender || undefined,
      style: answers.style,
      occasion: answers.occasion,
      budget: answers.budget,
      color: answers.color,
      recipient: answers.recipient,
    }

    // Create summary
    const summary = `${answers.gender || 'Unisex'}, ${answers.style?.replace('-', ' ')} style for ${answers.occasion?.replace('-', ' ')}, budget up to ₱${parseInt(answers.budget).toLocaleString()}, prefers ${answers.color} colors`

    try {
      // Try n8n webhook first
      const response = await getRecommendations(sessionId, user?.id || '', collectedData, summary)
      if (response?.success && response.looks?.length > 0) {
        setLooks(response.looks)
      } else {
        // Fallback to local generation
        const localLooks = generateLocalRecommendations(answers)
        setLooks(localLooks)
      }
    } catch {
      // Fallback to local generation if API fails
      const localLooks = generateLocalRecommendations(answers)
      setLooks(localLooks)
    }

    setCurrentStep(8) // Results
  }

  const handleAnswer = (field: keyof QuizAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep === 6) {
      generateRecommendations()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return answers.purpose !== null
      case 2: return answers.gender !== null
      case 3: return answers.purpose === 'gift' ? answers.recipient !== '' : answers.style !== ''
      case 4: return answers.occasion !== ''
      case 5: return answers.budget !== ''
      case 6: return answers.color !== ''
      default: return true
    }
  }

  const addToCart = async (item: LookItem) => {
    // Get the full product details
    const product = getProductById(item.product_id)
    if (product) {
      // Convert to cart product format
      addItem({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        image: product.images[0] || '/placeholder.jpg',
        category: product.category,
        sizes: product.sizes,
        colors: product.colors,
      }, 1)
    }
    setAddedItems(prev => new Set([...prev, item.product_id]))
  }

  const addAllToCart = async (look: Look) => {
    // Add each item to cart
    for (const item of look.items) {
      const product = getProductById(item.product_id)
      if (product) {
        addItem({
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          originalPrice: product.originalPrice || product.price,
          image: product.images[0] || '/placeholder.jpg',
          category: product.category,
          sizes: product.sizes,
          colors: product.colors,
        }, 1)
      }
    }

    // Mark all items as added
    const newItems = new Set(addedItems)
    look.items.forEach(item => newItems.add(item.product_id))
    setAddedItems(newItems)

    // Try to notify n8n webhook
    try {
      await addLookToCart(sessionId, user?.id || '', look, 'add_all')
    } catch {
      // Silently fail if webhook not configured
    }
  }

  const saveLook = async (lookNumber: number) => {
    const look = looks.find(l => l.look_number === lookNumber)

    setSavedLooks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lookNumber)) {
        newSet.delete(lookNumber)
      } else {
        newSet.add(lookNumber)
      }
      return newSet
    })

    // Try to save to n8n webhook
    if (look && !savedLooks.has(lookNumber)) {
      try {
        await saveLookToWishlist(sessionId, user?.id || '', look)
      } catch {
        // Silently fail if webhook not configured
      }
    }
  }

  const handleShare = async (look: Look) => {
    try {
      const response = await getShareUrls(sessionId, user?.id || '', look)
      if (response.success && response.share_options) {
        setShareUrls({
          messenger: response.share_options.messenger.url,
          whatsapp: response.share_options.whatsapp.url,
          copy: response.share_options.copy_link.url
        })
        setShareModalOpen(true)
      } else {
        // Fallback: Generate local share URLs
        const shareText = `Check out this ${look.look_name} from LGM Apparel! Total: ₱${look.total_price.toLocaleString()}`
        const shareUrl = `${window.location.origin}/ai-dresser?look=${look.look_number}`
        const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID
        setShareUrls({
          messenger: fbAppId
            ? `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=${fbAppId}&redirect_uri=${encodeURIComponent(window.location.href)}`
            : `fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`,
          whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
          copy: shareUrl
        })
        setShareModalOpen(true)
      }
    } catch {
      // Fallback share
      const shareText = `Check out this ${look.look_name} from LGM Apparel!`
      if (navigator.share) {
        navigator.share({ title: look.look_name, text: shareText, url: window.location.href })
      } else {
        navigator.clipboard.writeText(shareText + ' ' + window.location.href)
        alert('Link copied to clipboard!')
      }
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    alert('Link copied!')
    setShareModalOpen(false)
  }

  const totalSteps = answers.purpose === 'gift' ? 7 : 6

  // Render intro screen
  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center mx-auto mb-8">
        <Sparkles className="w-12 h-12 text-gold" />
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
        Your Personal
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-300 to-gold">
          AI Fashion Stylist
        </span>
      </h1>

      <p className="text-white/60 text-lg mb-8">
        Answer a few quick questions and let our AI curate 5 perfect outfits
        from our premium collection, tailored just for you.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-white text-sm font-medium">Personalized</p>
          <p className="text-white/40 text-xs">Based on your style</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="text-2xl mb-2">👗</div>
          <p className="text-white text-sm font-medium">5 Complete Looks</p>
          <p className="text-white/40 text-xs">Ready to purchase</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="text-2xl mb-2">⚡</div>
          <p className="text-white text-sm font-medium">Quick & Easy</p>
          <p className="text-white/40 text-xs">Under 2 minutes</p>
        </div>
      </div>

      {authLoading ? (
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
          <span className="text-white/50">Checking access...</span>
        </div>
      ) : !isLoggedIn ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
          <Lock className="w-8 h-8 text-gold mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Login Required</p>
          <p className="text-white/50 text-sm mb-4">
            Sign in to access your free daily AI Stylist session
          </p>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-bold py-3 px-6 rounded-full transition-all"
          >
            Sign In to Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : !hasAccess ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
          <Clock className="w-8 h-8 text-gold mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Session Used Today</p>
          <p className="text-white/50 text-sm mb-4">
            You've used your free session for today. Make a purchase to unlock another!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-bold py-3 px-6 rounded-full transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              Shop Now
            </Link>
            <p className="text-white/40 text-sm self-center">
              or come back tomorrow
            </p>
          </div>
        </div>
      ) : (
        <div>
          {user && (
            <p className="text-white/50 text-sm mb-4">
              Welcome back, <span className="text-gold font-medium">{user.name}</span>!
            </p>
          )}
          <button
            onClick={() => setCurrentStep(1)}
            className="group inline-flex items-center gap-3 bg-gold hover:bg-yellow-400 text-navy font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-gold/25 hover:shadow-gold/40"
          >
            Start Styling Session
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      <p className="text-white/30 text-sm mt-6">
        1 free session per day • Additional sessions unlock with purchases
      </p>
    </motion.div>
  )

  // Render quiz steps
  const renderQuizStep = () => {
    const stepContent = () => {
      switch (currentStep) {
        case 1: // Purpose
          return (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                What brings you here today?
              </h2>
              <p className="text-white/50 mb-8">Choose how you'd like me to help you</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleAnswer('purpose', 'personal')}
                  className={`group p-6 rounded-2xl border-2 transition-all text-left ${
                    answers.purpose === 'personal'
                      ? 'bg-gold/20 border-gold'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <User className={`w-10 h-10 mb-4 ${answers.purpose === 'personal' ? 'text-gold' : 'text-white/50'}`} />
                  <h3 className="text-white font-semibold text-lg mb-1">Personal Styling</h3>
                  <p className="text-white/50 text-sm">Find outfits for myself</p>
                </button>

                <button
                  onClick={() => handleAnswer('purpose', 'gift')}
                  className={`group p-6 rounded-2xl border-2 transition-all text-left ${
                    answers.purpose === 'gift'
                      ? 'bg-gold/20 border-gold'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <Gift className={`w-10 h-10 mb-4 ${answers.purpose === 'gift' ? 'text-gold' : 'text-white/50'}`} />
                  <h3 className="text-white font-semibold text-lg mb-1">Gift Finder</h3>
                  <p className="text-white/50 text-sm">Find the perfect present</p>
                </button>
              </div>
            </div>
          )

        case 2: // Gender
          return (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {answers.purpose === 'gift' ? "Who is the gift for?" : "What's your style preference?"}
              </h2>
              <p className="text-white/50 mb-8">This helps us show you the right products</p>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'male', label: "Men's", icon: '👔' },
                  { id: 'female', label: "Women's", icon: '👗' },
                  { id: 'unisex', label: 'Any / All', icon: '✨' },
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer('gender', option.id)}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      answers.gender === option.id
                        ? 'bg-gold/20 border-gold'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="text-4xl mb-3">{option.icon}</div>
                    <p className="text-white font-medium">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )

        case 3: // Style (personal) or Recipient (gift)
          if (answers.purpose === 'gift') {
            return (
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Who are you shopping for?
                </h2>
                <p className="text-white/50 mb-8">Tell us about the recipient</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {recipientOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer('recipient', option.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        answers.recipient === option.id
                          ? 'bg-gold/20 border-gold'
                          : 'bg-white/5 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <p className="text-white text-sm font-medium">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                What's your style vibe?
              </h2>
              <p className="text-white/50 mb-8">Pick what resonates with you most</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {styleOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer('style', option.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      answers.style === option.id
                        ? 'bg-gold/20 border-gold'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <p className="text-white font-medium text-sm">{option.label}</p>
                    <p className="text-white/40 text-xs">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )

        case 4: // Occasion
          return (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {answers.purpose === 'gift' ? "What's the occasion?" : "Where will you wear this?"}
              </h2>
              <p className="text-white/50 mb-8">
                {answers.purpose === 'gift' ? 'Help us find occasion-appropriate gifts' : 'We\'ll tailor recommendations to fit'}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(answers.purpose === 'gift' ? giftOccasionOptions : occasionOptions).map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer('occasion', option.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      answers.occasion === option.id
                        ? 'bg-gold/20 border-gold'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <p className="text-white text-sm font-medium">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )

        case 5: // Budget
          return (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                What's your budget?
              </h2>
              <p className="text-white/50 mb-8">Per complete outfit or gift set</p>

              <div className="grid grid-cols-2 gap-3">
                {budgetOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer('budget', option.id)}
                    className={`p-5 rounded-xl border-2 transition-all text-left ${
                      answers.budget === option.id
                        ? 'bg-gold/20 border-gold'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <Wallet className={`w-6 h-6 mb-2 ${answers.budget === option.id ? 'text-gold' : 'text-white/50'}`} />
                    <p className="text-white font-medium">{option.label}</p>
                    <p className="text-white/40 text-xs">{option.range}</p>
                  </button>
                ))}
              </div>
            </div>
          )

        case 6: // Color
          return (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Color preferences?
              </h2>
              <p className="text-white/50 mb-8">What palette speaks to you?</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {colorOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer('color', option.id)}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      answers.color === option.id
                        ? 'bg-gold/20 border-gold'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex -space-x-1">
                      {option.colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-navy"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="text-white font-medium">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )

        default:
          return null
      }
    }

    return (
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="max-w-2xl mx-auto"
      >
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-white/50 mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-yellow-400 transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {stepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <button
            onClick={prevStep}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className={`flex items-center gap-2 py-3 px-6 rounded-full font-semibold transition-all ${
              canProceed()
                ? 'bg-gold hover:bg-yellow-400 text-navy'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {currentStep === 6 ? 'Get My Looks' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    )
  }

  // Render loading state
  const renderLoading = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center max-w-md mx-auto"
    >
      <div className="relative w-32 h-32 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-gold/20" />
        <div className="absolute inset-0 rounded-full border-4 border-gold border-t-transparent animate-spin" />
        <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-gold animate-pulse" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-4">
        Crafting Your Perfect Looks...
      </h2>

      <div className="space-y-3 text-white/50">
        <p className="animate-pulse">Analyzing your preferences...</p>
        <p className="animate-pulse" style={{ animationDelay: '0.5s' }}>Scanning our collection...</p>
        <p className="animate-pulse" style={{ animationDelay: '1s' }}>Matching colors & styles...</p>
      </div>
    </motion.div>
  )

  // Render results
  const renderResults = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Your Personalized Looks
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          5 Perfect Outfits, Just for You
        </h2>
        <p className="text-white/50">
          Based on your {answers.style?.replace('-', ' ')} style for {answers.occasion?.replace('-', ' ')}
        </p>
      </div>

      {/* Look Navigation */}
      <div className="flex justify-center gap-2 mb-8">
        {looks.map((look, index) => (
          <button
            key={look.look_number}
            onClick={() => setActiveLook(index)}
            className={`w-12 h-12 rounded-full font-semibold transition-all ${
              activeLook === index
                ? 'bg-gold text-navy scale-110'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {look.look_number}
          </button>
        ))}
      </div>

      {/* Active Look Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLook}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden"
        >
          {/* Look Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {looks[activeLook].look_name}
                </h3>
                <p className="text-white/50 text-sm">
                  {looks[activeLook].look_description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-sm">Total</p>
                <p className="text-2xl font-bold text-gold">
                  ₱{looks[activeLook].total_price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Items Grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {looks[activeLook].items.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-white/5 rounded-xl overflow-hidden group"
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 relative">
                    {/* Placeholder for product image */}
                    <div className="absolute inset-0 flex items-center justify-center text-white/20">
                      <Shirt className="w-12 h-12" />
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addToCart(item)}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        addedItems.has(item.product_id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gold text-navy opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {addedItems.has(item.product_id) ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Plus className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="p-3">
                    <p className="text-white text-sm font-medium truncate">
                      {item.product_name}
                    </p>
                    <p className="text-gold font-semibold">
                      ₱{item.price.toLocaleString()}
                    </p>
                    <p className="text-white/40 text-xs mt-1 line-clamp-2">
                      {item.styling_note}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Style Tip */}
            <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 mb-6">
              <p className="text-gold text-sm font-medium mb-1">Style Tip</p>
              <p className="text-white/70 text-sm">{looks[activeLook].style_tip}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => addAllToCart(looks[activeLook])}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-bold py-4 px-6 rounded-full transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
                Add All to Cart
              </button>

              <button
                onClick={() => saveLook(looks[activeLook].look_number)}
                className={`flex items-center justify-center gap-2 py-4 px-6 rounded-full transition-all ${
                  savedLooks.has(looks[activeLook].look_number)
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                <Heart className={`w-5 h-5 ${savedLooks.has(looks[activeLook].look_number) ? 'fill-current' : ''}`} />
                {savedLooks.has(looks[activeLook].look_number) ? 'Saved' : 'Save Look'}
              </button>

              <button
                onClick={() => handleShare(looks[activeLook])}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-full transition-all border border-white/10"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setActiveLook(prev => Math.max(0, prev - 1))}
          disabled={activeLook === 0}
          className={`flex items-center gap-2 py-3 px-5 rounded-full transition-all ${
            activeLook === 0
              ? 'text-white/30 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          Previous Look
        </button>

        <button
          onClick={() => setActiveLook(prev => Math.min(looks.length - 1, prev + 1))}
          disabled={activeLook === looks.length - 1}
          className={`flex items-center gap-2 py-3 px-5 rounded-full transition-all ${
            activeLook === looks.length - 1
              ? 'text-white/30 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Next Look
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Start Over */}
      <div className="text-center mt-10">
        <button
          onClick={() => {
            setCurrentStep(0)
            setAnswers({ purpose: null, gender: null, style: '', occasion: '', budget: '', color: '' })
            setLooks([])
            setActiveLook(0)
            setAddedItems(new Set())
            setSavedLooks(new Set())
          }}
          className="text-white/50 hover:text-white transition-colors text-sm"
        >
          Start a new styling session
        </button>
      </div>
    </motion.div>
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-navy pt-24 pb-16">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.1),transparent_60%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.05),transparent_60%)]" />
        </div>

        <div className="container-max px-4 md:px-8 relative z-10 py-12">
          <AnimatePresence mode="wait">
            {currentStep === 0 && renderIntro()}
            {currentStep >= 1 && currentStep <= 6 && renderQuizStep()}
            {currentStep === 7 && renderLoading()}
            {currentStep === 8 && renderResults()}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShareModalOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-navy border border-white/10 rounded-2xl p-6 max-w-sm w-full"
          >
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">Share This Look</h3>
            <p className="text-white/50 text-sm mb-6">
              Share your styled look with friends!
            </p>

            <div className="space-y-3">
              {shareUrls?.messenger && (
                <a
                  href={shareUrls.messenger}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.512 3.726 7.21V22l3.405-1.869c.909.252 1.871.388 2.869.388 5.523 0 10-4.145 10-9.259S17.523 2 12 2zm1.008 12.461l-2.549-2.72-4.975 2.72 5.474-5.81 2.613 2.72 4.91-2.72-5.473 5.81z"/>
                  </svg>
                  Share via Messenger
                </a>
              )}

              {shareUrls?.whatsapp && (
                <a
                  href={shareUrls.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full p-4 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Share via WhatsApp
                </a>
              )}

              {shareUrls?.copy && (
                <button
                  onClick={() => copyToClipboard(shareUrls.copy!)}
                  className="flex items-center gap-3 w-full p-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  <Copy className="w-5 h-5" />
                  Copy Link
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
