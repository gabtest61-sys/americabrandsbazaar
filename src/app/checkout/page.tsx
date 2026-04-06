'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { createOrder } from '@/lib/firestore'
import { formatPrice } from '@/lib/constants'

export default function CheckoutPage() {
  const router = useRouter()
  const { state, dispatch } = useCart()
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

  // Pre-fill if logged in
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

  const subtotal = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const shippingFee = subtotal >= 2000 ? 0 : 100
  const total = subtotal + shippingFee

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state.items.length === 0) return
    setLoading(true)
    setError('')

    try {
      // 1. Save order to Firestore
      const items = state.items.map((i) => ({
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
        items,
        customerInfo,
        user?.id,
        form.notes,
        form.paymentMethod,
        'pending'
      )

      if (!result.success || !result.orderId) {
        throw new Error(result.error || 'Failed to place order')
      }

      // 2. Send emails (admin notification + customer confirmation)
      const emailPayload = {
        orderId: result.orderId,
        customer: customerInfo,
        products: state.items.map((i) => ({
          name: i.product.name,
          brand: i.product.brand,
          price: i.product.price,
          quantity: i.quantity,
        })),
        total,
      }

      const emailRes = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      })

      if (!emailRes.ok) {
        console.warn('Email sending failed but order was saved.')
      }

      // 3. Clear cart and show success
      dispatch({ type: 'CLEAR_CART' })
      setOrderId(result.orderId)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (state.items.length === 0 && !success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h2 className="text-2xl font-bold text-navy mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add some products before checking out.</p>
        <button
          onClick={() => router.push('/shop')}
          className="bg-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition"
        >
          Browse Shop
        </button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-navy mb-2">Order Placed!</h2>
          <p className="text-gray-600 mb-1">Your order ID is:</p>
          <p className="text-gold font-bold text-xl mb-4">{orderId}</p>
          <p className="text-gray-500 text-sm mb-6">
            A confirmation email has been sent to your inbox. We&apos;ll contact you via Facebook or phone to confirm your order and arrange delivery.
          </p>
          <button
            onClick={() => router.push('/shop')}
            className="bg-navy text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-700 transition w-full"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-navy mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — Customer Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-navy mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="juan@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="09XXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook (optional)</label>
                  <input
                    name="facebook"
                    value={form.facebook}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="facebook.com/yourprofile"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-navy mb-4">Delivery Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="House no., Street, Barangay"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City / Municipality</label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
                    placeholder="Manila"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-navy mb-4">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'cod', label: 'Cash on Delivery (COD)' },
                  { value: 'gcash', label: 'GCash' },
                  { value: 'bank', label: 'Bank Transfer' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.value}
                      checked={form.paymentMethod === opt.value}
                      onChange={handleChange}
                      className="accent-gold"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (optional)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
                placeholder="Any special instructions for your order..."
              />
            </div>
          </div>

          {/* Right — Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-navy mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {state.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-lg border border-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{item.product.brand}</p>
                      {item.size && <p className="text-xs text-gray-400">Size: {item.size}</p>}
                      {item.color && <p className="text-xs text-gray-400">Color: {item.color}</p>}
                      <p className="text-xs text-gray-600 mt-0.5">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-navy whitespace-nowrap">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-navy text-base border-t border-gray-100 pt-2 mt-2">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-gold text-white py-3 rounded-xl font-semibold text-base hover:bg-yellow-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">
                By placing your order, you agree to our terms. We&apos;ll contact you to confirm.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
