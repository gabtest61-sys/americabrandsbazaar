import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Privacy Policy | America Brands Bazaar',
  description: 'Privacy policy for America Brands Bazaar. How we collect, use, and protect your personal information.',
}

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Information We Collect',
      content: `When you place an order or create an account, we collect the following information:
• Full name and contact number
• Email address
• Delivery address
• Facebook profile name (for order updates)
• Payment information (we do not store card details)
• Order history and preferences`,
    },
    {
      title: '2. How We Use Your Information',
      content: `We use your information to:
• Process and fulfill your orders
• Send order confirmations and shipping updates
• Respond to your inquiries and customer support requests
• Improve our products, services, and website
• Send promotional offers (only with your consent)
• Comply with legal obligations`,
    },
    {
      title: '3. Information Sharing',
      content: `We do not sell, trade, or rent your personal information to third parties. We may share your information with:
• Courier partners (J&T Express, LBC, Ninja Van) for delivery purposes only
• Payment processors (GCash, bank partners) for secure payment processing
• Service providers who help operate our website under strict confidentiality agreements`,
    },
    {
      title: '4. Data Security',
      content: `We take the security of your personal information seriously. We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction.

However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.`,
    },
    {
      title: '5. Cookies',
      content: `Our website uses cookies to enhance your browsing experience. Cookies help us:
• Remember your cart items and preferences
• Understand how visitors use our website
• Improve site performance and functionality

You can disable cookies through your browser settings, though some features may not function properly.`,
    },
    {
      title: '6. Your Rights',
      content: `Under the Philippine Data Privacy Act of 2012 (Republic Act 10173), you have the right to:
• Access your personal data we hold
• Request correction of inaccurate data
• Request deletion of your data
• Withdraw consent for data processing
• Lodge a complaint with the National Privacy Commission

To exercise these rights, contact us at sales@americabrandsbazaar.com.`,
    },
    {
      title: '7. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of our website after changes constitutes acceptance of the updated policy.`,
    },
    {
      title: '8. Contact Us',
      content: `If you have questions about this Privacy Policy or how we handle your data, please contact us:

Email: sales@americabrandsbazaar.com
Phone: 09619371244
Facebook: America Brands Bazaar`,
    },
  ]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pt-24">

        <section className="bg-navy py-14">
          <div className="container-max px-4 md:px-8 text-center">
            <span className="text-gold text-sm font-semibold uppercase tracking-widest mb-3 block">Legal</span>
            <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
            <p className="text-white/60">Effective date: January 1, 2024</p>
          </div>
        </section>

        <section className="py-16">
          <div className="container-max px-4 md:px-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
              <p className="text-gray-600 mb-8 leading-relaxed">
                America Brands Bazaar (&quot;ABB&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use our website and services.
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
