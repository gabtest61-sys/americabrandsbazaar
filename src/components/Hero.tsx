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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-navy pt-[72px]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-800 to-navy-900" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(201,162,39,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(201,162,39,0.1),transparent_50%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full relative z-10 py-10 md:py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Content ── */}
          <div className={`text-center lg:text-left transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gold/10 backdrop-blur-sm border border-gold/20 text-gold px-4 py-2 rounded-full text-xs md:text-sm font-medium mb-5 md:mb-7">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
              </span>
              New Arrivals Available
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-4 md:mb-5">
              Premium Style,
              <span className="block mt-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-300 to-gold">
                  Unbeatable Prices
                </span>
              </span>
            </h1>

            {/* Rotating brand text — fixed height, no overflow clipping */}
            <div className="mb-6 md:mb-8">
              <p className="text-white/60 text-sm md:text-base lg:text-lg">
                Shop authentic{' '}
                <span className="text-gold font-semibold">
                  {brands[activeBrand]}
                </span>
                {' '}& more
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center lg:justify-start mb-8 md:mb-10">
              <button
                onClick={scrollToProducts}
                className="group flex items-center justify-center gap-2 bg-gold hover:bg-yellow-500 text-navy font-bold py-3.5 px-8 rounded-full transition-all duration-300 shadow-lg shadow-gold/25 hover:scale-105 text-sm md:text-base"
              >
                Shop Now
                <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </button>

              <Link
                href="/ai-dresser"
                className="group flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/15 hover:border-gold/50 text-white font-semibold py-3.5 px-8 rounded-full transition-all duration-300 text-sm md:text-base"
              >
                <Sparkles className="w-4 h-4 text-gold group-hover:scale-110 transition-transform flex-shrink-0" />
                Try AI Stylist
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center lg:justify-start gap-4 md:gap-6 flex-wrap text-white/50 text-xs md:text-sm">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gold flex-shrink-0" />
                <span>100% Authentic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-gold flex-shrink-0" />
                <span>Premium Quality</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-gold flex-shrink-0" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>

          {/* ── Logo Showcase ── */}
          <div className={`relative transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-[360px] md:h-[360px] lg:w-[420px] lg:h-[420px] mx-auto">
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border border-gold/10 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-4 sm:inset-6 rounded-full border border-gold/20 animate-[spin_15s_linear_infinite_reverse]" />
              <div className="absolute inset-8 sm:inset-12 rounded-full border border-gold/30" />
              {/* Glow */}
              <div className="absolute inset-12 sm:inset-16 rounded-full bg-gold/20 blur-3xl" />
              {/* Main logo */}
              <div className="absolute inset-12 sm:inset-16 rounded-full border-4 border-gold shadow-2xl shadow-gold/30 overflow-hidden bg-cream">
                <Image src="/abblogo.jpg" alt={BRAND.name} fill className="object-contain scale-[1.75]" priority />
              </div>
              {/* Floating badge — top right */}
              <div className="absolute top-2 sm:top-8 right-0 sm:right-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-[11px] sm:text-sm font-medium animate-float whitespace-nowrap">
                <span className="text-gold">500+</span> Happy Customers
              </div>
              {/* Floating badge — bottom left */}
              <div className="absolute bottom-6 sm:bottom-12 -left-2 sm:left-0 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-[11px] sm:text-sm font-medium animate-float whitespace-nowrap" style={{ animationDelay: '1s' }}>
                <span className="text-gold">EST.</span> {BRAND.established}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent" />

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex">
        <button
          onClick={scrollToProducts}
          className="flex flex-col items-center gap-2 text-white/40 hover:text-gold transition-colors cursor-pointer"
        >
          <span className="text-[10px] tracking-wider uppercase font-medium">Explore</span>
          <div className="w-5 h-8 rounded-full border-2 border-current flex items-start justify-center p-1">
            <div className="w-1 h-2.5 bg-current rounded-full animate-bounce" />
          </div>
        </button>
      </div>
    </section>
  )
}
