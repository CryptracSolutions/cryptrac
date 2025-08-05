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
    console.log('🔍 Checking payment status for payment ID:', id);

    // FIXED: Query transactions table by nowpayments_payment_id instead of payment_links
    const { data: payment, error: paymentError } = await supabase
      .from('transactions')
      .select('*')
      .eq('nowpayments_payment_id', id)
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
      nowpayments_payment_id: payment.nowpayments_payment_id,
      status: payment.status
    });

    // Step 2: Check NOWPayments for status updates
    if (payment.nowpayments_payment_id && payment.status !== 'confirmed') {
      try {
        console.log('🔄 Checking NOWPayments status for payment:', payment.nowpayments_payment_id);
        
        const nowPaymentsResponse = await fetch(
          `https://api.nowpayments.io/v1/payment/${payment.nowpayments_payment_id}`,
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
        payment_id: payment.nowpayments_payment_id,
        payment_status: payment.status,
        pay_address: payment.pay_address,
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency,
        price_amount: payment.amount,
        price_currency: payment.currency,
        order_id: payment.order_id,
        order_description: payment.description || '',
        created_at: payment.created_at,
        updated_at: payment.updated_at,
        outcome_amount: payment.merchant_receives,
        outcome_currency: payment.payout_currency,
        actually_paid: payment.amount_received,
        tx_hash: payment.tx_hash,
        network: payment.pay_currency
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

