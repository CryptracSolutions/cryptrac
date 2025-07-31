import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_id, phone } = body

    console.log('📱 SMS receipt request:', { payment_id, phone })

    if (!payment_id || !phone) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format' },
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
      console.error('❌ Payment not found for SMS receipt:', error)
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    // Generate SMS content
    const smsContent = generateSMSContent(payment)

    // Here you would integrate with your SMS service (Twilio, AWS SNS, etc.)
    // For now, we'll simulate sending the SMS
    console.log('📱 Sending SMS receipt to:', phone)
    console.log('📄 SMS content:', smsContent)

    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In a real implementation, you would:
    // 1. Use an SMS service like Twilio, AWS SNS, or similar
    // 2. Send the SMS content
    // 3. Handle SMS delivery status
    // 4. Store SMS sending record in database

    // For now, we'll just log success
    console.log('✅ SMS receipt sent successfully (simulated)')

    return NextResponse.json({
      success: true,
      message: 'SMS receipt sent successfully',
    })

  } catch (error) {
    console.error('❌ Error sending SMS receipt:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send SMS receipt' },
      { status: 500 }
    )
  }
}

function generateSMSContent(payment: any): string {
  const formatAmount = (amount: number, decimals: number = 8) => {
    return amount.toFixed(decimals).replace(/\.?0+$/, '')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return `
🎉 Payment Confirmed!

${payment.payment_link.title}
To: ${payment.payment_link.merchant.business_name}

Amount: ${formatAmount(payment.pay_amount)} ${payment.pay_currency}
USD Value: $${payment.amount.toFixed(2)}
Time: ${formatDate(payment.updated_at)}
Order ID: ${payment.order_id}

Powered by Cryptrac
  `.trim()
}

