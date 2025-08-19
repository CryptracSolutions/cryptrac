import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DateTime } from 'https://esm.sh/luxon@3.4.4';

// Unified Email Template Types
type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

interface DunningEmailData {
  merchantName: string;
  customerName?: string;
  subscriptionTitle: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  dueDate?: string;
  isPastDue: boolean;
  daysPastDue: number;
  isPaused?: boolean;
}

// Base HTML template structure
function getBaseTemplate(
  title: string,
  icon: string,
  iconColor: string,
  merchantName: string,
  content: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
        }
        .merchant-name {
            color: #6c757d;
            font-size: 16px;
            margin-top: 5px;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 10px;
            color: ${iconColor};
        }
        .details {
            background: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #495057;
        }
        .detail-value {
            color: #212529;
        }
        .amount-highlight {
            font-weight: bold;
            font-size: 18px;
            color: #28a745;
        }
        .button {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .button.warning {
            background: #ffc107;
            color: #212529;
        }
        .button.danger {
            background: #dc3545;
        }
        .button.success {
            background: #28a745;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
        }
        .alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .alert.danger {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .alert.warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
        }
        @media (max-width: 600px) {
            .detail-row {
                flex-direction: column;
                align-items: flex-start;
            }
            .detail-value {
                margin-top: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">${icon}</div>
            <h1>${title}</h1>
            <div class="merchant-name">From ${merchantName}</div>
        </div>
        
        ${content}
        
        <div class="footer">
            <p>This is an automated email from Cryptrac.</p>
            <p>If you have any questions, please contact ${merchantName}.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Subscription Dunning/Past Due Email
function generateSubscriptionDunningEmail(data: DunningEmailData): EmailTemplate {
  const { 
    subscriptionTitle, 
    merchantName, 
    customerName, 
    amount, 
    currency, 
    paymentUrl, 
    dueDate, 
    isPastDue, 
    daysPastDue, 
    isPaused 
  } = data;
  
  const customerGreeting = customerName ? `Hi ${customerName}` : 'Hi there';
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  let subject: string;
  let title: string;
  let icon: string;
  let iconColor: string;
  let alertSection: string;
  let mainMessage: string;
  let buttonText: string;
  let buttonClass: string;

  if (isPaused) {
    subject = `Action Required: ${subscriptionTitle} subscription paused`;
    title = 'Subscription Paused';
    icon = '⏸️';
    iconColor = '#dc3545';
    alertSection = `
        <div class="alert danger">
            <strong>Subscription Paused</strong><br>
            Your subscription has been temporarily paused due to missed payments.
        </div>
    `;
    mainMessage = `Your subscription for <strong>${subscriptionTitle}</strong> has been temporarily paused due to missed payments.<br><br>Don't worry - you can reactivate your subscription at any time by completing your payment.`;
    buttonText = 'Reactivate Subscription';
    buttonClass = 'success';
  } else {
    subject = `Payment Reminder: ${subscriptionTitle} invoice overdue`;
    title = 'Payment Reminder';
    icon = '⚠️';
    iconColor = '#ffc107';
    alertSection = `
        <div class="alert warning">
            <strong>Payment Overdue</strong><br>
            This invoice is ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} past due. Please pay immediately to avoid service interruption.
        </div>
    `;
    mainMessage = `This is a friendly reminder that your invoice for <strong>${subscriptionTitle}</strong> is now overdue.<br><br>To avoid any interruption to your service, please complete your payment as soon as possible.`;
    buttonText = 'Pay Now';
    buttonClass = 'warning';
  }

  const content = `
        ${alertSection}
        
        <p>${customerGreeting},</p>
        <p>${mainMessage}</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Subscription:</span>
                <span class="detail-value">${subscriptionTitle}</span>
            </div>
            ${dueDate ? `
            <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">${new Date(dueDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
            </div>
            ` : ''}
            ${isPastDue ? `
            <div class="detail-row">
                <span class="detail-label">Days Past Due:</span>
                <span class="detail-value">${daysPastDue}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">Amount Due:</span>
                <span class="detail-value amount-highlight">${formattedAmount}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${paymentUrl}" class="button ${buttonClass}">${buttonText}</a>
        </div>
        
        <p>${isPaused ? 'If you have any questions, please don\'t hesitate to reach out to us.' : 'If you have any questions about this invoice, please don\'t hesitate to contact us.'}</p>
        <p>Best regards,<br>The Cryptrac Team</p>
  `;

  const html = getBaseTemplate(title, icon, iconColor, merchantName, content);

  const text = `
${title.toUpperCase()}

${customerGreeting},

${isPaused 
  ? `Your subscription for ${subscriptionTitle} has been temporarily paused due to missed payments.\n\nDon't worry - you can reactivate your subscription at any time by completing your payment.`
  : `This is a friendly reminder that your invoice for ${subscriptionTitle} is now overdue.\n\nTo avoid any interruption to your service, please complete your payment as soon as possible.`
}

${isPastDue ? `⚠️ This invoice is ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} past due.\n` : ''}
Subscription Details:
• Subscription: ${subscriptionTitle}
${dueDate ? `• Due Date: ${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n` : ''}${isPastDue ? `• Days Past Due: ${daysPastDue}\n` : ''}• Amount Due: ${formattedAmount}

${isPaused ? 'Reactivate your subscription' : 'Pay your invoice'}: ${paymentUrl}

${isPaused ? 'If you have any questions, please don\'t hesitate to reach out to us.' : 'If you have any questions about this invoice, please don\'t hesitate to contact us.'}

Best regards,
The Cryptrac Team
`;

  return { subject, html, text };
}

// Helper function to log email to database
async function logEmailToDatabase(
  supabase: any,
  emailData: {
    email: string;
    type: string;
    status: 'sent' | 'failed' | 'queued';
    error_message?: string;
    metadata?: Record<string, any>;
  }
) {
  try {
    const { data, error } = await supabase.from('email_logs').insert({
      email: emailData.email,
      type: emailData.type,
      status: emailData.status,
      error_message: emailData.error_message || undefined,
      metadata: emailData.metadata || undefined
    });

    if (error) {
      console.error('❌ Failed to log email to database:', error);
      return false;
    }

    console.log('✅ Email logged to database successfully');
    return true;
  } catch (error) {
    console.error('❌ Error logging email to database:', error);
    return false;
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
        past_due_after_days,
        merchants!inner(business_name),
        customers!inner(name, email)
      )
    `)
    .eq('status', 'sent')
    .not('due_date', 'is', null);
    
  if (error) {
    console.error('fetch invoices error', error);
    return new Response('error', { status: 500 });
  }
  
  for (const inv of invoicesWithTiming || []) {
    try {
      const sub = inv.subscriptions;
      const dueDate = DateTime.fromISO(inv.due_date);
      const now = DateTime.now();
      const daysPastDue = Math.floor(now.diff(dueDate, 'days').days);
      const pastDueAfterDays = sub.past_due_after_days || 3; // Default to 3 days
      
      // Skip if not yet past due
      if (daysPastDue < pastDueAfterDays) continue;
      
      // Determine if subscription should be paused
      const pauseAfterMissedPayments = sub.pause_after_missed_payments || 3; // Default to 3 missed payments
      const shouldPause = sub.missed_payments_count >= pauseAfterMissedPayments;
      
      // Update subscription status and missed payments count
      const subscriptionUpdates: any = {
        missed_payments_count: sub.missed_payments_count + 1
      };
      
      if (shouldPause) {
        subscriptionUpdates.status = 'paused';
      }
      
      await supabase
        .from('subscriptions')
        .update(subscriptionUpdates)
        .eq('id', inv.subscription_id);
      
      // Update invoice status to past_due
      await supabase
        .from('subscription_invoices')
        .update({ status: 'past_due' })
        .eq('id', inv.id);
      
      // Get payment link for notification
      const { data: link } = await supabase
        .from('payment_links')
        .select('link_id')
        .eq('id', inv.payment_link_id)
        .single();
        
      const payUrl = `${appOrigin}/pay/${link?.link_id}`;
      
      // Send enhanced dunning email notification using unified template
      if (sub.customers?.email) {
        const template = generateSubscriptionDunningEmail({
          subscriptionTitle: sub.title,
          merchantName: sub.merchants.business_name,
          customerName: sub.customers.name,
          amount: inv.amount,
          currency: inv.currency,
          paymentUrl: payUrl,
          dueDate: inv.due_date,
          isPastDue: true,
          daysPastDue: daysPastDue,
          isPaused: shouldPause
        });

        const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${sendgridKey}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            personalizations: [{ 
              to: [{ email: sub.customers.email }], 
              subject: template.subject 
            }],
            from: { email: fromEmail, name: 'Cryptrac' },
            content: [
              { type: 'text/plain', value: template.text },
              { type: 'text/html', value: template.html }
            ],
            categories: [shouldPause ? 'subscription-paused' : 'subscription-dunning'],
            tracking_settings: {
              click_tracking: { enable: true },
              open_tracking: { enable: true }
            }
          })
        });

        const emailStatus = emailResponse.ok ? 'sent' : 'failed';
        let errorMessage: string | undefined = undefined;

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          errorMessage = `SendGrid error: ${emailResponse.status} - ${errorText}`;
          console.error('❌ SendGrid error:', errorMessage);
        }

        // Log email to database - ALWAYS log to email_logs table
        await logEmailToDatabase(supabase, {
          email: sub.customers.email,
          type: shouldPause ? 'subscription_paused' : 'subscription_dunning',
          status: emailStatus,
          error_message: errorMessage,
          metadata: {
            merchant_id: sub.merchant_id,
            subscription_id: inv.subscription_id,
            invoice_id: inv.id,
            payment_link_id: inv.payment_link_id,
            amount: inv.amount,
            currency: inv.currency,
            days_past_due: daysPastDue,
            is_paused: shouldPause,
            template_used: 'unified'
          }
        });

        if (emailResponse.ok) {
          console.log(`✅ ${shouldPause ? 'Subscription paused' : 'Dunning'} email sent successfully to:`, sub.customers.email);
        } else {
          console.error(`❌ Failed to send ${shouldPause ? 'subscription paused' : 'dunning'} email to:`, sub.customers.email);
        }
      }
      
    } catch (err) {
      console.error('dunning error', inv.id, err);
      
      // Log failed attempt to database
      if (inv.subscription_id && inv.subscriptions?.customers?.email) {
        await logEmailToDatabase(supabase, {
          email: inv.subscriptions.customers.email,
          type: 'subscription_dunning',
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          metadata: {
            merchant_id: inv.subscriptions.merchant_id,
            subscription_id: inv.subscription_id,
            invoice_id: inv.id,
            payment_link_id: inv.payment_link_id,
            template_used: 'unified'
          }
        });
      }
    }
  }
  
  return new Response('ok', { status: 200 });
});

