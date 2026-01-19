'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ShoppingBag, User, Mail, Phone, MapPin, FileText, Lock, Check, Truck, Loader2, CreditCard, Wallet, Building2, Tag, X } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { formatPrice, BRAND } from '@/lib/constants'
import { CheckoutFormData } from '@/lib/types'
import { sendWebhook, createCheckoutPayload, createOrderCompletedPayload } from '@/lib/webhook'
import { createOrder, OrderItem, getShippingSettings, ShippingSettings } from '@/lib/firestore'

type CheckoutStep = 'info' | 'payment' | 'confirm' | 'success'
type PaymentMethod = 'online' | 'cod'

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

// Sample coupon codes
interface Coupon {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minPurchase?: number
  description: string
}

const VALID_COUPONS: Coupon[] = [
  { code: 'WELCOME10', type: 'percentage', value: 10, description: '10% off your order' },
  { code: 'SAVE500', type: 'fixed', value: 500, minPurchase: 3000, description: '₱500 off orders ₱3,000+' },
  { code: 'FREESHIP', type: 'fixed', value: 0, description: 'Free shipping (applied separately)' },
  { code: 'VIP20', type: 'percentage', value: 20, minPurchase: 5000, description: '20% off orders ₱5,000+' },
]

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online')

  // Coupon code state
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')

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
  const isFreeShipping = subtotal >= shippingSettings.freeShippingThreshold || appliedCoupon?.code === 'FREESHIP'
  const selectedRate = shippingSettings.rates.find(r => r.id === shippingRegion)
  const shippingFee = isFreeShipping ? 0 : (selectedRate?.fee || 0)

  // Calculate discount from coupon
  const calculateDiscount = () => {
    if (!appliedCoupon || appliedCoupon.code === 'FREESHIP') return 0
    if (appliedCoupon.type === 'percentage') {
      return Math.round(subtotal * (appliedCoupon.value / 100))
    }
    return appliedCoupon.value
  }
  const discount = calculateDiscount()
  const total = subtotal - discount + shippingFee

  // Apply coupon code
  const handleApplyCoupon = () => {
    setCouponError('')
    setCouponSuccess('')

    const code = couponInput.toUpperCase().trim()
    if (!code) {
      setCouponError('Please enter a coupon code')
      return
    }

    const coupon = VALID_COUPONS.find(c => c.code === code)
    if (!coupon) {
      setCouponError('Invalid coupon code')
      return
    }

    if (coupon.minPurchase && subtotal < coupon.minPurchase) {
      setCouponError(`Minimum purchase of ₱${coupon.minPurchase.toLocaleString()} required`)
      return
    }

    setAppliedCoupon(coupon)
    setCouponSuccess(`Coupon applied: ${coupon.description}`)
    setCouponInput('')
  }

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
    setCouponSuccess('')
  }

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

    setStep('payment')
  }

  const handleSelectPayment = () => {
    setStep('confirm')
  }

  const handlePlaceOrder = async () => {
    setIsSubmitting(true)

    try {
      if (paymentMethod === 'online') {
        // Use PayMongo for online payment
        const response = await fetch('/api/paymongo/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(item => ({
              id: item.product.id,
              name: item.product.name,
              brand: item.product.brand,
              price: item.product.price,
              quantity: item.quantity,
              selectedSize: item.size,
              selectedColor: item.color
            })),
            customerInfo: {
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              city: formData.city
            },
            userId: isLoggedIn ? user?.id : undefined,
            notes: formData.notes,
            shippingFee
          })
        })

        const data = await response.json()

        if (data.success && data.checkoutUrl) {
          // Redirect to PayMongo checkout
          window.location.href = data.checkoutUrl
          return
        } else {
          throw new Error(data.error || 'Failed to create payment session')
        }
      }

      // COD order - save directly to Firestore
      const orderItems: OrderItem[] = items.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        price: item.product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      }))

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
        formData.notes || undefined,
        'cod',
        'pending'
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
                <Image src="/logo.png" alt={BRAND.name} fill className="object-cover" />
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
                      {!shippingRegion ? 'Select Shipping Region' : 'Continue to Payment'}
                    </button>
                  </form>
                </div>
              ) : step === 'payment' ? (
                /* Payment Method Selection */
                <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                  <h1 className="text-2xl font-bold text-navy mb-6">Select Payment Method</h1>

                  <div className="space-y-4 mb-8">
                    {/* Online Payment Option */}
                    <button
                      onClick={() => setPaymentMethod('online')}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        paymentMethod === 'online'
                          ? 'border-gold bg-gold/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          paymentMethod === 'online' ? 'bg-gold text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-navy">Pay Online</p>
                          <p className="text-sm text-gray-500 mt-1">
                            GCash, Maya, Credit/Debit Card, Online Banking
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              <Check className="w-3 h-3" />
                              Instant confirmation
                            </div>
                            <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              <Lock className="w-3 h-3" />
                              Secure
                            </div>
                          </div>
                        </div>
                        {paymentMethod === 'online' && (
                          <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* COD Option */}
                    <button
                      onClick={() => setPaymentMethod('cod')}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-gold bg-gold/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          paymentMethod === 'cod' ? 'bg-gold text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-navy">Cash on Delivery (COD)</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Pay when your order arrives
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                              <Building2 className="w-3 h-3" />
                              Available in select areas
                            </div>
                          </div>
                        </div>
                        {paymentMethod === 'cod' && (
                          <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Payment method logos */}
                  {paymentMethod === 'online' && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-3">Accepted payment methods:</p>
                      <div className="flex flex-wrap gap-3">
                        <span className="px-3 py-1 bg-white rounded border text-sm font-medium text-blue-600">GCash</span>
                        <span className="px-3 py-1 bg-white rounded border text-sm font-medium text-green-600">Maya</span>
                        <span className="px-3 py-1 bg-white rounded border text-sm font-medium text-gray-600">Visa</span>
                        <span className="px-3 py-1 bg-white rounded border text-sm font-medium text-orange-600">Mastercard</span>
                        <span className="px-3 py-1 bg-white rounded border text-sm font-medium text-blue-800">BDO</span>
                        <span className="px-3 py-1 bg-white rounded border text-sm font-medium text-red-600">BPI</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('info')}
                      className="btn-secondary flex-1"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSelectPayment}
                      className="btn-primary flex-1"
                    >
                      Continue to Review
                    </button>
                  </div>
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

                  {/* Payment Method */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-navy">Payment Method</h3>
                      <button
                        onClick={() => setStep('payment')}
                        className="text-gold text-sm hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {paymentMethod === 'online' ? (
                        <>
                          <CreditCard className="w-5 h-5 text-gold" />
                          <span className="text-gray-600">Pay Online (GCash, Maya, Card, etc.)</span>
                        </>
                      ) : (
                        <>
                          <Wallet className="w-5 h-5 text-gold" />
                          <span className="text-gray-600">Cash on Delivery</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Notice */}
                  <div className="mb-6 p-4 bg-gold/10 border border-gold/30 rounded-lg">
                    {paymentMethod === 'online' ? (
                      <>
                        <h3 className="font-semibold text-navy mb-2">Secure Payment</h3>
                        <p className="text-gray-600 text-sm">
                          You'll be redirected to our secure payment partner (PayMongo) to complete your payment.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-navy mb-2">COD Information</h3>
                        <p className="text-gray-600 text-sm">
                          Please prepare the exact amount. Our delivery partner will collect payment upon delivery.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('payment')}
                      className="btn-secondary flex-1"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : paymentMethod === 'online' ? (
                        'Proceed to Payment'
                      ) : (
                        'Place Order'
                      )}
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

                {/* Coupon Code */}
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-gold" />
                    <span className="text-sm font-medium text-navy">Have a coupon?</span>
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="font-mono font-bold text-green-700 text-sm">{appliedCoupon.code}</p>
                        <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase())
                          setCouponError('')
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-xs text-red-500 mt-2">{couponError}</p>
                  )}
                  {couponSuccess && !appliedCoupon && (
                    <p className="text-xs text-green-600 mt-2">{couponSuccess}</p>
                  )}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
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
