// AI Dresser Recommendation Engine
// Scoring and recommendation generation logic

import type { Look, LookItem } from './ai-dresser'
import type { FirestoreProduct } from './firestore'
import {
  colorHarmony,
  styleMapping,
  occasionMapping,
  scoringWeights,
  premiumBrands,
  personalLooks,
  giftSets,
  occasionSpecificNames
} from './ai-dresser-constants'

// Quiz answer types
export interface QuizAnswers {
  purpose: 'personal' | 'gift' | null
  gender: 'male' | 'female' | 'unisex' | null
  recipient?: string
  relationship?: string
  style: string
  occasion: string
  budget: string
  color: string
  sizes?: {
    top: string
    bottom: string
    shoe: string
  }
}

// Product scoring result
interface ProductScore {
  product: FirestoreProduct
  score: number
  reasons: string[]
}

// Score a product based on quiz answers
export const scoreProduct = (
  product: FirestoreProduct,
  answers: QuizAnswers,
  usedColors: Set<string>,
  usedBrands: Set<string> = new Set(),
  usedSubcategories: Set<string> = new Set()
): ProductScore => {
  let score = 0
  const reasons: string[] = []

  // Style matching
  const styleKeywords = styleMapping[answers.style] || []
  const productTags = product.tags?.map(t => t.toLowerCase()) || []
  const productStyles = product.style?.map(s => s.toLowerCase()) || []

  for (const keyword of styleKeywords) {
    const styleMatch = productStyles.some(s => s.includes(keyword))
    if (productTags.some(t => t.includes(keyword)) || styleMatch) {
      score += scoringWeights.styleMatch
      reasons.push(`Style match: ${keyword}`)
      break
    }
  }

  // Occasion matching
  const occasionKeywords = occasionMapping[answers.occasion] || []
  const productOccasions = product.occasions?.map(o => o.toLowerCase()) || []

  for (const keyword of occasionKeywords) {
    if (productOccasions.some(o => o.includes(keyword)) || productTags.some(t => t.includes(keyword))) {
      score += scoringWeights.occasionMatch
      reasons.push(`Occasion match: ${keyword}`)
      break
    }
  }

  // Color harmony matching (handle 'ai-decide' option)
  let preferredColors: string[] = []
  if (answers.color === 'ai-decide' || !answers.color) {
    // AI Decide: consider all colors as valid, give bonus for variety
    preferredColors = ['black', 'white', 'gray', 'beige', 'navy', 'brown', 'red', 'blue', 'green', 'pink', 'yellow', 'orange', 'purple', 'burgundy', 'olive', 'tan', 'cream', 'charcoal', 'forest', 'mint', 'lavender', 'peach', 'rust']
  } else {
    preferredColors = colorHarmony[answers.color] || []
  }
  const productColors = product.colors?.map(c => c.toLowerCase()) || []

  for (const color of productColors) {
    if (preferredColors.some(pc => color.includes(pc) || pc.includes(color))) {
      score += scoringWeights.colorHarmony
      reasons.push(`Color match: ${color}`)
      // Bonus for color variety in outfit
      if (!usedColors.has(color)) {
        score += scoringWeights.colorVariety
        reasons.push('Adds color variety')
      }
      break
    }
  }

  // Size availability scoring
  if (answers.sizes) {
    const productSizes = product.sizes?.map(s => s.toUpperCase()) || []
    let sizeMatch = false

    // Check if product has user's preferred size based on category
    if (product.category === 'clothes') {
      const subcategory = (product.subcategory || '').toLowerCase()
      // Check for top sizes (shirts, jackets, hoodies, etc.)
      if (subcategory.includes('shirt') || subcategory.includes('jacket') || subcategory.includes('hoodie') || subcategory.includes('top') || subcategory.includes('tee') || subcategory.includes('polo')) {
        if (answers.sizes.top && productSizes.includes(answers.sizes.top.toUpperCase())) {
          sizeMatch = true
        }
      }
      // Check for bottom sizes (pants, shorts, jeans, etc.)
      if (subcategory.includes('pant') || subcategory.includes('short') || subcategory.includes('jean') || subcategory.includes('trouser') || subcategory.includes('chino')) {
        if (answers.sizes.bottom && productSizes.includes(answers.sizes.bottom.toUpperCase())) {
          sizeMatch = true
        }
      }
      // If subcategory not clear, check both
      if (!sizeMatch && (answers.sizes.top || answers.sizes.bottom)) {
        if ((answers.sizes.top && productSizes.includes(answers.sizes.top.toUpperCase())) ||
            (answers.sizes.bottom && productSizes.includes(answers.sizes.bottom.toUpperCase()))) {
          sizeMatch = true
        }
      }
    } else if (product.category === 'shoes') {
      if (answers.sizes.shoe && productSizes.includes(answers.sizes.shoe)) {
        sizeMatch = true
      }
    }

    if (sizeMatch) {
      score += 15 // Significant bonus for size match
      reasons.push('Size available')
    }
  }

  // Brand diversity bonus (avoid same brand in outfit)
  if (!usedBrands.has(product.brand)) {
    score += scoringWeights.brandDiversity
  }

  // Subcategory diversity (avoid 2 t-shirts, 2 jeans, etc.)
  const subcategory = product.subcategory || product.category
  if (!usedSubcategories.has(subcategory)) {
    score += scoringWeights.subcategoryDiversity
  }

  // Gift suitability
  if (answers.purpose === 'gift') {
    if (product.giftSuitable) {
      score += scoringWeights.giftSuitable
      reasons.push('Gift suitable')
    }
    // Prefer premium brands for gifts
    if (premiumBrands.includes(product.brand)) {
      score += scoringWeights.premiumBrand
      reasons.push('Premium brand')
    }
  }

  // Featured products bonus (popularity indicator)
  if (product.featured) {
    score += scoringWeights.featured
    reasons.push('Featured/Popular')
  }

  // Price balance scoring
  const budget = parseInt(answers.budget) || 10000
  const priceRatio = product.price / budget

  if (priceRatio >= 0.3 && priceRatio <= 0.6) {
    // Sweet spot for good value
    score += scoringWeights.goodValue
    reasons.push('Good value')
  } else if (priceRatio > 0.8) {
    // Premium item for upsell
    score += scoringWeights.premiumPick
    reasons.push('Premium pick')
  }

  // Small random factor for variety
  score += Math.random() * scoringWeights.randomVariety

  return { product, score, reasons }
}

// Generate look name based on context
export const generateLookName = (
  index: number,
  answers: QuizAnswers,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _items: LookItem[]
): { name: string; desc: string } => {
  const isGift = answers.purpose === 'gift'

  // Use occasion-specific names when available
  if (!isGift && occasionSpecificNames[answers.occasion] && index === 0) {
    return occasionSpecificNames[answers.occasion]
  }

  return isGift ? giftSets[index] : personalLooks[index]
}

// Main recommendation engine
export const generateLocalRecommendations = (
  answers: QuizAnswers,
  allProducts: FirestoreProduct[],
  excludeProductIds: Set<string> = new Set()
): Look[] => {
  // Step 1: Filter base products by gender and budget (only products with IDs)
  let filtered = [...allProducts].filter(p =>
    p.id &&
    p.inStock &&
    p.stockQty > 0 &&
    !excludeProductIds.has(p.id)
  )

  if (answers.gender && answers.gender !== 'unisex') {
    filtered = filtered.filter(p =>
      p.gender === answers.gender || p.gender === 'unisex'
    )
  }

  if (answers.budget) {
    const maxBudget = parseInt(answers.budget)
    filtered = filtered.filter(p => p.price <= maxBudget)
  }

  // Step 2: Separate by category
  const clothes = filtered.filter(p => p.category === 'clothes')
  const accessories = filtered.filter(p => p.category === 'accessories')
  const shoes = filtered.filter(p => p.category === 'shoes')

  const looks: Look[] = []
  const usedProducts = new Set<string>()

  // Step 3: Generate 5 complete looks
  for (let i = 0; i < 5; i++) {
    const items: LookItem[] = []
    const usedColors = new Set<string>()
    const usedBrands = new Set<string>()
    const usedSubcategories = new Set<string>()
    let lookBudget = parseInt(answers.budget) || 10000

    // Score and sort available clothes
    const scoredClothes = clothes
      .filter(p => p.id && !usedProducts.has(p.id))
      .map(p => scoreProduct(p, answers, usedColors, usedBrands, usedSubcategories))
      .sort((a, b) => b.score - a.score)

    // Pick 1-2 clothing items (balance premium + affordable)
    const clothesToPick = Math.min(2, scoredClothes.length)
    let pickedClothes = 0
    let pickPremium = i % 2 === 0 // Alternate premium/affordable focus

    for (const scored of scoredClothes) {
      if (pickedClothes >= clothesToPick) break
      if (scored.product.price > lookBudget * 0.7) continue // Leave room for other items
      if (!scored.product.id) continue

      // Alternate between premium and affordable
      const isPremium = scored.product.price > lookBudget * 0.3
      if (pickedClothes === 0 || (pickPremium === isPremium)) {
        usedProducts.add(scored.product.id)
        usedBrands.add(scored.product.brand)
        usedSubcategories.add(scored.product.subcategory || scored.product.category)
        scored.product.colors?.forEach(c => usedColors.add(c.toLowerCase()))

        items.push({
          product_id: scored.product.id,
          product_name: scored.product.name,
          brand: scored.product.brand,
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
      .filter(p => p.id && !usedProducts.has(p.id) && p.price <= lookBudget * 0.5)
      .map(p => scoreProduct(p, answers, usedColors, usedBrands, usedSubcategories))
      .sort((a, b) => b.score - a.score)

    if (scoredAccessories.length > 0 && scoredAccessories[0].product.id) {
      const accessory = scoredAccessories[0]
      usedProducts.add(accessory.product.id!)

      items.push({
        product_id: accessory.product.id!,
        product_name: accessory.product.name,
        brand: accessory.product.brand,
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
      .filter(p => p.id && !usedProducts.has(p.id) && p.price <= lookBudget)
      .map(p => scoreProduct(p, answers, usedColors, usedBrands, usedSubcategories))
      .sort((a, b) => b.score - a.score)

    if (scoredShoes.length > 0 && scoredShoes[0].product.id) {
      const shoe = scoredShoes[0]
      usedProducts.add(shoe.product.id!)

      items.push({
        product_id: shoe.product.id!,
        product_name: shoe.product.name,
        brand: shoe.product.brand,
        category: 'shoes',
        price: shoe.product.price,
        image_url: shoe.product.images[0] || '/placeholder.jpg',
        product_url: `/shop/${shoe.product.id}`,
        styling_note: shoe.reasons[0] || 'Completes the look perfectly'
      })
    }

    // Create look if we have items (complete purchasable sets)
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
    return generateFallbackLooks(filtered, answers)
  }

  return looks
}

// Fallback function if scoring is too restrictive
const generateFallbackLooks = (products: FirestoreProduct[], answers: QuizAnswers): Look[] => {
  const clothes = products.filter(p => p.id && p.category === 'clothes')
  const accessories = products.filter(p => p.id && p.category === 'accessories')
  const shoes = products.filter(p => p.id && p.category === 'shoes')

  const looks: Look[] = []
  const used = new Set<string>()

  for (let i = 0; i < Math.min(5, Math.ceil(clothes.length / 2)); i++) {
    const items: LookItem[] = []

    // Pick clothes
    for (const c of clothes) {
      if (c.id && !used.has(c.id) && items.filter(x => x.category === 'clothes').length < 2) {
        used.add(c.id)
        items.push({
          product_id: c.id,
          product_name: c.name,
          brand: c.brand,
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
      if (a.id && !used.has(a.id)) {
        used.add(a.id)
        items.push({
          product_id: a.id,
          product_name: a.name,
          brand: a.brand,
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
      if (s.id && !used.has(s.id)) {
        used.add(s.id)
        items.push({
          product_id: s.id,
          product_name: s.name,
          brand: s.brand,
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

// Regenerate looks with exclusions (for "Get New Looks" feature)
export const regenerateLooks = (
  answers: QuizAnswers,
  allProducts: FirestoreProduct[],
  previousProductIds: string[]
): Look[] => {
  const excludeSet = new Set(previousProductIds)
  return generateLocalRecommendations(answers, allProducts, excludeSet)
}
