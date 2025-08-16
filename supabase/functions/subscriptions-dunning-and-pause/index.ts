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
  const fromEmail = Deno.env.get('CRYPTRAC_NOTIFICATIONS_FROM');
  const appOrigin = Deno.env.get('APP_ORIGIN');
  
  if (!url || !key || !sendgridKey || !fromEmail || !appOrigin) {
    console.error('missing env');
    return new Response('env', { status: 500 });
  }
  
  const supabase = createClient(url, key);
  
  // Task 5: Get invoices that should be marked past due based on configurable timing
  // Join with subscriptions to get past_due_after_days for each invoice
  const { data: invoicesWithTiming, error } = await supabase
    .from('subscription_invoices')
    .select(`
      id, 
      subscription_id, 
      payment_link_id, 
      amount, 
      currency, 
      due_date,
      subscriptions!inner(
        merchant_id,
        customer_id,
        title,
        missed_payments_count,
        pause_after_missed_payments,
        past_due_after_days
      )
    `)
    .in('status', ['pending', 'sent']);
    
  if (error) {
    console.error('fetch invoices', error);
    return new Response('error', { status: 500 });
  }
  
  const now = DateTime.now();
  
  for (const inv of invoicesWithTiming || []) {
    try {
      const sub = inv.subscriptions;
      const pastDueAfterDays = sub.past_due_after_days || 2; // Default to 2 days
      
      // Task 5: Check if invoice should be marked past due: now > due_date + past_due_after_days
      const dueDate = DateTime.fromISO(inv.due_date);
      const pastDueThreshold = dueDate.plus({ days: pastDueAfterDays });
      
      if (now <= pastDueThreshold) {
        // Not yet past due
        continue;
      }
      
      console.log(`Marking invoice ${inv.id} as past due (due: ${dueDate.toISO()}, threshold: ${pastDueThreshold.toISO()})`);
      
      // Mark invoice as past due
      await supabase
        .from('subscription_invoices')
        .update({ status: 'past_due' })
        .eq('id', inv.id);
        
      // Task 5: Increment missed payments count
      const newCount = (sub.missed_payments_count || 0) + 1;
      let subscriptionUpdates: any = { missed_payments_count: newCount };
      
      // Task 5: Pause subscription if threshold reached
      if (sub.pause_after_missed_payments > 0 && newCount >= sub.pause_after_missed_payments) {
        subscriptionUpdates.status = 'paused';
        subscriptionUpdates.paused_at = now.toISO();
        console.log(`Pausing subscription ${inv.subscription_id} after ${newCount} missed payments`);
      }
      
      await supabase
        .from('subscriptions')
        .update(subscriptionUpdates)
        .eq('id', inv.subscription_id);
        
      // Get customer email for notification
      const { data: customer } = await supabase
        .from('customers')
        .select('email')
        .eq('id', sub.customer_id)
        .single();
        
      // Get payment link for notification
      const { data: link } = await supabase
        .from('payment_links')
        .select('link_id')
        .eq('id', inv.payment_link_id)
        .single();
        
      const payUrl = `${appOrigin}/pay/${link?.link_id}`;
      
      // Task 10: Enhanced dunning email notification with better copy
      if (customer?.email) {
        const subject = subscriptionUpdates.status === 'paused' 
          ? `Action Required: ${sub.title} subscription paused` 
          : `Payment Reminder: ${sub.title} invoice overdue`;
          
        const content = subscriptionUpdates.status === 'paused'
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #e74c3c;">Subscription Paused</h2>
              <p>Hi there,</p>
              <p>Your subscription for <strong>${sub.title}</strong> has been temporarily paused due to missed payments.</p>
              <p>Don't worry - you can reactivate your subscription at any time by completing your payment.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${payUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reactivate Subscription</a>
              </div>
              <p>If you have any questions, please don't hesitate to reach out to us.</p>
              <p>Best regards,<br>The Cryptrac Team</p>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f39c12;">Payment Reminder</h2>
              <p>Hi there,</p>
              <p>This is a friendly reminder that your invoice for <strong>${sub.title}</strong> is now overdue.</p>
              <p>To avoid any interruption to your service, please complete your payment as soon as possible.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${payUrl}" style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Pay Now</a>
              </div>
              <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
              <p>Best regards,<br>The Cryptrac Team</p>
            </div>
          `;
        
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: customer.email }], subject }],
            from: { email: fromEmail },
            content: [{ type: 'text/html', value: content }]
          })
        });
        
        await logEmail(supabase, { 
          merchant_id: sub.merchant_id, 
          type: subscriptionUpdates.status === 'paused' ? 'subscription_paused' : 'subscription_dunning', 
          to_email: customer.email, 
          subject 
        });
      }
      
    } catch (err) {
      console.error('dunning error', inv.id, err);
    }
  }
  
  return new Response('ok', { status: 200 });
});

