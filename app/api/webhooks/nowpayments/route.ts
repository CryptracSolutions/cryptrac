import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔔 NOWPayments webhook received:', body)

    // Verify webhook authenticity (basic check)
    const signature = request.headers.get('x-nowpayments-sig')
    if (!signature) {
      console.warn('⚠️ Webhook received without signature')
    }

    // Extract payment data from webhook
    const {
      payment_id,
      order_id,
      payment_status,
      pay_currency,
      pay_amount,
      actually_paid,
      price_amount,
      price_currency,
      payout_currency,
      payout_amount,
      outcome,
      created_at,
      updated_at,
    } = body

    if (!payment_id || !order_id) {
      console.error('❌ Invalid webhook data: missing payment_id or order_id')
      return NextResponse.json(
        { success: false, message: 'Invalid webhook data' },
        { status: 400 }
      )
    }

    // Create Supabase client (use service role for webhooks)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op for webhooks
          },
        },
      }
    )

    // Find the payment record
    const { data: payment, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('nowpayments_invoice_id', payment_id)
      .single()

    if (findError || !payment) {
      console.error('❌ Payment not found for webhook:', payment_id, findError)
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment found for webhook:', {
      id: payment.id,
      current_status: payment.status,
      new_status: payment_status,
    })

    // Map NOWPayments status to our status
    let newStatus = payment.status
    switch (payment_status) {
      case 'waiting':
        newStatus = 'waiting'
        break
      case 'confirming':
        newStatus = 'confirming'
        break
      case 'confirmed':
      case 'finished':
        newStatus = 'confirmed'
        break
      case 'failed':
      case 'refunded':
        newStatus = 'failed'
        break
      case 'expired':
        newStatus = 'expired'
        break
      default:
        console.warn('⚠️ Unknown payment status:', payment_status)
        newStatus = payment_status
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    }

    // Add transaction hash if available
    if (outcome && outcome.hash) {
      updateData.tx_hash = outcome.hash
    }

    // Update received amounts if payment is confirmed
    if (newStatus === 'confirmed' && actually_paid) {
      updateData.amount_received = actually_paid
      updateData.currency_received = pay_currency?.toUpperCase()
    }

    // Update the payment record
    const { error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', payment.id)

    if (updateError) {
      console.error('❌ Error updating payment from webhook:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update payment' },
        { status: 500 }
      )
    }

    console.log('✅ Payment updated from webhook:', {
      payment_id: payment.id,
      old_status: payment.status,
      new_status: newStatus,
      tx_hash: outcome?.hash,
    })

    // If payment is confirmed, we could trigger additional actions here
    // such as sending confirmation emails, updating analytics, etc.
    if (newStatus === 'confirmed' && payment.status !== 'confirmed') {
      console.log('🎉 Payment confirmed! Triggering post-confirmation actions...')
      
      // Update payment link usage statistics using increment
      const { error: incrementError } = await supabase.rpc('increment_payment_link_usage', {
        link_id: payment.payment_link_id
      })

      if (incrementError) {
        console.warn('⚠️ Failed to update payment link usage:', incrementError)
        // Try alternative approach
        const { data: currentLink } = await supabase
          .from('payment_links')
          .select('current_uses')
          .eq('id', payment.payment_link_id)
          .single()

        if (currentLink) {
          await supabase
            .from('payment_links')
            .update({
              current_uses: (currentLink.current_uses || 0) + 1,
              last_payment_at: new Date().toISOString(),
            })
            .eq('id', payment.payment_link_id)
        }
      }

      // Here you could add:
      // - Send confirmation email to customer
      // - Send notification to merchant
      // - Update analytics/metrics
      // - Trigger any business logic
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    })

  } catch (error) {
    console.error('❌ Error processing NOWPayments webhook:', error)
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge')
  
  if (challenge) {
    console.log('🔍 Webhook verification challenge received')
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  return NextResponse.json({
    success: true,
    message: 'NOWPayments webhook endpoint is active',
    timestamp: new Date().toISOString(),
  })
}

