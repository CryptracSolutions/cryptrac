import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createPayment, generateOrderId } from '@/lib/nowpayments'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      payment_link_id, 
      pay_currency, 
      customer_email 
    } = body

    console.log('🔄 Payment creation request:', {
      payment_link_id,
      pay_currency,
      customer_email,
      api_key_exists: !!process.env.NOWPAYMENTS_API_KEY
    })

    if (!payment_link_id || !pay_currency) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!process.env.NOWPAYMENTS_API_KEY) {
      console.error('❌ NOWPAYMENTS_API_KEY not found in environment')
      return NextResponse.json(
        { success: false, message: 'Payment service not configured' },
        { status: 500 }
      )
    }

    // Initialize Supabase client
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
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server component context
            }
          },
        },
      }
    )

    // Get payment link details with merchant info
    const { data: paymentLink, error: linkError } = await supabase
      .from('payment_links')
      .select(`
        *,
        merchant:merchants(
          id,
          business_name,
          charge_customer_fee,
          auto_convert_enabled,
          preferred_payout_currency,
          wallets
        )
      `)
      .eq('link_id', payment_link_id)
      .eq('status', 'active')
      .single()

    if (linkError || !paymentLink) {
      console.error('❌ Payment link not found:', linkError)
      return NextResponse.json(
        { success: false, message: 'Payment link not found or inactive' },
        { status: 404 }
      )
    }

    console.log('✅ Payment link found:', {
      id: paymentLink.id,
      title: paymentLink.title,
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      merchant_id: paymentLink.merchant.id
    })

    // Validate that the merchant has a wallet for the selected currency
    const merchantWallets = paymentLink.merchant.wallets || {}
    const payoutAddress = merchantWallets[pay_currency]

    if (!payoutAddress) {
      console.error('❌ No wallet address configured for currency:', pay_currency)
      return NextResponse.json(
        { success: false, message: `Merchant has no wallet configured for ${pay_currency}` },
        { status: 400 }
      )
    }

    // Determine fee settings
    const chargeCustomerFee = paymentLink.charge_customer_fee ?? paymentLink.merchant.charge_customer_fee
    const autoConvertEnabled = paymentLink.auto_convert_enabled ?? paymentLink.merchant.auto_convert_enabled
    const preferredPayoutCurrency = paymentLink.preferred_payout_currency ?? paymentLink.merchant.preferred_payout_currency

    // Generate unique order ID
    const orderId = generateOrderId(paymentLink.merchant.id, paymentLink.id)

    // Prepare payment data for NOWPayments
    const paymentData = {
      price_amount: paymentLink.amount,
      price_currency: paymentLink.currency.toLowerCase(),
      pay_currency: pay_currency,
      payout_address: payoutAddress,
      payout_currency: autoConvertEnabled && preferredPayoutCurrency ? preferredPayoutCurrency : undefined,
      order_id: orderId,
      order_description: `${paymentLink.title} - ${paymentLink.merchant.business_name}`,
      is_fee_paid_by_user: chargeCustomerFee || false
    }

    console.log('🔄 Creating NOWPayments payment with data:', paymentData)

    // Create payment with NOWPayments
    const nowPayment = await createPayment(paymentData)

    console.log('✅ NOWPayments payment created successfully:', {
      payment_id: nowPayment.payment_id,
      pay_address: nowPayment.pay_address,
      pay_amount: nowPayment.pay_amount,
      pay_currency: nowPayment.pay_currency
    })

    // Calculate expiration time (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // Save payment record to database
    const { data: savedPayment, error: saveError } = await supabase
      .from('merchant_payments')
      .insert({
        merchant_id: paymentLink.merchant.id,
        payment_link_id: paymentLink.id,
        nowpayments_payment_id: nowPayment.payment_id,
        order_id: orderId,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        pay_amount: nowPayment.pay_amount,
        pay_currency: nowPayment.pay_currency,
        pay_address: nowPayment.pay_address,
        payout_address: payoutAddress,
        payout_currency: nowPayment.payout_currency || pay_currency,
        status: 'waiting',
        customer_email: customer_email || null,
        charge_customer_fee: chargeCustomerFee,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Error saving payment to database:', saveError)
      return NextResponse.json(
        { success: false, message: 'Failed to save payment record' },
        { status: 500 }
      )
    }

    console.log('✅ Payment saved to database:', savedPayment.id)

    // Increment payment link usage count
    try {
      const { error: incrementError } = await supabase.rpc('increment_payment_link_usage', {
        link_id: paymentLink.id
      })

      if (incrementError) {
        console.warn('⚠️ Could not increment payment link usage:', incrementError)
        // Fallback: manual increment
        await supabase
          .from('payment_links')
          .update({ 
            current_uses: (paymentLink.current_uses || 0) + 1,
            last_payment_at: new Date().toISOString()
          })
          .eq('id', paymentLink.id)
      }
    } catch (incrementError) {
      console.warn('⚠️ Error incrementing usage count:', incrementError)
    }

    // Return payment details for the frontend
    return NextResponse.json({
      success: true,
      payment: {
        id: savedPayment.id,
        payment_id: nowPayment.payment_id,
        pay_address: nowPayment.pay_address,
        pay_amount: nowPayment.pay_amount,
        pay_currency: nowPayment.pay_currency,
        price_amount: paymentLink.amount,
        price_currency: paymentLink.currency,
        order_id: orderId,
        expires_at: expiresAt,
        status: 'waiting',
        qr_data: `${pay_currency.toLowerCase()}:${nowPayment.pay_address}?amount=${nowPayment.pay_amount}`,
        payment_url: `${pay_currency.toLowerCase()}:${nowPayment.pay_address}?amount=${nowPayment.pay_amount}`,
        merchant_name: paymentLink.merchant.business_name,
        payment_title: paymentLink.title,
        charge_customer_fee: chargeCustomerFee
      }
    })

  } catch (error) {
    console.error('❌ Error creating payment:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Handle specific NOWPayments errors
    if (errorMessage.includes('amount too small') || errorMessage.includes('amountTo is too small')) {
      return NextResponse.json(
        { success: false, message: 'Payment amount is too small for this cryptocurrency' },
        { status: 400 }
      )
    } else if (errorMessage.includes('currency not supported')) {
      return NextResponse.json(
        { success: false, message: 'Cryptocurrency not supported' },
        { status: 400 }
      )
    } else if (errorMessage.includes('Invalid currency pair')) {
      return NextResponse.json(
        { success: false, message: 'Invalid currency combination' },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to create payment', error: errorMessage },
        { status: 500 }
      )
    }
  }
}

