import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getNOWPaymentsClient, calculateCryptracFees } from '@/lib/nowpayments';

interface CreatePaymentRequest {
  payment_link_id: string;
  pay_currency: string;
  customer_email?: string;
  success_url?: string;
  cancel_url?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();
    const { payment_link_id, pay_currency, customer_email, success_url, cancel_url } = body;

    // Validate required parameters
    if (!payment_link_id || !pay_currency) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          required: ['payment_link_id', 'pay_currency']
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server component context
            }
          },
        },
      }
    );

    // Get payment link details with merchant information
    const { data: paymentLink, error: linkError } = await supabase
      .from('payment_links')
      .select(`
        *,
        merchant:merchants(
          id,
          business_name,
          user_id,
          wallets
        )
      `)
      .eq('id', payment_link_id)
      .eq('status', 'active')
      .single();

    if (linkError || !paymentLink) {
      return NextResponse.json(
        { error: 'Payment link not found or inactive' },
        { status: 404 }
      );
    }

    // Check if payment link has expired
    if (paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Payment link has expired' },
        { status: 410 }
      );
    }

    // Check if payment link has reached max uses
    if (paymentLink.max_uses && paymentLink.current_uses >= paymentLink.max_uses) {
      return NextResponse.json(
        { error: 'Payment link has reached maximum uses' },
        { status: 410 }
      );
    }

    // Validate that the requested currency is accepted
    const acceptedCryptos = paymentLink.accepted_cryptos || [];
    if (!acceptedCryptos.includes(pay_currency.toUpperCase())) {
      return NextResponse.json(
        { error: `Currency ${pay_currency.toUpperCase()} is not accepted for this payment` },
        { status: 400 }
      );
    }

    // Get auto-conversion settings from the payment link (not current merchant settings)
    const merchant = paymentLink.merchant;
    const autoConvertEnabled = paymentLink.auto_convert_enabled || false;
    const preferredPayoutCurrency = paymentLink.preferred_payout_currency;
    const merchantWallets = merchant.wallets || {};

    console.log('Using payment link auto-conversion settings:', {
      autoConvertEnabled,
      preferredPayoutCurrency,
      paymentLinkId: paymentLink.id
    });

    // Determine payout currency and address
    let payoutCurrency = pay_currency.toLowerCase();
    let payoutAddress = merchantWallets[payoutCurrency];

    if (autoConvertEnabled && preferredPayoutCurrency) {
      payoutCurrency = preferredPayoutCurrency.toLowerCase();
      payoutAddress = merchantWallets[payoutCurrency];

      // Validate that merchant has the required payout wallet
      if (!payoutAddress) {
        return NextResponse.json(
          { error: `Merchant wallet address for ${payoutCurrency.toUpperCase()} is required for auto-conversion` },
          { status: 400 }
        );
      }
    } else {
      // Validate that merchant has wallet for the payment currency
      if (!payoutAddress) {
        return NextResponse.json(
          { error: `Merchant wallet address for ${pay_currency.toUpperCase()} is required` },
          { status: 400 }
        );
      }
    }

    // Get NOWPayments client
    const nowPayments = getNOWPaymentsClient();

    // Calculate fees based on auto-conversion setting
    const fees = calculateCryptracFees(paymentLink.amount, autoConvertEnabled);

    // Create unique order ID
    const orderId = `cryptrac_${paymentLink.link_id}_${Date.now()}`;

    // Prepare NOWPayments payment request with auto-conversion support
    const paymentRequest: {
      price_amount: number;
      price_currency: string;
      pay_currency: string;
      order_id: string;
      order_description: string;
      ipn_callback_url: string;
      success_url: string;
      cancel_url: string;
      is_fee_paid_by_user: boolean;
      payout_address: string;
      payout_currency?: string;
    } = {
      price_amount: paymentLink.amount,
      price_currency: paymentLink.currency.toLowerCase(),
      pay_currency: pay_currency.toLowerCase(),
      order_id: orderId,
      order_description: `${paymentLink.title} - ${merchant.business_name}`,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`,
      is_fee_paid_by_user: false, // Merchant pays the fee
      payout_address: payoutAddress // ALWAYS include for non-custodial flow
    };

    // Add payout currency if auto-conversion is enabled
    if (autoConvertEnabled && preferredPayoutCurrency) {
      paymentRequest.payout_currency = payoutCurrency;
    }

    console.log('Creating NOWPayments payment:', {
      orderId,
      amount: paymentRequest.price_amount,
      currency: paymentRequest.price_currency,
      payCurrency: paymentRequest.pay_currency,
      payoutCurrency: paymentRequest.payout_currency || 'same as pay_currency',
      autoConvert: autoConvertEnabled,
      feePercentage: fees.feePercentage
    });

    // Create payment with NOWPayments
    const nowPayment = await nowPayments.createPayment(paymentRequest);

    console.log('NOWPayments payment created:', {
      paymentId: nowPayment.payment_id,
      status: nowPayment.payment_status,
      payAddress: nowPayment.pay_address
    });

    // Store payment in database with enhanced fields
    const { data: merchantPayment, error: paymentError } = await supabase
      .from('merchant_payments')
      .insert({
        merchant_id: merchant.id,
        payment_link_id: paymentLink.id,
        nowpayments_invoice_id: nowPayment.payment_id,
        order_id: orderId,
        amount: paymentLink.amount,
        amount_received: 0,
        currency: paymentLink.currency,
        pay_currency: pay_currency.toUpperCase(),
        payout_currency: payoutCurrency.toUpperCase(),
        currency_received: pay_currency.toUpperCase(),
        status: nowPayment.payment_status,
        pay_address: nowPayment.pay_address,
        pay_amount: nowPayment.pay_amount,
        cryptrac_fee: fees.cryptracFee,
        gateway_fee: fees.gatewayFee,
        merchant_receives: fees.merchantReceives,
        customer_email: customer_email,
        payment_data: {
          ...nowPayment,
          auto_convert_enabled: autoConvertEnabled,
          preferred_payout_currency: preferredPayoutCurrency,
          payout_address: payoutAddress,
          fee_percentage: fees.feePercentage
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error storing payment:', paymentError);
      // Continue anyway - webhook will handle updates
    } else {
      console.log('Payment stored successfully:', merchantPayment?.id);
    }

    // Generate QR code data for the payment
    let qrCodeData: string;
    if (pay_currency.toLowerCase() === 'usdc') {
      qrCodeData = `ethereum:${nowPayment.pay_address}?value=${nowPayment.pay_amount}`;
    } else if (pay_currency.toLowerCase() === 'btc') {
      qrCodeData = `bitcoin:${nowPayment.pay_address}?amount=${nowPayment.pay_amount}`;
    } else if (pay_currency.toLowerCase() === 'eth') {
      qrCodeData = `ethereum:${nowPayment.pay_address}?value=${nowPayment.pay_amount}`;
    } else {
      qrCodeData = `${pay_currency.toLowerCase()}:${nowPayment.pay_address}?amount=${nowPayment.pay_amount}`;
    }

    // Return payment details with auto-conversion information
    return NextResponse.json({
      success: true,
      payment: {
        id: merchantPayment?.id,
        nowpayments_payment_id: nowPayment.payment_id,
        order_id: orderId,
        status: nowPayment.payment_status,
        pay_address: nowPayment.pay_address,
        pay_amount: nowPayment.pay_amount,
        pay_currency: pay_currency.toUpperCase(),
        payout_currency: payoutCurrency.toUpperCase(),
        price_amount: paymentLink.amount,
        price_currency: paymentLink.currency,
        qr_code_data: qrCodeData,
        payment_url: nowPayment.payment_url,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        auto_convert_enabled: autoConvertEnabled,
        fees: {
          cryptrac_fee: fees.cryptracFee,
          gateway_fee: fees.gatewayFee,
          total_fees: fees.totalFees,
          merchant_receives: fees.merchantReceives,
          fee_percentage: fees.feePercentage
        }
      },
      payment_link: {
        title: paymentLink.title,
        description: paymentLink.description,
        merchant_name: merchant.business_name
      }
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');

    if (!paymentId || paymentId === 'undefined') {
      return NextResponse.json(
        { error: 'Missing or invalid payment_id parameter' },
        { status: 400 }
      );
    }

    // Get NOWPayments client
    const nowPayments = getNOWPaymentsClient();

    // Get payment status from NOWPayments
    const paymentStatus = await nowPayments.getPaymentStatus(paymentId);

    return NextResponse.json({
      success: true,
      payment: paymentStatus
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get payment status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

