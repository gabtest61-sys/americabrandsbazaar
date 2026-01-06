'use client'

import Link from 'next/link'
import { Sparkles, Wand2, Gift, Calendar, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Wand2,
    title: 'Personal Styling',
    description: 'AI-curated outfits based on your style',
  },
  {
    icon: Gift,
    title: 'Gift Finder',
    description: 'Perfect presents for any occasion',
  },
  {
    icon: Calendar,
    title: 'Occasion Looks',
    description: 'Wedding, date night, office & more',
  },
]

export default function AIDresserBanner() {
  return (
    <section className="relative overflow-hidden bg-navy py-20 md:py-28">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.15),transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.1),transparent_60%)]" />
      </div>

      <div className="container-max px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Styling
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Your Personal
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-300 to-gold">
                AI Fashion Stylist
              </span>
            </h2>

            {/* Description */}
            <p className="text-white/60 text-lg mb-10 max-w-lg mx-auto lg:mx-0">
              Answer a few questions and let our AI curate the perfect look from our premium collection.
            </p>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-white font-medium text-sm mb-1">{feature.title}</h3>
                    <p className="text-white/40 text-xs hidden md:block">{feature.description}</p>
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            <Link
              href="/ai-dresser"
              className="group inline-flex items-center gap-3 bg-gold hover:bg-yellow-400 text-navy font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-gold/25 hover:shadow-gold/40"
            >
              Try AI Dresser Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-white/40 text-sm mt-4">No account needed</p>
          </div>

          {/* Phone Mockup */}
          <div className="relative hidden lg:block">
            <div className="relative w-full max-w-sm mx-auto">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full scale-75" />

              {/* Phone frame */}
              <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />

                {/* Phone screen */}
                <div className="relative bg-gradient-to-b from-navy-800 to-navy rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  {/* App header */}
                  <div className="bg-navy-900/50 backdrop-blur-sm px-6 pt-10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">AI Stylist</p>
                        <p className="text-white/50 text-xs">Finding your style...</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat bubbles */}
                  <div className="p-4 space-y-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
                      <p className="text-white text-xs">What's the occasion?</p>
                    </div>
                    <div className="bg-gold/20 backdrop-blur-sm rounded-2xl rounded-tr-sm p-3 max-w-[80%] ml-auto">
                      <p className="text-white text-xs">Date night 💫</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm p-3 max-w-[80%]">
                      <p className="text-white text-xs">Perfect! Here are my top picks...</p>
                    </div>

                    {/* Product suggestions */}
                    <div className="flex gap-2 mt-4">
                      <div className="flex-1 bg-white/10 rounded-xl p-2">
                        <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-600/30 mb-2" />
                        <p className="text-white text-[10px] font-medium truncate">CK Dress</p>
                        <p className="text-gold text-[10px]">₱2,499</p>
                      </div>
                      <div className="flex-1 bg-white/10 rounded-xl p-2">
                        <div className="aspect-square rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-600/30 mb-2" />
                        <p className="text-white text-[10px] font-medium truncate">MK Clutch</p>
                        <p className="text-gold text-[10px]">₱1,899</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-sm animate-float">
                <span className="text-gold">5</span> outfit picks
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white text-sm animate-float" style={{ animationDelay: '1s' }}>
                <span className="text-gold">1-click</span> add to cart
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
