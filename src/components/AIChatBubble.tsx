'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { X, Send, Sparkles, Loader2, ChevronDown, Download } from 'lucide-react'
import { getFirestoreProducts, FirestoreProduct } from '@/lib/firestore'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Renders assistant message content with markdown-like formatting
function MessageContent({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        // Section header: **Title:**
        const headerMatch = line.match(/^\*\*(.+?)\*\*:?$/)
        if (headerMatch) {
          return (
            <p key={i} className="font-semibold text-navy text-[13px] mt-2 first:mt-0">
              {headerMatch[1]}
            </p>
          )
        }

        // Bullet line: starts with - or •
        if (line.match(/^[-•]\s/)) {
          const content = line.replace(/^[-•]\s/, '')
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-gold mt-0.5 flex-shrink-0 text-[10px]">●</span>
              <span className="text-[13px] leading-relaxed">{renderInline(content)}</span>
            </div>
          )
        }

        // Normal paragraph
        return (
          <p key={i} className="text-[13px] leading-relaxed">
            {renderInline(line)}
          </p>
        )
      })}
    </div>
  )
}

// Renders inline bold, italic, and internal links within a line
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Combined regex: **bold**, *italic*, /shop/... or /ai-dresser links
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|(\/shop(?:\/[^\s,!?.()\[\]"']*)?(?=[\s,!?.()\[\]"']|$))|(\/ai-dresser(?:[^\s,!?.()\[\]"']*)?)/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    if (match[1]) {
      // **bold**
      parts.push(<strong key={match.index} className="font-semibold text-navy">{match[1]}</strong>)
    } else if (match[2]) {
      // *italic*
      parts.push(<em key={match.index} className="italic">{match[2]}</em>)
    } else if (match[3]) {
      // /shop link
      parts.push(
        <Link key={match.index} href={match[3]} className="text-gold font-semibold underline underline-offset-2 hover:text-navy transition-colors">
          {match[3]}
        </Link>
      )
    } else if (match[4]) {
      // /ai-dresser link
      parts.push(
        <Link key={match.index} href={match[4]} className="text-gold font-semibold underline underline-offset-2 hover:text-navy transition-colors">
          {match[4]}
        </Link>
      )
    }
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(text.slice(last))
  }

  return parts
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const QUICK_PROMPTS = [
  'What should I wear on a date?',
  'Best casual outfit for hot weather?',
  'Suggest a formal office look',
  'What brands do you carry?',
]

const INSTALL_STORAGE_KEY = 'abb-install-prompted'

export default function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showInstallCard, setShowInstallCard] = useState(false)
  const [products, setProducts] = useState<FirestoreProduct[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Check if already installed
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true)

    if (standalone) {
      setIsInstalled(true)
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // Listen for Android install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Auto-open after 4s and show install message if not already prompted
    const alreadyPrompted = localStorage.getItem(INSTALL_STORAGE_KEY)
    if (!alreadyPrompted) {
      const t = setTimeout(() => {
        setIsOpen(true)
        setHasUnread(false)
        setShowInstallCard(true)
      }, 4000)
      return () => {
        clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', handler)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Load product catalog once on mount
  useEffect(() => {
    getFirestoreProducts()
      .then((all) => setProducts(all.filter((p) => p.inStock)))
      .catch(() => {})
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, showInstallCard])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setHasUnread(false)
    }
  }, [isOpen])

  // Show unread dot after 3s if already prompted before (so bubble still pings)
  useEffect(() => {
    const alreadyPrompted = localStorage.getItem(INSTALL_STORAGE_KEY)
    if (alreadyPrompted && !isInstalled) {
      const t = setTimeout(() => {
        if (!isOpen) setHasUnread(true)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [isOpen, isInstalled])

  const dismissInstallCard = () => {
    setShowInstallCard(false)
    localStorage.setItem(INSTALL_STORAGE_KEY, '1')
  }

  const handleInstall = async () => {
    localStorage.setItem(INSTALL_STORAGE_KEY, '1')
    if (isIOS) {
      // Keep card open showing iOS steps — dismiss handled by user tapping X
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallCard(false)
      setIsInstalled(true)
      setDeferredPrompt(null)
    }
  }

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: Message = { role: 'user', content }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            category: p.category,
            price: p.price,
            colors: p.colors,
            tags: p.tags,
            inStock: p.inStock,
          })),
        }),
      })
      const data = await res.json()
      setMessages([...updated, { role: 'assistant', content: data.reply || 'Sorry, I had trouble with that.' }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ maxHeight: '70vh', minHeight: '420px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">ABB Style Assistant</p>
              <p className="text-white/50 text-[10px]">AI Fashion Designer</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">

          {/* Install prompt card — shown first if not installed */}
          {showInstallCard && !isInstalled && (
            <div className="bg-navy/5 border border-navy/10 rounded-2xl p-4 relative">
              <button
                onClick={dismissInstallCard}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-gold" />
                </div>
                <p className="text-navy text-sm leading-relaxed">
                  {isIOS
                    ? "Hey there! 👋 For the best shopping experience, install the ABB app on your iPhone — it's faster and works offline!"
                    : "Hey there! 👋 Install the ABB app on your device for a faster, app-like shopping experience — no browser needed!"}
                </p>
              </div>

              {isIOS ? (
                <div className="ml-11 space-y-1.5 mb-3">
                  {[
                    'Tap the Share button (□↑) in Safari',
                    'Tap "Add to Home Screen"',
                    'Tap "Add" — done! ✅',
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="w-4 h-4 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                  <button
                    onClick={dismissInstallCard}
                    className="mt-2 text-xs text-gray-400 underline underline-offset-2"
                  >
                    I&apos;ll do it later
                  </button>
                </div>
              ) : (
                <div className="ml-11 flex gap-2">
                  {deferredPrompt ? (
                    <button
                      onClick={handleInstall}
                      className="flex items-center gap-1.5 bg-navy text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-gold hover:text-navy transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Install Now
                    </button>
                  ) : (
                    <p className="text-xs text-gray-400">Open this page in Chrome to install.</p>
                  )}
                  <button
                    onClick={dismissInstallCard}
                    className="text-xs text-gray-400 underline underline-offset-2"
                  >
                    Later
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
                  <p className="text-navy text-sm">
                    I can also help you with outfit ideas, brand picks, and fashion advice. What are you looking for? ✨
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 ml-9">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-xs bg-cream text-navy px-3 py-1.5 rounded-full border border-gold/20 hover:bg-gold/10 hover:border-gold/40 transition-colors text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg: Message, i: number) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                </div>
              )}
              <div
                className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-navy text-white rounded-tr-sm text-sm leading-relaxed'
                    : 'bg-gray-100 text-navy rounded-tl-sm'
                }`}
              >
                {msg.role === 'user' ? msg.content : <MessageContent text={msg.content} />}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-gold animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-3 py-3 border-t border-gray-100">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about style..."
              rows={1}
              className="flex-1 resize-none bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 max-h-24 scrollbar-hide"
              style={{ lineHeight: '1.4' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center flex-shrink-0 hover:bg-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">Powered by DeepSeek AI</p>
        </div>
      </div>

      {/* Bubble Button */}
      <button
        onClick={() => setIsOpen((v: boolean) => !v)}
        className="fixed bottom-6 right-4 sm:right-6 z-[60] w-14 h-14 rounded-full bg-navy shadow-xl hover:bg-gold transition-all duration-300 flex items-center justify-center group hover:scale-110"
        aria-label="Open AI Style Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-gold group-hover:text-navy transition-colors" />
        )}
        {hasUnread && !isOpen && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  )
}
