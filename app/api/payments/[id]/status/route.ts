import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Checking payment status for link ID:', id);

    // Step 1: Get payment link ID from link_id
    const { data: paymentLinkData, error: linkError } = await supabase
      .from('payment_links')
      .select('id')
      .eq('link_id', id)
      .single();

    if (linkError) {
      console.error('❌ Payment link not found:', linkError);
      return NextResponse.json(
        { success: false, error: 'Payment link not found' },
        { status: 404 }
      );
    }

    console.log('✅ Payment link found:', paymentLinkData.id);

    // Step 2: Get most recent payment using payment_link_id and CORRECT column name
    const { data: payment, error: paymentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('payment_link_id', paymentLinkData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (paymentError) {
      console.error('❌ Payment not found:', paymentError);
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    console.log('✅ Payment found:', {
      id: payment.id,
      nowpayments_invoice_id: payment.nowpayments_invoice_id, // CORRECT column name
      status: payment.status
    });

    // Step 3: Check NOWPayments for status updates using CORRECT column name
    if (payment.nowpayments_invoice_id && payment.status !== 'confirmed') {
      try {
        console.log('🔄 Checking NOWPayments status for payment:', payment.nowpayments_invoice_id);
        
        const nowPaymentsResponse = await fetch(
          `https://api.nowpayments.io/v1/payment/${payment.nowpayments_invoice_id}`,
          {
            headers: {
              'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
            },
          }
        );

        if (nowPaymentsResponse.ok) {
          const nowPaymentsData = await nowPaymentsResponse.json();
          console.log('📊 NOWPayments status response:', {
            payment_id: nowPaymentsData.payment_id,
            payment_status: nowPaymentsData.payment_status,
            outcome_amount: nowPaymentsData.outcome_amount,
            outcome_currency: nowPaymentsData.outcome_currency
          });

          // Map NOWPayments status to our status
          let mappedStatus = nowPaymentsData.payment_status;
          if (nowPaymentsData.payment_status === 'sending') {
            mappedStatus = 'confirming';
          }

          // Check if status has changed
          if (mappedStatus !== payment.status) {
            console.log(`📈 Status changed: ${payment.status} → ${mappedStatus}`);

            // Prepare update data
            const updateData: any = {
              status: mappedStatus,
              updated_at: new Date().toISOString()
            };

            // Capture transaction hashes if available
            let primaryHash = null;
            
            // Extract hashes from NOWPayments response
            const payinHash = nowPaymentsData.payin_hash || nowPaymentsData.hash;
            const payoutHash = nowPaymentsData.payout_hash || nowPaymentsData.outcome?.hash;
            
            if (payinHash) {
              console.log('✅ Payin hash captured:', payinHash);
              updateData.payin_hash = payinHash;
            }
            
            if (payoutHash) {
              console.log('✅ Payout hash captured:', payoutHash);
              updateData.payout_hash = payoutHash;
            }

            // Smart primary hash selection
            if (mappedStatus === 'confirmed' && payoutHash) {
              primaryHash = payoutHash;
              console.log('✅ Using payout_hash as primary tx_hash for confirmed payment');
            } else if (payinHash) {
              primaryHash = payinHash;
              console.log('✅ Using payin_hash as primary tx_hash');
            }

            if (primaryHash) {
              updateData.tx_hash = primaryHash;
            }

            // Update additional payment information
            if (nowPaymentsData.outcome_amount) {
              updateData.merchant_receives = nowPaymentsData.outcome_amount;
            }
            
            if (nowPaymentsData.outcome_currency) {
              updateData.payout_currency = nowPaymentsData.outcome_currency.toUpperCase();
            }

            if (nowPaymentsData.actually_paid) {
              updateData.amount_received = nowPaymentsData.actually_paid;
            }

            // Update payment in database
            const { error: updateError } = await supabase
              .from('transactions')
              .update(updateData)
              .eq('id', payment.id);

            if (updateError) {
              console.error('❌ Error updating payment:', updateError);
            } else {
              console.log('✅ Payment updated successfully');
              // Update the payment object with new data
              Object.assign(payment, updateData);
            }
          }
        } else {
          console.error('❌ NOWPayments API error:', nowPaymentsResponse.status);
        }
      } catch (nowPaymentsError) {
        console.error('❌ Error checking NOWPayments:', nowPaymentsError);
        // Continue with existing payment data
      }
    }

    // Return current payment status
    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        nowpayments_payment_id: payment.nowpayments_invoice_id, // For frontend compatibility
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency,
        pay_address: payment.pay_address,
        payout_amount: payment.merchant_receives,
        payout_currency: payment.payout_currency,
        gateway_fee: payment.gateway_fee,
        amount_received: payment.amount_received,
        currency_received: payment.currency_received,
        merchant_receives: payment.merchant_receives,
        tx_hash: payment.tx_hash,
        payin_hash: payment.payin_hash,
        payout_hash: payment.payout_hash,
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        order_id: payment.order_id,
        // Tax information
        base_amount: payment.base_amount,
        tax_enabled: payment.tax_enabled,
        tax_amount: payment.tax_amount,
        subtotal_with_tax: payment.subtotal_with_tax,
        tax_rates: payment.tax_rates
      }
    });

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check payment status'
      },
      { status: 500 }
    );
  }
}

