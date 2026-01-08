'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, ArrowLeft, Lock, ShoppingBag,
  Clock, Heart, Share2, Plus, Check,
  User, Gift, Wallet, Loader2, MessageCircle, Copy, X, RefreshCw, Camera
} from 'lucide-react'
import ProductImage from '@/components/ai-dresser/ProductImage'
import Toast, { useToast } from '@/components/ai-dresser/Toast'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { incrementAIDresserUsage, updateUserPreferences, consumeBonusAIDresserSession, getFirestoreProducts, FirestoreProduct } from '@/lib/firestore'
import { useRouter } from 'next/navigation'
import { regenerateLooks } from '@/lib/ai-dresser-engine'
import {
  addLookToCart,
  saveLookToWishlist,
  getShareUrls,
  getAIRecommendations,
  Look,
  LookItem
} from '@/lib/ai-dresser'
import { budgetOptions } from '@/lib/ai-dresser-constants'

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
  sizes: {
    top: string
    bottom: string
    shoe: string
  }
  photo?: string // Base64 or URL of uploaded photo
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

// budgetOptions imported from ai-dresser-constants

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


// Recommendation engine imported from ai-dresser-engine
// generateLocalRecommendations and regenerateLooks handle all scoring and look generation

export default function AIDresserPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string>('')
  const [hasAccess, setHasAccess] = useState(true)
  const [accessType, setAccessType] = useState<'daily_free' | 'bonus' | 'none'>('daily_free')
  const [bonusSessions, setBonusSessions] = useState(0)
  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([])
  const [currentStep, setCurrentStep] = useState(0) // 0 = intro, 1-8 = quiz steps, 9 = loading, 10 = results
  const [answers, setAnswers] = useState<QuizAnswers>({
    purpose: null,
    gender: null,
    style: '',
    occasion: '',
    budget: '',
    color: '',
    sizes: {
      top: '',
      bottom: '',
      shoe: '',
    },
    photo: undefined,
  })
  const [looks, setLooks] = useState<Look[]>([])
  const [activeLook, setActiveLook] = useState(0)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const [savedLooks, setSavedLooks] = useState<Set<number>>(new Set())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrls, setShareUrls] = useState<{ messenger?: string; whatsapp?: string; copy?: string } | null>(null)
  const [shownProductIds, setShownProductIds] = useState<string[]>([])
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [tryOnImages, setTryOnImages] = useState<string[]>([]) // Virtual try-on images for each look
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false)

  // Toast notifications
  const { toast, showToast, hideToast } = useToast()

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && activeLook < looks.length - 1) {
      setActiveLook(prev => prev + 1)
    }
    if (isRightSwipe && activeLook > 0) {
      setActiveLook(prev => prev - 1)
    }
  }

  // Load products from Firestore
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await getFirestoreProducts()
        setAllProducts(products)
      } catch {
        setAllProducts([])
      }
    }
    loadProducts()
  }, [])

  // Check access when user logs in
  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id) {
        // Generate session ID
        const newSessionId = `ai_session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
        setSessionId(newSessionId)

        // Session limit temporarily disabled for testing
        // TODO: Re-enable session check after AI Dresser is fixed
        setHasAccess(true)
        setAccessType('daily_free')
        // try {
        //   const accessResult = await checkAIDresserDailyAccess(user.id)
        //   setHasAccess(accessResult.hasAccess)
        //   setAccessType(accessResult.accessType)
        //   setBonusSessions(accessResult.bonusSessions)
        // } catch {
        //   setHasAccess(true)
        //   setAccessType('daily_free')
        // }
      }
    }
    checkAccess()
  }, [user])

  // Generate virtual try-on images for looks
  const generateVirtualTryOn = async (generatedLooks: Look[], userPhoto: string) => {
    setIsGeneratingTryOn(true)
    const tryOnResults: string[] = []

    // Generate try-on for each look
    for (let i = 0; i < generatedLooks.length; i++) {
      const look = generatedLooks[i]
      try {
        const response = await fetch('/api/ai-dresser/virtual-try-on', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userPhoto,
            productImages: look.items.map(item => ({
              name: item.product_name,
              category: item.category,
              imageUrl: item.image_url
            })),
            lookNumber: look.look_number
          })
        })

        const data = await response.json()
        if (data.success && data.tryOnImage) {
          tryOnResults[i] = data.tryOnImage
        } else {
          tryOnResults[i] = ''
        }
      } catch (error) {
        console.error(`Failed to generate try-on for look ${i + 1}:`, error)
        tryOnResults[i] = ''
      }
    }

    setTryOnImages(tryOnResults)
    setIsGeneratingTryOn(false)
  }

  // Generate recommendations
  const generateRecommendations = async () => {
    setCurrentStep(9) // Loading state

    // Track AI Dresser usage and save preferences
    if (user?.id) {
      try {
        // If using bonus session, decrement it
        if (accessType === 'bonus') {
          const consumed = await consumeBonusAIDresserSession(user.id)
          if (consumed) {
            setBonusSessions(prev => prev - 1)
          }
        } else {
          await incrementAIDresserUsage(user.id)
        }
      } catch (error) {
        console.error('Failed to track AI Dresser usage:', error)
        // Continue with recommendations even if tracking fails
      }

      try {
        await updateUserPreferences(user.id, {
          styles: answers.style ? [answers.style] : [],
          colors: answers.color ? [answers.color] : [],
        })
      } catch (error) {
        console.error('Failed to update user preferences:', error)
        // Continue with recommendations even if preferences fail to save
      }
    }

    // Fetch fresh product data to ensure accurate stock levels
    let freshProducts = allProducts
    try {
      const latestProducts = await getFirestoreProducts()
      if (latestProducts.length > 0) {
        freshProducts = latestProducts
        setAllProducts(latestProducts) // Update state with fresh data
      }
    } catch (error) {
      console.error('Failed to fetch fresh products, using cached data:', error)
    }

    // Prepare products for AI (filter by gender/budget first)
    let filteredProducts = freshProducts.filter(p => p.inStock && p.stockQty > 0)

    if (answers.gender && answers.gender !== 'unisex') {
      filteredProducts = filteredProducts.filter(p =>
        p.gender === answers.gender || p.gender === 'unisex'
      )
    }

    if (answers.budget) {
      const maxBudget = parseInt(answers.budget)
      // Only filter if we have a valid budget number
      if (!isNaN(maxBudget) && maxBudget > 0) {
        filteredProducts = filteredProducts.filter(p => p.price <= maxBudget)
      }
    }

    // Get AI recommendations from n8n workflow
    const aiResponse = await getAIRecommendations(
      sessionId,
      user?.id || 'guest',
      {
        purpose: answers.purpose || undefined,
        gender: answers.gender || undefined,
        style: answers.style,
        occasion: answers.occasion,
        budget: answers.budget,
        color: answers.color || 'ai-decide',
        sizes: answers.sizes,
        photo: answers.photo,
        recipient: answers.recipient,
        relationship: answers.relationship
      },
      filteredProducts.filter(p => p.id).map(p => ({
        id: p.id!,
        name: p.name,
        brand: p.brand,
        price: p.price,
        category: p.category,
        subcategory: p.subcategory,
        colors: p.colors,
        sizes: p.sizes,
        style: p.style,
        occasions: p.occasions,
        tags: p.tags,
        images: p.images,
        gender: p.gender,
        giftSuitable: p.giftSuitable
      }))
    )

    let generatedLooks: Look[]

    if (aiResponse?.success && aiResponse.looks?.length > 0) {
      // Use AI-generated looks from n8n workflow
      generatedLooks = aiResponse.looks
      setLooks(generatedLooks)
      setCurrentStep(10) // Results

      // If user uploaded a photo, generate virtual try-on images in background
      if (answers.photo && generatedLooks.length > 0) {
        generateVirtualTryOn(generatedLooks, answers.photo)
      }
    } else {
      // n8n failed - show error with option to retry
      console.error('n8n AI recommendations failed:', aiResponse)
      showToast('Failed to generate recommendations. Please try again.', 'error')
      setCurrentStep(8) // Go back to last quiz step to retry
    }
  }

  const handleAnswer = (field: keyof QuizAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep === 8) {
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
      case 3: return answers.purpose === 'gift' ? (answers.recipient !== '' && answers.style !== '') : answers.style !== ''
      case 4: return answers.occasion !== ''
      case 5: return answers.budget !== ''
      case 6: return true // Color is optional, AI can decide
      case 7: return true // Sizes are optional, can skip
      case 8: return true // Photo is optional, can skip
      default: return true
    }
  }

  // Helper function to get product by ID from loaded products
  const getProductById = (id: string) => allProducts.find(p => p.id === id)

  const addToCart = async (item: LookItem) => {
    // Get the full product details
    const product = getProductById(item.product_id)
    if (product && product.id) {
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
      // Only mark as added if product was found and added
      setAddedItems(prev => new Set([...prev, item.product_id]))
      showToast(`${product.name} added to cart`, 'cart')
    } else {
      showToast('Product not available', 'error')
    }
  }

  const addAllToCart = async (look: Look) => {
    // Track successfully added items
    const successfullyAdded: string[] = []

    // Add each item to cart
    for (const item of look.items) {
      const product = getProductById(item.product_id)
      if (product && product.id) {
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
        successfullyAdded.push(item.product_id)
      }
    }

    // Only mark items that were actually added
    if (successfullyAdded.length > 0) {
      const newItems = new Set(addedItems)
      successfullyAdded.forEach(id => newItems.add(id))
      setAddedItems(newItems)
      showToast(`${successfullyAdded.length} items added to cart`, 'cart')
    } else {
      showToast('No items could be added to cart', 'error')
    }

    // Try to notify n8n webhook
    try {
      await addLookToCart(sessionId, user?.id || '', look, 'add_all')
    } catch {
      // Silently fail if webhook not configured
    }

    // Send Facebook Messenger notification to admin
    try {
      await fetch('/api/webhook/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ai_dresser_action',
          data: {
            customerName: user?.name || 'Guest',
            customerEmail: user?.email || 'Not provided',
            items: look.items.map(item => ({
              name: item.product_name,
              price: item.price,
              quantity: 1
            })),
            total: look.total_price,
            lookName: look.look_name,
            source: 'AI Dresser'
          }
        })
      })
    } catch {
      // Silently fail if notification fails
    }
  }

  // One-click checkout - add all items and go directly to checkout
  const oneClickCheckout = async (look: Look) => {
    // Add all items to cart first
    await addAllToCart(look)
    // Navigate to checkout
    router.push('/checkout')
  }

  const saveLook = async (lookNumber: number) => {
    const look = looks.find(l => l.look_number === lookNumber)
    const isAlreadySaved = savedLooks.has(lookNumber)

    setSavedLooks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lookNumber)) {
        newSet.delete(lookNumber)
      } else {
        newSet.add(lookNumber)
      }
      return newSet
    })

    // Show toast notification
    if (isAlreadySaved) {
      showToast('Look removed from wishlist', 'info')
    } else {
      showToast(`${look?.look_name || 'Look'} saved to wishlist`, 'wishlist')
    }

    // Try to save to n8n webhook
    if (look && !isAlreadySaved) {
      try {
        await saveLookToWishlist(sessionId, user?.id || '', look)
      } catch {
        // Silently fail if webhook not configured
      }
    }
  }

  // Regenerate looks with new products
  const handleRegenerateLooks = async () => {
    setIsRegenerating(true)

    // Collect all currently shown product IDs
    const currentProductIds = looks.flatMap(look => look.items.map(item => item.product_id))
    const allShownIds = [...shownProductIds, ...currentProductIds]
    setShownProductIds(allShownIds)

    // Generate new looks excluding previously shown products
    const newLooks = regenerateLooks(answers, allProducts, allShownIds)

    if (newLooks.length > 0) {
      setLooks(newLooks)
      setActiveLook(0)
      setAddedItems(new Set())
      setSavedLooks(new Set())
      showToast('New looks generated!', 'success')
    } else {
      // If no new looks possible, reset exclusions and regenerate
      setShownProductIds([])
      const freshLooks = regenerateLooks(answers, allProducts, [])
      setLooks(freshLooks)
      setActiveLook(0)
      showToast('Showing fresh looks', 'info')
    }

    setIsRegenerating(false)
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
        showToast('Link copied to clipboard!', 'success')
      }
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    showToast('Link copied!', 'success')
    setShareModalOpen(false)
  }

  const totalSteps = 8 // Both personal and gift flows have 8 quiz steps

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
            You&apos;ve already used your free styling session for today.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-bold py-3 px-6 rounded-full transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Our Collection
            </Link>
            <p className="text-white/40 text-sm">
              Your session resets at 12:00 AM midnight
            </p>
            <p className="text-white/50 text-xs mt-2">
              💡 Tip: Make a purchase to earn bonus AI Dresser sessions!
            </p>
          </div>
        </div>
      ) : (
        <div>
          {user && (
            <p className="text-white/50 text-sm mb-4">
              Welcome back, <span className="text-gold font-medium">{user.name}</span>!
              {bonusSessions > 0 && (
                <span className="ml-2 text-gold">
                  ✨ {bonusSessions} bonus session{bonusSessions > 1 ? 's' : ''} available
                </span>
              )}
            </p>
          )}
          <button
            onClick={() => setCurrentStep(1)}
            className="group inline-flex items-center gap-3 bg-gold hover:bg-yellow-400 text-navy font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-gold/25 hover:shadow-gold/40"
          >
            Start Styling Session
            {accessType === 'bonus' && <span className="text-sm opacity-75">(Using Bonus)</span>}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      <p className="text-white/30 text-sm mt-6">
        1 free session per day • Purchases unlock bonus sessions
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

        case 3: // Style (personal) or Recipient + Style (gift)
          if (answers.purpose === 'gift') {
            return (
              <div className="space-y-6">
                {/* Recipient Selection */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Who are you shopping for?
                  </h2>
                  <p className="text-white/50 mb-4">Tell us about the recipient</p>

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

                {/* Style Selection for Gift Recipient */}
                {answers.recipient && (
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-xl font-bold text-white mb-2">
                      What style suits them best?
                    </h3>
                    <p className="text-white/50 mb-4">Pick their style preference</p>

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
                )}
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
              <p className="text-white/50 mb-8">What palette speaks to you? (Optional - AI can decide)</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleAnswer('color', 'ai-decide')}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    answers.color === 'ai-decide'
                      ? 'bg-gold/20 border-gold'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 border-2 border-navy" />
                  <p className="text-white font-medium">Let AI Decide</p>
                </button>
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

        case 7: // Sizes
          return (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                What are your sizes?
              </h2>
              <p className="text-white/50 mb-8">Help us find the perfect fit (Optional)</p>

              <div className="space-y-6">
                {/* Top Size */}
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Top Size (Shirt/Jacket)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                      <button
                        key={size}
                        onClick={() => setAnswers(prev => ({ ...prev, sizes: { ...prev.sizes, top: size } }))}
                        className={`py-3 rounded-xl border-2 transition-all font-medium ${
                          answers.sizes.top === size
                            ? 'bg-gold/20 border-gold text-gold'
                            : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Size */}
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Bottom Size (Pants/Shorts)</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'].map(size => (
                      <button
                        key={size}
                        onClick={() => setAnswers(prev => ({ ...prev, sizes: { ...prev.sizes, bottom: size } }))}
                        className={`py-3 rounded-xl border-2 transition-all font-medium ${
                          answers.sizes.bottom === size
                            ? 'bg-gold/20 border-gold text-gold'
                            : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shoe Size */}
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Shoe Size</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'].map(size => (
                      <button
                        key={size}
                        onClick={() => setAnswers(prev => ({ ...prev, sizes: { ...prev.sizes, shoe: size } }))}
                        className={`py-3 rounded-xl border-2 transition-all font-medium ${
                          answers.sizes.shoe === size
                            ? 'bg-gold/20 border-gold text-gold'
                            : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )

        case 8: // Photo Upload
          return (
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Upload your photo
              </h2>
              <p className="text-white/50 mb-8">A full body photo helps AI understand your body type (Optional)</p>

              <div className="space-y-4">
                {answers.photo ? (
                  <div className="relative">
                    <div className="aspect-[3/4] max-w-xs mx-auto rounded-2xl overflow-hidden bg-white/10">
                      <img
                        src={answers.photo}
                        alt="Your photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => setAnswers(prev => ({ ...prev, photo: undefined }))}
                      className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-gold/50 transition-colors">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white/50" />
                      </div>
                      <p className="text-white font-medium mb-1">Upload a full body photo</p>
                      <p className="text-white/40 text-sm">JPG, PNG up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setAnswers(prev => ({ ...prev, photo: reader.result as string }))
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                )}

                <button
                  onClick={() => nextStep()}
                  className="w-full py-3 rounded-xl border-2 border-white/10 text-white/50 hover:border-white/30 hover:text-white transition-all text-sm"
                >
                  Skip this step
                </button>
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
            {currentStep === 8 ? 'Get My Looks' : 'Continue'}
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
        <p className="text-white/50 mb-4">
          Based on your {answers.style?.replace('-', ' ')} style for {answers.occasion?.replace('-', ' ')}
        </p>
        <button
          onClick={handleRegenerateLooks}
          disabled={isRegenerating}
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full transition-all border border-white/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          {isRegenerating ? 'Generating...' : 'Get New Looks'}
        </button>
      </div>

      {/* Look Navigation */}
      <div
        className="flex justify-center gap-2 mb-8"
        role="tablist"
        aria-label="Outfit looks navigation"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            setActiveLook(prev => Math.max(0, prev - 1))
          } else if (e.key === 'ArrowRight') {
            setActiveLook(prev => Math.min(looks.length - 1, prev + 1))
          }
        }}
      >
        {looks.map((look, index) => (
          <button
            key={look.look_number}
            role="tab"
            aria-selected={activeLook === index}
            aria-controls={`look-panel-${index}`}
            aria-label={`View ${look.look_name}, outfit ${look.look_number} of ${looks.length}`}
            tabIndex={activeLook === index ? 0 : -1}
            onClick={() => setActiveLook(index)}
            className={`w-12 h-12 rounded-full font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-navy ${
              activeLook === index
                ? 'bg-gold text-navy scale-110'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {look.look_number}
          </button>
        ))}
      </div>

      {/* Active Look Card - Swipe enabled */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLook}
          id={`look-panel-${activeLook}`}
          role="tabpanel"
          aria-labelledby={`look-tab-${activeLook}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Look Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {looks[activeLook].look_name}
                </h3>
                <p className="text-white/70 text-sm">
                  {looks[activeLook].look_description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm">Total</p>
                <p className="text-2xl font-bold text-gold">
                  ₱{looks[activeLook].total_price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Items Grid - Virtual Try-On or Product Cards */}
          <div className="p-6">
            {/* Virtual Try-On View (when photo uploaded) */}
            {answers.photo && tryOnImages[activeLook] ? (
              <div className="mb-6">
                {/* Try-On Image */}
                <div className="relative aspect-[3/4] max-w-md mx-auto mb-6 rounded-2xl overflow-hidden bg-white/10">
                  {isGeneratingTryOn ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Loader2 className="w-10 h-10 text-gold animate-spin mb-3" />
                      <p className="text-white/70 text-sm">Creating your virtual try-on...</p>
                    </div>
                  ) : (
                    <img
                      src={tryOnImages[activeLook]}
                      alt={`Virtual try-on for ${looks[activeLook].look_name}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-gold/90 text-navy text-xs font-bold px-3 py-1 rounded-full">
                    Virtual Try-On
                  </div>
                </div>

                {/* Product Thumbnails */}
                <p className="text-white/50 text-sm text-center mb-3">Items in this look:</p>
                <div className="grid grid-cols-4 gap-2">
                  {looks[activeLook].items.map((item) => (
                    <Link
                      key={item.product_id}
                      href={item.product_url}
                      className="bg-white/5 rounded-lg overflow-hidden group block"
                    >
                      <div className="relative aspect-square">
                        <ProductImage
                          src={item.image_url}
                          alt={item.product_name}
                          brand={item.brand}
                          category={item.category}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            addToCart(item)
                          }}
                          className={`absolute bottom-1 right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 ${
                            addedItems.has(item.product_id)
                              ? 'bg-green-500 text-white'
                              : 'bg-gold text-navy opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {addedItems.has(item.product_id) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="p-2">
                        <p className="text-white text-xs font-medium truncate">{item.product_name}</p>
                        <p className="text-gold text-xs font-semibold">₱{item.price.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : answers.photo && !tryOnImages[activeLook] ? (
              /* Photo uploaded but try-on not yet generated */
              <div className="mb-6">
                <div className="relative aspect-[3/4] max-w-md mx-auto mb-6 rounded-2xl overflow-hidden bg-white/10">
                  <img
                    src={answers.photo}
                    alt="Your uploaded photo"
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                    <Camera className="w-12 h-12 text-gold mb-3" />
                    <p className="text-white font-medium text-center px-4">Virtual try-on coming soon!</p>
                    <p className="text-white/50 text-sm text-center px-4 mt-1">AI is analyzing your photo to create personalized looks</p>
                  </div>
                </div>

                {/* Regular Product Grid below photo */}
                <p className="text-white/50 text-sm text-center mb-3">Recommended items:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {looks[activeLook].items.map((item) => (
                    <Link
                      key={item.product_id}
                      href={item.product_url}
                      className="bg-white/5 rounded-xl overflow-hidden group block"
                    >
                      <div className="relative">
                        <ProductImage
                          src={item.image_url}
                          alt={item.product_name}
                          brand={item.brand}
                          category={item.category}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            addToCart(item)
                          }}
                          className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
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
                        <p className="text-white/60 text-xs mb-0.5">{item.brand}</p>
                        <p className="text-white text-sm font-medium truncate">{item.product_name}</p>
                        <p className="text-gold font-semibold">₱{item.price.toLocaleString()}</p>
                        <p className="text-white/40 text-xs mt-1 line-clamp-2">{item.styling_note}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              /* No photo - Regular Product Cards */
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {looks[activeLook].items.map((item) => (
                  <Link
                    key={item.product_id}
                    href={item.product_url}
                    className="bg-white/5 rounded-xl overflow-hidden group block"
                  >
                    <div className="relative">
                      <ProductImage
                        src={item.image_url}
                        alt={item.product_name}
                        brand={item.brand}
                        category={item.category}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          addToCart(item)
                        }}
                        className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
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
                      <p className="text-white/60 text-xs mb-0.5">{item.brand}</p>
                      <p className="text-white text-sm font-medium truncate">{item.product_name}</p>
                      <p className="text-gold font-semibold">₱{item.price.toLocaleString()}</p>
                      <p className="text-white/40 text-xs mt-1 line-clamp-2">{item.styling_note}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Style Tip */}
            <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 mb-6">
              <p className="text-gold text-sm font-medium mb-1">Style Tip</p>
              <p className="text-white/70 text-sm">{looks[activeLook].style_tip}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => addAllToCart(looks[activeLook])}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-bold py-4 px-6 rounded-full transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
                Add All to Cart
              </button>

              <button
                onClick={() => oneClickCheckout(looks[activeLook])}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-full transition-all"
              >
                <ArrowRight className="w-5 h-5" />
                Buy Now
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
            setAnswers({ purpose: null, gender: null, style: '', occasion: '', budget: '', color: '', sizes: { top: '', bottom: '', shoe: '' }, photo: undefined })
            setLooks([])
            setActiveLook(0)
            setAddedItems(new Set())
            setSavedLooks(new Set())
            setTryOnImages([])
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
            {currentStep >= 1 && currentStep <= 8 && renderQuizStep()}
            {currentStep === 9 && renderLoading()}
            {currentStep === 10 && renderResults()}
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

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </>
  )
}
