'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle, ShoppingBag, Heart } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'cart' | 'wishlist'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
  isVisible: boolean
}

const iconMap = {
  success: Check,
  error: X,
  info: AlertCircle,
  cart: ShoppingBag,
  wishlist: Heart
}

const bgMap = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  cart: 'bg-gold',
  wishlist: 'bg-pink-500'
}

export default function Toast({
  message,
  type = 'success',
  duration = 3000,
  onClose,
  isVisible
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  const Icon = iconMap[type]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className={`${bgMap[type]} text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-3`}>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">{message}</span>
            <button
              onClick={onClose}
              className="ml-2 w-5 h-5 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for easy toast management
export function useToast() {
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false
  })

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, isVisible: true })
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  return {
    toast,
    showToast,
    hideToast
  }
}
