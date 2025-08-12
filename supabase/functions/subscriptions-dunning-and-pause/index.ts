import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DateTime } from 'https://esm.sh/luxon@3.4.4';

async function logEmail(supabase: any, data: any) {
  let { error } = await supabase.from('email_logs').insert({ ...data, status: 'sent' });
  if (error) {
    if (error.message && error.message.includes('column')) {
      const minimal = { email: data.to_email, type: data.type, status: 'sent' };
      ({ error } = await supabase.from('email_logs').insert(minimal));
      if (error) console.error('email log error', error);
    } else {
      console.error('email log error', error);
    }
  }
}

serve(async () => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  const appOrigin = Deno.env.get('APP_ORIGIN');
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER');
  if (!url || !key || !sendgridKey || !appOrigin) {
    console.error('missing env');
    return new Response('env', { status: 500 });
  }
  const supabase = createClient(url, key);
  const cutoff = DateTime.now().minus({ days: 2 }).toISO();
  const { data: invoices, error } = await supabase
    .from('subscription_invoices')
    .select('id, subscription_id, payment_link_id, amount, currency')
    .in('status', ['pending', 'sent'])
    .lt('due_date', cutoff);
  if (error) {
    console.error('fetch invoices', error);
    return new Response('error', { status: 500 });
  }
  for (const inv of invoices || []) {
    try {
      await supabase
        .from('subscription_invoices')
        .update({ status: 'past_due' })
        .eq('id', inv.id);
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('merchant_id, customer_id, title, missed_payments_count, pause_after_missed_payments')
        .eq('id', inv.subscription_id)
        .single();
      if (!sub) continue;
      const newCount = (sub.missed_payments_count || 0) + 1;
      let newStatus: any = {};
      if (sub.pause_after_missed_payments > 0 && newCount >= sub.pause_after_missed_payments) {
        newStatus.status = 'paused';
      }
      await supabase
        .from('subscriptions')
        .update({ missed_payments_count: newCount, ...newStatus })
        .eq('id', inv.subscription_id);
      const { data: customer } = await supabase
        .from('customers')
        .select('email, phone')
        .eq('id', sub.customer_id)
        .single();
      const { data: link } = await supabase
        .from('payment_links')
        .select('link_id')
        .eq('id', inv.payment_link_id)
        .single();
      const payUrl = `${appOrigin}/pay/${link?.link_id}`;
      if (customer?.email) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: customer.email }], subject: `Payment overdue for ${sub.title}` }],
            from: { email: 'no-reply@cryptrac.com' },
            content: [{ type: 'text/html', value: `<p>Your invoice is past due.</p><p><a href="${payUrl}">Pay now</a></p>` }]
          })
        });
        await logEmail(supabase, { merchant_id: sub.merchant_id, type: 'subscription_dunning', to_email: customer.email, subject: `Payment overdue for ${sub.title}` });
      }
      if (customer?.phone && twilioSid && twilioToken && twilioFrom) {
        const body = `${sub.title} invoice overdue. Pay: ${payUrl}`;
        const creds = btoa(`${twilioSid}:${twilioToken}`);
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ From: twilioFrom, To: customer.phone, Body: body })
        });
        await supabase.from('sms_logs').insert({ merchant_id: sub.merchant_id, phone: customer.phone, type: 'subscription_dunning', status: 'sent', payload: { message: body, link_id: inv.payment_link_id } });
      }
    } catch (err) {
      console.error('dunning error', inv.id, err);
    }
  }
  return new Response('ok', { status: 200 });
});
