import AIChatBubble from '@/components/AIChatBubble'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Categories from '@/components/Categories'
import FeaturedProducts from '@/components/FeaturedProducts'
import AIDresserBanner from '@/components/AIDresserBanner'
import Reviews from '@/components/Reviews'
import AppInstallSection from '@/components/AppInstallSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <AIDresserBanner />
      <Reviews />
      <AppInstallSection />
      <Footer />
      <AIChatBubble />
    </main>
  )
}
