'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { createOrder, addTryOnCreditsForPurchase } from '@/lib/firestore'
import { formatPrice } from '@/lib/constants'
import { ChevronLeft, ShoppingBag, CheckCircle, Package, Truck, Tag } from 'lucide-react'

const paymentOptions = [
  {
    value: 'cod',
    label: 'Cash on Delivery',
    desc: 'Pay when your order arrives',
    icon: '💵',
  },
  {
    value: 'gcash',
    label: 'GCash',
    desc: 'Send payment via GCash',
    icon: '📱',
  },
  {
    value: 'bank',
    label: 'Bank Transfer',
    desc: 'Direct bank transfer',
    icon: '🏦',
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    facebook: '',
    notes: '',
    paymentMethod: 'cod' as 'cod' | 'gcash' | 'bank',
  })

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        facebook: user.facebook || '',
      }))
    }
  }, [user])

  const subtotal = items.reduce((sum: number, i) => sum + i.product.price * i.quantity, 0)
  const shippingFee = subtotal >= 2000 ? 0 : 100
  const total = subtotal + shippingFee

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return
    setLoading(true)
    setError('')

    try {
      const orderItems = items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        brand: i.product.brand,
        price: i.product.price,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
        image: i.product.image,
      }))

      const customerInfo = {
        name: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        facebook: form.facebook,
      }

      const result = await createOrder(
        orderItems,
        customerInfo,
        user?.id,
        form.notes,
        form.paymentMethod,
        'pending'
      )

      if (!result.success || !result.orderId) {
        throw new Error(result.error || 'Failed to place order')
      }

      const emailPayload = {
        orderId: result.orderId,
        customer: customerInfo,
        products: items.map((i) => ({
          name: i.product.name,
          brand: i.product.brand,
          price: i.product.price,
          quantity: i.quantity,
        })),
        total,
      }

      await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      }).catch(() => {})

      // Add 10 try-on credits per item purchased
      if (user?.id) {
        addTryOnCreditsForPurchase(user.id, orderItems.length).catch(() => {})
      }

      clearCart()
      setOrderId(result.orderId)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-sm p-10 max-w-sm w-full text-center">
          <ShoppingBag className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Add some products before checking out.</p>
          <button
            onClick={() => router.push('/shop')}
            className="w-full bg-navy text-white px-6 py-3 rounded-xl font-semibold hover:bg-navy/90 transition"
          >
            Browse Shop
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-1">Order Placed!</h2>
          <p className="text-gray-500 text-sm mb-4">Thank you for shopping with us.</p>
          <div className="bg-gold/10 rounded-2xl px-6 py-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Order ID</p>
            <p className="text-gold font-bold text-lg tracking-wide">{orderId}</p>
          </div>
          <p className="text-gray-500 text-sm mb-8">
            We&apos;ll contact you via Facebook or phone to confirm your order and arrange delivery.
          </p>
          <button
            onClick={() => router.push('/shop')}
            className="w-full bg-navy text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-navy/90 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push('/shop')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Shop
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <h1 className="text-lg font-bold text-navy">Checkout</h1>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
            <Package className="w-3.5 h-3.5" />
            {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Left column ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Contact */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <h2 className="font-semibold text-navy">Contact Information</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'fullName', label: 'Full Name', placeholder: 'Juan Dela Cruz', required: true, type: 'text' },
                  { name: 'email', label: 'Email', placeholder: 'juan@email.com', required: true, type: 'email' },
                  { name: 'phone', label: 'Phone Number', placeholder: '09XXXXXXXXX', required: true, type: 'tel' },
                  { name: 'facebook', label: 'Facebook (optional)', placeholder: 'facebook.com/yourprofile', required: false, type: 'text' },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {field.label}
                    </label>
                    <input
                      name={field.name}
                      type={field.type}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy placeholder-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <h2 className="font-semibold text-navy">Delivery Address</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Street Address</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="House no., Street, Barangay"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy placeholder-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition"
                  />
                </div>
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">City / Municipality</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Manila"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy placeholder-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition"
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <h2 className="font-semibold text-navy">Payment Method</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {paymentOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      form.paymentMethod === opt.value
                        ? 'border-gold bg-gold/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={form.paymentMethod === opt.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-semibold text-navy">{opt.label}</span>
                    <span className="text-xs text-gray-400 text-center">{opt.desc}</span>
                    {form.paymentMethod === opt.value && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-gold rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">4</span>
                </div>
                <h2 className="font-semibold text-navy">Order Notes <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
              </div>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any special instructions, preferred delivery time, etc."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-navy placeholder-gray-300 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition resize-none"
              />
            </div>
          </div>

          {/* ── Right column — Order Summary ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm sticky top-24">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-semibold text-navy">Order Summary</h2>
              </div>

              {/* Items */}
              <div className="p-6 space-y-4 max-h-72 overflow-y-auto">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-xl border border-gray-100"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-navy text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy truncate">{item.product.name}</p>
                      <p className="text-xs text-gold font-medium">{item.product.brand}</p>
                      <div className="flex gap-2 mt-0.5">
                        {item.size && <span className="text-xs text-gray-400">Size: {item.size}</span>}
                        {item.color && <span className="text-xs text-gray-400">· {item.color}</span>}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-navy whitespace-nowrap">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-6 py-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-navy">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Shipping
                  </span>
                  <span className={`font-medium ${shippingFee === 0 ? 'text-green-600' : 'text-navy'}`}>
                    {shippingFee === 0 ? '🎉 Free' : formatPrice(shippingFee)}
                  </span>
                </div>
                {shippingFee > 0 && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Add {formatPrice(2000 - subtotal)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <span className="font-bold text-navy">Total</span>
                  <span className="font-bold text-xl text-navy">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-6 mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                  {error}
                </div>
              )}

              {/* CTA */}
              <div className="px-6 pb-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold text-navy py-4 rounded-xl font-bold text-base hover:bg-yellow-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-gold/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Placing Order…
                    </span>
                  ) : (
                    'Place Order'
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
                  By placing your order, you agree to our terms.<br />We&apos;ll contact you to confirm.
                </p>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}
