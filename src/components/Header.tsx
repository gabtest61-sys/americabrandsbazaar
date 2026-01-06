'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ShoppingCart, User, Search, ChevronRight, Truck, Shield, RotateCcw } from 'lucide-react'
import { NAV_LINKS, BRAND } from '@/lib/constants'
import { useCart } from '@/context/CartContext'

const promoMessages = [
  { icon: Truck, text: 'Free Shipping on Orders ₱2,000+' },
  { icon: Shield, text: '100% Authentic Products' },
  { icon: RotateCcw, text: 'Easy Returns within 7 Days' },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentPromo, setCurrentPromo] = useState(0)
  const { itemCount, toggleCart } = useCart()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promoMessages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const CurrentPromoIcon = promoMessages[currentPromo].icon

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Promo Banner */}
      <div className="bg-gold">
        <div className="container-max px-4">
          <div className="flex items-center justify-center h-9 text-navy text-sm font-medium overflow-hidden">
            <div className="flex items-center gap-2 animate-fade-in" key={currentPromo}>
              <CurrentPromoIcon className="w-4 h-4" />
              <span>{promoMessages[currentPromo].text}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`transition-all duration-300 ${
        isScrolled
          ? 'bg-navy/95 backdrop-blur-lg shadow-xl'
          : 'bg-navy'
      }`}>
        <div className="container-max px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className={`relative rounded-full overflow-hidden border-2 border-gold/80 group-hover:border-gold transition-all duration-300 shadow-lg ${
                isScrolled ? 'w-10 h-10' : 'w-12 h-12 md:w-14 md:h-14'
              }`}>
                <Image
                  src="/logo.jpg"
                  alt={BRAND.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-white font-bold tracking-wide transition-all duration-300 ${
                  isScrolled ? 'text-lg' : 'text-xl'
                }`}>
                  {BRAND.name}
                </h1>
                <p className="text-gold/80 text-[10px] tracking-[0.2em] uppercase">
                  {BRAND.tagline}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="relative px-5 py-2 text-white/90 hover:text-white text-sm font-medium tracking-wide transition-colors group"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gold group-hover:w-8 transition-all duration-300 rounded-full" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Search */}
              <button className="p-2.5 text-white/80 hover:text-gold hover:bg-white/5 rounded-full transition-all">
                <Search className="w-5 h-5" />
              </button>

              {/* Account */}
              <Link
                href="/account"
                className="hidden sm:flex p-2.5 text-white/80 hover:text-gold hover:bg-white/5 rounded-full transition-all"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative p-2.5 text-white/80 hover:text-gold hover:bg-white/5 rounded-full transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-gold text-navy text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center animate-scale-in">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 text-white/80 hover:text-gold hover:bg-white/5 rounded-full transition-all ml-1"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ${
        isMenuOpen ? 'max-h-96' : 'max-h-0'
      }`}>
        <nav className="bg-navy-800/95 backdrop-blur-lg border-t border-white/10">
          <div className="container-max px-4 py-3">
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between py-3.5 px-4 text-white/90 hover:text-gold hover:bg-white/5 rounded-xl transition-all text-sm font-medium"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {link.name}
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2">
              <Link
                href="/account"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 py-3.5 px-4 text-white/90 hover:text-gold hover:bg-white/5 rounded-xl transition-all text-sm font-medium"
              >
                <User className="w-4 h-4" />
                My Account
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
