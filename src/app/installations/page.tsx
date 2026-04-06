'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Smartphone, Monitor, Apple, Download, CheckCircle2, Share, Globe } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallationsPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

    if (standalone) {
      setIsInstalled(true)
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const android = /android/i.test(navigator.userAgent)
    const mobile = ios || android || window.innerWidth < 768

    setIsIOS(ios)
    setIsAndroid(android)
    setIsMobile(mobile)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    setInstalling(false)
  }

  // Already installed
  if (isInstalled || installed) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cream pt-24 pb-16 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-navy mb-3">You&apos;re all set!</h1>
            <p className="text-gray-500 text-lg">ABB App is already installed on your device.</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pt-24 pb-16">
        <div className="container-max px-4 md:px-8 py-12">

          {/* Hero */}
          <div className="text-center mb-10">
            <span className="text-gold font-semibold text-sm tracking-wider uppercase mb-3 block">
              Get the App
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy mb-4">
              Shop Faster with the ABB App
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto text-lg mb-8">
              Install America Brands Bazaar on your device for a native app experience — no browser required.
            </p>
          </div>

          {/* Mobile: Native Install UI */}
          {isMobile ? (
            <div className="max-w-sm mx-auto mb-16">
              {/* Android: Show install button */}
              {(isAndroid || deferredPrompt) && (
                <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-navy flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <Download className="w-10 h-10 text-gold" />
                  </div>
                  <h2 className="text-xl font-bold text-navy mb-2">Install ABB App</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Tap the button below to install the app directly on your home screen.
                  </p>
                  {deferredPrompt ? (
                    <button
                      onClick={handleInstall}
                      disabled={installing}
                      className="w-full bg-navy text-white font-semibold py-4 rounded-xl text-lg transition-all hover:bg-gold hover:text-navy disabled:opacity-60"
                    >
                      {installing ? 'Installing...' : 'Install Now'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-400 mb-4">Follow these quick steps:</p>
                      {[
                        'Open this page in Globe',
                        'Tap the three-dot menu (⋮)',
                        'Tap "Add to Home Screen"',
                        'Tap "Add" to confirm',
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 text-left">
                          <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-gray-600 text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* iOS: Show share sheet instructions */}
              {isIOS && !isAndroid && (
                <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-navy flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <Apple className="w-10 h-10 text-gold" />
                  </div>
                  <h2 className="text-xl font-bold text-navy mb-2">Install on iPhone / iPad</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Just 3 quick taps and it&apos;s on your home screen!
                  </p>

                  {/* Visual step with share icon */}
                  <div className="space-y-4 text-left">
                    <div className="flex items-center gap-4 bg-cream rounded-xl p-4">
                      <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                        <Share className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-navy font-semibold text-sm">Tap Share</p>
                        <p className="text-gray-500 text-xs">The share icon at the bottom of Safari</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-cream rounded-xl p-4">
                      <span className="w-10 h-10 rounded-full bg-navy text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">2</span>
                      <div>
                        <p className="text-navy font-semibold text-sm">&ldquo;Add to Home Screen&rdquo;</p>
                        <p className="text-gray-500 text-xs">Scroll down in the share sheet</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-cream rounded-xl p-4">
                      <span className="w-10 h-10 rounded-full bg-navy text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">3</span>
                      <div>
                        <p className="text-navy font-semibold text-sm">Tap &ldquo;Add&rdquo;</p>
                        <p className="text-gray-500 text-xs">Top right corner — done!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Desktop: Keep original install cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16 mt-4">
              {/* Android / Globe */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h2 className="font-bold text-navy">Android / Globe</h2>
                    <p className="text-sm text-gray-400">Globe browser</p>
                  </div>
                </div>
                <ol className="space-y-4">
                  {[
                    'Open americabrandsbazaar.com in Globe',
                    'Tap the three-dot menu (⋮) in the top right',
                    'Tap "Add to Home Screen"',
                    'Tap "Add" to confirm',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-600 text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* iPhone / Safari */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Apple className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h2 className="font-bold text-navy">iPhone / iPad</h2>
                    <p className="text-sm text-gray-400">Safari browser</p>
                  </div>
                </div>
                <ol className="space-y-4">
                  {[
                    'Open americabrandsbazaar.com in Safari',
                    'Tap the Share button (□↑) at the bottom',
                    'Scroll down and tap "Add to Home Screen"',
                    'Tap "Add" in the top right corner',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-gray-600 text-sm">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-navy rounded-2xl p-8 md:p-12 text-white text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Why Install the App?</h2>
            <p className="text-white/60 mb-8">Everything you love, faster and more convenient</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Smartphone, title: 'Native Feel', desc: 'Full-screen experience like a real app' },
                { icon: Monitor, title: 'Works Offline', desc: 'Browse even without internet' },
                { icon: Globe, title: 'Instant Access', desc: 'One tap from your home screen' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-white/50 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
