import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, Send } from 'lucide-react'
import { BRAND } from '@/lib/constants'

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/shop' },
    { name: 'Clothes', href: '/shop?category=clothes' },
    { name: 'Accessories', href: '/shop?category=accessories' },
    { name: 'Shoes', href: '/shop?category=shoes' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Shipping Info', href: '/shipping' },
    { name: 'Returns', href: '/returns' },
    { name: 'Size Guide', href: '/size-guide' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'AI Dresser', href: '/ai-dresser' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container-max px-4 md:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-1">Get Exclusive Offers</h3>
              <p className="text-white/50 text-sm">Subscribe for deals and new arrivals</p>
            </div>
            <div className="flex w-full md:w-auto md:max-w-sm">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-l-full px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
              />
              <button className="bg-gold hover:bg-gold-400 text-navy-900 font-semibold px-5 py-3 rounded-r-full transition-colors flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-max px-4 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-gold/50 bg-white">
                <Image
                  src="/abblogo.jpg"
                  alt={BRAND.name}
                  fill
                  className="object-contain scale-[1.75]"
                />
              </div>
              <div>
                <span className="font-bold text-lg block">{BRAND.name}</span>
                <span className="text-gold/70 text-[10px] tracking-widest uppercase">{BRAND.tagline}</span>
              </div>
            </Link>

            <p className="text-white/50 text-sm mb-5 max-w-xs leading-relaxed">
              Your trusted source for authentic premium brands since {BRAND.established}.
            </p>

            {/* Social */}
            <div className="flex gap-2 mb-5">
              <a
                href={BRAND.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-gold hover:text-navy flex items-center justify-center transition-all"
              >
                {/* Facebook icon */}
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-gold hover:text-navy flex items-center justify-center transition-all"
              >
                {/* Instagram icon */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            </div>

            {/* Contact */}
            <div className="space-y-2 text-sm text-white/50">
              <a href="mailto:sales@americabrandsbazaar.com" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Mail className="w-4 h-4" />
                sales@americabrandsbazaar.com
              </a>
              <a href="tel:09619371244" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Phone className="w-4 h-4" />
                09619371244
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/50 hover:text-gold text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">Support</h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/50 hover:text-gold text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-white/80 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-white/50 hover:text-gold text-sm transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="container-max px-4 md:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-white/40 text-xs">
            <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="#privacy" className="hover:text-gold transition-colors">Privacy</Link>
              <Link href="#terms" className="hover:text-gold transition-colors">Terms</Link>
              <span>EST. {BRAND.established}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
