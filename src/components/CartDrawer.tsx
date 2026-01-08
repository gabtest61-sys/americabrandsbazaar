'use client'

import { useEffect, useState } from 'react'
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/constants'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart()
  const [isAnimating, setIsAnimating] = useState(false)
  const [removingItem, setRemovingItem] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(closeCart, 300)
  }

  const handleRemoveItem = (productId: string) => {
    setRemovingItem(productId)
    setTimeout(() => {
      removeItem(productId)
      setRemovingItem(null)
    }, 300)
  }

  const handleClearCart = () => {
    if (confirm('Remove all items from your cart?')) {
      clearCart()
    }
  }

  if (!isOpen && !isAnimating) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-navy to-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Your Cart</h2>
              <p className="text-white/60 text-sm">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Clear All Button */}
        {items.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
            <button
              onClick={handleClearCart}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove All
            </button>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-8">
                Discover our premium collection and add some items to your cart!
              </p>
              <button
                onClick={handleClose}
                className="group flex items-center gap-2 bg-navy text-white font-semibold py-3 px-6 rounded-full hover:bg-gold hover:text-navy transition-all"
              >
                Start Shopping
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {items.map((item, index) => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  className={`bg-gray-50 rounded-xl p-4 transition-all duration-300 ${
                    removingItem === item.product.id
                      ? 'opacity-0 translate-x-full'
                      : 'opacity-100 translate-x-0'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-4">
                    {/* Product Image Placeholder */}
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                      <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center">
                        <span className="text-navy font-bold text-sm">
                          {item.product.brand.charAt(0)}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-gold text-xs font-bold tracking-wider uppercase">
                            {item.product.brand}
                          </span>
                          <h3 className="text-navy font-semibold text-sm line-clamp-2 mt-0.5">
                            {item.product.name}
                          </h3>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.size && (
                        <p className="text-gray-500 text-xs mt-1">Size: {item.size}</p>
                      )}

                      {/* Price and Quantity */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center bg-white rounded-full border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-navy font-bold w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-navy font-bold">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 p-5 bg-gray-50">
            {/* AI Dresser Promo */}
            <div className="bg-gradient-to-r from-navy to-navy-700 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">Complete your look!</p>
                  <p className="text-white/60 text-xs">Try our AI Dresser for styling tips</p>
                </div>
              </div>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-2xl font-bold text-navy">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-gray-400 text-xs mb-4">
              Shipping & taxes calculated at checkout
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/checkout"
                onClick={handleClose}
                className="group flex items-center justify-center gap-2 w-full bg-gold text-navy font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-gold/30 transition-all"
              >
                Checkout
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={handleClose}
                className="w-full text-gray-500 font-medium py-2 hover:text-navy transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
