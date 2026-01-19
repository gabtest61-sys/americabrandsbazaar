'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, Sparkles, ShieldCheck, Award, Truck } from 'lucide-react'
import { BRAND } from '@/lib/constants'

const brands = ['Calvin Klein', 'Nike', 'GAP', 'Ralph Lauren', 'Michael Kors']

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeBrand, setActiveBrand] = useState(0)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBrand((prev) => (prev + 1) % brands.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const scrollToProducts = () => {
    document.getElementById('featured-products')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-navy pt-24 md:pt-28">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-800 to-navy-900" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.1),transparent_50%)]" />
      </div>

      <div className="container-max px-4 md:px-8 relative z-10 py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Content */}
          <div className={`text-center lg:text-left transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gold/10 backdrop-blur-sm border border-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
              </span>
              New Arrivals Available
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6">
              Premium Style,
              <span className="block mt-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-300 to-gold animate-pulse">
                  Unbeatable Prices
                </span>
              </span>
            </h1>

            {/* Rotating brand text */}
            <div className="h-8 mb-8 overflow-hidden">
              <p className="text-white/60 text-lg">
                Shop authentic{' '}
                <span className="text-gold font-semibold inline-block min-w-[140px] text-left transition-all duration-500">
                  {brands[activeBrand]}
                </span>
                {' '}& more
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-12">
              <button
                onClick={scrollToProducts}
                className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-gold hover:bg-yellow-400 text-navy font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-lg shadow-gold/25 hover:shadow-gold/40 hover:shadow-xl hover:scale-105"
              >
                Shop Now
                <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
              </button>

              <Link
                href="/ai-dresser"
                className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-gold/50 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300"
              >
                <Sparkles className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                Try AI Stylist
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-white/50 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold" />
                <span>100% Authentic</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-gold" />
                <span>Premium Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gold" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>

          {/* Logo Showcase */}
          <div className={`relative transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-[420px] md:h-[420px] mx-auto">
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border border-gold/10 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 sm:inset-6 rounded-full border border-gold/20 animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-8 sm:inset-12 rounded-full border border-gold/30" />

              {/* Glow effect */}
              <div className="absolute inset-12 sm:inset-16 rounded-full bg-gold/20 blur-3xl" />

              {/* Main logo */}
              <div className="absolute inset-12 sm:inset-16 rounded-full border-4 border-gold shadow-2xl shadow-gold/30 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt={BRAND.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating brand badges */}
              <div className="absolute top-4 sm:top-8 right-0 sm:right-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm font-medium animate-float">
                <span className="text-gold">500+</span> Happy Customers
              </div>
              <div className="absolute bottom-8 sm:bottom-12 -left-2 sm:left-0 bg-white/10 backdrop-blur-md border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm font-medium animate-float" style={{ animationDelay: '1s' }}>
                <span className="text-gold">EST.</span> {BRAND.established}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={scrollToProducts}
          className="flex flex-col items-center gap-2 text-navy/60 hover:text-gold transition-colors cursor-pointer"
        >
          <span className="text-[10px] tracking-wider uppercase font-medium">Explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-current flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-current rounded-full animate-bounce" />
          </div>
        </button>
      </div>
    </section>
  )
}
