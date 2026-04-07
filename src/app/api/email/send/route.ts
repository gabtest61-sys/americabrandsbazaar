import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { getPaymentSettings } from '@/lib/firestore'

interface OrderEmailData {
  orderId: string
  customer: {
    name: string
    email: string
    phone: string
    address?: string
    city?: string
    houseNo?: string
    street?: string
    barangay?: string
    province?: string
    zip?: string
    facebook?: string
  }
  products: {
    name: string
    brand: string
    price: number
    quantity: number
    size?: string
    color?: string
  }[]
  total: number
  paymentMethod?: 'gcash' | 'bank' | 'cod' | 'online'
  notes?: string
  type?: 'order_placed' | 'payment_instructions'
  paymentSettings?: {
    gcashNumber: string
    gcashName: string
    bankName: string
    bankAccount: string
    bankAccountName: string
  }
}

// Create transporter with Murphy Consulting SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.murphyconsulting.us',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'gabriel@murphyconsulting.us',
      pass: process.env.SMTP_PASS,
    },
  })
}

function formatAddress(customer: OrderEmailData['customer']): string {
  const parts = [
    customer.houseNo,
    customer.street,
    customer.barangay,
    customer.city || customer.address,
    customer.province,
    customer.zip,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

function getPaymentInstructions(method: string | undefined, pay: { gcashNumber: string; gcashName: string; bankName: string; bankAccount: string; bankAccountName: string }): string {
  if (method === 'gcash') {
    if (pay.gcashNumber) {
      return `
        <div style="background: #e6f0ff; border-left: 4px solid #1a78c2; border-radius: 6px; padding: 18px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; color: #1a365d; font-size: 16px;">📱 GCash Payment Instructions</h3>
          <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">Please send your payment to:</p>
          <table style="width: 100%; background: #fff; border-radius: 6px; padding: 12px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 6px 12px; color: #666; font-size: 14px; width: 40%;">GCash Number:</td>
              <td style="padding: 6px 12px; font-weight: bold; color: #1a365d; font-size: 16px; letter-spacing: 1px;">${pay.gcashNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; color: #666; font-size: 14px;">Account Name:</td>
              <td style="padding: 6px 12px; font-weight: bold; color: #1a365d; font-size: 15px;">${pay.gcashName}</td>
            </tr>
          </table>
          <p style="margin: 12px 0 0 0; color: #555; font-size: 13px;">After sending, screenshot your GCash confirmation and send it to us via <strong>Facebook Messenger</strong> or reply to this email.</p>
        </div>
      `
    }
    return `
      <div style="background: #e6f0ff; border-left: 4px solid #1a78c2; border-radius: 6px; padding: 18px; margin: 20px 0;">
        <h3 style="margin: 0 0 8px 0; color: #1a365d; font-size: 16px;">📱 GCash Payment</h3>
        <p style="margin: 0; color: #555; font-size: 14px;">You selected <strong>GCash</strong> as your payment method. We will send you our GCash number via <strong>Facebook Messenger</strong> or email shortly.</p>
      </div>
    `
  }

  if (method === 'bank') {
    if (pay.bankAccount) {
      return `
        <div style="background: #f0f4ff; border-left: 4px solid #6366f1; border-radius: 6px; padding: 18px; margin: 20px 0;">
          <h3 style="margin: 0 0 12px 0; color: #1a365d; font-size: 16px;">🏦 Bank Transfer Instructions</h3>
          <p style="margin: 0 0 10px 0; color: #333; font-size: 14px;">Please transfer your payment to:</p>
          <table style="width: 100%; background: #fff; border-radius: 6px; padding: 12px;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding: 6px 12px; color: #666; font-size: 14px; width: 40%;">Bank:</td>
              <td style="padding: 6px 12px; font-weight: bold; color: #1a365d; font-size: 15px;">${pay.bankName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; color: #666; font-size: 14px;">Account Number:</td>
              <td style="padding: 6px 12px; font-weight: bold; color: #1a365d; font-size: 16px; letter-spacing: 1px;">${pay.bankAccount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 12px; color: #666; font-size: 14px;">Account Name:</td>
              <td style="padding: 6px 12px; font-weight: bold; color: #1a365d; font-size: 15px;">${pay.bankAccountName}</td>
            </tr>
          </table>
          <p style="margin: 12px 0 0 0; color: #555; font-size: 13px;">After transferring, screenshot the transaction receipt and send it to us via <strong>Facebook Messenger</strong> or reply to this email.</p>
        </div>
      `
    }
    return `
      <div style="background: #f0f4ff; border-left: 4px solid #6366f1; border-radius: 6px; padding: 18px; margin: 20px 0;">
        <h3 style="margin: 0 0 8px 0; color: #1a365d; font-size: 16px;">🏦 Bank Transfer Payment</h3>
        <p style="margin: 0; color: #555; font-size: 14px;">You selected <strong>Bank Transfer</strong> as your payment method. We will send you our bank account details via <strong>Facebook Messenger</strong> or email shortly.</p>
      </div>
    `
  }

  return `
    <div style="background: #e6f0ff; border-left: 4px solid #1a78c2; border-radius: 6px; padding: 18px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; color: #1a365d; font-size: 16px;">💳 Payment Instructions</h3>
      <p style="margin: 0; color: #555; font-size: 14px;">We will send you the complete payment details via <strong>Facebook Messenger</strong> or email shortly.</p>
    </div>
  `
}

// Generate admin notification email HTML
function generateAdminEmailHtml(data: OrderEmailData): string {
  const productRows = data.products
    .map(
      (p) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${p.name} <span style="color:#888;">(${p.brand})</span>
          ${p.size ? `<br><small style="color:#aaa;">Size: ${p.size}</small>` : ''}
          ${p.color ? `<small style="color:#aaa;"> · ${p.color}</small>` : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₱${(p.price * p.quantity).toLocaleString()}</td>
      </tr>
    `
    )
    .join('')

  const address = formatAddress(data.customer)

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order - ${data.orderId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background: #f7fafc;">
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #d69e2e; margin: 0; font-size: 22px;">🛒 New Order Received!</h1>
        <p style="color: #fff; margin: 6px 0 0 0; font-size: 14px;">Order ID: <strong>${data.orderId}</strong></p>
      </div>

      <div style="background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">

        <h2 style="color: #1a365d; margin-top: 0; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Customer Details</h2>
        <table style="width: 100%; margin-bottom: 24px; font-size: 14px;">
          <tr>
            <td style="padding: 5px 0; color: #666; width: 35%;">Name:</td>
            <td style="padding: 5px 0; font-weight: bold;">${data.customer.name}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">Email:</td>
            <td style="padding: 5px 0;">${data.customer.email}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">Phone:</td>
            <td style="padding: 5px 0;">${data.customer.phone}</td>
          </tr>
          ${data.customer.facebook ? `
          <tr>
            <td style="padding: 5px 0; color: #666;">Facebook:</td>
            <td style="padding: 5px 0;"><a href="${data.customer.facebook.startsWith('http') ? data.customer.facebook : 'https://facebook.com/' + data.customer.facebook}" style="color: #2c5282;">${data.customer.facebook}</a></td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 5px 0; color: #666; vertical-align: top;">Delivery Address:</td>
            <td style="padding: 5px 0;">${address}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #666;">Payment:</td>
            <td style="padding: 5px 0; font-weight: bold; text-transform: capitalize;">${data.paymentMethod === 'gcash' ? '📱 GCash' : data.paymentMethod === 'bank' ? '🏦 Bank Transfer' : '—'}</td>
          </tr>
        </table>

        <h2 style="color: #1a365d; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Order Items</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <thead>
            <tr style="background: #f7fafc;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e2e8f0;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${productRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px; font-weight: bold; text-align: right; font-size: 15px;">Total:</td>
              <td style="padding: 12px; font-weight: bold; text-align: right; color: #d69e2e; font-size: 20px;">₱${data.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        ${data.notes ? `
        <div style="background: #f7fafc; border-radius: 6px; padding: 14px; margin-bottom: 16px;">
          <strong style="color: #1a365d; font-size: 13px;">📝 Customer Notes:</strong>
          <p style="margin: 6px 0 0 0; color: #555; font-size: 14px;">${data.notes}</p>
        </div>
        ` : ''}

        <div style="background: #fff3cd; border: 1px solid #d69e2e; border-radius: 6px; padding: 14px;">
          <strong style="color: #856404;">⚠️ Action Required</strong>
          <p style="margin: 6px 0 0 0; color: #856404; font-size: 14px;">Contact the customer via Facebook Messenger or phone to confirm payment and arrange delivery.</p>
        </div>
      </div>

      <div style="background: #f7fafc; padding: 14px; border-radius: 0 0 8px 8px; text-align: center; color: #999; font-size: 12px;">
        America Brands Bazaar — Order Notification System
      </div>
    </body>
    </html>
  `
}

function productTable(products: OrderEmailData['products']): string {
  return products.map((p) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${p.name} <span style="color:#888;">(${p.brand})</span>
        ${p.size ? `<br><small style="color:#aaa;">Size: ${p.size}</small>` : ''}
        ${p.color ? `<small style="color:#aaa;"> · ${p.color}</small>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₱${(p.price * p.quantity).toLocaleString()}</td>
    </tr>
  `).join('')
}

function emailFooter(): string {
  return `
    <div style="background: #1a365d; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
      <p style="color: #d69e2e; font-weight: bold; margin: 0; font-size: 15px;">America Brands Bazaar</p>
      <p style="color: #a0aec0; margin: 4px 0 0 0; font-size: 12px;">Premium Branded Apparel</p>
    </div>
  `
}

// Email 1: Sent immediately when order is placed — NO payment details
function generateOrderPlacedEmailHtml(data: OrderEmailData): string {
  const address = formatAddress(data.customer)
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Received - ${data.orderId}</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background: #f7fafc;">
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">🛒</div>
        <h1 style="color: #d69e2e; margin: 0; font-size: 26px;">Order Received!</h1>
        <p style="color: #cbd5e0; margin: 8px 0 0 0; font-size: 14px;">Order ID: <strong style="color:#fff;">${data.orderId}</strong></p>
      </div>
      <div style="background: #fff; padding: 28px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 15px; color: #333; margin-top: 0;">Hi <strong>${data.customer.name}</strong>,</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Thank you for shopping at <strong>America Brands Bazaar</strong>! We've received your order and it is now <strong>pending confirmation</strong>.
        </p>
        <div style="background: #fff8e1; border: 1px solid #f6c90e; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px; font-weight: bold;">⏳ What happens next?</p>
          <p style="margin: 8px 0 0 0; color: #856404; font-size: 14px;">Our team is reviewing your order. Once confirmed, we will send you a separate email with the payment instructions. Please wait for that email before sending any payment.</p>
        </div>
        <h2 style="color: #1a365d; font-size: 16px; margin-top: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Your Order</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <thead><tr style="background: #f7fafc;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e2e8f0;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Subtotal</th>
          </tr></thead>
          <tbody>${productTable(data.products)}</tbody>
          <tfoot><tr>
            <td colspan="2" style="padding: 14px; font-weight: bold; text-align: right; font-size: 15px;">Total:</td>
            <td style="padding: 14px; font-weight: bold; text-align: right; color: #d69e2e; font-size: 22px;">₱${data.total.toLocaleString()}</td>
          </tr></tfoot>
        </table>
        <div style="background: #f7fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px 0; font-weight: bold; color: #1a365d; font-size: 14px;">📦 Delivery Address</p>
          <p style="margin: 0; color: #555; font-size: 14px;">${address}</p>
        </div>
        <p style="color: #999; font-size: 13px; margin-top: 20px;">Questions? Reply to this email or message us on Facebook. We're happy to help!</p>
      </div>
      ${emailFooter()}
    </body>
    </html>
  `
}

// Email 2: Sent when admin confirms the order — directs customer to website to pay
function generatePaymentInstructionsEmailHtml(data: OrderEmailData, _pay: { gcashNumber: string; gcashName: string; bankName: string; bankAccount: string; bankAccountName: string }): string {
  const address = formatAddress(data.customer)
  const baseUrl = 'https://americanbrandbazaar.com/'
  const payMethod = data.paymentMethod === 'gcash' ? '📱 GCash' : data.paymentMethod === 'bank' ? '🏦 Bank Transfer' : 'online'
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Confirmed — ${data.orderId}</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background: #f7fafc;">
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
        <h1 style="color: #d69e2e; margin: 0; font-size: 26px;">Order Confirmed!</h1>
        <p style="color: #cbd5e0; margin: 8px 0 0 0; font-size: 14px;">Order ID: <strong style="color:#fff;">${data.orderId}</strong></p>
      </div>
      <div style="background: #fff; padding: 28px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 15px; color: #333; margin-top: 0;">Hi <strong>${data.customer.name}</strong>,</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          Great news! Your order has been <strong>confirmed</strong> by our team. Please complete your <strong>${payMethod}</strong> payment via our website to proceed.
        </p>

        <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 24px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 6px 0; font-weight: bold; color: #15803d; font-size: 17px;">💳 Complete Your Payment</p>
          <p style="margin: 0 0 18px 0; color: #166534; font-size: 13px; line-height: 1.6;">Log in to your account, go to <strong>My Orders</strong>, and tap <strong>"Make Payment"</strong> to see the payment details and upload your screenshot.</p>
          <a href="${baseUrl}account" style="display: inline-block; background: #1a365d; color: #d69e2e; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px;">Go to My Orders →</a>
        </div>

        <h2 style="color: #1a365d; font-size: 16px; margin-top: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Your Order</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <thead><tr style="background: #f7fafc;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e2e8f0;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Subtotal</th>
          </tr></thead>
          <tbody>${productTable(data.products)}</tbody>
          <tfoot><tr>
            <td colspan="2" style="padding: 14px; font-weight: bold; text-align: right; font-size: 15px;">Total:</td>
            <td style="padding: 14px; font-weight: bold; text-align: right; color: #d69e2e; font-size: 22px;">₱${data.total.toLocaleString()}</td>
          </tr></tfoot>
        </table>

        <div style="background: #f7fafc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px 0; font-weight: bold; color: #1a365d; font-size: 14px;">📦 Delivery Address</p>
          <p style="margin: 0; color: #555; font-size: 14px;">${address}</p>
        </div>

        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px;">
          <h3 style="margin: 0 0 12px 0; color: #1a365d; font-size: 15px;">How it works:</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="padding: 7px 0; vertical-align: top; width: 30px;">1️⃣</td><td style="padding: 7px 0; color: #555;">Open <strong>My Orders</strong> on our website and click <strong>"Make Payment"</strong>.</td></tr>
            <tr><td style="padding: 7px 0; vertical-align: top;">2️⃣</td><td style="padding: 7px 0; color: #555;">Send the exact amount and upload your payment screenshot directly on the site.</td></tr>
            <tr><td style="padding: 7px 0; vertical-align: top;">3️⃣</td><td style="padding: 7px 0; color: #555;">We verify and ship your items — you'll get a tracking update via email. 🚚</td></tr>
          </table>
        </div>

        <p style="color: #999; font-size: 13px; margin-top: 20px;">Questions? Reply to this email or message us on Facebook. We're happy to help!</p>
      </div>
      ${emailFooter()}
    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const data: OrderEmailData = await request.json()

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP credentials not configured')
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const transporter = createTransporter()
    const from_orders = `"ABB Orders" <${process.env.SMTP_USER || 'gabriel@murphyconsulting.us'}>`
    const from_abb = `"America Brands Bazaar" <${process.env.SMTP_USER || 'gabriel@murphyconsulting.us'}>`

    const adminEmails = [
      'sales@americabrandsbazaar.com',
      'gmaturan60@gmail.com',
      'nheymaturan@gmail.com'
    ].join(', ')

    if (data.type === 'payment_instructions') {
      // Triggered by admin when order is confirmed — send payment details to customer only
      // Use settings passed from admin client (already loaded) or fall back to Firestore read
      const pay = data.paymentSettings ?? await getPaymentSettings()
      await transporter.sendMail({
        from: from_abb,
        to: data.customer.email,
        subject: `✅ Order Confirmed — Payment Instructions (${data.orderId})`,
        html: generatePaymentInstructionsEmailHtml(data, pay),
      })
    } else {
      // Default: triggered when order is placed — notify admin + send "pending" email to customer
      await transporter.sendMail({
        from: from_orders,
        to: adminEmails,
        subject: `🛒 New Order ${data.orderId} — ${data.customer.name}`,
        html: generateAdminEmailHtml(data),
      })
      await transporter.sendMail({
        from: from_abb,
        to: data.customer.email,
        subject: `Order Received — We'll confirm shortly (${data.orderId})`,
        html: generateOrderPlacedEmailHtml(data),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
