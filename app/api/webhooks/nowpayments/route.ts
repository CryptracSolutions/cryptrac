import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getNOWPaymentsClient } from '@/lib/nowpayments';

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
  purchase_id?: string;
  created_at: string;
  updated_at: string;
  outcome_amount?: number;
  outcome_currency?: string;
  actually_paid?: number;
  actually_paid_at_fiat?: number;
}

// Payment status mappings
const PAYMENT_STATUS = {
  WAITING: 'waiting',
  CONFIRMING: 'confirming', 
  CONFIRMED: 'confirmed',
  SENDING: 'sending',
  PARTIALLY_PAID: 'partially_paid',
  FINISHED: 'finished',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  EXPIRED: 'expired'
} as const;

function isPaymentComplete(status: string): boolean {
  return [PAYMENT_STATUS.CONFIRMED, PAYMENT_STATUS.FINISHED].includes(status as any);
}

function isPaymentFailed(status: string): boolean {
  return [PAYMENT_STATUS.FAILED, PAYMENT_STATUS.EXPIRED, PAYMENT_STATUS.REFUNDED].includes(status as any);
}

function isPaymentPartial(status: string): boolean {
  return status === PAYMENT_STATUS.PARTIALLY_PAID;
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-nowpayments-sig');

    console.log('NOWPayments webhook received:', {
      hasSignature: !!signature,
      bodyLength: body.length
    });

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
    
    console.log('NOWPayments IPN processed:', {
      payment_id: ipnData.payment_id,
      status: ipnData.payment_status,
      order_id: ipnData.order_id,
      pay_amount: ipnData.pay_amount,
      price_amount: ipnData.price_amount,
      actually_paid: ipnData.actually_paid
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
    const { error: logError } = await supabase.from('webhook_logs').insert({
      provider: 'nowpayments',
      event_type: 'payment_status_update',
      payment_id: ipnData.payment_id,
      status: ipnData.payment_status,
      raw_data: ipnData,
      processed: false,
      created_at: new Date().toISOString()
    });

    if (logError) {
      console.error('Error logging webhook:', logError);
    }

    // Extract link_id from order_id (format: cryptrac_pl_XXXXX_timestamp)
    const linkIdMatch = ipnData.order_id.match(/cryptrac_(pl_[^_]+)_/);
    const linkId = linkIdMatch ? linkIdMatch[1] : null;

    if (!linkId) {
      console.error('Could not extract link_id from order_id:', ipnData.order_id);
      return NextResponse.json({ error: 'Invalid order_id format' }, { status: 400 });
    }

    // Find the payment link
    const { data: paymentLink, error: linkError } = await supabase
      .from('payment_links')
      .select(`
        *,
        merchant:merchants(
          id,
          business_name,
          user_id
        )
      `)
      .eq('link_id', linkId)
      .single();

    if (linkError || !paymentLink) {
      console.error('Payment link not found for link_id:', linkId, linkError);
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
    }

    // Find existing payment record
    const { data: existingPayment, error: paymentError } = await supabase
      .from('merchant_payments')
      .select('*')
      .eq('nowpayments_invoice_id', ipnData.payment_id)
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') {
      console.error('Error checking existing payment:', paymentError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Calculate fees based on actual amounts
    const baseAmount = ipnData.price_amount;
    const actuallyPaid = ipnData.actually_paid || ipnData.pay_amount;
    const cryptracFeeRate = 0.019; // 1.9%
    const nowPaymentsFeeRate = 0.01; // 1% (estimated)
    
    const cryptracFee = baseAmount * cryptracFeeRate;
    const nowPaymentsFee = baseAmount * nowPaymentsFeeRate;
    const totalFees = cryptracFee + nowPaymentsFee;
    const merchantReceives = Math.max(0, baseAmount - totalFees);

    // Determine payment completion status
    const isComplete = isPaymentComplete(ipnData.payment_status);
    const isFailed = isPaymentFailed(ipnData.payment_status);
    const isPartial = isPaymentPartial(ipnData.payment_status);

    if (!existingPayment) {
      // Create new payment record
      const { data: newPayment, error: insertError } = await supabase
        .from('merchant_payments')
        .insert({
          merchant_id: paymentLink.merchant.id,
          payment_link_id: paymentLink.id,
          nowpayments_invoice_id: ipnData.payment_id,
          order_id: ipnData.order_id,
          amount: baseAmount,
          amount_received: actuallyPaid,
          currency: ipnData.price_currency.toUpperCase(),
          currency_received: ipnData.pay_currency.toUpperCase(),
          status: ipnData.payment_status,
          pay_address: ipnData.pay_address,
          pay_amount: ipnData.pay_amount,
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

      console.log('Created new payment record:', newPayment?.id);
    } else {
      // Update existing payment
      const { error: updateError } = await supabase
        .from('merchant_payments')
        .update({
          status: ipnData.payment_status,
          amount_received: actuallyPaid,
          merchant_receives: merchantReceives,
          payment_data: ipnData,
          updated_at: ipnData.updated_at
        })
        .eq('id', existingPayment.id);

      if (updateError) {
        console.error('Error updating payment record:', updateError);
        return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
      }

      console.log('Updated existing payment record:', existingPayment.id);
    }

    // Handle payment completion
    if (isComplete) {
      console.log('🎉 Payment completed successfully:', {
        payment_id: ipnData.payment_id,
        amount_paid: actuallyPaid,
        merchant_receives: merchantReceives
      });
      
      // Update payment link usage count
      const { error: usageError } = await supabase
        .from('payment_links')
        .update({
          usage_count: (paymentLink.usage_count || 0) + 1,
          last_payment_at: new Date().toISOString()
        })
        .eq('id', paymentLink.id);

      if (usageError) {
        console.error('Error updating usage count:', usageError);
      }

      // TODO: Send confirmation email to merchant
      // TODO: Trigger real-time notification to dashboard
      // TODO: Process fee distribution to merchant wallet
    }

    // Handle partial payments
    if (isPartial) {
      console.log('⚠️ Partial payment received:', {
        payment_id: ipnData.payment_id,
        expected: ipnData.pay_amount,
        received: actuallyPaid,
        shortfall: ipnData.pay_amount - actuallyPaid
      });

      // TODO: Send partial payment notification to merchant
      // TODO: Provide customer with option to complete payment
    }

    // Handle payment failure
    if (isFailed) {
      console.log('❌ Payment failed:', {
        payment_id: ipnData.payment_id,
        status: ipnData.payment_status,
        reason: ipnData.payment_status
      });
      
      // TODO: Send failure notification to merchant
      // TODO: Log failure reason for analytics
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ 
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('payment_id', ipnData.payment_id)
      .eq('provider', 'nowpayments')
      .eq('processed', false);

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      payment_status: ipnData.payment_status,
      payment_id: ipnData.payment_id
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
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
    service: 'nowpayments-webhook-enhanced',
    timestamp: new Date().toISOString(),
    version: '2.0'
  });
}

