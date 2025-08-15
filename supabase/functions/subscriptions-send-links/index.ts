import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  
  if (!url || !key || !sendgridKey || !appOrigin) {
    console.error('missing env');
    return new Response('env', { status: 500 });
  }
  
  const supabase = createClient(url, key);
  const { data: invoices, error } = await supabase
    .from('subscription_invoices')
    .select('id, subscription_id, payment_link_id, amount, currency')
    .eq('status', 'pending')
    .is('sent_at', null);
    
  if (error) {
    console.error('fetch invoices error', error);
    return new Response('error', { status: 500 });
  }
  
  for (const inv of invoices || []) {
    try {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('merchant_id, customer_id, title')
        .eq('id', inv.subscription_id)
        .single();
        
      if (!sub) continue;
      
      const { data: customer } = await supabase
        .from('customers')
        .select('email')
        .eq('id', sub.customer_id)
        .single();
        
      const { data: link } = await supabase
        .from('payment_links')
        .select('link_id')
        .eq('id', inv.payment_link_id)
        .single();
        
      const payUrl = `${appOrigin}/pay/${link?.link_id}`;
      let sentVia = [] as string[];
      
      // Send email notification only
      if (customer?.email) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: customer.email }], subject: `Invoice for ${sub.title} – ${inv.amount} ${inv.currency}` }],
            from: { email: 'no-reply@cryptrac.com' },
            content: [{ type: 'text/html', value: `<p>Please pay your invoice.</p><p><a href="${payUrl}">Pay now</a></p>` }]
          })
        });
        await logEmail(supabase, { merchant_id: sub.merchant_id, type: 'subscription_invoice', to_email: customer.email, subject: `Invoice for ${sub.title} – ${inv.amount} ${inv.currency}` });
        sentVia.push('email');
      }
      
      await supabase
        .from('subscription_invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString(), sent_via: sentVia.join(',') })
        .eq('id', inv.id);
    } catch (err) {
      console.error('send link error', inv.id, err);
    }
  }
  
  return new Response('ok', { status: 200 });
});

