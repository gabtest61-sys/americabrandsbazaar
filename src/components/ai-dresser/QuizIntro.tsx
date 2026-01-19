'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Lock, ShoppingBag, Clock, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface QuizIntroProps {
  isLoggedIn: boolean
  authLoading: boolean
  hasAccess: boolean
  accessType: 'daily_free' | 'bonus' | 'none'
  bonusSessions: number
  userName?: string
  onStart: () => void
  onOpenAuth: () => void
}

export default function QuizIntro({
  isLoggedIn,
  authLoading,
  hasAccess,
  accessType,
  bonusSessions,
  userName,
  onStart,
  onOpenAuth
}: QuizIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center mx-auto mb-8">
        <Sparkles className="w-12 h-12 text-gold" />
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
        Your Personal
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-300 to-gold">
          AI Fashion Stylist
        </span>
      </h1>

      <p className="text-white/60 text-lg mb-8">
        Answer a few quick questions and let our AI curate 5 perfect outfits
        from our premium collection, tailored just for you.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="text-2xl mb-2">🎯</div>
          <p className="text-white text-sm font-medium">Personalized</p>
          <p className="text-white/40 text-xs">Based on your style</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="text-2xl mb-2">👗</div>
          <p className="text-white text-sm font-medium">5 Complete Looks</p>
          <p className="text-white/40 text-xs">Ready to purchase</p>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="text-2xl mb-2">⚡</div>
          <p className="text-white text-sm font-medium">Quick & Easy</p>
          <p className="text-white/40 text-xs">Under 2 minutes</p>
        </div>
      </div>

      {authLoading ? (
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
          <span className="text-white/50">Checking access...</span>
        </div>
      ) : !isLoggedIn ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
          <Lock className="w-8 h-8 text-gold mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Login Required</p>
          <p className="text-white/50 text-sm mb-4">
            Sign in to access your free daily AI Stylist session
          </p>
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-400 text-navy font-bold py-3 px-6 rounded-full transition-all"
          >
            Sign In to Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : !hasAccess ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
          <Clock className="w-8 h-8 text-gold mx-auto mb-3" />
          <p className="text-white font-medium mb-2">Session Used Today</p>
          <p className="text-white/50 text-sm mb-4">
            You&apos;ve already used your free styling session for today.
          </p>
          <div className="flex flex-col gap-3 items-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-400 text-navy font-bold py-3 px-6 rounded-full transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Our Collection
            </Link>
            <p className="text-white/40 text-sm">
              Your session resets at 12:00 AM midnight
            </p>
            <p className="text-white/50 text-xs mt-2">
              💡 Tip: Make a purchase to earn bonus AI Dresser sessions!
            </p>
          </div>
        </div>
      ) : (
        <div>
          {userName && (
            <p className="text-white/50 text-sm mb-4">
              Welcome back, <span className="text-gold font-medium">{userName}</span>!
              {bonusSessions > 0 && (
                <span className="ml-2 text-gold">
                  ✨ {bonusSessions} bonus session{bonusSessions > 1 ? 's' : ''} available
                </span>
              )}
            </p>
          )}
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-3 bg-gold hover:bg-gold-400 text-navy font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-gold/25 hover:shadow-gold/40"
          >
            Start Styling Session
            {accessType === 'bonus' && <span className="text-sm opacity-75">(Using Bonus)</span>}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      <p className="text-white/30 text-sm mt-6">
        1 free session per day • Purchases unlock bonus sessions
      </p>
    </motion.div>
  )
}
