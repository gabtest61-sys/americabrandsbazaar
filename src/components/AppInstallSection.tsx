'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Share, Check, Smartphone, Zap, Bell, WifiOff } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function AppInstallSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [showIOSSteps, setShowIOSSteps] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
    setIsInstalled(standalone)

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (isIOS) { setShowIOSSteps(true); return }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setInstalled(true); setDeferredPrompt(null) }
  }

  const features = [
    { icon: Zap, label: 'Faster browsing', desc: 'Loads instantly every time' },
    { icon: Bell, label: 'Order updates', desc: 'Get notified on every step' },
    { icon: WifiOff, label: 'Works offline', desc: 'Browse even without signal' },
    { icon: Smartphone, label: 'Home screen icon', desc: 'One tap to open the shop' },
  ]

  return (
    <section className="bg-[#0f1e38] py-14 md:py-20 overflow-hidden relative">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — text */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.15em] mb-5">
              <Smartphone className="w-3.5 h-3.5" />
              Install the App
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
              Shop smarter,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-yellow-300">
                anytime.
              </span>
            </h2>
            <p className="text-white/50 text-sm md:text-base max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed">
              Install the {BRAND.name} app on your phone for the best experience — faster, easier, and always one tap away.
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-2 gap-3 mb-8 max-w-md mx-auto lg:mx-0">
              {features.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3 bg-white/5 border border-white/8 rounded-2xl p-3.5">
                  <div className="w-8 h-8 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold leading-tight">{label}</p>
                    <p className="text-white/40 text-[11px] mt-0.5 leading-tight">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            {isInstalled || installed ? (
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 font-semibold px-6 py-3 rounded-full text-sm">
                <Check className="w-4 h-4" />
                App Already Installed
              </div>
            ) : isIOS && !showIOSSteps ? (
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-2.5 bg-gold text-navy font-bold px-8 py-3.5 rounded-full text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-gold/20 hover:scale-105 active:scale-95"
              >
                <Share className="w-4 h-4" />
                Install on iPhone / iPad
              </button>
            ) : deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-2.5 bg-gold text-navy font-bold px-8 py-3.5 rounded-full text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-gold/20 hover:scale-105 active:scale-95"
              >
                <Download className="w-4 h-4" />
                Install App — It&apos;s Free
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 text-white/40 border border-white/10 px-6 py-3 rounded-full text-xs">
                <Smartphone className="w-3.5 h-3.5" />
                Open in Chrome or Safari to install
              </div>
            )}

            {/* iOS Steps */}
            {showIOSSteps && (
              <div className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-4 max-w-sm mx-auto lg:mx-0 text-left">
                <p className="text-white font-semibold text-sm mb-3">How to install on iPhone / iPad:</p>
                <ol className="space-y-2 text-xs text-white/60 list-decimal list-inside">
                  <li>Tap the <span className="text-white font-medium">Share</span> button in Safari (bottom center)</li>
                  <li>Scroll down and tap <span className="text-white font-medium">&quot;Add to Home Screen&quot;</span></li>
                  <li>Tap <span className="text-white font-medium">Add</span> in the top right corner</li>
                </ol>
              </div>
            )}
          </div>

          {/* Right — phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone frame */}
              <div className="relative w-[200px] sm:w-[240px] mx-auto">
                {/* Glow behind phone */}
                <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full scale-75 translate-y-4" />

                <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-3 shadow-2xl border border-white/10">
                  {/* Notch */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-full z-10" />

                  {/* Screen */}
                  <div className="bg-[#0f1e38] rounded-[2rem] overflow-hidden aspect-[9/19]">
                    {/* Status bar */}
                    <div className="px-5 pt-7 pb-2 flex justify-between text-[9px] text-white/50">
                      <span>9:41</span>
                      <span>●●●</span>
                    </div>

                    {/* App content preview */}
                    <div className="px-3 space-y-2.5">
                      {/* Logo */}
                      <div className="flex items-center gap-2 py-1.5 border-b border-white/5">
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-cream flex-shrink-0 border border-gold/30">
                          <Image src="/abblogo.jpg" alt="ABB" width={28} height={28} className="object-contain scale-125" />
                        </div>
                        <div>
                          <p className="text-white text-[9px] font-bold leading-tight">America Brands</p>
                          <p className="text-gold text-[8px] leading-tight">Bazaar</p>
                        </div>
                        <div className="ml-auto w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center">
                          <Bell className="w-2.5 h-2.5 text-gold" />
                        </div>
                      </div>

                      {/* Product cards */}
                      {[
                        { color: 'from-blue-900 to-blue-800', label: 'Tommy Hilfiger', price: '₱2,100' },
                        { color: 'from-rose-900 to-rose-800', label: 'Ralph Lauren', price: '₱3,500' },
                      ].map((card) => (
                        <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl p-2.5 flex items-center gap-2`}>
                          <div className="w-10 h-10 bg-white/10 rounded-lg flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-[8px] font-semibold truncate">{card.label}</p>
                            <p className="text-gold text-[9px] font-bold">{card.price}</p>
                          </div>
                          <div className="w-5 h-5 bg-gold rounded-full flex items-center justify-center flex-shrink-0">
                            <Download className="w-2.5 h-2.5 text-navy" />
                          </div>
                        </div>
                      ))}

                      {/* Gold bar CTA */}
                      <div className="bg-gold rounded-xl py-2 flex items-center justify-center gap-1.5">
                        <Zap className="w-3 h-3 text-navy" />
                        <span className="text-navy text-[9px] font-bold">Shop Now</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Install badge floating */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg shadow-gold/30 whitespace-nowrap flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  Free to Install
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
