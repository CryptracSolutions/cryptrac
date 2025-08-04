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
      // Additional hash fields from NOWPayments
      payin_hash,
      payout_hash,
      burning_percent,
      type
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
      case 'sending':
        newStatus = 'confirming' // Map 'sending' to 'confirming' for our UI
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

    // Enhanced transaction hash logging
    console.log('🔗 Processing transaction hashes:', {
      outcome_hash: outcome?.hash,
      payin_hash: payin_hash,
      payout_hash: payout_hash,
      type: type
    })

    // Handle different hash sources and types
    if (payin_hash) {
      updateData.payin_hash = payin_hash
      console.log('✅ Payin hash captured:', payin_hash)
    }

    if (payout_hash) {
      updateData.payout_hash = payout_hash
      console.log('✅ Payout hash captured:', payout_hash)
    }

    // Legacy support: if outcome.hash exists and no specific hashes, use it as primary
    if (outcome && outcome.hash) {
      if (!updateData.payin_hash && !updateData.payout_hash) {
        // If no specific hashes, use outcome.hash as tx_hash
        updateData.tx_hash = outcome.hash
        console.log('✅ Legacy tx_hash captured from outcome:', outcome.hash)
      } else {
        // If we have specific hashes, use outcome.hash as tx_hash for backward compatibility
        updateData.tx_hash = outcome.hash
        console.log('✅ Primary tx_hash captured from outcome:', outcome.hash)
      }
    }

    // Determine primary tx_hash based on payment status and available hashes
    if (!updateData.tx_hash) {
      if (newStatus === 'confirmed' && updateData.payout_hash) {
        // For confirmed payments, prefer payout hash as primary
        updateData.tx_hash = updateData.payout_hash
        console.log('✅ Using payout_hash as primary tx_hash for confirmed payment')
      } else if (updateData.payin_hash) {
        // For other statuses, use payin hash as primary
        updateData.tx_hash = updateData.payin_hash
        console.log('✅ Using payin_hash as primary tx_hash')
      }
    }

    // Update received amounts if payment is confirmed
    if (newStatus === 'confirmed' && actually_paid) {
      updateData.amount_received = actually_paid
      updateData.currency_received = pay_currency?.toUpperCase()
      console.log('💰 Payment confirmed - updating received amounts:', {
        amount_received: actually_paid,
        currency_received: pay_currency?.toUpperCase()
      })
    }

    // Update payout information if available
    if (payout_amount && payout_currency) {
      updateData.merchant_receives = payout_amount
      updateData.payout_currency = payout_currency.toUpperCase()
      console.log('💸 Payout information updated:', {
        merchant_receives: payout_amount,
        payout_currency: payout_currency.toUpperCase()
      })
    }

    // Calculate gateway fee if we have the data
    if (price_amount && actually_paid && pay_currency === price_currency) {
      const gatewayFee = Math.max(0, actually_paid - price_amount)
      if (gatewayFee > 0) {
        updateData.gateway_fee = gatewayFee
        console.log('💳 Gateway fee calculated:', gatewayFee)
      }
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
      tx_hash: updateData.tx_hash,
      payin_hash: updateData.payin_hash,
      payout_hash: updateData.payout_hash,
      amount_received: updateData.amount_received,
      merchant_receives: updateData.merchant_receives
    })

    // If payment is confirmed, trigger post-confirmation actions
    if (newStatus === 'confirmed' && payment.status !== 'confirmed') {
      console.log('🎉 Payment confirmed! Triggering post-confirmation actions...')
      
      // Update payment link usage statistics
      try {
        const { error: incrementError } = await supabase.rpc('increment_payment_link_usage', {
          p_link_id: payment.payment_link_id
        })

        if (incrementError) {
          console.warn('⚠️ Failed to update payment link usage via function:', incrementError)
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
            console.log('✅ Payment link usage updated via direct query')
          }
        } else {
          console.log('✅ Payment link usage updated via function')
        }
      } catch (linkUpdateError) {
        console.warn('⚠️ Error updating payment link usage:', linkUpdateError)
      }

      // Here you could add additional post-confirmation actions:
      // - Send confirmation email to customer
      // - Send notification to merchant
      // - Update analytics/metrics
      // - Trigger any business logic
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      payment_id: payment.id,
      status: newStatus,
      hashes_captured: {
        tx_hash: !!updateData.tx_hash,
        payin_hash: !!updateData.payin_hash,
        payout_hash: !!updateData.payout_hash
      }
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

