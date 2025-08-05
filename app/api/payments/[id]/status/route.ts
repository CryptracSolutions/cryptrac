import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getPaymentStatus(paymentId: string) {
  const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
    method: 'GET',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`NOWPayments API error: ${response.status}`)
  }

  return await response.json()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Checking payment status for link ID:', id)

    // First, get the payment link to find the most recent payment
    const { data: paymentLinkData, error: linkError } = await supabase
      .from('payment_links')
      .select('id')
      .eq('link_id', id)
      .single()

    if (linkError || !paymentLinkData) {
      console.error('❌ Payment link not found:', linkError)
      return NextResponse.json(
        { success: false, message: 'Payment link not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment link found:', paymentLinkData.id)

    // Get the most recent payment for this payment link
    const { data: payment, error: paymentError } = await supabase
      .from('transactions')
      .select(`
        *
      `)
      .eq('payment_link_id', paymentLinkData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (paymentError || !payment) {
      console.error('❌ Payment not found:', paymentError)
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment found:', {
      id: payment.id,
      status: payment.status,
      payment_id: payment.payment_id,
    })

    // If payment is still waiting or confirming, check NOWPayments for updates
    if (['waiting', 'confirming'].includes(payment.status) && payment.payment_id) {
      try {
        console.log('🔄 Checking NOWPayments status...')
        const nowPaymentStatus = await getPaymentStatus(payment.payment_id)
        
        // Map NOWPayments status to our status
        let newStatus = payment.status
        let txHash = payment.tx_hash
        let payinHash = payment.payin_hash
        let payoutHash = payment.payout_hash
        
        console.log('📊 NOWPayments status response:', {
          payment_status: nowPaymentStatus.payment_status,
          payin_hash: nowPaymentStatus.payin_hash,
          payout_hash: nowPaymentStatus.payout_hash,
          outcome: nowPaymentStatus.outcome
        })
        
        switch (nowPaymentStatus.payment_status) {
          case 'waiting':
            newStatus = 'waiting'
            break
          case 'confirming':
          case 'sending':
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
        }

        // Extract transaction hashes
        if (nowPaymentStatus.payin_hash && nowPaymentStatus.payin_hash !== payinHash) {
          payinHash = nowPaymentStatus.payin_hash
          console.log('✅ Payin hash captured:', payinHash)
        }

        if (nowPaymentStatus.payout_hash && nowPaymentStatus.payout_hash !== payoutHash) {
          payoutHash = nowPaymentStatus.payout_hash
          console.log('✅ Payout hash captured:', payoutHash)
        }

        // Set primary tx_hash based on status
        if (newStatus === 'confirmed' && payoutHash) {
          txHash = payoutHash // Use payout hash for confirmed payments
          console.log('✅ Using payout_hash as primary tx_hash for confirmed payment')
        } else if (payinHash && !txHash) {
          txHash = payinHash // Use payin hash if no tx_hash yet
          console.log('✅ Using payin_hash as primary tx_hash')
        }

        // Update payment status if it changed
        if (newStatus !== payment.status || 
            (txHash && txHash !== payment.tx_hash) ||
            (payinHash && payinHash !== payment.payin_hash) ||
            (payoutHash && payoutHash !== payment.payout_hash)) {
          
          console.log(`📝 Updating payment status: ${payment.status} -> ${newStatus}`)
          
          const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          }

          if (txHash && txHash !== payment.tx_hash) {
            updateData.tx_hash = txHash
          }

          if (payinHash && payinHash !== payment.payin_hash) {
            updateData.payin_hash = payinHash
          }

          if (payoutHash && payoutHash !== payment.payout_hash) {
            updateData.payout_hash = payoutHash
          }

          // If payment is confirmed, update received amounts
          if (newStatus === 'confirmed' && nowPaymentStatus.actually_paid) {
            updateData.amount_received = nowPaymentStatus.actually_paid
            updateData.currency_received = nowPaymentStatus.pay_currency?.toUpperCase()
          }

          const { error: updateError } = await supabase
            .from('transactions')
            .update(updateData)
            .eq('id', payment.id)

          if (updateError) {
            console.error('❌ Error updating payment status:', updateError)
          } else {
            console.log('✅ Payment status updated successfully')
            // Update the payment object with new data
            payment.status = newStatus
            payment.tx_hash = txHash
            payment.payin_hash = payinHash
            payment.payout_hash = payoutHash
            if (updateData.amount_received) payment.amount_received = updateData.amount_received
            if (updateData.currency_received) payment.currency_received = updateData.currency_received
          }
        }
      } catch (nowPaymentsError) {
        console.error('❌ Error checking NOWPayments status:', nowPaymentsError)
        // Continue with existing status if NOWPayments check fails
      }
    }

    // Get payment link and merchant info for response
    const { data: paymentLinkInfo, error: linkInfoError } = await supabase
      .from('payment_links')
      .select(`
        id,
        link_id,
        title,
        merchant:merchants(
          business_name
        )
      `)
      .eq('id', payment.payment_link_id)
      .single()

    // Prepare response data
    const responsePayment = {
      id: payment.id,
      nowpayments_payment_id: payment.payment_id,
      order_id: payment.order_id,
      status: payment.status,
      pay_currency: payment.pay_currency,
      pay_amount: payment.pay_amount,
      pay_address: payment.pay_address,
      price_amount: payment.price_amount,
      price_currency: payment.price_currency,
      payout_currency: payment.payout_currency || payment.pay_currency,
      payout_amount: payment.payout_amount,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      tx_hash: payment.tx_hash,
      payin_hash: payment.payin_hash,
      payout_hash: payment.payout_hash,
      is_fee_paid_by_user: payment.is_fee_paid_by_user || false,
      gateway_fee: payment.gateway_fee || 0,
      merchant_receives: payment.merchant_receives,
      amount_received: payment.amount_received,
      currency_received: payment.currency_received,
      payment_link: paymentLinkInfo ? {
        title: paymentLinkInfo.title,
        link_id: paymentLinkInfo.link_id,
        merchant: paymentLinkInfo.merchant
      } : null
    }

    return NextResponse.json({
      success: true,
      payment: responsePayment,
    })

  } catch (error) {
    console.error('❌ Error in payment status API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

