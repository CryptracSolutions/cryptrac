import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createPayment, generateOrderId, calculateFees } from '@/lib/nowpayments'

// Helper function to format currency codes for NOWPayments
function formatCurrencyForNOWPayments(currency: string): string {
  // NOWPayments expects lowercase alphanumeric only (no underscores)
  return currency.toLowerCase().replace(/_/g, '')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_link_id, pay_currency, customer_email } = body

    console.log('🔄 Creating payment for:', {
      payment_link_id,
      pay_currency,
      customer_email: customer_email ? 'provided' : 'not provided'
    })

    if (!payment_link_id || !pay_currency) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
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

    // Get payment link details
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
      .eq('id', payment_link_id)
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
      merchant: paymentLink.merchant.business_name
    })

    // Check if payment link has expired
    if (paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Payment link has expired' },
        { status: 400 }
      )
    }

    // Check if payment link has reached max uses
    if (paymentLink.max_uses && paymentLink.current_uses >= paymentLink.max_uses) {
      return NextResponse.json(
        { success: false, message: 'Payment link has reached maximum uses' },
        { status: 400 }
      )
    }

    // Check if merchant has wallet for this currency
    const merchantWallets = paymentLink.merchant.wallets || {}
    const payoutAddress = merchantWallets[pay_currency]
    
    if (!payoutAddress) {
      return NextResponse.json(
        { success: false, message: `Merchant does not have a wallet configured for ${pay_currency}` },
        { status: 400 }
      )
    }

    // Determine fee settings
    const chargeCustomerFee = paymentLink.charge_customer_fee ?? paymentLink.merchant.charge_customer_fee ?? false
    const autoConvertEnabled = paymentLink.merchant.auto_convert_enabled ?? false
    const preferredPayoutCurrency = paymentLink.merchant.preferred_payout_currency

    // Calculate fees
    const feeCalculation = calculateFees(
      paymentLink.amount,
      autoConvertEnabled && preferredPayoutCurrency && preferredPayoutCurrency !== pay_currency,
      chargeCustomerFee
    )

    // Generate unique order ID
    const orderId = generateOrderId(paymentLink.merchant.id, paymentLink.id)

    // Format currencies for NOWPayments (remove underscores, lowercase)
    const formattedPayCurrency = formatCurrencyForNOWPayments(pay_currency)
    const formattedPriceCurrency = formatCurrencyForNOWPayments(paymentLink.currency)
    const formattedPayoutCurrency = preferredPayoutCurrency 
      ? formatCurrencyForNOWPayments(preferredPayoutCurrency)
      : formattedPayCurrency

    // Prepare NOWPayments request
    const nowPaymentsRequest = {
      price_amount: feeCalculation.customerPays,
      price_currency: formattedPriceCurrency,
      pay_currency: formattedPayCurrency,
      payout_address: payoutAddress,
      payout_currency: formattedPayoutCurrency,
      order_id: orderId,
      order_description: `${paymentLink.title} - ${paymentLink.merchant.business_name}`,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${paymentLink.link_id}`,
      is_fee_paid_by_user: chargeCustomerFee,
    }

    console.log('🔄 Creating NOWPayments payment:', nowPaymentsRequest)

    // Create payment with NOWPayments
    const nowPayment = await createPayment(nowPaymentsRequest)

    console.log('✅ NOWPayments payment created:', {
      payment_id: nowPayment.payment_id,
      pay_address: nowPayment.pay_address,
      pay_amount: nowPayment.pay_amount,
      pay_currency: nowPayment.pay_currency
    })

    // Save payment to database
    const paymentRecord = {
      payment_link_id: paymentLink.id,
      merchant_id: paymentLink.merchant.id,
      nowpayments_invoice_id: nowPayment.payment_id,
      order_id: orderId,
      status: 'waiting',
      amount: paymentLink.amount,
      currency: paymentLink.currency,
      pay_currency: pay_currency, // Keep original format for display
      pay_amount: nowPayment.pay_amount,
      pay_address: nowPayment.pay_address,
      customer_email: customer_email || null,
      gateway_fee: feeCalculation.gatewayFee,
      merchant_receives: feeCalculation.merchantReceives,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: savedPayment, error: saveError } = await supabase
      .from('merchant_payments')
      .insert(paymentRecord)
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

    // Generate QR code data (payment URL for wallet apps)
    const qrCodeData = `${pay_currency.toLowerCase()}:${nowPayment.pay_address}?amount=${nowPayment.pay_amount}`
    
    // Calculate expiration time (NOWPayments typically gives 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    // Prepare response
    const paymentResponse = {
      id: savedPayment.id,
      nowpayments_payment_id: nowPayment.payment_id,
      order_id: orderId,
      status: 'waiting',
      pay_currency: pay_currency, // Keep original format for display
      pay_amount: nowPayment.pay_amount,
      pay_address: nowPayment.pay_address,
      price_amount: paymentLink.amount,
      price_currency: paymentLink.currency,
      payout_currency: preferredPayoutCurrency || pay_currency,
      payout_amount: feeCalculation.merchantReceives,
      created_at: nowPayment.created_at,
      updated_at: nowPayment.updated_at,
      expires_at: expiresAt,
      qr_code_data: qrCodeData,
      payment_url: `${pay_currency.toLowerCase()}:${nowPayment.pay_address}?amount=${nowPayment.pay_amount}`,
      is_fee_paid_by_user: chargeCustomerFee,
      gateway_fee: feeCalculation.gatewayFee,
      network_fee: feeCalculation.networkFee,
      total_fee: feeCalculation.totalFee,
      actual_amount_to_pay: nowPayment.pay_amount,
      merchant_receives: feeCalculation.merchantReceives,
    }

    return NextResponse.json({
      success: true,
      payment: paymentResponse,
    })

  } catch (error) {
    console.error('❌ Error creating payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

