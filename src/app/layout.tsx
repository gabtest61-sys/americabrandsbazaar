import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ToastProvider } from '@/components/Toast'
import CartDrawer from '@/components/CartDrawer'
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

export const metadata: Metadata = {
  title: 'LGM Apparel | Premium Brands EST. 2020',
  description: 'Shop authentic premium brands - Calvin Klein, Nike, GAP, Ralph Lauren, Michael Kors. Quality clothing, accessories, and shoes at great prices.',
  keywords: ['LGM Apparel', 'premium brands', 'clothing', 'accessories', 'shoes', 'Calvin Klein', 'Nike', 'GAP', 'Ralph Lauren', 'Michael Kors'],
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'LGM Apparel | Premium Brands',
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
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              {children}
              <CartDrawer />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
