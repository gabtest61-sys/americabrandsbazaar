import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface OrderEmailData {
  orderId: string
  customer: {
    name: string
    email: string
    phone: string
    address?: string
    city?: string
    facebook?: string
  }
  products: {
    name: string
    brand: string
    price: number
    quantity: number
  }[]
  total: number
}

// Create transporter with GoDaddy SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Generate admin notification email HTML
function generateAdminEmailHtml(data: OrderEmailData): string {
  const productRows = data.products
    .map(
      (p) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.name} (${p.brand})</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₱${p.price.toLocaleString()}</td>
      </tr>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order - ${data.orderId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #d69e2e; margin: 0; font-size: 24px;">New Order Received!</h1>
        <p style="color: #fff; margin: 5px 0 0 0;">Order ID: ${data.orderId}</p>
      </div>

      <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
        <h2 style="color: #1a365d; margin-top: 0;">Customer Details</h2>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 5px 0; color: #666;">Name:</td>
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
          ${data.customer.address ? `
          <tr>
            <td style="padding: 5px 0; color: #666;">Address:</td>
            <td style="padding: 5px 0;">${data.customer.address}${data.customer.city ? ', ' + data.customer.city : ''}</td>
          </tr>
          ` : ''}
        </table>

        <h2 style="color: #1a365d;">Order Items</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f7fafc;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e2e8f0;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e2e8f0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right;">Total:</td>
              <td style="padding: 10px; font-weight: bold; text-align: right; color: #d69e2e; font-size: 18px;">₱${data.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #fff3cd; border: 1px solid #d69e2e; border-radius: 4px; padding: 15px; margin-top: 20px;">
          <strong style="color: #856404;">Action Required:</strong>
          <p style="margin: 5px 0 0 0; color: #856404;">Contact customer via Facebook Messenger to confirm order and arrange payment/delivery.</p>
        </div>
      </div>

      <div style="background: #f7fafc; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #666; font-size: 12px;">
        America Brands Bazaar - Order Notification System
      </div>
    </body>
    </html>
  `
}

// Generate customer confirmation email HTML
function generateCustomerEmailHtml(data: OrderEmailData): string {
  const productRows = data.products
    .map(
      (p) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${p.name} (${p.brand})</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₱${p.price.toLocaleString()}</td>
      </tr>
    `
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ${data.orderId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7fafc;">
      <div style="background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #d69e2e; margin: 0; font-size: 28px;">Thank You for Your Order!</h1>
        <p style="color: #fff; margin: 10px 0 0 0; font-size: 16px;">Order ID: ${data.orderId}</p>
      </div>

      <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px; color: #333;">Hi ${data.customer.name},</p>
        <p style="color: #666;">We've received your order and will contact you shortly to confirm the details and arrange payment and delivery.</p>

        <div style="background: #e6f3ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1a365d;">We'll Contact You Via:</h3>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 8px 0;">
                <span style="display: inline-block; width: 30px; height: 30px; background: #1a365d; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 10px; color: #fff; font-size: 14px;">💬</span>
                Facebook Messenger
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="display: inline-block; width: 30px; height: 30px; background: #1a365d; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 10px; color: #fff; font-size: 14px;">📧</span>
                Email
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <span style="display: inline-block; width: 30px; height: 30px; background: #1a365d; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 10px; color: #fff; font-size: 14px;">📱</span>
                Phone / SMS
              </td>
            </tr>
          </table>
        </div>

        <h2 style="color: #1a365d; margin-top: 30px;">Your Order Details</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f7fafc;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Product</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px; font-weight: bold; text-align: right; font-size: 18px;">Total:</td>
              <td style="padding: 15px; font-weight: bold; text-align: right; color: #d69e2e; font-size: 22px;">₱${data.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <p style="color: #666; font-size: 14px;">If you have any questions, feel free to reply to this email or reach out to us on Facebook.</p>
      </div>

      <div style="background: #1a365d; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="color: #d69e2e; font-weight: bold; margin: 0;">America Brands Bazaar</p>
        <p style="color: #fff; margin: 5px 0 0 0; font-size: 12px;">Premium Branded Apparel</p>
      </div>
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
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER

    // Send admin notification email
    await transporter.sendMail({
      from: `"America Brands Bazaar" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `New Order - ${data.orderId}`,
      html: generateAdminEmailHtml(data),
    })

    // Send customer confirmation email
    await transporter.sendMail({
      from: `"America Brands Bazaar" <${process.env.SMTP_USER}>`,
      to: data.customer.email,
      subject: `Order Confirmed - ${data.orderId}`,
      html: generateCustomerEmailHtml(data),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
