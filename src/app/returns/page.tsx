import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { RotateCcw, CheckCircle, XCircle, AlertCircle, Phone } from 'lucide-react'

export const metadata = {
  title: 'Returns & Exchanges | America Brands Bazaar',
  description: 'Return and exchange policy for America Brands Bazaar. Easy 7-day returns on eligible items.',
}

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pt-24">

        {/* Hero */}
        <section className="bg-navy py-14">
          <div className="container-max px-4 md:px-8 text-center">
            <span className="text-gold text-sm font-semibold uppercase tracking-widest mb-3 block">Policy</span>
            <h1 className="text-4xl font-bold text-white mb-3">Returns & Exchanges</h1>
            <p className="text-white/60 max-w-xl mx-auto">
              Your satisfaction is our priority. We accept returns within 7 days for eligible items.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container-max px-4 md:px-8 max-w-4xl mx-auto space-y-8">

            {/* How to Return */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-gold" />
                </div>
                <h2 className="text-xl font-bold text-navy">How to Return or Exchange</h2>
              </div>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Contact Us Within 7 Days', desc: 'Message us on Facebook or call 09619371244 within 7 days of receiving your order. Include your order number and reason for return.' },
                  { step: '2', title: 'Send Photos', desc: 'Take clear photos of the item showing the issue (defect, wrong item, damage) and send them to us for review.' },
                  { step: '3', title: 'Wait for Approval', desc: 'Our team will review your request within 1–2 business days. We will notify you via Facebook message or SMS.' },
                  { step: '4', title: 'Ship the Item Back', desc: 'Once approved, ship the item back to us in its original packaging. We will cover the return shipping cost for approved returns.' },
                  { step: '5', title: 'Refund or Exchange', desc: 'Once we receive and inspect the item, we will process your refund (via GCash/bank) or ship your replacement within 3–5 business days.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {step}
                    </span>
                    <div>
                      <p className="font-semibold text-navy mb-1">{title}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eligible & Not Eligible */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold text-navy">Eligible for Return</h3>
                </div>
                <ul className="space-y-2.5">
                  {[
                    'Items with manufacturing defects',
                    'Wrong item received',
                    'Damaged during shipping',
                    'Item significantly different from description',
                    'Unworn, with original tags attached',
                    'Returned within 7 days of receipt',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-navy">Not Eligible for Return</h3>
                </div>
                <ul className="space-y-2.5">
                  {[
                    'Items returned after 7 days',
                    'Worn, washed, or altered items',
                    'Items without original tags',
                    'Sale or clearance items (final sale)',
                    'Underwear, socks, and innerwear (hygiene)',
                    'Items damaged by customer misuse',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Note */}
            <div className="bg-gold/10 border border-gold/20 rounded-2xl p-6 flex gap-4">
              <AlertCircle className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-navy mb-1">Important Note</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  All returns are subject to inspection. We reserve the right to decline returns that do not meet our policy criteria.
                  Refunds are processed within 3–7 business days after we receive and inspect the returned item.
                </p>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-navy rounded-2xl p-8 text-white text-center">
              <Phone className="w-8 h-8 text-gold mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Need Help With a Return?</h3>
              <p className="text-white/60 mb-4">Message us on Facebook or call us directly.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="https://www.facebook.com/share/1CWpCZdBB6/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"
                  className="bg-gold text-navy font-semibold px-6 py-3 rounded-full hover:bg-white transition-colors">
                  Message on Facebook
                </a>
                <a href="tel:09619371244" className="border border-white/30 text-white font-semibold px-6 py-3 rounded-full hover:border-gold hover:text-gold transition-colors">
                  Call 09619371244
                </a>
              </div>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
