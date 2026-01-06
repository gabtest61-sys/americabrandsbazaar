'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, ArrowLeft, Lock, ShoppingBag,
  Clock, Heart, Share2, Plus, Check,
  User, Gift, Shirt, Wallet, Loader2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useAuth } from '@/context/AuthContext'

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

interface LookItem {
  product_id: string
  product_name: string
  category: string
  price: number
  image_url: string
  product_url: string
  styling_note: string
}

interface Look {
  look_number: number
  look_name: string
  look_description: string
  items: LookItem[]
  total_price: number
  style_tip: string
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

// Mock recommendations for demo
const mockLooks: Look[] = [
  {
    look_number: 1,
    look_name: 'Casual Street Style',
    look_description: 'Perfect for everyday adventures with a touch of urban edge',
    items: [
      { product_id: '1', product_name: 'Calvin Klein Oversized Tee', category: 'clothes', price: 1899, image_url: '/products/ck-tee.jpg', product_url: '/shop/ck-tee', styling_note: 'Tuck the front for a relaxed look' },
      { product_id: '2', product_name: 'Nike Air Max 90', category: 'shoes', price: 6995, image_url: '/products/nike-airmax.jpg', product_url: '/shop/nike-airmax', styling_note: 'Classic silhouette that goes with everything' },
      { product_id: '3', product_name: 'Michael Kors Crossbody', category: 'accessories', price: 4500, image_url: '/products/mk-bag.jpg', product_url: '/shop/mk-bag', styling_note: 'Adds sophistication to casual fits' },
    ],
    total_price: 13394,
    style_tip: 'Roll up your sleeves slightly for extra style points'
  },
  {
    look_number: 2,
    look_name: 'Smart Casual Elegance',
    look_description: 'Effortlessly polished for work-to-dinner transitions',
    items: [
      { product_id: '4', product_name: 'Ralph Lauren Polo', category: 'clothes', price: 3299, image_url: '/products/rl-polo.jpg', product_url: '/shop/rl-polo', styling_note: 'Pop the collar for a preppy vibe' },
      { product_id: '5', product_name: 'GAP Slim Chinos', category: 'clothes', price: 2499, image_url: '/products/gap-chinos.jpg', product_url: '/shop/gap-chinos', styling_note: 'Cuff at the ankle for a modern touch' },
      { product_id: '6', product_name: 'CK Leather Belt', category: 'accessories', price: 1899, image_url: '/products/ck-belt.jpg', product_url: '/shop/ck-belt', styling_note: 'Match with your shoe color' },
    ],
    total_price: 7697,
    style_tip: 'Add a watch to complete the sophisticated look'
  },
  {
    look_number: 3,
    look_name: 'Weekend Wanderer',
    look_description: 'Comfortable yet stylish for your off-duty days',
    items: [
      { product_id: '7', product_name: 'Nike Tech Hoodie', category: 'clothes', price: 4299, image_url: '/products/nike-hoodie.jpg', product_url: '/shop/nike-hoodie', styling_note: 'Layer over a plain tee' },
      { product_id: '8', product_name: 'GAP Joggers', category: 'clothes', price: 1999, image_url: '/products/gap-joggers.jpg', product_url: '/shop/gap-joggers', styling_note: 'Tapered fit for a clean silhouette' },
      { product_id: '9', product_name: 'Nike Dunk Low', category: 'shoes', price: 5495, image_url: '/products/nike-dunk.jpg', product_url: '/shop/nike-dunk', styling_note: 'Iconic sneaker for any outfit' },
    ],
    total_price: 11793,
    style_tip: 'Keep accessories minimal for this athleisure look'
  },
  {
    look_number: 4,
    look_name: 'Date Night Ready',
    look_description: 'Make an impression with this refined ensemble',
    items: [
      { product_id: '10', product_name: 'CK Slim Fit Shirt', category: 'clothes', price: 2899, image_url: '/products/ck-shirt.jpg', product_url: '/shop/ck-shirt', styling_note: 'Leave top button undone' },
      { product_id: '11', product_name: 'Ralph Lauren Blazer', category: 'clothes', price: 8999, image_url: '/products/rl-blazer.jpg', product_url: '/shop/rl-blazer', styling_note: 'Push sleeves up for a relaxed feel' },
      { product_id: '12', product_name: 'MK Leather Watch', category: 'accessories', price: 7500, image_url: '/products/mk-watch.jpg', product_url: '/shop/mk-watch', styling_note: 'Classic timepiece that elevates any look' },
    ],
    total_price: 19398,
    style_tip: 'A subtle cologne completes this ensemble'
  },
  {
    look_number: 5,
    look_name: 'Minimalist Modern',
    look_description: 'Less is more with this clean, contemporary style',
    items: [
      { product_id: '13', product_name: 'CK Basic Tee (White)', category: 'clothes', price: 1299, image_url: '/products/ck-white-tee.jpg', product_url: '/shop/ck-white-tee', styling_note: 'Perfect fit is key' },
      { product_id: '14', product_name: 'GAP Black Jeans', category: 'clothes', price: 2799, image_url: '/products/gap-jeans.jpg', product_url: '/shop/gap-jeans', styling_note: 'Slim fit for a sleek look' },
      { product_id: '15', product_name: 'Nike White Sneakers', category: 'shoes', price: 4995, image_url: '/products/nike-white.jpg', product_url: '/shop/nike-white', styling_note: 'Keep them clean!' },
      { product_id: '16', product_name: 'CK Minimalist Watch', category: 'accessories', price: 5999, image_url: '/products/ck-watch.jpg', product_url: '/shop/ck-watch', styling_note: 'Simple elegance' },
    ],
    total_price: 15092,
    style_tip: 'Stick to a monochrome palette for maximum impact'
  },
]

export default function AIDresserPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth()
  const [hasAccess, setHasAccess] = useState(true) // TODO: Connect to session check API
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

  // Simulate loading recommendations
  const generateRecommendations = async () => {
    setCurrentStep(7) // Loading state

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2500))

    // In production, this would call the n8n webhook
    // POST /webhook/ai-dresser/get-recommendations
    setLooks(mockLooks)
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

  const addToCart = (item: LookItem) => {
    setAddedItems(prev => new Set([...prev, item.product_id]))
    // TODO: Call cart API
  }

  const addAllToCart = (look: Look) => {
    const newItems = new Set(addedItems)
    look.items.forEach(item => newItems.add(item.product_id))
    setAddedItems(newItems)
    // TODO: Call cart API with all items
  }

  const saveLook = (lookNumber: number) => {
    setSavedLooks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lookNumber)) {
        newSet.delete(lookNumber)
      } else {
        newSet.add(lookNumber)
      }
      return newSet
    })
    // TODO: Call wishlist API
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
          <Link
            href="/login?redirect=ai-dresser"
            className="inline-flex items-center gap-2 bg-gold hover:bg-yellow-400 text-navy font-bold py-3 px-6 rounded-full transition-all"
          >
            Sign In to Continue
            <ArrowRight className="w-5 h-5" />
          </Link>
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

              <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-full transition-all border border-white/10">
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
    </>
  )
}
