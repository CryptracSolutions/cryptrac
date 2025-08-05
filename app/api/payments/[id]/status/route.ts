import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Block explorer URL mapping
const getBlockExplorerUrl = (txHash: string, currency: string) => {
  const currencyUpper = currency.toUpperCase()
  
  if (currencyUpper === 'BTC') {
    return `https://blockstream.info/tx/${txHash}`
  } else if (currencyUpper === 'ETH' || currencyUpper.includes('ERC20') || currencyUpper.includes('USDT') || currencyUpper.includes('USDC')) {
    return `https://etherscan.io/tx/${txHash}`
  } else if (currencyUpper === 'LTC') {
    return `https://blockchair.com/litecoin/transaction/${txHash}`
  } else if (currencyUpper === 'SOL') {
    return `https://solscan.io/tx/${txHash}`
  } else if (currencyUpper === 'TRX' || currencyUpper.includes('TRC20')) {
    return `https://tronscan.org/#/transaction/${txHash}`
  } else if (currencyUpper === 'BNB' || currencyUpper.includes('BSC')) {
    return `https://bscscan.com/tx/${txHash}`
  } else if (currencyUpper === 'MATIC' || currencyUpper.includes('POLYGON')) {
    return `https://polygonscan.com/tx/${txHash}`
  }
  
  return null
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    console.log('🔍 Checking payment status for link ID:', id)

    // Step 1: Get payment link ID from link_id
    const { data: paymentLinkData, error: linkError } = await supabase
      .from('payment_links')
      .select('id')
      .eq('link_id', id)
      .single()

    if (linkError || !paymentLinkData) {
      console.error('❌ Payment link not found:', linkError)
      return NextResponse.json(
        { success: false, error: 'Payment link not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment link found:', paymentLinkData.id)

    // Step 2: Get the most recent payment for this payment link
    const { data: payment, error: paymentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_link_id', paymentLinkData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (paymentError || !payment) {
      console.error('❌ Payment not found:', paymentError)
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    console.log('✅ Payment found:', {
      id: payment.id,
      payment_id: payment.payment_id,
      status: payment.status,
      pay_currency: payment.pay_currency
    })

    // Step 3: Check NOWPayments for status updates if payment exists
    if (payment.payment_id) {
      try {
        console.log('🔍 Checking NOWPayments status for payment:', payment.payment_id)
        
        const nowPaymentsResponse = await fetch(
          `https://api.nowpayments.io/v1/payment/${payment.payment_id}`,
          {
            headers: {
              'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
            },
          }
        )

        if (nowPaymentsResponse.ok) {
          const nowPaymentsData = await nowPaymentsResponse.json()
          console.log('✅ NOWPayments status:', {
            payment_status: nowPaymentsData.payment_status,
            payin_hash: nowPaymentsData.payin_hash || 'null',
            payout_hash: nowPaymentsData.payout_hash || 'null'
          })

          // Map NOWPayments status to our status
          let mappedStatus = nowPaymentsData.payment_status
          if (nowPaymentsData.payment_status === 'sending') {
            mappedStatus = 'confirming'
          }

          // Extract transaction hashes
          let payinHash = nowPaymentsData.payin_hash || null
          let payoutHash = nowPaymentsData.payout_hash || null
          let primaryTxHash = null

          // Smart primary hash selection
          if (mappedStatus === 'confirmed' && payoutHash) {
            primaryTxHash = payoutHash
            console.log('✅ Using payout_hash as primary tx_hash for confirmed payment')
          } else if (payinHash) {
            primaryTxHash = payinHash
            console.log('✅ Using payin_hash as primary tx_hash')
          } else if (nowPaymentsData.outcome?.hash) {
            primaryTxHash = nowPaymentsData.outcome.hash
            console.log('✅ Using outcome.hash as primary tx_hash')
          }

          // Update payment status and hashes in database if changed
          if (payment.status !== mappedStatus || 
              payment.payin_hash !== payinHash || 
              payment.payout_hash !== payoutHash ||
              payment.tx_hash !== primaryTxHash) {
            
            console.log('🔄 Updating payment status and hashes in database')
            
            const updateData: any = {
              status: mappedStatus,
              updated_at: new Date().toISOString()
            }

            // Update hashes if available
            if (payinHash && payment.payin_hash !== payinHash) {
              updateData.payin_hash = payinHash
              console.log('✅ Payin hash captured:', payinHash)
            }
            
            if (payoutHash && payment.payout_hash !== payoutHash) {
              updateData.payout_hash = payoutHash
              console.log('✅ Payout hash captured:', payoutHash)
            }
            
            if (primaryTxHash && payment.tx_hash !== primaryTxHash) {
              updateData.tx_hash = primaryTxHash
              console.log('✅ Primary tx_hash updated:', primaryTxHash)
            }

            // Update additional payment details
            if (nowPaymentsData.actually_paid !== undefined) {
              updateData.amount_received = nowPaymentsData.actually_paid
            }
            
            if (nowPaymentsData.outcome_amount !== undefined) {
              updateData.payout_amount = nowPaymentsData.outcome_amount
            }
            
            if (nowPaymentsData.outcome_currency) {
              updateData.payout_currency = nowPaymentsData.outcome_currency.toUpperCase()
            }

            const { error: updateError } = await supabase
              .from('transactions')
              .update(updateData)
              .eq('id', payment.id)

            if (updateError) {
              console.error('❌ Error updating payment:', updateError)
            } else {
              console.log('✅ Payment updated successfully')
              // Update local payment object
              Object.assign(payment, updateData)
            }
          }
        } else {
          console.error('❌ NOWPayments API error:', nowPaymentsResponse.status)
        }
      } catch (nowPaymentsError) {
        console.error('❌ Error checking NOWPayments:', nowPaymentsError)
        // Continue with existing payment data
      }
    }

    // Prepare response with enhanced payment data
    const responsePayment = {
      id: payment.id,
      payment_id: payment.payment_id,
      order_id: payment.order_id,
      status: payment.status,
      pay_currency: payment.pay_currency,
      pay_amount: payment.pay_amount,
      pay_address: payment.pay_address,
      price_amount: payment.price_amount,
      price_currency: payment.price_currency,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      tx_hash: payment.tx_hash,
      payin_hash: payment.payin_hash,
      payout_hash: payment.payout_hash,
      amount_received: payment.amount_received,
      payout_amount: payment.payout_amount,
      payout_currency: payment.payout_currency,
      gateway_fee: payment.gateway_fee,
      merchant_receives: payment.merchant_receives,
      customer_email: payment.customer_email,
      customer_phone: payment.customer_phone,
      // Tax information
      tax_enabled: payment.tax_enabled,
      base_amount: payment.base_amount,
      tax_rates: payment.tax_rates,
      tax_amount: payment.tax_amount,
      subtotal_with_tax: payment.subtotal_with_tax,
      // Block explorer URL if tx_hash is available
      block_explorer_url: payment.tx_hash ? getBlockExplorerUrl(payment.tx_hash, payment.pay_currency) : null
    }

    console.log('✅ Returning payment status:', {
      status: responsePayment.status,
      tx_hash: responsePayment.tx_hash ? 'present' : 'null',
      payin_hash: responsePayment.payin_hash ? 'present' : 'null',
      payout_hash: responsePayment.payout_hash ? 'present' : 'null'
    })

    return NextResponse.json({
      success: true,
      payment: responsePayment
    })

  } catch (error) {
    console.error('❌ Error checking payment status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check payment status' 
      },
      { status: 500 }
    )
  }
}

