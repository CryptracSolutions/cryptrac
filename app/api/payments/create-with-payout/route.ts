import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requiresExtraId, validateExtraId, getExtraIdLabel } from '@/lib/extra-id-validation';

export async function POST(request: NextRequest) {
  try {
    const { merchantId, currency, amount, orderId } = await request.json();
    
    console.log(`💳 Creating payment - Merchant: ${merchantId}, Currency: ${currency}, Amount: ${amount}`);
    
    // Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Get merchant's wallet configuration from merchants table
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('wallets')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({
        success: false,
        error: 'Merchant not found'
      }, { status: 404 });
    }
    
    // Get merchant's extra_ids from merchant_settings table
    const { data: merchantSettings, error: settingsError } = await supabase
      .from('merchant_settings')
      .select('wallet_extra_ids')
      .eq('merchant_id', merchantId)
      .single();

    const walletAddress = merchant.wallets?.[currency];
    const extraId = merchantSettings?.wallet_extra_ids?.[currency];

    // Validate merchant has configured this currency
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: `Merchant has not configured ${currency} wallet`
      }, { status: 400 });
    }

    // Validate extra_id if required
    if (requiresExtraId(currency) && !extraId) {
      return NextResponse.json({
        success: false,
        error: `${getExtraIdLabel(currency)} is required for ${currency} but not configured`
      }, { status: 400 });
    }

    // Create payment with merchant-specific payout info
    const paymentPayload: any = {
      price_amount: amount,
      price_currency: 'usd',
      pay_currency: currency.toLowerCase(),
      order_id: orderId,
      payout_address: walletAddress, // Merchant's wallet address
      ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/api/webhooks/nowpayments`
    };

    // Add payout_extra_id only for currencies that need it
    if (requiresExtraId(currency) && extraId) {
      paymentPayload.payout_extra_id = extraId; // Merchant's destination tag
    }

    console.log('🚀 Calling NOWPayments API with payload:', paymentPayload);

    const nowPaymentsResponse = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await nowPaymentsResponse.json();

    if (!nowPaymentsResponse.ok) {
      console.error('❌ NOWPayments API error:', paymentData);
      return NextResponse.json({
        success: false,
        error: 'Payment creation failed'
      }, { status: 500 });
    }

    console.log('✅ Payment created successfully:', paymentData.payment_id);

    return NextResponse.json({
      success: true,
      payment: {
        payment_id: paymentData.payment_id,
        pay_address: paymentData.pay_address, // Customer sends here
        payin_extra_id: paymentData.payin_extra_id, // Customer includes this
        pay_amount: paymentData.pay_amount,
        pay_currency: paymentData.pay_currency,
        // Merchant payout info (for your records)
        payout_address: walletAddress,
        payout_extra_id: extraId
      }
    });
    
  } catch (error) {
    console.error('💥 Payment creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}