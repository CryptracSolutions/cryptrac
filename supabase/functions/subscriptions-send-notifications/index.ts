import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Simple email logging function
async function logEmail(supabase: any, email: string, type: string, status: string, error?: string, metadata?: any) {
  try {
    await supabase.from('email_logs').insert({
      email,
      type,
      status,
      error_message: error || null,
      metadata: metadata || null,
      created_at: new Date().toISOString()
    });
    console.log('✅ Email logged to database');
  } catch (err) {
    console.error('❌ Failed to log email:', err);
  }
}

// Simple email sending function with retry
async function sendEmail(supabase: any, to: string, template: EmailTemplate, emailType: string): Promise<boolean> {
  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  const fromEmail = Deno.env.get('CRYPTRAC_RECEIPTS_FROM') || 'receipts@cryptrac.com';

  if (!sendgridKey) {
    console.error('❌ SENDGRID_API_KEY not configured');
    await logEmail(supabase, to, emailType, 'failed', 'SENDGRID_API_KEY not configured');
    return false;
  }

  const emailPayload = {
    personalizations: [{ to: [{ email: to }], subject: template.subject }],
    from: { email: fromEmail, name: 'Cryptrac' },
    content: [
      { type: 'text/plain', value: template.text },
      { type: 'text/html', value: template.html }
    ],
    categories: ['subscription', emailType]
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      if (response.ok) {
        await logEmail(supabase, to, emailType, 'sent', undefined, { subject: template.subject });
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ SendGrid error (attempt ${attempt + 1}):`, response.status, errorText);
        if (attempt === 2) {
          await logEmail(supabase, to, emailType, 'failed', `SendGrid error: ${response.status} - ${errorText}`);
        }
      }
    } catch (error) {
      console.error(`❌ Email sending error (attempt ${attempt + 1}):`, error);
      if (attempt === 2) {
        await logEmail(supabase, to, emailType, 'failed', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return false;
}

// Generate welcome email template
function generateWelcomeTemplate(data: {
  merchantName: string;
  customerName?: string;
  subscriptionTitle: string;
  amount?: number;
  currency?: string;
  nextBillingDate?: string;
}): EmailTemplate {
  const { merchantName, customerName, subscriptionTitle, amount, currency, nextBillingDate } = data;
  
  const formattedAmount = amount && currency ? 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount) : '';

  const subject = `Welcome to ${subscriptionTitle}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Your Subscription</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
        .welcome-icon { color: #28a745; font-size: 48px; margin-bottom: 10px; }
        .details { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="welcome-icon">🎉</div>
            <h1>Welcome to Your Subscription</h1>
            <div style="color: #6c757d; font-size: 16px; margin-top: 5px;">From ${merchantName}</div>
        </div>
        
        <p>Hello${customerName ? ` ${customerName}` : ''},</p>
        <p>Welcome to your new subscription!</p>
        
        <div class="details">
            <div class="detail-row">
                <span>Subscription:</span>
                <span>${subscriptionTitle}</span>
            </div>
            ${formattedAmount ? `
            <div class="detail-row">
                <span>Amount:</span>
                <span style="font-weight: bold; color: #28a745;">${formattedAmount}</span>
            </div>
            ` : ''}
            ${nextBillingDate ? `
            <div class="detail-row">
                <span>Next Billing:</span>
                <span>${new Date(nextBillingDate).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}</span>
            </div>
            ` : ''}
        </div>
        
        <p>Thank you for subscribing! You'll receive invoices before each billing cycle.</p>
        <p>Best regards,<br>The ${merchantName} Team</p>
        
        <div class="footer">
            <p>This is an automated email from Cryptrac.</p>
            <p>If you have any questions, please contact ${merchantName}.</p>
        </div>
    </div>
</body>
</html>
  `;

  const text = `
Subscription Welcome

Hello${customerName ? ` ${customerName}` : ''},

Welcome to your new subscription!

Subscription: ${subscriptionTitle}
${formattedAmount ? `Amount: ${formattedAmount}\n` : ''}${nextBillingDate ? `Next Billing: ${new Date(nextBillingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n` : ''}

Thank you for subscribing! You'll receive invoices before each billing cycle.

Best regards,
The ${merchantName} Team
  `.trim();

  return { subject, html, text };
}

// Generate completion email template
function generateCompletionTemplate(data: {
  merchantName: string;
  customerName?: string;
  subscriptionTitle: string;
  maxCycles?: number;
}): EmailTemplate {
  const { merchantName, customerName, subscriptionTitle, maxCycles } = data;
  
  const subject = `Subscription Complete - ${subscriptionTitle}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Complete</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
        .complete-icon { color: #28a745; font-size: 48px; margin-bottom: 10px; }
        .details { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="complete-icon">✅</div>
            <h1>Subscription Complete</h1>
            <div style="color: #6c757d; font-size: 16px; margin-top: 5px;">From ${merchantName}</div>
        </div>
        
        <p>Hello${customerName ? ` ${customerName}` : ''},</p>
        <p>Your subscription has been completed successfully!</p>
        
        <div class="details">
            <div class="detail-row">
                <span>Subscription:</span>
                <span>${subscriptionTitle}</span>
            </div>
            <div class="detail-row">
                <span>Status:</span>
                <span>Completed</span>
            </div>
            ${maxCycles ? `
            <div class="detail-row">
                <span>Total Cycles:</span>
                <span>${maxCycles}</span>
            </div>
            ` : ''}
        </div>
        
        <p>Thank you for your subscription! We hope you enjoyed our service.</p>
        <p>Best regards,<br>The ${merchantName} Team</p>
        
        <div class="footer">
            <p>This is an automated email from Cryptrac.</p>
            <p>If you have any questions, please contact ${merchantName}.</p>
        </div>
    </div>
</body>
</html>
  `;

  const text = `
Subscription Complete

Hello${customerName ? ` ${customerName}` : ''},

Your subscription has been completed successfully!

Subscription: ${subscriptionTitle}
Status: Completed
${maxCycles ? `Total Cycles: ${maxCycles}\n` : ''}

Thank you for your subscription! We hope you enjoyed our service.

Best regards,
The ${merchantName} Team
  `.trim();

  return { subject, html, text };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Subscription notification function started');

    const { subscription_id, type, customer_email, payment_url, transaction_data, invoice_data } = await req.json();

    if (!subscription_id || !type || !customer_email) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters: subscription_id, type, and customer_email' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!['welcome', 'invoice', 'completion'].includes(type)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid email type. Must be welcome, invoice, or completion' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server configuration error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        id, title, amount, currency, max_cycles, next_billing_at, merchant_id, customer_id,
        merchants!inner(id, business_name),
        customers!inner(id, name, email)
      `)
      .eq('id', subscription_id)
      .single();

    if (subscriptionError || !subscription) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Subscription not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let emailType: string;
    let template: EmailTemplate;

    switch (type) {
      case 'welcome':
        emailType = 'subscription_welcome';
        template = generateWelcomeTemplate({
          merchantName: subscription.merchants.business_name,
          customerName: subscription.customers.name,
          subscriptionTitle: subscription.title,
          amount: subscription.amount,
          currency: subscription.currency,
          nextBillingDate: subscription.next_billing_at
        });
        break;

      case 'invoice':
        emailType = 'subscription_invoice';
        
        // Check if this is a receipt email (has transaction data) or invoice email (payment request)
        if (transaction_data?.tx_hash || transaction_data?.payin_hash || transaction_data?.payout_hash) {
          // This is a receipt email for a completed subscription payment
          emailType = 'subscription_receipt';
          const currentDate = transaction_data?.created_at ? new Date(transaction_data.created_at) : new Date();
          const dateString = currentDate.toISOString().split('T')[0];
          
          const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: subscription.currency || 'USD'
          }).format(subscription.amount || 0);

          const formattedDate = currentDate.toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
          });

          let displayHash = transaction_data?.tx_hash || transaction_data?.payin_hash || '';
          let hashLabel = 'Transaction Hash';

          template = {
            subject: `Receipt for ${subscription.title} - ${formattedAmount}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
                <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <div style="text-align: center; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; margin-bottom: 30px;">
                    <div style="color: #28a745; font-size: 48px; margin-bottom: 10px;">✓</div>
                    <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">Payment Received</h1>
                    <div style="color: #6c757d; font-size: 16px; margin-top: 5px;">From ${subscription.merchants.business_name}</div>
                  </div>
                  
                  <div style="background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: 600; color: #495057;">Payment Method:</span>
                      <span style="color: #212529;">Invoice ${dateString}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: 600; color: #495057;">Description:</span>
                      <span style="color: #212529;">${subscription.title}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: 600; color: #495057;">Date:</span>
                      <span style="color: #212529;">${formattedDate}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef;">
                      <span style="font-weight: 600; color: #495057;">Status:</span>
                      <span style="color: #212529;">Confirmed</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                      <span style="font-weight: 600; color: #495057;">Total Amount:</span>
                      <span style="color: #28a745; font-weight: bold; font-size: 18px;">${formattedAmount}</span>
                    </div>
                  </div>

                  ${displayHash ? `
                  <div style="margin: 15px 0;">
                    <div style="font-weight: 600; color: #495057; margin-bottom: 5px;">${hashLabel}:</div>
                    <div style="background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all;">${displayHash}</div>
                  </div>
                  ` : ''}

                  <div style="text-align: center;">
                    <a href="${payment_url || ''}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">View Your Receipt</a>
                  </div>

                  <p>Thank you for your payment!</p>
                  <p>This is an automated receipt. Please keep this for your records.</p>
                </div>
              </div>
            `,
            text: `
Payment Receipt

✓ Payment Received from ${subscription.merchants.business_name}

Payment Details:
• Method: Invoice ${dateString}
• Description: ${subscription.title}
• Date: ${formattedDate}
• Status: Confirmed
• Total Amount: ${formattedAmount}

${displayHash ? `${hashLabel}: ${displayHash}\n` : ''}
View your receipt: ${payment_url || ''}

Thank you for your payment!
This is an automated receipt. Please keep this for your records.
            `.trim()
          };
        } else {
          // This is a regular invoice email (payment request)
          const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: subscription.currency || 'USD'
          }).format(subscription.amount || 0);

          template = {
            subject: `Invoice for ${subscription.title} - ${formattedAmount}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1>Subscription Invoice</h1>
                <p>Hello ${subscription.customers.name},</p>
                <p>Your subscription invoice is ready.</p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <p><strong>Subscription:</strong> ${subscription.title}</p>
                  <p><strong>Amount Due:</strong> ${formattedAmount}</p>
                </div>
                ${payment_url ? `<p><a href="${payment_url}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Pay Now</a></p>` : ''}
                <p>Please complete your payment to continue your subscription.</p>
                <p>Best regards,<br>The ${subscription.merchants.business_name} Team</p>
              </div>
            `,
            text: `
Subscription Invoice

Hello ${subscription.customers.name},

Your subscription invoice is ready.

Subscription: ${subscription.title}
Amount Due: ${formattedAmount}

${payment_url ? `Pay now: ${payment_url}\n` : ''}

Please complete your payment to continue your subscription.

Best regards,
The ${subscription.merchants.business_name} Team
            `.trim()
          };
        }
        break;

      case 'completion':
        emailType = 'subscription_completion';
        template = generateCompletionTemplate({
          merchantName: subscription.merchants.business_name,
          customerName: subscription.customers.name,
          subscriptionTitle: subscription.title,
          maxCycles: subscription.max_cycles
        });
        break;

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid email type' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const success = await sendEmail(supabase, customer_email, template, emailType);

    return new Response(JSON.stringify({ 
      success, 
      type: emailType,
      message: success ? 'Email sent successfully' : 'Failed to send email'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Subscription notification error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

