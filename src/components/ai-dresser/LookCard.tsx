'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ArrowRight, Heart, Share2, Plus, Check } from 'lucide-react'
import Link from 'next/link'
import ProductImage from './ProductImage'
import type { Look, LookItem } from '@/lib/ai-dresser'

interface LookCardProps {
  look: Look
  isActive: boolean
  addedItems: Set<string>
  savedLooks: Set<number>
  onAddToCart: (item: LookItem) => void
  onAddAllToCart: (look: Look) => void
  onOneClickCheckout: (look: Look) => void
  onSaveLook: (lookNumber: number) => void
  onShare: (look: Look) => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: () => void
}

export default function LookCard({
  look,
  isActive,
  addedItems,
  savedLooks,
  onAddToCart,
  onAddAllToCart,
  onOneClickCheckout,
  onSaveLook,
  onShare,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}: LookCardProps) {
  if (!isActive) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={look.look_number}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.2 }}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl overflow-hidden touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Look Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {look.look_name}
              </h3>
              <p className="text-white/50 text-sm">
                {look.look_description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-sm">Total</p>
              <p className="text-2xl font-bold text-gold">
                ₱{look.total_price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {look.items.map((item) => (
              <Link
                key={item.product_id}
                href={item.product_url}
                className="bg-white/5 rounded-xl overflow-hidden group block"
              >
                <div className="relative">
                  {/* Product Image with Fallback */}
                  <ProductImage
                    src={item.image_url}
                    alt={item.product_name}
                    brand={item.brand}
                    category={item.category}
                  />

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      onAddToCart(item)
                    }}
                    className={`absolute bottom-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
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
                  <p className="text-white/60 text-xs mb-0.5">{item.brand}</p>
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
              </Link>
            ))}
          </div>

          {/* Style Tip */}
          <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 mb-6">
            <p className="text-gold text-sm font-medium mb-1">Style Tip</p>
            <p className="text-white/70 text-sm">{look.style_tip}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onAddAllToCart(look)}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-gold hover:bg-gold-400 text-navy font-bold py-4 px-6 rounded-full transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              Add All to Cart
            </button>

            <button
              onClick={() => onOneClickCheckout(look)}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-full transition-all"
            >
              <ArrowRight className="w-5 h-5" />
              Buy Now
            </button>

            <button
              onClick={() => onSaveLook(look.look_number)}
              className={`flex items-center justify-center gap-2 py-4 px-6 rounded-full transition-all ${
                savedLooks.has(look.look_number)
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${savedLooks.has(look.look_number) ? 'fill-current' : ''}`} />
              {savedLooks.has(look.look_number) ? 'Saved' : 'Save Look'}
            </button>

            <button
              onClick={() => onShare(look)}
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-full transition-all border border-white/10"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
