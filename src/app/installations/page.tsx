import Header from '@/components/Header'
import Footer from '@/components/Footer'
import InstallButton from '@/components/InstallButton'
import { Smartphone, Monitor, Apple, Chrome } from 'lucide-react'

export const metadata = {
  title: 'Install App | America Brands Bazaar',
  description: 'Install the America Brands Bazaar app on your device for a faster shopping experience.',
}

export default function InstallationsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pt-24 pb-16">
        <div className="container-max px-4 md:px-8 py-12">
          {/* Hero */}
          <div className="text-center mb-10">
            <span className="text-gold font-semibold text-sm tracking-wider uppercase mb-3 block">
              Get the App
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy mb-4">
              Shop Faster with the ABB App
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto text-lg mb-8">
              Install America Brands Bazaar on your device for a native app experience — no browser required.
            </p>

            {/* Install Button */}
            <div className="flex justify-center">
              <InstallButton />
            </div>
          </div>

          {/* Install Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16 mt-12">
            {/* Android / Chrome */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Chrome className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="font-bold text-navy">Android / Chrome</h2>
                  <p className="text-sm text-gray-400">Chrome browser</p>
                </div>
              </div>
              <ol className="space-y-4">
                {[
                  'Open americabrandsbazaar.com in Chrome',
                  'Tap the three-dot menu (⋮) in the top right',
                  'Tap "Add to Home Screen"',
                  'Tap "Add" to confirm',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-600 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* iPhone / Safari */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                  <Apple className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="font-bold text-navy">iPhone / iPad</h2>
                  <p className="text-sm text-gray-400">Safari browser</p>
                </div>
              </div>
              <ol className="space-y-4">
                {[
                  'Open americabrandsbazaar.com in Safari',
                  'Tap the Share button (□↑) at the bottom',
                  'Scroll down and tap "Add to Home Screen"',
                  'Tap "Add" in the top right corner',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-600 text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-navy rounded-2xl p-8 md:p-12 text-white text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Why Install the App?</h2>
            <p className="text-white/60 mb-8">Everything you love, faster and more convenient</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Smartphone, title: 'Native Feel', desc: 'Full-screen experience like a real app' },
                { icon: Monitor, title: 'Works Offline', desc: 'Browse even without internet' },
                { icon: Chrome, title: 'Instant Access', desc: 'One tap from your home screen' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-white/50 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
