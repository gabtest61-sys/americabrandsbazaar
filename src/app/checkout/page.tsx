'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ShoppingBag, User, Mail, Phone, MapPin, FileText, Lock, Check, Truck, Loader2 } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { formatPrice, BRAND } from '@/lib/constants'
import { CheckoutFormData } from '@/lib/types'
import { sendWebhook, createCheckoutPayload, createOrderCompletedPayload } from '@/lib/webhook'
import { createOrder, OrderItem, getShippingSettings, ShippingSettings } from '@/lib/firestore'

type CheckoutStep = 'info' | 'confirm' | 'success'

// Default shipping settings (fallback if Firestore not available)
const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  rates: [
    { id: 'metro-manila', region: 'Metro Manila', fee: 100 },
    { id: 'luzon', region: 'Luzon (Provincial)', fee: 150 },
    { id: 'visayas', region: 'Visayas', fee: 200 },
    { id: 'mindanao', region: 'Mindanao', fee: 250 },
  ],
  freeShippingThreshold: 3000,
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user, isLoggedIn } = useAuth()
  const [step, setStep] = useState<CheckoutStep>('info')
  const [isGuest, setIsGuest] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string>('')
  const [shippingRegion, setShippingRegion] = useState<string>('')
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  // Load shipping settings from Firestore
  useEffect(() => {
    const loadShippingSettings = async () => {
      try {
        const settings = await getShippingSettings()
        setShippingSettings(settings)
      } catch (error) {
        console.error('Error loading shipping settings:', error)
        // Keep default settings on error
      } finally {
        setIsLoadingSettings(false)
      }
    }
    loadShippingSettings()
  }, [])
  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    createAccount: false,
    password: '',
  })

  // Calculate shipping fee - free if above threshold, otherwise based on region
  const isFreeShipping = subtotal >= shippingSettings.freeShippingThreshold
  const selectedRate = shippingSettings.rates.find(r => r.id === shippingRegion)
  const shippingFee = isFreeShipping ? 0 : (selectedRate?.fee || 0)
  const total = subtotal + shippingFee

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault()

    // Send checkout started webhook to n8n
    const payload = createCheckoutPayload(items, formData)
    await sendWebhook(payload)

    setStep('confirm')
  }

  const handlePlaceOrder = async () => {
    setIsSubmitting(true)

    try {
      // Prepare order items for Firestore
      const orderItems: OrderItem[] = items.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        price: item.product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      }))

      // Save order to Firestore
      const result = await createOrder(
        orderItems,
        {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address || undefined,
          city: formData.city || undefined
        },
        isLoggedIn ? user?.id : undefined,
        formData.notes || undefined
      )

      if (result.orderId) {
        setOrderId(result.orderId)
      }

      // Send order completed webhook to n8n
      const payload = createOrderCompletedPayload(items, formData)
      await sendWebhook(payload)

      // Clear cart and show success
      clearCart()
      setStep('success')
    } catch (error) {
      console.error('Order error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="container-max px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-navy mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Add some items to your cart to checkout</p>
          <Link href="/" className="btn-navy">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-navy py-4">
        <div className="container-max px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gold">
                <Image src="/logo.jpg" alt={BRAND.name} fill className="object-cover" />
              </div>
              <span className="text-white font-bold">{BRAND.name}</span>
            </Link>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Lock className="w-4 h-4" />
              Secure Checkout
            </div>
          </div>
        </div>
      </header>

      <main className="container-max px-4 py-8">
        {/* Back Link */}
        {step === 'info' && (
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-navy mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Shopping
          </Link>
        )}

        {step === 'success' ? (
          /* Success Screen */
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-navy mb-4">Order Placed!</h1>
            {orderId && (
              <p className="text-gold font-mono text-sm mb-4">
                Order ID: {orderId}
              </p>
            )}
            <p className="text-gray-600 mb-2">
              Thank you for your order, {formData.fullName}!
            </p>
            <p className="text-gray-500 mb-8">
              We've received your order and will contact you shortly via Messenger to confirm the details.
            </p>
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-8">
              <p className="text-navy font-semibold mb-2">What's next?</p>
              <p className="text-gray-600 text-sm">
                Our team will message you on Facebook Messenger with payment instructions and delivery details.
              </p>
            </div>
            <Link href="/" className="btn-navy">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              {step === 'info' ? (
                /* Customer Info Form */
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                  <h1 className="text-2xl font-bold text-navy mb-6">Checkout</h1>

                  {/* Guest/Account Toggle */}
                  <div className="flex gap-4 mb-8">
                    <button
                      onClick={() => setIsGuest(true)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                        isGuest
                          ? 'border-gold bg-gold/10 text-navy'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-semibold">Guest Checkout</span>
                    </button>
                    <button
                      onClick={() => setIsGuest(false)}
                      className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                        !isGuest
                          ? 'border-gold bg-gold/10 text-navy'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-semibold">Create Account</span>
                      <p className="text-xs text-gray-400 mt-1">Unlock AI Dresser</p>
                    </button>
                  </div>

                  <form onSubmit={handleSubmitInfo} className="space-y-6">
                    {/* Contact Information */}
                    <div>
                      <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-gold" />
                        Contact Information
                      </h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-colors"
                            placeholder="Juan Dela Cruz"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-colors"
                            placeholder="juan@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Phone className="w-4 h-4 inline mr-1" />
                            Phone *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-colors"
                            placeholder="09XX XXX XXXX"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shipping Region */}
                    <div>
                      <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-gold" />
                        Shipping Region *
                      </h2>
                      {isLoadingSettings ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-gold" />
                          <span className="ml-2 text-gray-500 text-sm">Loading shipping options...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {shippingSettings.rates.map((rate) => (
                            <button
                              key={rate.id}
                              type="button"
                              onClick={() => setShippingRegion(rate.id)}
                              className={`p-3 rounded-lg border-2 text-center transition-colors ${
                                shippingRegion === rate.id
                                  ? 'border-gold bg-gold/10 text-navy'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <p className="font-medium text-sm">{rate.region}</p>
                              <p className="text-xs mt-1">
                                {isFreeShipping ? (
                                  <span className="text-green-600">Free</span>
                                ) : (
                                  <span className="text-gray-500">₱{rate.fee.toLocaleString()}</span>
                                )}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      {isFreeShipping && (
                        <p className="text-sm text-green-600 mb-4">
                          ✓ You qualify for free shipping on orders ₱{shippingSettings.freeShippingThreshold.toLocaleString()}+
                        </p>
                      )}
                      {!isFreeShipping && (
                        <p className="text-sm text-gray-500 mb-4">
                          Add ₱{(shippingSettings.freeShippingThreshold - subtotal).toLocaleString()} more for free shipping!
                        </p>
                      )}
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gold" />
                        Delivery Address (Optional)
                      </h2>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-colors"
                            placeholder="Street address, barangay"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-colors"
                            placeholder="City / Municipality"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Order Notes */}
                    <div>
                      <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gold" />
                        Order Notes (Optional)
                      </h2>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-colors resize-none"
                        placeholder="Any special instructions or requests..."
                      />
                    </div>

                    {/* Create Account Option */}
                    {!isGuest && (
                      <div className="bg-navy/5 rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-navy mb-4 flex items-center gap-2">
                          <Lock className="w-5 h-5 text-gold" />
                          Create Account
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                          Create an account to access the AI Dresser, track orders, and get personalized recommendations.
                        </p>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password *
                          </label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required={!isGuest}
                            minLength={8}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-gold outline-none transition-colors"
                            placeholder="Minimum 8 characters"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!shippingRegion}
                      className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {!shippingRegion ? 'Select Shipping Region' : 'Continue to Review'}
                    </button>
                  </form>
                </div>
              ) : (
                /* Order Review */
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                  <h1 className="text-2xl font-bold text-navy mb-6">Review Your Order</h1>

                  {/* Customer Details */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-navy">Contact Details</h3>
                      <button
                        onClick={() => setStep('info')}
                        className="text-gold text-sm hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-gray-600">{formData.fullName}</p>
                    <p className="text-gray-600">{formData.email}</p>
                    <p className="text-gray-600">{formData.phone}</p>
                    {formData.address && (
                      <p className="text-gray-600 mt-2">
                        {formData.address}, {formData.city}
                      </p>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-navy mb-4">Order Items</h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">{item.product.brand}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-navy">{item.product.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatPrice(item.product.price)} x {item.quantity}
                            </p>
                          </div>
                          <p className="font-bold text-navy">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Notice */}
                  <div className="mb-6 p-4 bg-gold/10 border border-gold/30 rounded-lg">
                    <h3 className="font-semibold text-navy mb-2">Payment Instructions</h3>
                    <p className="text-gray-600 text-sm">
                      After placing your order, we will contact you via Facebook Messenger with payment options including GCash, Maya, Bank Transfer, or COD.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('info')}
                      className="btn-secondary flex-1"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Placing Order...' : 'Place Order'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                <h2 className="text-lg font-bold text-navy mb-4">Order Summary</h2>

                {/* Items */}
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xs">{item.product.brand}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-navy">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    {isFreeShipping ? (
                      <span className="text-green-600">Free</span>
                    ) : shippingRegion ? (
                      <span>{formatPrice(shippingFee)}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Select region</span>
                    )}
                  </div>
                  {!shippingRegion && !isFreeShipping && (
                    <p className="text-xs text-amber-600">* Please select shipping region above</p>
                  )}
                  <div className="flex justify-between text-xl font-bold text-navy pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
