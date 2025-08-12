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
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('id, merchant_id, title, amount, currency, interval, interval_count, billing_anchor, next_billing_at, accepted_cryptos, charge_customer_fee, auto_convert_enabled, preferred_payout_currency, tax_enabled, tax_rates')
    .eq('status', 'active')
    .lte('next_billing_at', new Date().toISOString());
  if (error) {
    console.error('fetch subs error', error);
    return new Response('error', { status: 500 });
  }
  for (const sub of subs || []) {
    try {
      const { data: merchantInfo } = await supabase
        .from('merchants')
        .select('timezone')
        .eq('id', sub.merchant_id)
        .single();
      const zone = merchantInfo?.timezone || 'UTC';
      const today = DateTime.now().setZone(zone).toISODate();
      const { data: override } = await supabase
        .from('subscription_amount_overrides')
        .select('amount')
        .eq('subscription_id', sub.id)
        .lte('effective_from', today)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();
      const amount = override?.amount ?? sub.amount;
      const title = `${sub.title} — Invoice ${today}`;
      const res = await fetch(`${appOrigin}/api/internal/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Key': internalKey },
        body: JSON.stringify({
          merchant_id: sub.merchant_id,
          title,
          amount,
          currency: sub.currency,
          accepted_cryptos: sub.accepted_cryptos,
          source: 'subscription',
          subscription_id: sub.id,
          charge_customer_fee: sub.charge_customer_fee,
          auto_convert_enabled: sub.auto_convert_enabled,
          preferred_payout_currency: sub.preferred_payout_currency,
          tax_enabled: sub.tax_enabled,
          tax_rates: sub.tax_rates
        })
      });
      if (!res.ok) throw new Error('create payment link failed');
      const { payment_link } = await res.json();
      await supabase.from('subscription_invoices').insert({
        subscription_id: sub.id,
        merchant_id: sub.merchant_id,
        payment_link_id: payment_link.id,
        due_date: new Date().toISOString(),
        amount,
        currency: sub.currency,
        status: 'pending'
      });
      let next = DateTime.fromISO(sub.billing_anchor, { zone });
      while (next <= DateTime.now().setZone(zone)) {
        next = addInterval(next, sub.interval, sub.interval_count);
      }
      await supabase
        .from('subscriptions')
        .update({ next_billing_at: next.toUTC().toISO() })
        .eq('id', sub.id);
    } catch (err) {
      console.error('error processing subscription', sub.id, err);
    }
  }
  return new Response('ok', { status: 200 });
});
