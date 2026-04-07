import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const STATUS_META: Record<string, { emoji: string; label: string; color: string; bg: string; message: string }> = {
  pending: {
    emoji: '🕐',
    label: 'Pending',
    color: '#d69e2e',
    bg: '#fff8e1',
    message: 'Your order is pending confirmation. We will notify you once it is confirmed.',
  },
  confirmed: {
    emoji: '✅',
    label: 'Confirmed',
    color: '#2ecc71',
    bg: '#e8faf0',
    message: 'Great news! Your order has been confirmed. We are now preparing your items.',
  },
  processing: {
    emoji: '⚙️',
    label: 'Processing',
    color: '#3498db',
    bg: '#ebf5fb',
    message: 'Your order is being packed by our team. It will be ready for shipment soon!',
  },
  shipped: {
    emoji: '🚚',
    label: 'Shipped',
    color: '#9b59b6',
    bg: '#f5eef8',
    message: 'Your order is on its way! Expect delivery within the estimated timeframe.',
  },
  delivered: {
    emoji: '📦',
    label: 'Delivered',
    color: '#27ae60',
    bg: '#e9f7ef',
    message: 'Your order has been delivered. Thank you for shopping with America Brands Bazaar! We hope you love your purchase.',
  },
  cancelled: {
    emoji: '❌',
    label: 'Cancelled',
    color: '#e74c3c',
    bg: '#fdedec',
    message: 'Your order has been cancelled. If you have questions or need assistance, please contact us.',
  },
}

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.murphyconsulting.us',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'gabriel@murphyconsulting.us',
      pass: process.env.SMTP_PASS,
    },
  })

function generateStatusEmailHtml(data: {
  orderId: string
  customerName: string
  status: string
  items: { name: string; brand?: string; quantity: number; price: number; size?: string }[]
  total: number
}): string {
  const meta = STATUS_META[data.status] || STATUS_META.pending
  const currentIndex = STEPS.indexOf(data.status)
  const isCancelled = data.status === 'cancelled'

  const itemRows = data.items.map((item) => `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; color: #333;">
        ${item.name}${item.brand ? ` <span style="color:#aaa;">(${item.brand})</span>` : ''}
        ${item.size ? `<br><span style="font-size:12px;color:#aaa;">Size: ${item.size}</span>` : ''}
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: center; font-size: 14px; color: #333;">${item.quantity}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 14px; font-weight: bold; color: #1a365d;">₱${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('')

  // Timeline using table (email-safe)
  const timelineCells = STEPS.map((s) => {
    const stepIndex = STEPS.indexOf(s)
    const isDone = !isCancelled && stepIndex <= currentIndex
    const isCurrent = s === data.status
    const bgColor = isDone ? '#d69e2e' : '#e2e8f0'
    const textColor = isDone ? '#1a365d' : '#aaa'
    const labelColor = isCurrent ? '#d69e2e' : '#999'
    const labelWeight = isCurrent ? 'bold' : 'normal'
    const checkmark = isDone ? '&#10003;' : ''
    const sMeta = STATUS_META[s]
    return `
      <td style="text-align: center; padding: 0 4px; vertical-align: top;">
        <div style="width: 34px; height: 34px; border-radius: 50%; background: ${bgColor}; margin: 0 auto 6px; line-height: 34px; font-size: 15px; font-weight: bold; color: ${textColor}; text-align: center;">
          ${checkmark}
        </div>
        <p style="margin: 0; font-size: 10px; color: ${labelColor}; font-weight: ${labelWeight}; line-height: 1.3;">${sMeta.label}</p>
      </td>
    `
  }).join('')

  // Connector lines between steps (table-safe)
  const timelineWithLines = STEPS.map((s, i) => {
    const stepIndex = STEPS.indexOf(s)
    const isDone = !isCancelled && stepIndex <= currentIndex
    const isCurrent = s === data.status
    const bgColor = isDone ? '#d69e2e' : '#e2e8f0'
    const labelColor = isCurrent ? '#d69e2e' : '#999'
    const labelWeight = isCurrent ? 'bold' : 'normal'
    const sMeta = STATUS_META[s]
    const cell = `
      <td style="text-align: center; vertical-align: top; width: 20%;">
        <table cellpadding="0" cellspacing="0" style="width: 100%;">
          <tr>
            ${i > 0 ? `<td style="width: 50%; height: 2px; background: ${!isCancelled && stepIndex <= currentIndex ? '#d69e2e' : '#e2e8f0'}; vertical-align: middle; padding-top: 16px;"></td>` : '<td style="width: 50%;"></td>'}
            <td style="width: 0; text-align: center; vertical-align: top;">
              <div style="width: 34px; height: 34px; border-radius: 50%; background: ${bgColor}; line-height: 34px; font-size: 16px; font-weight: bold; color: ${isDone ? '#1a365d' : '#bbb'}; text-align: center; margin: 0 auto;">
                ${isDone ? '&#10003;' : ''}
              </div>
            </td>
            ${i < STEPS.length - 1 ? `<td style="width: 50%; height: 2px; background: ${!isCancelled && stepIndex < currentIndex ? '#d69e2e' : '#e2e8f0'}; vertical-align: middle; padding-top: 16px;"></td>` : '<td style="width: 50%;"></td>'}
          </tr>
          <tr>
            <td></td>
            <td style="text-align: center; padding-top: 6px;">
              <p style="margin: 0; font-size: 10px; color: ${labelColor}; font-weight: ${labelWeight}; line-height: 1.3; white-space: nowrap;">${sMeta.label}</p>
            </td>
            <td></td>
          </tr>
        </table>
      </td>
    `
    return cell
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Order Update — ${data.orderId}</title></head>
    <body style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 20px; background: #f7fafc;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 32px 24px; border-radius: 10px 10px 0 0; text-align: center;">
        <div style="font-size: 52px; margin-bottom: 10px; line-height: 1;">${meta.emoji}</div>
        <h1 style="color: #d69e2e; margin: 0 0 6px 0; font-size: 26px;">${meta.label}!</h1>
        <p style="color: #cbd5e0; margin: 0; font-size: 13px;">Order ID: <strong style="color: #fff;">${data.orderId}</strong></p>
      </div>

      <!-- Body -->
      <div style="background: #fff; padding: 28px 24px; border: 1px solid #e2e8f0; border-top: none;">

        <!-- Status message -->
        <div style="background: ${meta.bg}; border-left: 4px solid ${meta.color}; border-radius: 6px; padding: 16px 18px; margin-bottom: 28px;">
          <p style="margin: 0; color: #333; font-size: 15px; line-height: 1.5;">
            Hi <strong>${data.customerName}</strong>, ${meta.message}
          </p>
        </div>

        ${!isCancelled ? `
        <!-- Timeline -->
        <h3 style="color: #1a365d; font-size: 14px; font-weight: bold; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">Order Progress</h3>
        <table cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 28px;">
          <tr>${timelineWithLines}</tr>
        </table>
        ` : ''}

        <!-- Items -->
        <h3 style="color: #1a365d; font-size: 14px; font-weight: bold; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Your Items</h3>
        <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="background: #f7fafc;">
              <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #666; text-transform: uppercase;">Product</th>
              <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #666; text-transform: uppercase;">Qty</th>
              <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #666; text-transform: uppercase;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 14px 8px; font-size: 15px; font-weight: bold; text-align: right; color: #333;">Total:</td>
              <td style="padding: 14px 8px; font-size: 22px; font-weight: bold; text-align: right; color: #d69e2e;">₱${data.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <p style="color: #aaa; font-size: 13px; margin: 0;">Questions? Reply to this email or message us on Facebook. We&apos;re always happy to help!</p>
      </div>

      <!-- Footer -->
      <div style="background: #1a365d; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
        <p style="color: #d69e2e; font-weight: bold; margin: 0 0 4px 0; font-size: 15px;">America Brands Bazaar</p>
        <p style="color: #a0aec0; margin: 0; font-size: 12px;">Premium Branded Apparel</p>
      </div>

    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { orderId, customerName, customerEmail, status, items, total } = data

    if (!customerEmail || !orderId || !status) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ success: false, error: 'Email service not configured' }, { status: 500 })
    }

    const meta = STATUS_META[status] || STATUS_META.pending
    const transporter = createTransporter()

    await transporter.sendMail({
      from: `"America Brands Bazaar" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `${meta.emoji} Your order is ${meta.label} — ${orderId}`,
      html: generateStatusEmailHtml({ orderId, customerName, status, items: items || [], total: total || 0 }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Status email error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 })
  }
}
