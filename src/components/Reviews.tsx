'use client'

import { useState, useEffect } from 'react'
import { Star, ChevronLeft, ChevronRight, Facebook, MessageCircle } from 'lucide-react'
import { REVIEWS, BRAND } from '@/lib/constants'

export default function Reviews() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % REVIEWS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextReview = () => {
    setIsAutoPlaying(false)
    setActiveIndex((prev) => (prev + 1) % REVIEWS.length)
  }

  const prevReview = () => {
    setIsAutoPlaying(false)
    setActiveIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)
  }

  return (
    <section className="section-padding bg-cream overflow-hidden">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <span className="text-gold font-semibold text-sm tracking-wider uppercase mb-2 block">
            Testimonials
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-navy">
            What Our Customers Say
          </h2>
        </div>

        {/* Reviews Carousel */}
        <div className="max-w-4xl mx-auto mb-10 md:mb-16">
          <div className="relative px-10 md:px-14">
            {/* Main Review Card */}
            <div className="bg-white rounded-3xl p-6 md:p-10 lg:p-12 shadow-xl">
              {/* Stars */}
              <div className="flex gap-1 mb-4 md:mb-6 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${
                      i < REVIEWS[activeIndex].rating ? 'text-gold fill-gold' : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Review text */}
              <blockquote className="text-base md:text-xl lg:text-2xl text-navy font-medium leading-relaxed mb-6 md:mb-8 text-center">
                &ldquo;{REVIEWS[activeIndex].comment}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gold to-gold-400 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg flex-shrink-0">
                  {REVIEWS[activeIndex].name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-bold text-navy text-base md:text-lg">{REVIEWS[activeIndex].name}</p>
                  <p className="text-gray-500 text-sm">Verified Buyer</p>
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevReview}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-navy hover:text-gold hover:scale-110 transition-all"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={nextReview}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 md:w-12 md:h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-navy hover:text-gold hover:scale-110 transition-all"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {REVIEWS.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false)
                  setActiveIndex(index)
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'w-8 bg-gold' : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
          {[
            { value: '500+', label: 'Happy Customers' },
            { value: '4.9', label: 'Average Rating' },
            { value: '100%', label: 'Authentic Products' },
            { value: '24h', label: 'Fast Response' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-4 md:p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-navy mb-1">{stat.value}</p>
              <p className="text-gray-500 text-xs md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Facebook CTA */}
        <div className="bg-navy rounded-3xl p-6 md:p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                Follow Us on Facebook
              </h3>
              <p className="text-white/60 text-sm md:text-base">
                Get exclusive deals and updates
              </p>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <a
                href={BRAND.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 md:px-6 rounded-full transition-all text-sm md:text-base"
              >
                <Facebook className="w-5 h-5" />
                Follow
              </a>
              <a
                href={BRAND.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-5 md:px-6 rounded-full transition-all text-sm md:text-base"
              >
                <MessageCircle className="w-5 h-5" />
                Message
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
