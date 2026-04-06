import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ToastProvider } from '@/components/Toast'
import CartDrawer from '@/components/CartDrawer'
import NavigationProgress from '@/components/NavigationProgress'
import InstallPrompt from '@/components/InstallPrompt'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
})

export const viewport: Viewport = {
  themeColor: '#1e3a5f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'America Brands Bazaar | Discover Premium Brands',
  description: 'Shop authentic premium brands - Calvin Klein, Nike, GAP, Ralph Lauren, Michael Kors and more. Quality clothing, accessories, and shoes at great prices.',
  keywords: ['America Brands Bazaar', 'premium brands', 'clothing', 'accessories', 'shoes', 'Calvin Klein', 'Nike', 'GAP', 'Ralph Lauren', 'Michael Kors'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ABB',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'America Brands Bazaar | Discover Premium Brands',
    description: 'Shop authentic premium brands at great prices',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ABB" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <NavigationProgress />
              {children}
              <CartDrawer />
              <InstallPrompt />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
