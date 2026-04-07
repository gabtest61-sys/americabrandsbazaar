'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { X, Send, Sparkles, Loader2, ChevronDown, Download, Trash2 } from 'lucide-react'
import { getFirestoreProducts, FirestoreProduct } from '@/lib/firestore'

interface Message {
  role: 'user' | 'assistant' | 'install-card'
  content: string
}

const INSTALL_KEYWORDS = /install|add to home|download.*app|how.*install|get.*app|pwa|home screen/i

// Renders assistant message content with markdown-like formatting
function MessageContent({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-0.5" />

        // ### Heading (with optional emoji)
        const h3Match = line.match(/^#{1,3}\s+(.+)$/)
        if (h3Match) {
          return (
            <p key={i} className="font-bold text-navy text-[13px] mt-3 mb-0.5 first:mt-0 flex items-center gap-1.5">
              {h3Match[1]}
            </p>
          )
        }

        // **Title:** standalone bold header
        const headerMatch = line.match(/^\*\*(.+?)\*\*:?\s*$/)
        if (headerMatch) {
          return (
            <p key={i} className="font-semibold text-navy text-[13px] mt-2 first:mt-0">
              {headerMatch[1]}
            </p>
          )
        }

        // Numbered list: 1. item
        const numMatch = line.match(/^(\d+)\.\s+(.+)$/)
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-navy text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{numMatch[1]}</span>
              <span className="text-[13px] leading-relaxed">{renderInline(numMatch[2])}</span>
            </div>
          )
        }

        // Bullet line: starts with - or •
        if (line.match(/^[-•]\s/)) {
          const content = line.replace(/^[-•]\s/, '')
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-gold mt-1 flex-shrink-0 text-[8px]">●</span>
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

const CATEGORY_SUGGESTIONS = [
  { label: 'Tops', emoji: '👕', prompt: 'Show me your best tops and shirts available' },
  { label: 'Accessories', emoji: '⌚', prompt: 'What accessories do you have in stock?' },
  { label: 'Fragrance', emoji: '🌸', prompt: 'What fragrances and perfumes do you carry?' },
  { label: 'Shoes', emoji: '👟', prompt: 'Show me your available shoes and sneakers' },
]

const QUICK_PROMPTS = [
  'Best outfit for a date night?',
  'What brands do you carry?',
  'Something for a casual day out?',
  'Help me pick a gift',
]

const INSTALL_STORAGE_KEY = 'abb-install-prompted'

// ─── Inline install card rendered inside chat ─────────────────────────────────
function InlineInstallCard({
  deferredPrompt,
  isIOS,
  isInstalled,
  onInstalled,
}: {
  deferredPrompt: BeforeInstallPromptEvent | null
  isIOS: boolean
  isInstalled: boolean
  onInstalled: () => void
}) {
  const [installing, setInstalling] = useState(false)
  const [done, setDone] = useState(isInstalled)

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDone(true)
      onInstalled()
    }
    setInstalling(false)
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-sm text-green-700 font-medium flex items-center gap-2">
        ✅ App installed! Open it from your home screen.
      </div>
    )
  }

  return (
    <div className="bg-navy/5 border border-navy/10 rounded-2xl p-4">
      <p className="text-navy font-semibold text-sm mb-3 flex items-center gap-2">
        <Download className="w-4 h-4 text-gold" />
        Install ABB App
      </p>

      {isIOS ? (
        <div className="space-y-2 mb-3">
          {[
            { step: '1', text: 'Open this page in Safari' },
            { step: '2', text: 'Tap the Share button (□↑) at the bottom' },
            { step: '3', text: 'Tap "Add to Home Screen"' },
            { step: '4', text: 'Tap "Add" — done! ✅' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {step}
              </span>
              <span className="text-xs text-gray-600">{text}</span>
            </div>
          ))}
        </div>
      ) : deferredPrompt ? (
        <button
          onClick={handleInstall}
          disabled={installing}
          className="w-full flex items-center justify-center gap-2 bg-navy text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-gold hover:text-navy transition-colors disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {installing ? 'Installing…' : 'Install Now'}
        </button>
      ) : (
        <div className="space-y-2">
          {[
            { step: '1', text: 'Open this page in Chrome' },
            { step: '2', text: 'Tap the three-dot menu (⋮)' },
            { step: '3', text: 'Tap "Add to Home Screen"' },
            { step: '4', text: 'Tap "Add" — done! ✅' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {step}
              </span>
              <span className="text-xs text-gray-600">{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem('abb-chat-history')
      return saved ? (JSON.parse(saved) as Message[]) : []
    } catch {
      return []
    }
  })
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
    const android = /android/i.test(navigator.userAgent)
    const isMobile = ios || android
    setIsIOS(ios)

    // Only show install prompt on actual mobile devices
    if (!isMobile) return

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

  // Persist chat history to localStorage (keep last 40 messages)
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem('abb-chat-history', JSON.stringify(messages.slice(-40)))
      } catch {}
    }
  }, [messages])

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
      const reply = data.reply || 'Sorry, I had trouble with that.'
      const newMessages: Message[] = [...updated, { role: 'assistant', content: reply }]
      // If user asked about installing, append an install card
      if (INSTALL_KEYWORDS.test(content)) {
        newMessages.push({ role: 'install-card', content: '' })
      }
      setMessages(newMessages)
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
      {/* ── Mobile: full-screen overlay backdrop ── */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[59]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Panel
          Mobile  → slides up from bottom, full width, 92dvh tall
          Desktop → floating card, bottom-right corner              */}
      <div
        className={`fixed z-[60] bg-white flex flex-col transition-all duration-300
          bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl
          md:bottom-6 md:right-6 md:left-auto md:w-[420px] md:rounded-2xl md:shadow-2xl md:border md:border-gray-100 md:origin-bottom-right
          ${isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto md:scale-100'
            : 'opacity-0 translate-y-full pointer-events-none md:translate-y-0 md:scale-95'
          }`}
        style={{
          // Mobile: 92% of viewport height. Desktop (md+): fixed 600px tall
          height: isOpen ? 'min(92dvh, 92vh)' : undefined,
          maxHeight: isOpen ? 'min(92dvh, 92vh)' : 0,
        } as React.CSSProperties}
        // Override max-height on desktop via inline (Tailwind can't use arbitrary values easily here)
        ref={(el) => {
          if (el) {
            if (window.innerWidth >= 768) {
              el.style.height = isOpen ? '600px' : '0'
              el.style.maxHeight = isOpen ? '600px' : '0'
            }
          }
        }}
      >
        {/* Drag handle (mobile only) */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-navy md:rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">ABB Style Assistant</p>
              <p className="text-white/50 text-[10px]">AI Fashion Designer</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([])
                  try { localStorage.removeItem('abb-chat-history') } catch {}
                }}
                className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
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
            <div className="space-y-4">
              {/* Greeting bubble */}
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
                  <p className="text-navy text-sm leading-relaxed">
                    Hi! 👋 I&apos;m your ABB style assistant. Browse our categories or ask me anything about fashion and our products.
                  </p>
                </div>
              </div>

              {/* Category tiles */}
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => sendMessage(cat.prompt)}
                    className="flex items-center gap-2.5 bg-white border border-gray-100 hover:border-gold/50 hover:bg-gold/5 rounded-2xl px-3.5 py-3 transition-all shadow-sm group text-left"
                  >
                    <span className="text-xl leading-none">{cat.emoji}</span>
                    <span className="text-sm font-semibold text-navy group-hover:text-gold transition-colors">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick prompt chips */}
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 ml-1">Or ask me</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="text-xs bg-navy/5 text-navy px-3 py-1.5 rounded-full border border-navy/10 hover:bg-gold/10 hover:border-gold/40 hover:text-navy transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg: Message, i: number) => {
            // Inline install card
            if (msg.role === 'install-card') {
              return <InlineInstallCard key={i} deferredPrompt={deferredPrompt} isIOS={isIOS} isInstalled={isInstalled} onInstalled={() => { setIsInstalled(true); setDeferredPrompt(null) }} />
            }
            return (
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
            )
          })}

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
        <div className="flex-shrink-0 px-3 py-3 border-t border-gray-100 pb-[max(12px,env(safe-area-inset-bottom))]">
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
        </div>
      </div>

      {/* Bubble Button — hidden on mobile when open, hidden on desktop when open (panel has close) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-4 sm:right-6 z-[61] w-14 h-14 rounded-full bg-navy shadow-xl hover:bg-gold transition-all duration-300 flex items-center justify-center group hover:scale-110"
          aria-label="Open AI Style Assistant"
        >
          <Sparkles className="w-6 h-6 text-gold group-hover:text-navy transition-colors" />
          {hasUnread && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      )}
    </>
  )
}
