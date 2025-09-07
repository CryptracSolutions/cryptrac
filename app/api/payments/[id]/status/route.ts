import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Function to trigger real-time notifications for payment status updates
async function broadcastPaymentUpdate(
  supabase: any,
  paymentId: string,
  updateData: Record<string, unknown>
) {
  try {
    console.log(`📡 Broadcasting real-time update for payment: ${paymentId}`)

    // Use HTTP broadcast API; no server-side subscribe needed
    const { error: channelError } = await supabase
      .channel(`payment-${paymentId}`)
      .send({
        type: 'broadcast',
        event: 'payment_status_update',
        payload: {
          payment_id: paymentId,
          status: updateData.status,
          tx_hash: updateData.tx_hash,
          payin_hash: updateData.payin_hash,
          payout_hash: updateData.payout_hash,
          amount_received: updateData.amount_received,
          currency_received: updateData.currency_received,
          merchant_receives: updateData.merchant_receives,
          payout_currency: updateData.payout_currency,
          timestamp: new Date().toISOString()
        }
      })

    if (channelError) {
      console.warn('⚠️ Error broadcasting payment update:', channelError)
    } else {
      console.log('✅ Real-time broadcast sent successfully')
    }

  } catch (error) {
    console.error('❌ Error in broadcastPaymentUpdate:', error)
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
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
            // Treat sending as confirmed (post-confirm payout phase)
            mappedStatus = 'confirmed';
          } else if (nowPaymentsData.payment_status === 'partially_paid') {
            mappedStatus = 'confirming';
          }

          // Check if status has changed
          if (mappedStatus !== payment.status) {
            console.log(`📈 Status changed: ${payment.status} → ${mappedStatus}`);

            // Prepare update data
            // Prevent regression after confirmation
            let effectiveStatus = mappedStatus as string
            const rank: Record<string, number> = { waiting: 0, pending: 0, confirming: 1, partially_paid: 1, confirmed: 2, sending: 2, finished: 2 }
            const currentRank = rank[payment.status] ?? -1
            const newRank = rank[mappedStatus] ?? -1
            if (newRank < currentRank) {
              console.warn(`⚠️ Ignoring status regression ${payment.status} → ${mappedStatus}; keeping ${payment.status}`)
              effectiveStatus = payment.status
            }

            const updateData: Record<string, unknown> = {
              status: effectiveStatus,
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
              
              // Broadcast real-time update to connected clients
              await broadcastPaymentUpdate(supabase, id, updateData);
              if (mappedStatus === 'confirmed') {
                try {
                  const { data: link } = await supabase
                    .from('payment_links')
                    .select('id, subscription_id')
                    .eq('id', payment.payment_link_id)
                    .single();
                  if (link && link.subscription_id) {
                    const { data: updatedInvoice } = await supabase
                      .from('subscription_invoices')
                      .update({ status: 'paid', paid_at: new Date().toISOString() })
                      .eq('payment_link_id', link.id)
                      .neq('status', 'paid')
                      .select('id');
                    if (updatedInvoice && updatedInvoice.length > 0) {
                      const { data: sub } = await supabase
                        .from('subscriptions')
                        .select('total_cycles')
                        .eq('id', link.subscription_id)
                        .single();
                      await supabase
                        .from('subscriptions')
                        .update({ total_cycles: (sub?.total_cycles || 0) + 1 })
                        .eq('id', link.subscription_id);
                    }
                  }
                } catch (err) {
                  console.warn('⚠️ Error updating subscription invoice:', err);
                }
              }
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
