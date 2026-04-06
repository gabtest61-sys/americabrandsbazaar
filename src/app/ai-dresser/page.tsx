'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Upload, Sparkles, ShoppingCart, Wand2, Lock,
  RotateCcw, AlertCircle, ChevronRight, Loader2,
  CheckCircle, X, ImageIcon, Shirt, Palette,
  User, ArrowRight, ZoomIn,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { getFirestoreProducts, FirestoreProduct } from '@/lib/firestore'

// ─── Style quiz options ───────────────────────────────────────────────────────
const GENDERS = ['Men', 'Women', 'Both']
const STYLES = ['Casual', 'Smart-Casual', 'Sporty', 'Formal', 'Streetwear']
const OCCASIONS = ['Everyday', 'Work', 'Sports', 'Going Out', 'Special Event']
const COLOR_GROUPS: Record<string, string[]> = {
  Neutrals: ['white', 'black', 'grey', 'gray', 'beige', 'cream', 'ivory', 'off-white'],
  'Earth Tones': ['brown', 'tan', 'camel', 'khaki', 'olive', 'rust', 'terracotta'],
  Bold: ['red', 'blue', 'yellow', 'green', 'orange', 'pink', 'purple', 'fuchsia'],
  Pastels: ['light blue', 'light pink', 'lavender', 'mint', 'peach', 'lilac'],
  Dark: ['navy', 'charcoal', 'dark green', 'maroon', 'burgundy', 'forest green'],
}

const AI_DECIDE = 'Let AI Decide'

type TryOnStatus = 'idle' | 'uploading' | 'generating' | 'done' | 'failed'
type PageStep = 'quiz' | 'results'

// ─── Helper: filter products by preferences ──────────────────────────────────
function filterProducts(
  products: FirestoreProduct[],
  gender: string,
  style: string,
  occasion: string,
  colorGroup: string
): FirestoreProduct[] {
  if (products.length === 0) return []

  const selectedColors = COLOR_GROUPS[colorGroup] || []

  const scored = products
    .filter((p) => {
      if (!p.inStock) return false

      // Hard gender filter — products with no gender field pass through for all selections
      if (gender !== 'Both' && p.gender) {
        const g = p.gender.toLowerCase()
        const isUnisex = g === 'unisex' || g === 'both' || g === 'all'
        const matchesMen = gender === 'Men' && (g.includes('men') || g.includes('male') || g.includes('man'))
        const matchesWomen = gender === 'Women' && (g.includes('women') || g.includes('female') || g.includes('woman') || g.includes('girl'))
        if (!isUnisex && !matchesMen && !matchesWomen) return false
      }

      return true
    })
    .map((p) => {
      let score = 1 // base score — gender already hard-filtered above

      // Style / tag match
      const allText = [
        ...p.tags,
        p.category,
        p.subcategory || '',
        p.name,
        p.description,
      ]
        .join(' ')
        .toLowerCase()

      if (allText.includes(style.toLowerCase())) score += 3
      if (allText.includes(occasion.toLowerCase())) score += 2
      if (style === 'Casual' && allText.match(/casual|everyday|basic|tee|jeans|denim/)) score += 2
      if (style === 'Sporty' && allText.match(/sport|athletic|gym|running|activewear/)) score += 2
      if (style === 'Formal' && allText.match(/formal|suit|dress|blazer|button/)) score += 2
      if (style === 'Streetwear' && allText.match(/street|urban|hoodie|sneaker|hype/)) score += 2
      if (occasion === 'Work' && allText.match(/work|office|business|professional/)) score += 2

      // Color match
      if (selectedColors.length > 0) {
        const productColors = p.colors.map((c) => c.toLowerCase())
        if (selectedColors.some((sc) => productColors.some((pc) => pc.includes(sc) || sc.includes(pc)))) {
          score += 2
        }
      }

      return { product: p, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 8).map((s) => s.product)
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIDresserPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth()
  const { addItem } = useCart()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const [allProducts, setAllProducts] = useState<FirestoreProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Quiz state
  const [gender, setGender] = useState('Both')
  const [style, setStyle] = useState('')
  const [occasion, setOccasion] = useState('')
  const [colorGroup, setColorGroup] = useState('')
  const [pageStep, setPageStep] = useState<PageStep>('quiz')
  const [recommended, setRecommended] = useState<FirestoreProduct[]>([])
  const [aiStyleNote, setAiStyleNote] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Photo upload state
  const [uploadedDataUrl, setUploadedDataUrl] = useState('')

  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Try-on state
  const [tryOnProduct, setTryOnProduct] = useState<FirestoreProduct | null>(null)
  const [tryOnStatus, setTryOnStatus] = useState<TryOnStatus>('idle')
  const [tryOnImageUrl, setTryOnImageUrl] = useState('')
  const [zoomOpen, setZoomOpen] = useState(false)
  const [tryOnError, setTryOnError] = useState('')
  const [addedToCart, setAddedToCart] = useState<string[]>([])

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const tryOnSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoggedIn) return
    setLoadingProducts(true)
    getFirestoreProducts()
      .then(setAllProducts)
      .catch(console.error)
      .finally(() => setLoadingProducts(false))
  }, [isLoggedIn])

  // Stop polling on unmount
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current) }, [])

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { setTryOnError('Please upload an image file'); return }
    if (file.size > 10 * 1024 * 1024) { setTryOnError('Image must be under 10MB'); return }
    setTryOnError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      const original = e.target?.result as string
      // Compress to max 900px and 0.85 quality to keep upload under 1MB
      const img = new window.Image()
      img.onload = () => {
        const MAX = 900
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        setUploadedDataUrl(compressed)
        setTryOnStatus('idle')
        setTryOnImageUrl('')
        setTryOnProduct(null)
      }
      img.src = original
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault(); setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const findRecommendations = async () => {
    setAiError('')
    setAiStyleNote('')

    if (colorGroup === AI_DECIDE) {
      // Use DeepSeek AI to pick products
      if (!style || !occasion) return
      setIsAiLoading(true)
      try {
        const productData = allProducts.filter((p) => p.inStock).map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          subcategory: p.subcategory,
          colors: p.colors,
          price: p.price,
          tags: p.tags,
          gender: p.gender,
          inStock: p.inStock,
        }))

        const res = await fetch('/api/ai-dresser/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gender, style, occasion, products: productData }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        const picks = allProducts.filter((p) =>
          (data.recommendedProductIds as string[]).includes(p.id as string)
        )
        // Fallback also respects gender filter
        const genderFallback = allProducts.filter((p) => {
          if (!p.inStock) return false
          if (gender === 'Both' || !p.gender) return true
          const g = p.gender.toLowerCase()
          if (g === 'unisex' || g === 'both' || g === 'all') return true
          if (gender === 'Men') return g.includes('men') || g.includes('male') || g.includes('man')
          if (gender === 'Women') return g.includes('women') || g.includes('female') || g.includes('woman')
          return true
        })
        setRecommended(picks.length > 0 ? picks : genderFallback.slice(0, 8))
        setAiStyleNote(data.styleNote || '')
        setPageStep('results')
      } catch (err: any) {
        setAiError(err.message || 'AI failed to respond. Try again or pick a color group.')
      } finally {
        setIsAiLoading(false)
      }
    } else {
      // Client-side filtering
      const results = filterProducts(allProducts, gender, style, occasion, colorGroup)
      setRecommended(results.length > 0 ? results : allProducts.filter((p) => p.inStock).slice(0, 8))
      setPageStep('results')
    }
  }

  const startTryOn = async (product: FirestoreProduct) => {
    if (!uploadedDataUrl) { setTryOnError('Upload a photo first to try on this item'); return }
    if (!product.images?.[0]) { setTryOnError('This product has no image available'); return }

    setTryOnProduct(product)
    setTryOnStatus('generating')
    setTryOnImageUrl('')
    setTryOnError('')

    // Scroll to top of right panel immediately — anchor is always in DOM
    tryOnSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    console.log('[TryOn] Starting try-on for:', product.brand, product.name)

    try {
      // Step 1: Upload user photo to Cloudinary to get a public URL
      setTryOnStatus('uploading')
      console.log('[TryOn] Uploading user photo to Cloudinary...')
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: uploadedDataUrl, folder: 'try-on-photos' }),
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'Failed to upload your photo')
      }
      const personImageUrl = uploadData.url
      console.log('[TryOn] User photo uploaded:', personImageUrl)

      // Step 2: Submit to NanoBanana with both person image and product (garment) image
      setTryOnStatus('generating')
      console.log('[TryOn] Submitting to NanoBanana...', { personImageUrl, productImage: product.images[0] })
      const res = await fetch('/api/ai-dresser/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImageUrl,
          productImageUrl: product.images[0],
          productName: product.name,
          productBrand: product.brand,
          productColors: product.colors,
          productCategory: product.category,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const { taskId } = data
      console.log('[TryOn] Task submitted, taskId:', taskId)

      // Step 3: Poll for result
      let attempts = 0
      const MAX_ATTEMPTS = 60 // 3 min max

      pollingRef.current = setInterval(async () => {
        attempts++
        if (attempts > MAX_ATTEMPTS) {
          clearInterval(pollingRef.current!)
          setTryOnStatus('failed')
          setTryOnError('Try-on timed out. Please try again.')
          return
        }

        try {
          const statusRes = await fetch(`/api/ai-dresser/try-on/status?taskId=${taskId}`)
          const statusData = await statusRes.json()
          console.log(`[TryOn] Poll #${attempts}:`, statusData.status)

          if (statusData.status === 'done') {
            clearInterval(pollingRef.current!)
            console.log('[TryOn] Done! Image URL:', statusData.imageUrl)
            setTryOnImageUrl(statusData.imageUrl)
            setTryOnStatus('done')
            tryOnSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          } else if (statusData.status === 'failed') {
            clearInterval(pollingRef.current!)
            console.error('[TryOn] Failed:', statusData.error)
            setTryOnStatus('failed')
            setTryOnError(statusData.error || 'Generation failed')
          }
          // status === 'pending' → keep polling
        } catch (pollErr) {
          console.warn('[TryOn] Poll network glitch, retrying...', pollErr)
        }
      }, 3000)
    } catch (err: any) {
      console.error('[TryOn] Error:', err)
      setTryOnStatus('failed')
      setTryOnError(err.message || 'Failed to start try-on')
    }
  }

  const handleAddToCart = (product: FirestoreProduct) => {
    addItem(product as any)
    setAddedToCart((prev) => [...prev, product.id as string])
    setTimeout(() => setAddedToCart((prev) => prev.filter((id) => id !== product.id)), 2000)
  }

  const quizComplete = style && occasion && colorGroup
  const isAiMode = colorGroup === AI_DECIDE

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-navy-900 pt-24 pb-6 md:pb-12">
        <div className="container-max px-4 md:px-8">
          <nav className="hidden md:flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gold-400">AI Dresser</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-gold-400" />
                </div>
                <span className="text-gold-400 text-xs md:text-sm font-medium uppercase tracking-widest">
                  Powered by AI
                </span>
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-white mb-2">
                AI Personal Stylist
              </h1>
              <p className="text-white/60 text-sm md:text-lg max-w-xl">
                Tell us your style, get tailored picks, then see yourself wearing them.
              </p>
            </div>
            <div className="hidden md:flex flex-wrap gap-3">
              {[
                { icon: Shirt, label: 'Style Quiz' },
                { icon: Sparkles, label: 'Smart Picks' },
                { icon: Wand2, label: 'Virtual Try-On' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                  <Icon className="w-4 h-4 text-gold-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="bg-gray-50 min-h-screen">
        <div className="container-max px-3 md:px-8 py-6 md:py-12">

          {/* Auth loading */}
          {authLoading && (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 text-navy-600 animate-spin" />
            </div>
          )}

          {/* Not logged in */}
          {!authLoading && !isLoggedIn && (
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 rounded-full bg-navy-900/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-9 h-9 text-navy-800" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-navy-900 mb-3">Sign In Required</h2>
              <p className="text-gray-500 mb-8 text-lg">
                Create a free account to access the AI Dresser and get personalized style
                recommendations with virtual try-on.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true) }}
                  className="px-8 py-3 bg-navy-900 text-white rounded-xl font-semibold hover:bg-navy-800 transition-colors"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}
                  className="px-8 py-3 bg-white text-navy-900 border border-navy-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* Logged in */}
          {!authLoading && isLoggedIn && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

              {/* ── Left sidebar ─────────────────────────────────────────── */}
              <div className={`lg:col-span-1 lg:sticky lg:top-24 lg:self-start space-y-4 ${pageStep === 'results' ? 'hidden lg:block' : ''}`}>

                {/* Photo upload card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-navy-600" />
                      <h2 className="font-serif text-base md:text-lg font-bold text-navy-900">Your Photo</h2>
                    </div>
                    <span className="text-gray-400 text-[10px]">Optional · For try-on</span>
                  </div>

                  {!uploadedDataUrl ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`mt-2 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 py-4 px-4 cursor-pointer transition-all ${isDragging ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-navy-400 hover:bg-gray-50'}`}
                    >
                      <Upload className="w-5 h-5 text-navy-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-navy-800 text-sm">Tap to upload photo</p>
                        <p className="text-gray-400 text-xs">Max 10MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={uploadedDataUrl} alt="Your photo" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-navy-800 text-sm font-medium">Photo ready ✓</p>
                        <p className="text-gray-400 text-xs">Tap try-on on any product</p>
                      </div>
                      <button
                        onClick={() => { setUploadedDataUrl(''); setTryOnStatus('idle'); setTryOnImageUrl(''); setTryOnProduct(null) }}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </div>

                {/* Style quiz card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-navy-600" />
                    <h2 className="font-serif text-base md:text-lg font-bold text-navy-900">Style Quiz</h2>
                  </div>

                  {/* Gender */}
                  <div className="mb-3">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Shopping for</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {GENDERS.map((g) => (
                        <button key={g} onClick={() => setGender(g)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex-shrink-0 ${gender === g ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-gray-600 border-gray-200'}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style */}
                  <div className="mb-3">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">My style vibe</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {STYLES.map((s) => (
                        <button key={s} onClick={() => setStyle(s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex-shrink-0 ${style === s ? 'bg-gold-500 text-navy-900 border-gold-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Occasion */}
                  <div className="mb-3">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Occasion</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {OCCASIONS.map((o) => (
                        <button key={o} onClick={() => setOccasion(o)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex-shrink-0 ${occasion === o ? 'bg-gold-500 text-navy-900 border-gold-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color group */}
                  <div className="mb-4">
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Favorite colors</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {Object.keys(COLOR_GROUPS).map((cg) => (
                        <button key={cg} onClick={() => setColorGroup(cg)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex-shrink-0 ${colorGroup === cg ? 'bg-gold-500 text-navy-900 border-gold-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                          {cg}
                        </button>
                      ))}
                      {/* AI Decide option */}
                      <button
                        onClick={() => setColorGroup(AI_DECIDE)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                          colorGroup === AI_DECIDE
                            ? 'bg-navy-900 text-gold-400 border-navy-900 shadow-md'
                            : 'bg-white text-navy-700 border-navy-200'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        Let AI Decide
                      </button>
                    </div>
                    {colorGroup === AI_DECIDE && (
                      <p className="mt-2 text-xs text-navy-500 bg-navy-50 border border-navy-100 rounded-lg px-3 py-2">
                        DeepSeek AI picks the best products for your style & occasion.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={findRecommendations}
                    disabled={!quizComplete || loadingProducts || isAiLoading}
                    className="w-full py-3 rounded-xl bg-navy-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors disabled:opacity-40"
                  >
                    {(loadingProducts || isAiLoading) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-gold-400" />
                    )}
                    {loadingProducts ? 'Loading catalog…' : isAiLoading ? 'AI is thinking…' : isAiMode ? 'Ask AI to Style Me' : 'Find My Style'}
                    {!loadingProducts && !isAiLoading && <ArrowRight className="w-4 h-4" />}
                  </button>

                  {aiError && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {aiError}
                    </div>
                  )}

                  {!quizComplete && (
                    <p className="text-center text-xs text-gray-400 mt-2">Select style, occasion & colors to continue</p>
                  )}

                  {pageStep === 'results' && (
                    <button
                      onClick={() => { setPageStep('quiz'); setRecommended([]); setAiStyleNote(''); setAiError(''); setTryOnStatus('idle'); setTryOnImageUrl(''); setTryOnProduct(null) }}
                      className="mt-2 w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* ── Right panel ───────────────────────────────────────────── */}
              <div className={`lg:col-span-2 space-y-4 lg:space-y-6 ${pageStep === 'quiz' ? 'hidden lg:block' : ''}`}>

                {/* Mobile: back to quiz button */}
                {pageStep === 'results' && (
                  <div className="flex items-center justify-between lg:hidden">
                    <button
                      onClick={() => { setPageStep('quiz'); setRecommended([]); setAiStyleNote(''); setAiError(''); setTryOnStatus('idle'); setTryOnImageUrl(''); setTryOnProduct(null) }}
                      className="flex items-center gap-2 text-sm text-navy-700 font-medium bg-white border border-gray-200 px-4 py-2 rounded-full"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Edit Style
                    </button>
                    <span className="text-sm text-gray-400">{recommended.length} picks</span>
                  </div>
                )}

                {/* Permanent anchor — always in DOM so scroll always works */}
                <div ref={tryOnSectionRef} />

                {/* ── Try-on section (generating or done) — shown at TOP ── */}
                {tryOnError && (
                  <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {tryOnError}
                  </div>
                )}

                {(tryOnStatus === 'uploading' || tryOnStatus === 'generating') && tryOnProduct && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-serif text-xl font-bold text-navy-900">AI Style Shot</h3>
                      <p className="text-gray-500 text-sm">{tryOnProduct.brand} — {tryOnProduct.name}</p>
                    </div>
                    <div className="p-6 max-w-xs mx-auto">
                      <div className="rounded-xl overflow-hidden bg-gray-100 aspect-[3/4] relative">
                        {tryOnProduct.images?.[0] && (
                          <img src={tryOnProduct.images[0]} alt="Product" className="w-full h-full object-cover opacity-20" />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/50">
                          <Loader2 className="w-10 h-10 text-navy-700 animate-spin" />
                          <p className="text-sm font-semibold text-navy-800">AI is generating…</p>
                          <p className="text-xs text-gray-400">This takes 20–60 seconds</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Try-on result */}
                {tryOnStatus === 'done' && tryOnImageUrl && tryOnProduct && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-navy-900">AI Style Shot</h3>
                        <p className="text-gray-500 text-sm">{tryOnProduct.brand} — {tryOnProduct.name}</p>
                      </div>
                      <button
                        onClick={() => { setTryOnStatus('idle'); setTryOnImageUrl(''); setTryOnProduct(null) }}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Close
                      </button>
                    </div>

                    <div className="p-6 max-w-xs mx-auto">
                      <div
                        className="rounded-xl overflow-hidden bg-gray-100 aspect-[3/4] relative group cursor-zoom-in"
                        onClick={() => setZoomOpen(true)}
                      >
                        <img src={tryOnImageUrl} alt="AI generated style shot" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <ZoomIn className="w-5 h-5 text-navy" />
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-xs text-gray-400 mt-2">Tap to zoom</p>
                    </div>

                    <div className="px-6 pb-6 flex gap-3">
                      <button
                        onClick={() => handleAddToCart(tryOnProduct)}
                        className="flex-1 py-3 rounded-xl bg-navy-900 text-white font-semibold flex items-center justify-center gap-2 hover:bg-navy-800 transition-colors"
                      >
                        {addedToCart.includes(tryOnProduct.id as string) ? (
                          <><CheckCircle className="w-4 h-4 text-green-400" /> Added!</>
                        ) : (
                          <><ShoppingCart className="w-4 h-4" /> Add to Cart — ₱{tryOnProduct.price.toLocaleString()}</>
                        )}
                      </button>
                      <button
                        onClick={() => { setTryOnStatus('idle'); setTryOnImageUrl(''); setTryOnProduct(null) }}
                        className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Try Another
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Empty state (desktop only — mobile hides this panel on quiz step) ── */}
                {pageStep === 'quiz' && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-16 text-center px-8">
                    <div className="w-14 h-14 rounded-2xl bg-gold-50 flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-gold-500" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-navy-900 mb-2">
                      Complete the style quiz
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                      Answer a few quick questions on the left and we&apos;ll pick the best items from our{' '}
                      {allProducts.length > 0 ? `${allProducts.length}-product` : ''} collection for you.
                    </p>
                  </div>
                )}

                {/* ── Recommendations ── */}
                {pageStep === 'results' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-serif text-2xl font-bold text-navy-900">Recommended For You</h2>
                        <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1.5">
                          {isAiMode && <Sparkles className="w-3.5 h-3.5 text-gold-500" />}
                          {style} · {occasion} · {isAiMode ? 'AI Selected' : colorGroup} · {gender}
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">{recommended.length} items</span>
                    </div>

                    {aiStyleNote && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-navy-900 border border-navy-800 text-white">
                        <Sparkles className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-white/80">{aiStyleNote}</p>
                      </div>
                    )}

                    {recommended.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
                        No products matched. Try different preferences.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        {recommended.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            isAddedToCart={addedToCart.includes(product.id as string)}
                            isThisTryOn={tryOnProduct?.id === product.id}
                            tryOnStatus={tryOnStatus}
                            hasPhoto={!!uploadedDataUrl}
                            onAddToCart={() => handleAddToCart(product)}
                            onTryOn={() => startTryOn(product)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authMode} />

      {/* Zoom Modal */}
      {zoomOpen && tryOnImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setZoomOpen(false)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={tryOnImageUrl}
            alt="AI Style Shot fullscreen"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function Camera({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ProductCard({
  product,
  isAddedToCart,
  isThisTryOn,
  tryOnStatus,
  hasPhoto,
  onAddToCart,
  onTryOn,
}: {
  product: FirestoreProduct
  isAddedToCart: boolean
  isThisTryOn: boolean
  tryOnStatus: TryOnStatus
  hasPhoto: boolean
  onAddToCart: () => void
  onTryOn: () => void
}) {
  const isBusy = tryOnStatus === 'uploading' || tryOnStatus === 'generating'
  const isLoading = isThisTryOn && isBusy
  const isDisabled = isBusy // disable ALL cards while any try-on is in progress

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
            SALE
          </span>
        )}
      </div>

      <div className="p-3 md:p-4">
        <p className="text-[10px] font-semibold text-gold-600 uppercase tracking-wider mb-0.5">{product.brand}</p>
        <h3 className="font-medium text-navy-900 text-xs md:text-sm line-clamp-2 mb-1">{product.name}</h3>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-navy-900 font-bold text-sm">₱{product.price.toLocaleString()}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-gray-400 text-xs line-through">₱{product.originalPrice.toLocaleString()}</span>
          )}
        </div>

        <div className="flex gap-1.5 md:gap-2">
          <button
            onClick={onAddToCart}
            className="flex-1 py-2 md:py-2.5 rounded-xl border border-navy-200 text-navy-800 text-xs md:text-sm font-medium flex items-center justify-center gap-1 md:gap-1.5 hover:bg-navy-50 transition-colors"
          >
            {isAddedToCart ? (
              <><CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-500" /> Added!</>
            ) : (
              <><ShoppingCart className="w-3 h-3 md:w-3.5 md:h-3.5" /> Cart</>
            )}
          </button>
          <button
            onClick={onTryOn}
            disabled={isDisabled}
            title={!hasPhoto ? 'Upload a photo first' : undefined}
            className={`flex-1 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold flex items-center justify-center gap-1 md:gap-1.5 transition-colors ${
              hasPhoto
                ? 'bg-gold-500 text-navy-900 hover:bg-gold-400'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            } disabled:opacity-60`}
          >
            {isLoading ? (
              <><Loader2 className="w-3 h-3 animate-spin" /> Wait…</>
            ) : (
              <><Wand2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> Try On</>
            )}
          </button>
        </div>
        {!hasPhoto && (
          <p className="text-[10px] text-gray-400 text-center mt-1.5">Upload photo to try on</p>
        )}
      </div>
    </div>
  )
}
