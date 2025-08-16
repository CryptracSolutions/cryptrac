import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DateTime } from 'https://esm.sh/luxon@3.4.4';

function addInterval(dt: DateTime, interval: string, count: number) {
  switch (interval) {
    case 'day':
      return dt.plus({ days: count });
    case 'week':
      return dt.plus({ weeks: count });
    case 'month': {
      const added = dt.plus({ months: count });
      const end = added.endOf('month');
      return added.day < dt.day ? end : added;
    }
    case 'year':
      return dt.plus({ years: count });
    default:
      return dt.plus({ months: count });
  }
}

serve(async () => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const internalKey = Deno.env.get('INTERNAL_API_KEY');
  const appOrigin = Deno.env.get('APP_ORIGIN');
  if (!url || !key || !internalKey || !appOrigin) {
    console.error('Missing env vars');
    return new Response('missing env', { status: 500 });
  }
  const supabase = createClient(url, key);
  
  // Task 3: Get subscriptions with timing configuration fields
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, merchant_id, customer_id, title, amount, currency, interval, interval_count, billing_anchor, next_billing_at, accepted_cryptos, charge_customer_fee, auto_convert_enabled, preferred_payout_currency, tax_enabled, tax_rates, invoice_due_days, generate_days_in_advance, past_due_after_days, max_cycles')
    .eq('status', 'active');
    
  if (error) {
    console.error('fetch subs error', error);
    return new Response('error', { status: 500 });
  }
  
  const now = DateTime.now();
  
  for (const sub of subs || []) {
    try {
      const { data: merchantInfo } = await supabase
        .from('merchants')
        .select('timezone')
        .eq('id', sub.merchant_id)
        .single();
      const zone = merchantInfo?.timezone || 'UTC';
      
      // Get customer information for email notifications
      const { data: customer } = await supabase
        .from('customers')
        .select('email')
        .eq('id', sub.customer_id)
        .single();
      
      // Task 3: Eligibility condition - subscription is due if now >= next_billing_at - generate_days_in_advance
      const nextBilling = DateTime.fromISO(sub.next_billing_at, { zone });
      const generateDaysInAdvance = sub.generate_days_in_advance || 0;
      const eligibleAt = nextBilling.minus({ days: generateDaysInAdvance });
      
      if (now < eligibleAt) {
        // Not yet eligible for generation
        continue;
      }
      
      // Task 2: cycle_start_at is the occurrence being billed (computed in merchant's TZ, stored in UTC)
      const cycleStart = nextBilling.toUTC();
      const cycleStartISO = cycleStart.toISO();
      
      // Max cycles completion logic - check if subscription has reached its limit
      if (sub.max_cycles && sub.max_cycles > 0) {
        // Count existing invoices to determine current cycle
        const { count: currentCycle } = await supabase
          .from('subscription_invoices')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_id', sub.id);
        
        if (currentCycle && currentCycle >= sub.max_cycles) {
          // Complete the subscription
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
              next_billing_at: null
            })
            .eq('id', sub.id);
          
          console.log(`✅ Subscription ${sub.id} completed after ${currentCycle} cycles`);
          
          // Send completion email
          if (customer?.email) {
            try {
              const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://cryptrac.com';
              await fetch(`${appOrigin}/api/supabase/functions/subscriptions-send-notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'completion',
                  subscription_id: sub.id,
                  customer_email: customer.email
                })
              });
            } catch (error) {
              console.error('Failed to send completion email:', error);
            }
          }
          
          continue; // Skip to next subscription
        }
        
        console.log(`Subscription ${sub.id} cycle ${currentCycle}/${sub.max_cycles}`);
      }
      
      // Check if invoice already exists for this cycle (idempotency)
      const { data: existingInvoice } = await supabase
        .from('subscription_invoices')
        .select('id, payment_link_id')
        .eq('subscription_id', sub.id)
        .eq('cycle_start_at', cycleStartISO)
        .maybeSingle();
        
      if (existingInvoice) {
        console.log(`Invoice already exists for subscription ${sub.id}, cycle ${cycleStartISO}`);
        
        // Still advance next_billing_at to prevent re-processing
        let next = DateTime.fromISO(sub.billing_anchor, { zone });
        while (next <= now.setZone(zone)) {
          next = addInterval(next, sub.interval, sub.interval_count);
        }
        await supabase
          .from('subscriptions')
          .update({ next_billing_at: next.toUTC().toISO() })
          .eq('id', sub.id);
          
        continue;
      }
      
      // Get amount override for this cycle
      const today = cycleStart.setZone(zone).toISODate();
      const { data: override } = await supabase
        .from('subscription_amount_overrides')
        .select('amount')
        .eq('subscription_id', sub.id)
        .lte('effective_from', today)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();
      const amount = override?.amount ?? sub.amount;
      
      // Task 3: Calculate due date and expiration
      const invoiceDueDays = sub.invoice_due_days || 0;
      const pastDueAfterDays = sub.past_due_after_days || 2;
      
      // Due date: cycle_start_at + invoice_due_days (0 = due on cycle date)
      const dueDate = cycleStart.plus({ days: invoiceDueDays });
      
      // Expires at: cycle_start_at + (past_due_after_days + 14) days
      const expiresAt = cycleStart.plus({ days: pastDueAfterDays + 14 });
      
      // Create payment link
      const title = `${sub.title} — Invoice ${cycleStart.setZone(zone).toISODate()}`;
      const res = await fetch(`${appOrigin}/api/internal/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Key': internalKey },
        body: JSON.stringify({
          merchant_id: sub.merchant_id,
          title,
          amount,
          currency: sub.currency,
          accepted_cryptos: sub.accepted_cryptos,
          charge_customer_fee: sub.charge_customer_fee,
          auto_convert_enabled: sub.auto_convert_enabled,
          preferred_payout_currency: sub.preferred_payout_currency,
          tax_enabled: sub.tax_enabled,
          tax_rates: sub.tax_rates,
          source: 'subscription',
          subscription_id: sub.id,
          max_uses: 1, // Task 8: Single-use links (perfect parity with manual generation)
          expires_at: expiresAt.toISO()
        })
      });
      
      if (!res.ok) throw new Error('create payment link failed');
      const { payment_link } = await res.json();
      
      // Task 7: Generate invoice number using atomic counter
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc('get_next_invoice_number', { merchant_uuid: sub.merchant_id });
      
      if (numberError) {
        console.error('Failed to generate invoice number:', numberError);
        throw new Error('Failed to generate invoice number');
      }
      
      // Task 2: Insert invoice with cycle_start_at using UPSERT to handle race conditions
      const { error: insertError } = await supabase.from('subscription_invoices').upsert({
        subscription_id: sub.id,
        merchant_id: sub.merchant_id,
        payment_link_id: payment_link.id,
        cycle_start_at: cycleStartISO,
        due_date: dueDate.toISO(), // Task 3: Configurable due date
        amount,
        currency: sub.currency,
        invoice_number: invoiceNumber, // Task 7: Add invoice number
        status: 'pending'
      }, {
        onConflict: 'subscription_id,cycle_start_at',
        ignoreDuplicates: true
      });
      
      if (insertError) {
        console.error('Failed to insert invoice:', insertError);
        continue;
      }
      
      // Send invoice notification email
      if (customer?.email) {
        try {
          const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://cryptrac.com';
          const paymentUrl = `${appOrigin}/pay/${payment_link.link_id}`;
          
          // Count existing invoices to determine cycle number
          const { count: invoiceCount } = await supabase
            .from('subscription_invoices')
            .select('*', { count: 'exact', head: true })
            .eq('subscription_id', sub.id);
          
          await fetch(`${appOrigin}/api/supabase/functions/subscriptions-send-notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'invoice',
              subscription_id: sub.id,
              customer_email: customer.email,
              payment_url: paymentUrl,
              invoice_data: {
                amount,
                cycle_count: invoiceCount || 1,
                invoice_number: invoiceNumber
              }
            })
          });
        } catch (error) {
          console.error('Failed to send invoice notification email:', error);
          // Don't fail invoice generation if email fails
        }
      }
      
      // Task 3: Advance next_billing_at by the interval (preserves "generate early for the next cycle")
      let next = DateTime.fromISO(sub.billing_anchor, { zone });
      while (next <= now.setZone(zone)) {
        next = addInterval(next, sub.interval, sub.interval_count);
      }
      await supabase
        .from('subscriptions')
        .update({ next_billing_at: next.toUTC().toISO() })
        .eq('id', sub.id);
        
        console.log(`Generated invoice for subscription ${sub.id}, cycle ${cycleStartISO}, due ${dueDate.toISO()}, number ${invoiceNumber}`);
      
    } catch (err) {
      console.error('error processing subscription', sub.id, err);
    }
  }
  
  return new Response('ok', { status: 200 });
});

