'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Check if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

    if (isStandalone) return

    // Check if dismissed before
    const dismissed = localStorage.getItem('abb-install-dismissed')
    if (dismissed) return

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    if (ios) {
      setShowBanner(true)
      return
    }

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShowBanner(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIOSInstructions(false)
    localStorage.setItem('abb-install-dismissed', '1')
  }

  if (!showBanner) return null

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-navy text-white shadow-2xl safe-area-bottom">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 text-white/60 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          {!showIOSInstructions ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <p className="font-semibold text-sm">Install ABB App</p>
                <p className="text-white/60 text-xs mt-0.5">Shop faster with our app — no browser needed</p>
              </div>
              <button
                onClick={handleInstall}
                className="flex-shrink-0 bg-gold text-navy font-semibold text-sm px-4 py-2 rounded-lg"
              >
                Install
              </button>
            </div>
          ) : (
            <div className="pr-6">
              <p className="font-semibold text-sm mb-2">Install on iPhone / iPad</p>
              <ol className="text-white/70 text-xs space-y-1 list-decimal list-inside">
                <li>Tap the <strong className="text-white">Share</strong> button at the bottom of Safari</li>
                <li>Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong></li>
                <li>Tap <strong className="text-white">Add</strong> in the top right</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
