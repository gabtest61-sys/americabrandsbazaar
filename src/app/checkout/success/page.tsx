'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Loader2, AlertCircle, ShoppingBag, Package, Mail } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { useCart } from '@/context/CartContext'

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const orderIdParam = searchParams.get('order_id')

    if (orderIdParam) {
      setOrderId(orderIdParam)
    }

    // Verify payment status
    const verifyPayment = async () => {
      if (!sessionId) {
        // No session ID means COD order or direct navigation
        if (orderIdParam) {
          setStatus('success')
          clearCart()
        } else {
          setStatus('error')
        }
        return
      }

      try {
        // Verify with PayMongo that payment was successful
        const response = await fetch(`/api/paymongo/verify?session_id=${sessionId}`)
        const data = await response.json()

        if (data.success && data.status === 'paid') {
          setStatus('success')
          clearCart()
        } else if (data.status === 'pending') {
          // Payment still processing
          setStatus('success')
          clearCart()
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        // Assume success if we have an order ID (webhook will handle actual status)
        if (orderIdParam) {
          setStatus('success')
          clearCart()
        } else {
          setStatus('error')
        }
      }
    }

    verifyPayment()
  }, [searchParams, clearCart])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-navy py-4">
          <div className="container-max px-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gold">
                <Image src="/logo.jpg" alt={BRAND.name} fill className="object-cover" />
              </div>
              <span className="text-white font-bold">{BRAND.name}</span>
            </Link>
          </div>
        </header>

        <main className="container-max px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-navy mb-4">Payment Issue</h1>
            <p className="text-gray-600 mb-8">
              We couldn't verify your payment. If you believe this is an error, please contact us.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/checkout" className="btn-secondary">
                Try Again
              </Link>
              <Link href="/" className="btn-navy">
                Go Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-navy py-4">
        <div className="container-max px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gold">
              <Image src="/logo.jpg" alt={BRAND.name} fill className="object-cover" />
            </div>
            <span className="text-white font-bold">{BRAND.name}</span>
          </Link>
        </div>
      </header>

      <main className="container-max px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-navy mb-4">Payment Successful!</h1>

          {orderId && (
            <p className="text-gold font-mono text-lg mb-4">
              Order #{orderId}
            </p>
          )}

          <p className="text-gray-600 mb-8">
            Thank you for your purchase! Your order has been confirmed and will be processed shortly.
          </p>

          {/* Order Details Card */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-navy mb-4">What's Next?</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-medium text-navy">Confirmation Email</p>
                  <p className="text-sm text-gray-500">
                    You'll receive an order confirmation email with your receipt.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-medium text-navy">Order Processing</p>
                  <p className="text-sm text-gray-500">
                    We'll prepare your items for shipping within 1-2 business days.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="font-medium text-navy">Track Your Order</p>
                  <p className="text-sm text-gray-500">
                    We'll send tracking information once your order ships.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/account" className="btn-secondary">
              View Orders
            </Link>
            <Link href="/" className="btn-navy">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
