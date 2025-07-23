import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getNOWPaymentsClient, PaymentStatus, isPaymentComplete, isPaymentFailed } from '@/lib/nowpayments';

interface NOWPaymentsIPN {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount?: number;
  outcome_currency?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-nowpayments-sig');

    if (!signature) {
      console.error('Missing NOWPayments signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify the webhook signature
    const nowPayments = getNOWPaymentsClient();
    const isValidSignature = nowPayments.verifyIpnSignature(body, signature);

    if (!isValidSignature) {
      console.error('Invalid NOWPayments signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the IPN data
    const ipnData: NOWPaymentsIPN = JSON.parse(body);
    
    console.log('NOWPayments IPN received:', {
      payment_id: ipnData.payment_id,
      status: ipnData.payment_status,
      order_id: ipnData.order_id
    });

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

    // Log the webhook event
    await supabase.from('webhook_logs').insert({
      provider: 'nowpayments',
      event_type: 'payment_status_update',
      payment_id: ipnData.payment_id,
      status: ipnData.payment_status,
      raw_data: ipnData,
      processed: false,
      created_at: new Date().toISOString()
    });

    // Find the payment link by order_id
    const { data: paymentLink, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('link_id', ipnData.order_id)
      .single();

    if (linkError || !paymentLink) {
      console.error('Payment link not found for order_id:', ipnData.order_id);
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
    }

    // Check if payment already exists
    let { data: existingPayment, error: paymentError } = await supabase
      .from('merchant_payments')
      .select('*')
      .eq('nowpayments_payment_id', ipnData.payment_id)
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') {
      console.error('Error checking existing payment:', paymentError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Calculate fees
    const cryptracFeeRate = 0.019; // 1.9%
    const nowPaymentsFeeRate = 0.01; // 1% (estimated)
    const cryptracFee = ipnData.price_amount * cryptracFeeRate;
    const nowPaymentsFee = ipnData.price_amount * nowPaymentsFeeRate;
    const totalFees = cryptracFee + nowPaymentsFee;
    const merchantReceives = ipnData.price_amount - totalFees;

    if (!existingPayment) {
      // Create new payment record
      const { data: newPayment, error: insertError } = await supabase
        .from('merchant_payments')
        .insert({
          merchant_id: paymentLink.merchant_id,
          payment_link_id: paymentLink.id,
          nowpayments_payment_id: ipnData.payment_id,
          amount_requested: ipnData.price_amount,
          amount_received: ipnData.pay_amount,
          currency_requested: ipnData.price_currency,
          currency_received: ipnData.pay_currency,
          status: ipnData.payment_status,
          pay_address: ipnData.pay_address,
          cryptrac_fee: cryptracFee,
          gateway_fee: nowPaymentsFee,
          merchant_receives: merchantReceives,
          payment_data: ipnData,
          created_at: ipnData.created_at,
          updated_at: ipnData.updated_at
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating payment record:', insertError);
        return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
      }

      existingPayment = newPayment;
    } else {
      // Update existing payment
      const { error: updateError } = await supabase
        .from('merchant_payments')
        .update({
          status: ipnData.payment_status,
          amount_received: ipnData.pay_amount,
          merchant_receives: merchantReceives,
          payment_data: ipnData,
          updated_at: ipnData.updated_at
        })
        .eq('id', existingPayment.id);

      if (updateError) {
        console.error('Error updating payment record:', updateError);
        return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
      }
    }

    // Handle payment completion
    if (isPaymentComplete(ipnData.payment_status)) {
      console.log('Payment completed:', ipnData.payment_id);
      
      // Update payment link usage count
      await supabase
        .from('payment_links')
        .update({
          usage_count: paymentLink.usage_count + 1,
          last_payment_at: new Date().toISOString()
        })
        .eq('id', paymentLink.id);

      // TODO: Send confirmation email to merchant
      // TODO: Trigger real-time notification to dashboard
      // TODO: Process fee distribution
    }

    // Handle payment failure
    if (isPaymentFailed(ipnData.payment_status)) {
      console.log('Payment failed:', ipnData.payment_id);
      
      // TODO: Send failure notification to merchant
      // TODO: Log failure reason
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ processed: true })
      .eq('payment_id', ipnData.payment_id)
      .eq('provider', 'nowpayments');

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log the error
    try {
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

      await supabase.from('webhook_logs').insert({
        provider: 'nowpayments',
        event_type: 'webhook_error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        raw_data: { error: error instanceof Error ? error.stack : error },
        processed: false,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'nowpayments-webhook',
    timestamp: new Date().toISOString()
  });
}

