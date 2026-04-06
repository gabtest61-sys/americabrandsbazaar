'use client'

import { useState, useEffect } from 'react'
import { Download, Check, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installed, setInstalled] = useState(false)

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
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      setDeferredPrompt(null)
    }
  }

  if (isInstalled || installed) {
    return (
      <div className="flex items-center justify-center gap-2 bg-green-500 text-white font-semibold px-8 py-4 rounded-full text-lg">
        <Check className="w-5 h-5" />
        App Already Installed
      </div>
    )
  }

  // iOS — no JS install API, show share hint
  if (isIOS) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 bg-navy text-white font-semibold px-8 py-4 rounded-full text-lg">
          <Share className="w-5 h-5" />
          Tap Share → Add to Home Screen
        </div>
        <p className="text-sm text-gray-400">Follow the steps below for iPhone / iPad</p>
      </div>
    )
  }

  // Android / Chrome with prompt available
  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-3 bg-gold text-navy font-bold px-10 py-4 rounded-full text-lg hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
      >
        <Download className="w-6 h-6" />
        Install App Now
      </button>
    )
  }

  // Fallback — browser doesn't support or already dismissed
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 bg-gold/20 text-navy font-semibold px-8 py-4 rounded-full text-lg border-2 border-gold/30">
        <Download className="w-5 h-5 text-gold" />
        Follow the steps below to install
      </div>
      <p className="text-sm text-gray-400">Use Chrome on Android or Safari on iPhone</p>
    </div>
  )
}
