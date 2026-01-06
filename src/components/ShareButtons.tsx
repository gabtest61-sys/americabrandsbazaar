'use client'

import { useState } from 'react'
import { Share2, MessageCircle, Copy, Check, X } from 'lucide-react'

interface ShareButtonsProps {
  title: string
  text: string
  url?: string
  items?: { name: string; price: number }[]
  showModal?: boolean
}

export default function ShareButtons({ title, text, url, items, showModal = true }: ShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  const generateMessage = () => {
    let message = `${title}\n\n${text}`
    if (items && items.length > 0) {
      message += '\n\n'
      items.forEach(item => {
        message += `• ${item.name} - ₱${item.price.toLocaleString()}\n`
      })
    }
    message += `\n👉 ${shareUrl}`
    return message
  }

  const shareViaMessenger = () => {
    const message = encodeURIComponent(generateMessage())
    // Facebook Messenger share link
    window.open(
      `https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    )
  }

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(generateMessage())
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateMessage())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: generateMessage(),
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== 'AbortError') {
          setIsOpen(true)
        }
      }
    } else {
      setIsOpen(true)
    }
  }

  if (!showModal) {
    // Inline buttons mode
    return (
      <div className="flex gap-2">
        <button
          onClick={shareViaWhatsApp}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          WhatsApp
        </button>
        <button
          onClick={shareViaMessenger}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Messenger
        </button>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleNativeShare}
        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-full transition-all border border-white/10"
      >
        <Share2 className="w-5 h-5" />
        Share
      </button>

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-navy">Share this look</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              {/* WhatsApp */}
              <button
                onClick={shareViaWhatsApp}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-navy">WhatsApp</p>
                  <p className="text-sm text-gray-500">Share with friends</p>
                </div>
              </button>

              {/* Messenger */}
              <button
                onClick={shareViaMessenger}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-navy">Messenger</p>
                  <p className="text-sm text-gray-500">Share via Facebook</p>
                </div>
              </button>

              {/* Copy Link */}
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {copied ? <Check className="w-6 h-6 text-green-500" /> : <Copy className="w-6 h-6 text-gray-600" />}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-navy">{copied ? 'Copied!' : 'Copy Link'}</p>
                  <p className="text-sm text-gray-500">{copied ? 'Link copied to clipboard' : 'Copy to share anywhere'}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
