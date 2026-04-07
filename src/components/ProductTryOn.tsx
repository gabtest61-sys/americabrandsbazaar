'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Wand2, X, Upload, Camera, Loader2, RotateCcw, Sparkles, AlertCircle, CheckCircle, Zap, LogIn, ShieldCheck, UserPlus, Bookmark } from 'lucide-react'
import { FirestoreProduct, saveTryOnResult, getTryOnCredits, consumeTryOnCredit, saveTryOnLook } from '@/lib/firestore'
import { useAuth } from '@/context/AuthContext'
import AuthModal from '@/components/AuthModal'

const CONSENT_KEY = 'tryon_consent_v1'

type Step = 'upload' | 'generating' | 'done' | 'error'

interface Props {
  product: FirestoreProduct
  triggerOpen?: boolean
  onTriggerHandled?: () => void
}

export default function ProductTryOn({ product, triggerOpen, onTriggerHandled }: Props) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [personPreview, setPersonPreview] = useState<string | null>(null)
  const [personUrl, setPersonUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [savedLookId, setSavedLookId] = useState<string | null>(null)
  const [savingLook, setSavingLook] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const productImage = product.images?.[0] || null

  // Load credits when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      getTryOnCredits(user.id).then(({ credits }) => setCredits(credits))
    }
  }, [isOpen, user?.id])

  // External trigger — same logic as clicking the button
  useEffect(() => {
    if (!triggerOpen) return
    onTriggerHandled?.()
    const hasConsented = typeof window !== 'undefined' && localStorage.getItem(CONSENT_KEY) === 'true'
    if (hasConsented) {
      setIsOpen(true)
    } else {
      setShowConsent(true)
    }
  }, [triggerOpen])

  const reset = () => {
    setStep('upload')
    setPersonPreview(null)
    setPersonUrl(null)
    setResultUrl(null)
    setError('')
    setSavedLookId(null)
  }

  const retryWithSamePhoto = () => {
    setStep('upload')
    setResultUrl(null)
    setError('')
  }

  const handleClose = () => {
    setIsOpen(false)
    reset()
  }

  const handlePhoto = async (file: File) => {
    setUploading(true)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => setPersonPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, folder: 'tryon' }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Upload failed')
      setPersonUrl(data.url)
    } catch (e: any) {
      setError(e.message || 'Failed to upload photo')
    }
    setUploading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePhoto(file)
    e.target.value = ''
  }

  const handleGenerate = async () => {
    if (!productImage) { setError('This product has no image to try on.'); return }

    // Check credits
    if (!user?.id) { setError('Please sign in to use AI Try-On.'); return }
    const creditCheck = await consumeTryOnCredit(user.id)
    if (!creditCheck.success) {
      setError(creditCheck.error || 'No credits left this month.')
      return
    }
    setCredits(creditCheck.creditsLeft)

    setStep('generating')
    setError('')

    try {
      const res = await fetch('/api/ai-dresser/try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImageUrl: personUrl,
          productImageUrl: productImage,
          productName: product.name,
          productBrand: product.brand,
          productColors: product.colors || [],
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.taskId) throw new Error(data.error || 'Failed to start try-on')

      const nanoUrl = await pollStatus(data.taskId)

      let finalUrl = nanoUrl
      try {
        const saveRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: nanoUrl, folder: 'tryon-results' }),
        })
        const saveData = await saveRes.json()
        if (saveData.success && saveData.url) finalUrl = saveData.url
      } catch {}

      setResultUrl(finalUrl)
      if (product.id) {
        saveTryOnResult(product.id, user.id, finalUrl).catch(() => {})
      }
      setStep('done')
    } catch (e: any) {
      // Refund credit on failure
      getTryOnCredits(user.id).then(({ credits: c }) => setCredits(c))
      setError(e.message || 'Something went wrong')
      setStep('error')
    }
  }

  const pollStatus = (taskId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const max = 40
      const interval = setInterval(async () => {
        attempts++
        try {
          const res = await fetch(`/api/ai-dresser/try-on/status?taskId=${taskId}`)
          const data = await res.json()
          if (data.status === 'done' && data.imageUrl) {
            clearInterval(interval)
            resolve(data.imageUrl)
          } else if (data.status === 'failed' || attempts >= max) {
            clearInterval(interval)
            reject(new Error(data.error || 'Generation timed out'))
          }
        } catch {
          clearInterval(interval)
          reject(new Error('Status check failed'))
        }
      }, 3000)
    })
  }

  const noCredits = user && credits !== null && credits <= 0

  return (
    <>
      {/* Try On button */}
      <button
        onClick={() => {
          const hasConsented = typeof window !== 'undefined' && localStorage.getItem(CONSENT_KEY) === 'true'
          if (!hasConsented) {
            setShowConsent(true)
          } else {
            setIsOpen(true)
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-gold/40 bg-gold/5 text-navy font-semibold text-sm hover:bg-gold/15 hover:border-gold transition-all"
      >
        <Wand2 className="w-4 h-4 text-gold" />
        Try On with AI
      </button>

      {/* Consent Modal */}
      {showConsent && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowConsent(false)} />
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl p-6 w-full md:w-[420px] pointer-events-auto"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy mb-2">Photo Usage Consent</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  By using the AI Try-On feature, you agree that <span className="font-bold text-navy">America Brands Bazaar</span> may use the AI-generated image of you wearing our product for <span className="font-bold text-navy">marketing purposes</span> — including our website and Facebook page.
                </p>
              </div>
              <div className="w-full bg-gold/5 border border-gold/20 rounded-2xl p-3 text-left space-y-2">
                {['Your AI-generated image may appear on our website or social media', 'Your real photo is never stored or shared — only the AI output'].map(item => (
                  <p key={item} className="text-xs text-gray-500 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
                    {item}
                  </p>
                ))}
              </div>
              <button
                onClick={() => {
                  localStorage.setItem(CONSENT_KEY, 'true')
                  setShowConsent(false)
                  setIsOpen(true)
                }}
                className="w-full py-3.5 bg-gold text-white font-bold rounded-2xl hover:bg-gold/90 transition-colors"
              >
                I Agree — Start Try-On
              </button>
              <button
                onClick={() => setShowConsent(false)}
                className="w-full py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          <div className="fixed z-50 bg-white
            bottom-0 left-0 right-0 rounded-t-3xl
            md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
            md:w-[480px] md:rounded-3xl
            shadow-2xl flex flex-col max-h-[92dvh] md:max-h-[85vh]"
          >
            {/* Drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="font-bold text-navy text-sm">AI Try On</p>
                  <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{product.brand} · {product.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Credit badge */}
                {user && credits !== null && (
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    credits === 0 ? 'bg-red-50 text-red-500' :
                    credits <= 5 ? 'bg-orange-50 text-orange-500' :
                    'bg-gold/10 text-gold'
                  }`}>
                    <Zap className="w-3 h-3" />
                    {credits} left
                  </div>
                )}
                <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Not logged in */}
              {!user && (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-navy/5 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <p className="font-bold text-navy">Sign in to try on</p>
                    <p className="text-sm text-gray-400 mt-1">You need an account to use AI Try-On.<br />Get 20 free credits every month!</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => { setAuthMode('login'); setShowAuth(true) }}
                      className="w-full py-3 bg-navy text-white rounded-xl font-semibold text-sm hover:bg-navy/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                    <button
                      onClick={() => { setAuthMode('register'); setShowAuth(true) }}
                      className="w-full py-3 border-2 border-gold bg-gold/5 text-navy rounded-xl font-semibold text-sm hover:bg-gold/15 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </button>
                  </div>
                </div>
              )}

              {/* No credits left */}
              {user && noCredits && (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-bold text-navy">No credits left this month</p>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                      Your 20 monthly credits are used up.<br />
                      Credits reset on the 1st of next month.
                    </p>
                  </div>
                  <div className="w-full bg-gold/5 border border-gold/20 rounded-2xl p-3 text-left">
                    <p className="text-xs font-semibold text-navy mb-1">💡 Earn more credits</p>
                    <p className="text-[11px] text-gray-500">Each product you purchase gives you <span className="font-semibold text-navy">+10 credits</span> instantly.</p>
                  </div>
                </div>
              )}

              {/* Step: Upload */}
              {user && !noCredits && (step === 'upload' || step === 'error') && (
                <>
                  {/* Product preview */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-gray-100">
                      {productImage
                        ? <Image src={productImage} alt={product.name} fill className="object-cover" sizes="56px" />
                        : <div className="flex items-center justify-center h-full text-gray-300 text-xs font-bold">{product.brand.slice(0,2)}</div>
                      }
                    </div>
                    <div>
                      <p className="text-xs text-gold font-semibold uppercase">{product.brand}</p>
                      <p className="text-sm font-semibold text-navy">{product.name}</p>
                      <p className="text-xs text-gray-400">₱{product.price.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Photo upload area */}
                  <div>
                    <p className="text-sm font-semibold text-navy mb-2">Your Photo</p>
                    <p className="text-xs text-gray-400 mb-3">Upload a full-body or half-body photo for the best result</p>

                    {personPreview ? (
                      <div className="relative">
                        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                          <Image src={personPreview} alt="Your photo" fill className="object-cover" sizes="400px" />
                          {uploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { setPersonPreview(null); setPersonUrl(null) }}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-gold hover:bg-gold/5 rounded-2xl py-6 transition-all"
                        >
                          <Upload className="w-6 h-6 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Upload Photo</span>
                          <span className="text-[10px] text-gray-400">JPG, PNG</span>
                        </button>
                        <label
                          htmlFor="tryon-camera"
                          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-navy hover:bg-navy/5 rounded-2xl py-6 transition-all cursor-pointer"
                        >
                          <Camera className="w-6 h-6 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Take Photo</span>
                          <span className="text-[10px] text-gray-400">Use camera</span>
                        </label>
                      </div>
                    )}

                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <input id="tryon-camera" ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Tips */}
                  <div className="bg-navy/3 rounded-2xl p-3 space-y-1.5">
                    <p className="text-xs font-semibold text-navy">📸 Tips for best results</p>
                    {['Stand facing the camera with arms slightly apart', 'Good lighting, plain background', 'Full or half-body shot works best'].map(t => (
                      <p key={t} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                        <span className="text-gold mt-0.5">•</span>{t}
                      </p>
                    ))}
                  </div>
                </>
              )}

              {/* Step: Generating */}
              {step === 'generating' && (
                <div className="flex flex-col items-center justify-center py-12 gap-5 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center">
                      <Sparkles className="w-9 h-9 text-gold animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
                  </div>
                  <div>
                    <p className="font-bold text-navy text-lg">Generating your look…</p>
                    <p className="text-sm text-gray-400 mt-1">This usually takes 30–60 seconds</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Step: Done */}
              {step === 'done' && resultUrl && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <p className="text-sm font-semibold">Your try-on is ready!</p>
                  </div>
                  <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                    <Image src={resultUrl} alt="Try-on result" fill className="object-cover" sizes="480px" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={retryWithSamePhoto} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-500 transition-colors">
                      <RotateCcw className="w-4 h-4" />
                      Try again
                    </button>
                    <button onClick={reset} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm text-gray-500 transition-colors">
                      <Upload className="w-4 h-4" />
                      Change Photo
                    </button>
                  </div>
                  <button
                    disabled={savingLook || !!savedLookId}
                    onClick={async () => {
                      if (!user?.id || savingLook || savedLookId) return
                      setSavingLook(true)
                      const id = await saveTryOnLook(user.id, product, resultUrl!)
                      setSavedLookId(id)
                      setSavingLook(false)
                    }}
                    className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                      savedLookId
                        ? 'border-green-200 bg-green-50 text-green-600'
                        : 'border-gold/40 bg-gold/5 text-navy hover:bg-gold/15'
                    } disabled:opacity-60`}
                  >
                    {savingLook ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : savedLookId ? (
                      <><CheckCircle className="w-4 h-4" /> Saved to Looks</>
                    ) : (
                      <><Bookmark className="w-4 h-4 text-gold" /> Save Look</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            {user && !noCredits && (step === 'upload' || step === 'error') && (
              <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100">
                <button
                  onClick={handleGenerate}
                  disabled={!personUrl || uploading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy text-white font-bold rounded-2xl hover:bg-navy/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 text-gold" />
                  Generate Try-On
                  {credits !== null && credits > 0 && (
                    <span className="ml-1 text-xs text-white/60 font-normal">· uses 1 credit</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        initialMode={authMode}
      />
    </>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
