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
  purchase_id: string;
  created_at: string;
  updated_at: string;
  outcome_amount?: number;
  outcome_currency?: string;
  actually_paid?: number;
  actually_paid_at_fiat?: number;
}

function isPaymentComplete(status: string): boolean {
  return status === 'confirmed' || status === 'finished';
}

function isPaymentFailed(status: string): boolean {
  return status === 'failed' || status === 'expired' || status === 'refunded';
}

function isPaymentPartial(status: string): boolean {
  return status === 'partially_paid';
}

function calculatePaymentLinkStatus(paymentLink: any, newUsageCount: number): string {
  // If payment link is manually completed, keep it completed
  if (paymentLink.status === 'completed') {
    return 'completed';
  }

  // If payment link is manually paused, keep it paused
  if (paymentLink.status === 'paused') {
    return 'paused';
  }

  // Check if expired
  if (paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date()) {
    return 'expired';
  }

  // Check if max uses reached (including single-use links with max_uses=1)
  if (paymentLink.max_uses && newUsageCount >= paymentLink.max_uses) {
    return 'completed';
  }

  // Otherwise, keep it active
  return 'active';
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-nowpayments-sig');

    console.log('🔔 NOWPayments webhook received:', {
      hasSignature: !!signature,
      bodyLength: body.length,
      timestamp: new Date().toISOString()
    });

    if (!signature) {
      console.error('❌ Missing NOWPayments signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify the webhook signature
    const nowPayments = getNOWPaymentsClient();
    const isValidSignature = nowPayments.verifyIpnSignature(body, signature);

    if (!isValidSignature) {
      console.error('❌ Invalid NOWPayments signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the IPN data
    const ipnData: NOWPaymentsIPN = JSON.parse(body);
    
    console.log('📦 NOWPayments IPN processed:', {
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
    const logError = await supabase.from('webhook_logs').insert({
      provider: 'nowpayments',
      event_type: 'payment_status_update',
      payment_id: ipnData.payment_id,
      status: ipnData.payment_status,
      raw_data: ipnData,
      processed: false,
      created_at: new Date().toISOString()
    });

    if (logError.error) {
      console.error('⚠️ Error logging webhook:', logError.error);
    }

    // Extract link_id from order_id
    let linkId = ipnData.order_id;
    
    // If order_id follows format "cryptrac_pl_XXXXX_timestamp", extract the link_id
    if (ipnData.order_id.startsWith('cryptrac_')) {
      const parts = ipnData.order_id.split('_');
      if (parts.length >= 3 && parts[1] === 'pl') {
        linkId = `${parts[1]}_${parts[2]}`;
      }
    }

    console.log('🔍 Looking for payment link:', linkId);

    // Find the payment link
    const { data: paymentLink, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('link_id', linkId)
      .single();

    if (linkError || !paymentLink) {
      console.error('❌ Payment link not found:', linkId, linkError);
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 });
    }

    console.log('✅ Found payment link:', {
      id: paymentLink.id,
      title: paymentLink.title,
      current_status: paymentLink.status,
      usage_count: paymentLink.usage_count,
      max_uses: paymentLink.max_uses,
      is_single_use: paymentLink.max_uses === 1
    });

    // Check if payment already exists
    const { data: existingPayment, error: paymentError } = await supabase
      .from('merchant_payments')
      .select('*')
      .eq('nowpayments_invoice_id', ipnData.payment_id)
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') {
      console.error('❌ Error checking existing payment:', paymentError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Calculate fees
    const baseAmount = ipnData.actually_paid || ipnData.price_amount;
    const cryptracFeeRate = 0.019; // 1.9%
    const nowPaymentsFeeRate = 0.01; // 1% (estimated)
    const cryptracFee = baseAmount * cryptracFeeRate;
    const nowPaymentsFee = baseAmount * nowPaymentsFeeRate;
    const totalFees = cryptracFee + nowPaymentsFee;
    const merchantReceives = baseAmount - totalFees;

    if (!existingPayment) {
      // Create new payment record
      const { data: newPayment, error: insertError } = await supabase
        .from('merchant_payments')
        .insert({
          merchant_id: paymentLink.merchant_id,
          payment_link_id: paymentLink.id,
          nowpayments_invoice_id: ipnData.payment_id,
          amount: ipnData.price_amount,
          currency: ipnData.price_currency,
          pay_amount: ipnData.actually_paid || ipnData.pay_amount,
          pay_currency: ipnData.pay_currency,
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
        console.error('❌ Error creating payment record:', insertError);
        return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
      }

      console.log('✅ Payment record created:', newPayment?.id);
    } else {
      // Update existing payment
      const { error: updateError } = await supabase
        .from('merchant_payments')
        .update({
          status: ipnData.payment_status,
          pay_amount: ipnData.actually_paid || ipnData.pay_amount,
          merchant_receives: merchantReceives,
          payment_data: ipnData,
          updated_at: ipnData.updated_at
        })
        .eq('id', existingPayment.id);

      if (updateError) {
        console.error('❌ Error updating payment record:', updateError);
        return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
      }

      console.log('✅ Payment record updated:', existingPayment.id);
    }

    // Handle payment completion
    if (isPaymentComplete(ipnData.payment_status)) {
      console.log('🎉 Payment completed:', ipnData.payment_id);
      
      // Calculate new usage count
      const newUsageCount = paymentLink.usage_count + 1;
      
      // Calculate new payment link status
      const newStatus = calculatePaymentLinkStatus(paymentLink, newUsageCount);
      
      console.log('📊 Updating payment link:', {
        old_usage: paymentLink.usage_count,
        new_usage: newUsageCount,
        old_status: paymentLink.status,
        new_status: newStatus,
        max_uses: paymentLink.max_uses,
        expires_at: paymentLink.expires_at,
        is_single_use: paymentLink.max_uses === 1,
        will_complete: newStatus === 'completed'
      });

      // Update payment link with new usage count and status
      const { error: linkUpdateError } = await supabase
        .from('payment_links')
        .update({
          usage_count: newUsageCount,
          last_payment_at: new Date().toISOString(),
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentLink.id);

      if (linkUpdateError) {
        console.error('❌ Error updating payment link:', linkUpdateError);
      } else {
        console.log('✅ Payment link updated successfully');
        
        // Log status change if it occurred
        if (newStatus !== paymentLink.status) {
          console.log(`🔄 Payment link status changed: ${paymentLink.status} → ${newStatus}`);
          
          // Special logging for single-use links
          if (paymentLink.max_uses === 1 && newStatus === 'completed') {
            console.log('🎯 Single-use payment link completed after first payment');
          }
        }
      }

      // TODO: Send confirmation email to merchant
      // TODO: Trigger real-time notification to dashboard
      // TODO: Process fee distribution
    }

    // Handle partial payments
    if (isPaymentPartial(ipnData.payment_status)) {
      console.log('⚠️ Partial payment detected:', ipnData.payment_id);
      const shortfall = ipnData.pay_amount - (ipnData.actually_paid || 0);
      console.log('💰 Payment shortfall:', shortfall, ipnData.pay_currency);
      
      // TODO: Send partial payment notification to merchant
      // TODO: Update customer payment page with shortfall amount
    }

    // Handle payment failure
    if (isPaymentFailed(ipnData.payment_status)) {
      console.log('❌ Payment failed:', ipnData.payment_id, 'Status:', ipnData.payment_status);
      
      // TODO: Send failure notification to merchant
      // TODO: Log failure reason
    }

    // Mark webhook as processed
    await supabase
      .from('webhook_logs')
      .update({ processed: true })
      .eq('payment_id', ipnData.payment_id)
      .eq('provider', 'nowpayments');

    console.log('✅ Webhook processing completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      payment_status: ipnData.payment_status,
      payment_id: ipnData.payment_id
    });

  } catch (error) {
    console.error('💥 Webhook processing error:', error);
    
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
        raw_data: { error: error instanceof Error ? error.stack : String(error) },
        processed: false,
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('💥 Failed to log webhook error:', logError);
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

