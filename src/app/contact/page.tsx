import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Mail, Phone, Facebook, Clock, MapPin, ChevronRight, MessageSquare } from 'lucide-react'

export const metadata = {
  title: 'Contact Us | America Brands Bazaar',
  description: 'Get in touch with America Brands Bazaar. We\'re here to help with your orders, questions, and concerns.',
}

export default function ContactPage() {
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
              <span className="text-gold/80">Contact Us</span>
            </nav>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-gold" />
              </div>
              <span className="text-gold text-xs font-semibold uppercase tracking-[0.2em]">Get in Touch</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Contact Us</h1>
            <p className="text-white/50 text-sm md:text-base max-w-xl">
              Have a question about your order or need help finding the right product? We&apos;re happy to assist.
            </p>
          </div>
          <div className="h-[3px] bg-gradient-to-r from-gold/40 via-gold to-gold/40" />
        </section>

        <section className="py-10 md:py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 max-w-5xl mx-auto">

              {/* Contact Info */}
              <div className="space-y-4 md:space-y-6">
                <h2 className="text-xl md:text-2xl font-bold text-navy">Reach Us Directly</h2>

                {[
                  {
                    icon: Facebook,
                    label: 'Facebook',
                    value: 'America Brands Bazaar',
                    href: 'https://www.facebook.com/share/1CWpCZdBB6/?mibextid=wwXIfr',
                    desc: 'Message us on Facebook for the fastest response',
                  },
                  {
                    icon: Phone,
                    label: 'Phone / Viber / WhatsApp',
                    value: '09619371244',
                    href: 'tel:09619371244',
                    desc: 'Call or message us anytime',
                  },
                  {
                    icon: Mail,
                    label: 'Email',
                    value: 'sales@americabrandsbazaar.com',
                    href: 'mailto:sales@americabrandsbazaar.com',
                    desc: 'We reply within 24 hours',
                  },
                ].map(({ icon: Icon, label, value, href, desc }) => (
                  <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                    className="flex gap-4 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="font-semibold text-navy group-hover:text-gold transition-colors">{value}</p>
                      <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
                    </div>
                  </a>
                ))}

                {/* Hours */}
                <div className="flex gap-4 bg-white rounded-2xl p-5 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Business Hours</p>
                    <p className="font-semibold text-navy">Monday – Saturday</p>
                    <p className="text-gray-500 text-sm">9:00 AM – 6:00 PM (Philippine Time)</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex gap-4 bg-white rounded-2xl p-5 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Location</p>
                    <p className="font-semibold text-navy">Philippines</p>
                    <p className="text-gray-500 text-sm">Nationwide shipping available</p>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-navy mb-4 md:mb-6">Common Questions</h2>
                <div className="space-y-4">
                  {[
                    { q: 'How do I track my order?', a: 'Once your order is shipped, we will send the tracking number to your contact details via SMS or Facebook message.' },
                    { q: 'Are your products 100% authentic?', a: 'Yes. Every item we sell is 100% genuine. We source directly from authorized distributors and verify authenticity before selling.' },
                    { q: 'Do you accept returns?', a: 'Yes, we accept returns within 7 days of receiving your order for items with defects or incorrect shipments. See our Returns page for details.' },
                    { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD), GCash, and bank transfers. Payment details are provided during checkout.' },
                    { q: 'How long does delivery take?', a: 'Metro Manila: 2–4 business days. Provincial: 4–7 business days. Rush delivery available on request.' },
                  ].map(({ q, a }) => (
                    <div key={q} className="bg-white rounded-2xl p-5 shadow-sm">
                      <p className="font-semibold text-navy mb-1.5">{q}</p>
                      <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
