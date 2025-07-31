import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPaymentStatus } from '@/lib/nowpayments-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Checking payment status for link ID:', id)

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

    // Get the most recent payment for this payment link
    const { data: payment, error } = await supabase
      .from('transactions')
      .select(`
        *,
        payment_link:payment_links(
          id,
          link_id,
          title,
          merchant:merchants(
            business_name
          )
        )
      `)
      .eq('payment_link.link_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !payment) {
      console.error('❌ Payment not found:', error)
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment found:', {
      id: payment.id,
      status: payment.status,
      nowpayments_id: payment.nowpayments_invoice_id,
    })

    // If payment is still waiting or confirming, check NOWPayments for updates
    if (['waiting', 'confirming'].includes(payment.status) && payment.nowpayments_invoice_id) {
      try {
        console.log('🔄 Checking NOWPayments status...')
        const nowPaymentStatus = await getPaymentStatus(payment.nowpayments_invoice_id)
        
        // Map NOWPayments status to our status
        let newStatus = payment.status
        let txHash = payment.tx_hash
        
        switch (nowPaymentStatus.payment_status) {
          case 'waiting':
            newStatus = 'waiting'
            break
          case 'confirming':
            newStatus = 'confirming'
            break
          case 'confirmed':
          case 'finished':
            newStatus = 'confirmed'
            // Extract transaction hash if available (check multiple possible fields)
            if ((nowPaymentStatus as any).outcome?.hash) {
              txHash = (nowPaymentStatus as any).outcome.hash
            } else if ((nowPaymentStatus as any).tx_hash) {
              txHash = (nowPaymentStatus as any).tx_hash
            } else if ((nowPaymentStatus as any).txid) {
              txHash = (nowPaymentStatus as any).txid
            }
            break
          case 'failed':
          case 'refunded':
            newStatus = 'failed'
            break
          case 'expired':
            newStatus = 'expired'
            break
        }

        // Update payment status if it changed
        if (newStatus !== payment.status || (txHash && txHash !== payment.tx_hash)) {
          console.log(`📝 Updating payment status: ${payment.status} -> ${newStatus}`)
          
          const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          }

          if (txHash && txHash !== payment.tx_hash) {
            updateData.tx_hash = txHash
          }

          // If payment is confirmed, update received amounts
          if (newStatus === 'confirmed' && (nowPaymentStatus as any).actually_paid) {
            updateData.amount_received = (nowPaymentStatus as any).actually_paid
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
            if (updateData.amount_received) payment.amount_received = updateData.amount_received
            if (updateData.currency_received) payment.currency_received = updateData.currency_received
          }
        }
      } catch (nowPaymentsError) {
        console.error('❌ Error checking NOWPayments status:', nowPaymentsError)
        // Continue with existing status if NOWPayments check fails
      }
    }

    // Prepare response data
    const responsePayment = {
      id: payment.id,
      nowpayments_payment_id: payment.nowpayments_invoice_id,
      order_id: payment.order_id,
      status: payment.status,
      pay_currency: payment.pay_currency,
      pay_amount: payment.pay_amount,
      pay_address: payment.pay_address,
      price_amount: payment.amount,
      price_currency: payment.currency,
      payout_currency: payment.currency_received || payment.pay_currency,
      payout_amount: payment.merchant_receives,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      tx_hash: payment.tx_hash,
      is_fee_paid_by_user: payment.gateway_fee > 0,
      gateway_fee: payment.gateway_fee,
      merchant_receives: payment.merchant_receives,
      amount_received: payment.amount_received,
      currency_received: payment.currency_received,
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

