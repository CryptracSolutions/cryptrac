import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DateTime } from 'https://esm.sh/luxon@3';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Professional email template generator for invoice notifications
function generateInvoiceEmailTemplate(data: {
  subscriptionTitle: string;
  merchantName: string;
  customerName?: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  cycleCount?: number;
  maxCycles?: number;
}): EmailTemplate {
  const { subscriptionTitle, merchantName, customerName, amount, currency, paymentUrl, cycleCount, maxCycles } = data;
  
  const customerGreeting = customerName ? `Hi ${customerName}` : 'Hi there';
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const subject = `New Invoice: ${subscriptionTitle}`;
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Invoice</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
        .invoice-icon { color: #007bff; font-size: 48px; margin-bottom: 10px; }
        .details { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; color: #007bff; }
        .pay-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="invoice-icon">📄</div>
            <h1>New Invoice Ready</h1>
            <div style="color: #6c757d; font-size: 16px;">From ${merchantName}</div>
        </div>
        
        <p>${customerGreeting},</p>
        <p>Your new invoice for <strong>${subscriptionTitle}</strong> is ready for payment.</p>
        
        <div class="details">
            <div class="detail-row">
                <span>Subscription:</span>
                <span>${subscriptionTitle}</span>
            </div>
            ${cycleCount && maxCycles ? `
            <div class="detail-row">
                <span>Billing Cycle:</span>
                <span>${cycleCount} of ${maxCycles}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span>Amount Due:</span>
                <span>${formattedAmount}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${paymentUrl}" class="pay-button">Pay Invoice</a>
        </div>
        
        <div class="footer">
            <p>Thank you for your continued subscription!</p>
            <p>If you have any questions about this invoice, please contact ${merchantName}.</p>
        </div>
    </div>
</body>
</html>`;

  const text = `
New Invoice Ready

${customerGreeting},

Your new invoice for ${subscriptionTitle} is ready for payment.

Invoice Details:
• Subscription: ${subscriptionTitle}
${cycleCount && maxCycles ? `• Billing Cycle: ${cycleCount} of ${maxCycles}\n` : ''}• Amount Due: ${formattedAmount}

Pay your invoice: ${paymentUrl}

Thank you for your continued subscription!
If you have any questions about this invoice, please contact ${merchantName}.
`;

  return { subject, html, text };
}

// SendGrid email sending function with logging
async function sendInvoiceEmail(
  supabase: any,
  sendgridKey: string,
  fromEmail: string,
  toEmail: string,
  template: EmailTemplate
): Promise<boolean> {
  try {
    const emailPayload = {
      personalizations: [{ 
        to: [{ email: toEmail }], 
        subject: template.subject 
      }],
      from: { email: fromEmail },
      content: [
        { type: 'text/plain', value: template.text },
        { type: 'text/html', value: template.html }
      ],
      categories: ['subscription', 'subscription_invoice'],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true }
      }
    };

    console.log('📤 SendGrid payload prepared for:', toEmail);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    console.log('📬 SendGrid response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    const success = response.ok;

    if (!success) {
      const errorBody = await response.text();
      console.error('📧 SendGrid error details:', errorBody);
    }

    // Log email to database
    console.log('📝 Logging email to database:', {
      email: toEmail,
      type: 'subscription_invoice',
      status: success ? 'sent' : 'failed'
    });

    const { data: logResult, error: logError } = await supabase.from('email_logs').insert({
      email: toEmail,
      type: 'subscription_invoice',
      status: success ? 'sent' : 'failed'
    });

    if (logError) {
      console.error('❌ Failed to log email to database:', logError);
    } else {
      console.log('✅ Email logged to database successfully:', logResult);
    }

    return success;
  } catch (error) {
    console.error('📧 SendGrid request failed:', error);
    
    // Log failed email to database
    console.log('📝 Logging failed email to database');
    
    const { data: logResult, error: logError } = await supabase.from('email_logs').insert({
      email: toEmail,
      type: 'subscription_invoice',
      status: 'failed'
    });

    if (logError) {
      console.error('❌ Failed to log failed email to database:', logError);
    } else {
      console.log('✅ Failed email logged to database successfully:', logResult);
    }
    
    return false;
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      
      // FIXED: Get customer information including name for email notifications
      const { data: customer } = await supabase
        .from('customers')
        .select('email, name')
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
      
      // Check if invoice already exists for this cycle (idempotency)
      const { data: existingInvoice } = await supabase
        .from('subscription_invoices')
        .select('id, payment_link_id')
        .eq('subscription_id', sub.id)
        .eq('cycle_start_at', cycleStartISO)
        .maybeSingle();
        
      if (existingInvoice) {
        console.log(`Invoice already exists for subscription ${sub.id}, cycle ${cycleStartISO}`);
        // FIXED: Don't advance next_billing_at if invoice already exists for this cycle
        // The billing date should only advance after successful invoice creation
        continue;
      }
      
      // FIXED: Max cycles completion logic - check BEFORE creating new invoice
      if (sub.max_cycles && sub.max_cycles > 0) {
        // Count existing invoices to determine if we've reached the limit
        const { count: currentCycle } = await supabase
          .from('subscription_invoices')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_id', sub.id);
        
        // FIXED: Check if we've already reached max cycles (currentCycle is 0-based count)
        if (currentCycle && currentCycle >= sub.max_cycles) {
          // Complete the subscription
          await supabase
            .from('subscriptions')
            .update({ 
              status: 'completed',
              next_billing_at: null
            })
            .eq('id', sub.id);
          
          console.log(`✅ Subscription ${sub.id} completed after ${currentCycle} cycles`);
          
          // FIXED: Send completion email using correct Supabase Edge Function URL
          if (customer?.email) {
            try {
              console.log('📧 Sending completion email to:', customer.email);
              const response = await fetch(`${url}/functions/v1/subscriptions-send-notifications`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                  type: 'completion',
                  subscription_id: sub.id,
                  customer_email: customer.email
                })
              });
              
              console.log('📧 Completion email response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('📧 Completion email error:', errorText);
              } else {
                console.log('✅ Completion email sent successfully');
              }
            } catch (error) {
              console.error('❌ Failed to send completion email:', error);
            }
          }
          
          continue; // Skip to next subscription
        }
        
        console.log(`Subscription ${sub.id} cycle ${(currentCycle || 0) + 1}/${sub.max_cycles}`);
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
      
      // FIXED: Only advance next_billing_at AFTER successful invoice creation
      let next = DateTime.fromISO(sub.billing_anchor, { zone });
      while (next <= nextBilling.setZone(zone)) {
        next = addInterval(next, sub.interval, sub.interval_count);
      }
      await supabase
        .from('subscriptions')
        .update({ next_billing_at: next.toUTC().toISO() })
        .eq('id', sub.id);
      
      // Send invoice notification email directly
      console.log(`📧 Email notification check for subscription ${sub.id}`);
      console.log(`Customer email: ${customer?.email || 'NOT FOUND'}`);
      
      if (customer?.email) {
        try {
          const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
          const fromEmail = Deno.env.get('CRYPTRAC_NOTIFICATIONS_FROM');
          
          console.log('📧 Email service check:', {
            hasSendgridKey: !!sendgridKey,
            hasFromEmail: !!fromEmail,
            fromEmail: fromEmail
          });
          
          if (sendgridKey && fromEmail) {
            const appOrigin = Deno.env.get('APP_ORIGIN') || 'https://cryptrac.com';
            const paymentUrl = `${appOrigin}/pay/${payment_link.link_id}`;
            
            console.log(`📧 Preparing direct email notification:`);
            console.log(`- Payment URL: ${paymentUrl}`);
            console.log(`- Customer email: ${customer.email}`);
            
            // Count existing invoices to determine cycle number
            const { count: invoiceCount } = await supabase
              .from('subscription_invoices')
              .select('*', { count: 'exact', head: true })
              .eq('subscription_id', sub.id);
            
            console.log(`📧 Invoice count: ${invoiceCount}`);
            
            // Get merchant name for email
            const { data: merchant } = await supabase
              .from('merchants')
              .select('business_name')
              .eq('id', sub.merchant_id)
              .single();
            
            const merchantName = merchant?.business_name || 'Cryptrac';
            
            // Generate email template
            const emailTemplate = generateInvoiceEmailTemplate({
              subscriptionTitle: sub.title,
              merchantName,
              customerName: customer.name, // FIXED: Now properly available
              amount,
              currency: sub.currency,
              paymentUrl,
              cycleCount: invoiceCount || 1,
              maxCycles: sub.max_cycles
            });
            
            console.log(`📧 Email template generated:`, {
              subject: emailTemplate.subject,
              toEmail: customer.email,
              fromEmail: fromEmail
            });
            
            // Send email directly via SendGrid
            const emailSuccess = await sendInvoiceEmail(
              supabase,
              sendgridKey,
              fromEmail,
              customer.email,
              emailTemplate
            );
            
            if (emailSuccess) {
              console.log(`📧 Invoice notification sent successfully!`);
            } else {
              console.error(`📧 Failed to send invoice notification`);
            }
          } else {
            console.warn('⚠️ Email service not configured - skipping notification');
          }
          
        } catch (error) {
          console.error('📧 Failed to send invoice notification email:', error);
          // Don't fail invoice generation if email fails
        }
      } else {
        console.log(`📧 No customer email found, skipping email notification`);
      }
      
      console.log(`Generated invoice for subscription ${sub.id}, cycle ${cycleStartISO}, due ${dueDate.toISO()}, number ${invoiceNumber}`);
      
    } catch (err) {
      console.error('error processing subscription', sub.id, err);
    }
  }
  
  return new Response('ok', { status: 200 });
});

