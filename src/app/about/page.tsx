import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Sparkles, Shield, Heart, Award } from 'lucide-react'

export const metadata = {
  title: 'About Us | America Brands Bazaar',
  description: 'Learn about America Brands Bazaar — your trusted source for authentic premium brands in the Philippines.',
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pt-24">

        {/* Hero */}
        <section className="bg-navy py-16 md:py-24">
          <div className="container-max px-4 md:px-8 text-center">
            <span className="text-gold text-sm font-semibold uppercase tracking-widest mb-3 block">Our Story</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About America Brands Bazaar</h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Your trusted destination for authentic premium fashion brands in the Philippines — delivering quality you can feel and style you can trust.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 bg-white">
          <div className="container-max px-4 md:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-navy mb-6">Who We Are</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
                <p>
                  America Brands Bazaar (ABB) was established in 2023 with one mission — to make authentic premium fashion brands accessible to every Filipino. We source directly and carefully curate only the highest quality products.
                </p>
                <p>
                  We carry internationally recognized brands including <strong className="text-navy">Nike, Calvin Klein, Tommy Hilfiger, GAP, Ralph Lauren, Michael Kors</strong>, and many more. Every item in our collection is verified authentic before it reaches you.
                </p>
                <p>
                  Based in the Philippines, we understand the local lifestyle, climate, and culture. Our team handpicks products that suit the Filipino way of life — from casual everyday wear to formal occasions and everything in between.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-cream">
          <div className="container-max px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-navy">What We Stand For</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Shield, title: '100% Authentic', desc: 'Every product is verified genuine. No fakes, no replicas — ever.' },
                { icon: Award, title: 'Premium Quality', desc: 'We curate only the best from internationally trusted brands.' },
                { icon: Heart, title: 'Customer First', desc: 'Your satisfaction drives everything we do, from browsing to delivery.' },
                { icon: Sparkles, title: 'Style Forward', desc: 'We bring the latest trends and timeless classics right to your door.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-bold text-navy mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-navy text-white text-center">
          <div className="container-max px-4 md:px-8">
            <h2 className="text-3xl font-bold mb-3">Ready to Shop?</h2>
            <p className="text-white/60 mb-8">Explore our full collection of premium authentic brands.</p>
            <a href="/shop" className="inline-block bg-gold text-navy font-bold px-8 py-4 rounded-full hover:bg-white transition-colors">
              Browse All Products
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
