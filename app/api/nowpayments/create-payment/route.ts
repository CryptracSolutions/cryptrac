import { NextRequest, NextResponse } from 'next/server'
import { createPayment, formatCurrencyForNOWPayments } from '@/lib/nowpayments-dynamic'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      price_amount, 
      price_currency, 
      pay_currency, 
      order_id, 
      order_description,
      payout_address,
      payout_currency,
      ipn_callback_url,
      payment_link_id,
      customer_email,
      // Tax information
      tax_enabled,
      base_amount,
      tax_rates,
      tax_amount,
      subtotal_with_tax
    } = body

    console.log('💳 Payment creation request:', {
      price_amount,
      price_currency,
      pay_currency,
      order_id,
      payout_address: payout_address ? '***' : undefined,
      payout_currency
    })

    // Validate required parameters
    if (!price_amount || !price_currency || !pay_currency) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: price_amount, price_currency, pay_currency' 
        },
        { status: 400 }
      )
    }

    // Validate amount
    const amount = parseFloat(price_amount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid price_amount: must be a positive number' 
        },
        { status: 400 }
      )
    }

    // Prepare payment request
    const paymentRequest = {
      price_amount: amount,
      price_currency: formatCurrencyForNOWPayments(price_currency),
      pay_currency: formatCurrencyForNOWPayments(pay_currency),
      order_id: order_id || `cryptrac_${Date.now()}`,
      order_description: order_description || 'Cryptrac Payment',
      payout_address: payout_address,
      payout_currency: payout_currency ? formatCurrencyForNOWPayments(payout_currency) : undefined,
      ipn_callback_url: ipn_callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      fixed_rate: false // Use floating rate for better success rate
    }

    console.log('📡 Sending payment request to NOWPayments...')

    // Create payment with NOWPayments
    const payment = await createPayment(paymentRequest)

    console.log('✅ Payment created successfully:', {
      payment_id: payment.payment_id,
      payment_status: payment.payment_status,
      pay_amount: payment.pay_amount,
      pay_currency: payment.pay_currency
    })

    return NextResponse.json({
      success: true,
      payment: {
        payment_id: payment.payment_id,
        payment_status: payment.payment_status,
        pay_address: payment.pay_address,
        price_amount: payment.price_amount,
        price_currency: payment.price_currency.toUpperCase(),
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency.toUpperCase(),
        order_id: payment.order_id,
        order_description: payment.order_description,
        purchase_id: payment.purchase_id,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        outcome_amount: payment.outcome_amount,
        outcome_currency: payment.outcome_currency?.toUpperCase()
      },
      source: 'nowpayments_dynamic_api'
    })

  } catch (error) {
    console.error('💥 Error creating payment:', error)
    
    // Parse NOWPayments error messages for better user feedback
    let errorMessage = 'Failed to create payment'
    let statusCode = 500

    if (error instanceof Error) {
      const errorText = error.message.toLowerCase()
      
      if (errorText.includes('amount too small') || errorText.includes('min_amount')) {
        errorMessage = 'Payment amount is too small for this currency'
        statusCode = 400
      } else if (errorText.includes('amount too large') || errorText.includes('max_amount')) {
        errorMessage = 'Payment amount is too large for this currency'
        statusCode = 400
      } else if (errorText.includes('currency not supported') || errorText.includes('invalid currency')) {
        errorMessage = 'Currency not supported'
        statusCode = 400
      } else if (errorText.includes('invalid address') || errorText.includes('payout_address')) {
        errorMessage = 'Invalid payout address'
        statusCode = 400
      } else if (errorText.includes('rate')) {
        errorMessage = 'Unable to get exchange rate for this currency pair'
        statusCode = 400
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    )
  }
}

