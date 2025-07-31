import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id, email } = body

    console.log('📧 Email receipt request:', { payment_id, email })

    if (!payment_id || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Fetch payment data
    const { data: payment, error } = await supabase
      .from('transactions')
      .select(`
        *,
        payment_link:payment_links(
          title,
          description,
          merchant:merchants(
            business_name
          )
        )
      `)
      .eq('id', payment_id)
      .single()

    if (error || !payment) {
      console.error('❌ Payment not found for receipt:', error)
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    // Generate receipt content
    const receiptContent = generateReceiptHTML(payment, email)

    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll simulate sending the email
    console.log('📧 Sending email receipt to:', email)
    console.log('📄 Receipt content generated for payment:', payment.id)

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In a real implementation, you would:
    // 1. Use an email service like SendGrid, AWS SES, or similar
    // 2. Send the HTML receipt content
    // 3. Handle email delivery status
    // 4. Store receipt sending record in database

    // For now, we'll just log success
    console.log('✅ Email receipt sent successfully (simulated)')

    return NextResponse.json({
      success: true,
      message: 'Email receipt sent successfully',
    })

  } catch (error) {
    console.error('❌ Error sending email receipt:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send email receipt' },
      { status: 500 }
    )
  }
}

function generateReceiptHTML(payment: any, email: string): string {
  const formatAmount = (amount: number, decimals: number = 8) => {
    return amount.toFixed(decimals).replace(/\.?0+$/, '')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Receipt - ${payment.payment_link.title}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #7f5efd; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { color: #7f5efd; font-size: 24px; font-weight: bold; }
        .receipt-title { color: #333; margin: 10px 0; }
        .success-badge { background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; }
        .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .detail-label { color: #6b7280; }
        .detail-value { font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .tx-hash { font-family: monospace; font-size: 12px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Cryptrac</div>
        <h1 class="receipt-title">Payment Receipt</h1>
        <span class="success-badge">✓ Confirmed</span>
      </div>

      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Payment For:</span>
          <span class="detail-value">${payment.payment_link.title}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Merchant:</span>
          <span class="detail-value">${payment.payment_link.merchant.business_name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid:</span>
          <span class="detail-value">${formatAmount(payment.pay_amount)} ${payment.pay_currency}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">USD Value:</span>
          <span class="detail-value">$${payment.amount.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Time:</span>
          <span class="detail-value">${formatDate(payment.updated_at)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value">${payment.order_id}</span>
        </div>
        ${payment.tx_hash ? `
        <div class="detail-row">
          <span class="detail-label">Transaction Hash:</span>
          <span class="detail-value tx-hash">${payment.tx_hash}</span>
        </div>
        ` : ''}
      </div>

      <div class="footer">
        <p>This receipt was sent to: ${email}</p>
        <p>Payment processed securely by Cryptrac</p>
        <p>Non-custodial crypto payment processing</p>
      </div>
    </body>
    </html>
  `
}

