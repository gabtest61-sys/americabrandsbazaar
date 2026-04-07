import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Truck, Clock, MapPin, Package, CheckCircle, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Shipping Info | America Brands Bazaar',
  description: 'Learn about shipping rates, delivery times, and how we process orders at America Brands Bazaar.',
}

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 ">

        {/* Hero */}
        <section className="pt-[72px]" style={{ background: '#0f1e38' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
            <nav className="hidden md:flex items-center gap-2 text-sm text-white/40 mb-6">
              <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gold/80">Shipping Information</span>
            </nav>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <Package className="w-4 h-4 text-gold" />
              </div>
              <span className="text-gold text-xs font-semibold uppercase tracking-[0.2em]">Delivery</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Shipping Information</h1>
            <p className="text-white/50 text-sm md:text-base max-w-xl">
              We ship nationwide across the Philippines. Here&apos;s everything you need to know about our delivery process.
            </p>
          </div>
          <div className="h-[3px] bg-gradient-to-r from-gold/40 via-gold to-gold/40" />
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8 max-w-4xl mx-auto space-y-8">

            {/* Rates */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-gold" />
                </div>
                <h2 className="text-xl font-bold text-navy">Shipping Rates</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 text-gray-500 font-semibold">Order Value</th>
                      <th className="text-left py-3 text-gray-500 font-semibold">Shipping Fee</th>
                      <th className="text-left py-3 text-gray-500 font-semibold">Coverage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr>
                      <td className="py-3.5 text-navy font-medium">Below ₱2,000</td>
                      <td className="py-3.5 text-navy">₱100</td>
                      <td className="py-3.5 text-gray-500">Nationwide</td>
                    </tr>
                    <tr>
                      <td className="py-3.5 text-navy font-medium">₱2,000 and above</td>
                      <td className="py-3.5 text-green-600 font-semibold">FREE</td>
                      <td className="py-3.5 text-gray-500">Nationwide</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 text-sm text-navy">
                🎉 <strong>Free shipping</strong> on all orders ₱2,000 and above!
              </div>
            </div>

            {/* Delivery Times */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gold" />
                </div>
                <h2 className="text-xl font-bold text-navy">Estimated Delivery Times</h2>
              </div>
              <div className="space-y-4">
                {[
                  { area: 'Metro Manila (NCR)', time: '2–4 business days', note: '' },
                  { area: 'Luzon (outside Metro Manila)', time: '3–5 business days', note: '' },
                  { area: 'Visayas', time: '4–7 business days', note: '' },
                  { area: 'Mindanao', time: '5–8 business days', note: '' },
                  { area: 'Remote / Island Areas', time: '7–14 business days', note: 'Additional shipping fees may apply' },
                ].map(({ area, time, note }) => (
                  <div key={area} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-navy text-sm">{area}</p>
                        {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap">{time}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">* Delivery times are estimates and may vary during peak seasons or holidays.</p>
            </div>

            {/* Order Processing */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gold" />
                </div>
                <h2 className="text-xl font-bold text-navy">Order Processing</h2>
              </div>
              <div className="space-y-3">
                {[
                  'Orders are processed within 1–2 business days after payment confirmation.',
                  'You will receive an SMS or Facebook message with your tracking number once shipped.',
                  'Orders placed on weekends or holidays are processed the next business day.',
                  'We use trusted courier partners: J&T Express, LBC, and Ninja Van.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
