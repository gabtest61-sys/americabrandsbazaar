import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | America Brands Bazaar',
  description: 'Terms and conditions for shopping at America Brands Bazaar.',
}

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using the America Brands Bazaar website (americabrandsbazaar.com) and placing orders, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.`,
    },
    {
      title: '2. Products and Authenticity',
      content: `All products sold by America Brands Bazaar are 100% authentic and sourced from authorized distributors. We guarantee the genuineness of every item in our catalog.

Product images are for illustration purposes. Actual colors may vary slightly due to monitor settings and photography conditions.`,
    },
    {
      title: '3. Pricing',
      content: `All prices are listed in Philippine Peso (₱). Prices are subject to change without prior notice.

Shipping fees are calculated at checkout based on your location. Orders totaling ₱2,000 or more qualify for free shipping.`,
    },
    {
      title: '4. Orders and Payment',
      content: `• Orders are confirmed only after payment is received and verified.
• We accept Cash on Delivery (COD), GCash, and bank transfer.
• We reserve the right to cancel orders in cases of pricing errors, suspected fraud, or stock unavailability.
• Order cancellations by the customer must be requested before the item is shipped.`,
    },
    {
      title: '5. Delivery',
      content: `We ship nationwide across the Philippines via our courier partners. Estimated delivery times are provided as guidelines and are not guaranteed.

America Brands Bazaar is not responsible for delays caused by the courier, weather, natural disasters, or other events beyond our control.`,
    },
    {
      title: '6. Returns and Refunds',
      content: `Returns are accepted within 7 days of receipt for defective items, wrong items, or items damaged during shipping. Items must be unused, unwashed, and in original packaging with tags attached.

Refunds are processed within 3–7 business days after inspection of the returned item. Please see our Returns page for full details.`,
    },
    {
      title: '7. Intellectual Property',
      content: `All content on this website including text, images, logos, and design is the property of America Brands Bazaar or respective brand owners. Unauthorized use, reproduction, or distribution of any content is strictly prohibited.`,
    },
    {
      title: '8. Account Responsibility',
      content: `You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility. Notify us immediately at sales@americabrandsbazaar.com if you suspect unauthorized use of your account.`,
    },
    {
      title: '9. Limitation of Liability',
      content: `America Brands Bazaar shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services beyond the value of the item purchased.`,
    },
    {
      title: '10. Governing Law',
      content: `These Terms of Service are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved under Philippine jurisdiction.`,
    },
    {
      title: '11. Changes to Terms',
      content: `We reserve the right to modify these Terms at any time. Updated terms will be posted on this page. Continued use of our services after changes constitutes acceptance.`,
    },
    {
      title: '12. Contact',
      content: `For questions about these Terms, contact us at:

Email: sales@americabrandsbazaar.com
Phone: 09619371244
Facebook: America Brands Bazaar`,
    },
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 ">

        <section className="pt-[72px]" style={{ background: '#0f1e38' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
            <nav className="hidden md:flex items-center gap-2 text-sm text-white/40 mb-6">
              <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gold/80">Terms of Service</span>
            </nav>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-gold" />
              </div>
              <span className="text-gold text-xs font-semibold uppercase tracking-[0.2em]">Legal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Terms of Service</h1>
            <p className="text-white/50 text-sm md:text-base">Effective date: January 1, 2024</p>
          </div>
          <div className="h-[3px] bg-gradient-to-r from-gold/40 via-gold to-gold/40" />
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
              <p className="text-gray-600 mb-8 leading-relaxed">
                These Terms of Service govern your use of America Brands Bazaar&apos;s website and services. Please read them carefully before making a purchase.
              </p>
              <div className="space-y-8">
                {sections.map(({ title, content }) => (
                  <div key={title}>
                    <h2 className="text-lg font-bold text-navy mb-3">{title}</h2>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{content}</p>
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
