import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Unified Email Template Types
type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

interface InvoiceEmailData {
  merchantName: string;
  customerName?: string;
  subscriptionTitle: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  dueDate?: string;
  isPastDue?: boolean;
  daysPastDue?: number;
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
        .button.danger {
            background: #dc3545;
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

// Subscription Invoice Email (for payment requests)
function generateSubscriptionInvoiceEmail(data: InvoiceEmailData): EmailTemplate {
  const { subscriptionTitle, merchantName, customerName, amount, currency, paymentUrl, dueDate, isPastDue, daysPastDue } = data;
  
  const customerGreeting = customerName ? `Hi ${customerName}` : 'Hi there';
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

  const subject = isPastDue 
    ? `PAST DUE: Invoice for ${subscriptionTitle} - ${formattedAmount}`
    : `New Invoice: ${subscriptionTitle} - ${formattedAmount}`;

  const alertSection = isPastDue ? `
        <div class="alert danger">
            <strong>Payment Past Due</strong><br>
            This invoice is ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} past due. Please pay immediately to avoid service interruption.
        </div>
  ` : '';

  const content = `
        ${alertSection}
        
        <p>${customerGreeting},</p>
        <p>Your ${isPastDue ? 'past due ' : ''}invoice for <strong>${subscriptionTitle}</strong> is ready for payment.</p>
        
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
            <div class="detail-row">
                <span class="detail-label">Amount Due:</span>
                <span class="detail-value amount-highlight">${formattedAmount}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${paymentUrl}" class="button ${isPastDue ? 'danger' : ''}">${isPastDue ? 'Pay Now (Past Due)' : 'Pay Invoice'}</a>
        </div>
        
        <p>Thank you for your continued subscription!</p>
  `;

  const html = getBaseTemplate(
    isPastDue ? 'Past Due Invoice' : 'New Invoice Ready', 
    isPastDue ? '⚠️' : '📄', 
    isPastDue ? '#dc3545' : '#007bff', 
    merchantName, 
    content
  );

  const text = `
${isPastDue ? 'PAST DUE INVOICE' : 'New Invoice Ready'}

${customerGreeting},

Your ${isPastDue ? 'past due ' : ''}invoice for ${subscriptionTitle} is ready for payment.

${isPastDue ? `⚠️ This invoice is ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} past due. Please pay immediately to avoid service interruption.\n` : ''}
Invoice Details:
• Subscription: ${subscriptionTitle}
${dueDate ? `• Due Date: ${new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n` : ''}• Amount Due: ${formattedAmount}

Pay your invoice: ${paymentUrl}

Thank you for your continued subscription!
If you have any questions about this invoice, please contact ${merchantName}.
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
  const appOrigin = Deno.env.get('APP_ORIGIN');
  
  if (!url || !key || !sendgridKey || !appOrigin) {
    console.error('missing env');
    return new Response('env', { status: 500 });
  }
  
  const supabase = createClient(url, key);
  const { data: invoices, error } = await supabase
    .from('subscription_invoices')
    .select('id, subscription_id, payment_link_id, amount, currency, due_date')
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
        .select('merchant_id, customer_id, title, merchants!inner(business_name), customers!inner(name, email)')
        .eq('id', inv.subscription_id)
        .single();
        
      if (!sub) continue;
      
      const { data: link } = await supabase
        .from('payment_links')
        .select('link_id')
        .eq('id', inv.payment_link_id)
        .single();
        
      const payUrl = `${appOrigin}/pay/${link?.link_id}`;
      let sentVia = [] as string[];
      
      // Send email notification using unified template
      if (sub.customers?.email) {
        // Generate unified email template
        const template = generateSubscriptionInvoiceEmail({
          subscriptionTitle: sub.title,
          merchantName: sub.merchants.business_name,
          customerName: sub.customers.name,
          amount: inv.amount,
          currency: inv.currency,
          paymentUrl: payUrl,
          dueDate: inv.due_date,
          isPastDue: false, // This function handles new invoices, not past due ones
          daysPastDue: 0
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
            from: { email: 'no-reply@cryptrac.com', name: 'Cryptrac' },
            content: [
              { type: 'text/plain', value: template.text },
              { type: 'text/html', value: template.html }
            ],
            categories: ['subscription-invoice'],
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
          type: 'subscription_invoice',
          status: emailStatus,
          error_message: errorMessage,
          metadata: {
            merchant_id: sub.merchant_id,
            subscription_id: inv.subscription_id,
            invoice_id: inv.id,
            payment_link_id: inv.payment_link_id,
            amount: inv.amount,
            currency: inv.currency,
            template_used: 'unified'
          }
        });

        if (emailResponse.ok) {
          sentVia.push('email');
          console.log('✅ Subscription invoice email sent successfully to:', sub.customers.email);
        } else {
          console.error('❌ Failed to send subscription invoice email to:', sub.customers.email);
        }
      }
      
      await supabase
        .from('subscription_invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString(), sent_via: sentVia.join(',') })
        .eq('id', inv.id);
    } catch (err) {
      console.error('send link error', inv.id, err);
      
      // Log failed attempt to database
      if (inv.subscription_id) {
        await logEmailToDatabase(supabase, {
          email: 'unknown@error.local',
          type: 'subscription_invoice',
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
          metadata: {
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

