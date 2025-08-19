import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DateTime } from 'https://esm.sh/luxon@3.4.4';

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

// Generate dunning email template
function generateDunningTemplate(data: {
  merchantName: string;
  customerName?: string;
  subscriptionTitle: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  daysPastDue: number;
}): EmailTemplate {
  const { merchantName, customerName, subscriptionTitle, amount, currency, paymentUrl, daysPastDue } = data;
  
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  const subject = `Payment Past Due - ${subscriptionTitle}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Past Due</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
        .warning-icon { color: #dc3545; font-size: 48px; margin-bottom: 10px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .details { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .pay-button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="warning-icon">⚠️</div>
            <h1>Payment Past Due</h1>
            <div style="color: #6c757d; font-size: 16px; margin-top: 5px;">From ${merchantName}</div>
        </div>
        
        <div class="alert">
            <strong>Payment Past Due</strong><br>
            Your subscription payment is ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} overdue.
        </div>

        <p>Hello${customerName ? ` ${customerName}` : ''},</p>
        <p>Your subscription payment is past due. Please complete your payment to avoid service interruption.</p>
        
        <div class="details">
            <div class="detail-row">
                <span>Subscription:</span>
                <span>${subscriptionTitle}</span>
            </div>
            <div class="detail-row">
                <span>Amount Due:</span>
                <span style="font-weight: bold; color: #dc3545;">${formattedAmount}</span>
            </div>
            <div class="detail-row">
                <span>Days Past Due:</span>
                <span>${daysPastDue}</span>
            </div>
        </div>

        <div style="text-align: center;">
            <a href="${paymentUrl}" class="pay-button">Pay Now to Avoid Suspension</a>
        </div>
        
        <p><strong>Action Required:</strong> Please complete your payment immediately to continue your subscription.</p>
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
Payment Past Due

Hello${customerName ? ` ${customerName}` : ''},

Your subscription payment is ${daysPastDue} day${daysPastDue !== 1 ? 's' : ''} overdue.

Subscription: ${subscriptionTitle}
Amount Due: ${formattedAmount}
Days Past Due: ${daysPastDue}

Pay now: ${paymentUrl}

Action Required: Please complete your payment immediately to continue your subscription.

Best regards,
The ${merchantName} Team
  `.trim();

  return { subject, html, text };
}

// Generate pause email template
function generatePauseTemplate(data: {
  merchantName: string;
  customerName?: string;
  subscriptionTitle: string;
  paymentUrl?: string;
}): EmailTemplate {
  const { merchantName, customerName, subscriptionTitle, paymentUrl } = data;
  
  const subject = `Subscription Paused - ${subscriptionTitle}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Paused</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; }
        .container { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
        .pause-icon { color: #ffc107; font-size: 48px; margin-bottom: 10px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .details { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
        .detail-row:last-child { border-bottom: none; }
        .reactivate-button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="pause-icon">⏸️</div>
            <h1>Subscription Paused</h1>
            <div style="color: #6c757d; font-size: 16px; margin-top: 5px;">From ${merchantName}</div>
        </div>
        
        <div class="alert">
            <strong>Subscription Paused</strong><br>
            Your subscription has been paused due to missed payments.
        </div>

        <p>Hello${customerName ? ` ${customerName}` : ''},</p>
        <p>Your subscription has been temporarily paused due to missed payments.</p>
        
        <div class="details">
            <div class="detail-row">
                <span>Subscription:</span>
                <span>${subscriptionTitle}</span>
            </div>
            <div class="detail-row">
                <span>Status:</span>
                <span>Paused</span>
            </div>
        </div>

        ${paymentUrl ? `
        <div style="text-align: center;">
            <a href="${paymentUrl}" class="reactivate-button">Reactivate Subscription</a>
        </div>
        ` : ''}
        
        <p>To reactivate your subscription, please complete your outstanding payment.</p>
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
Subscription Paused

Hello${customerName ? ` ${customerName}` : ''},

Your subscription has been temporarily paused due to missed payments.

Subscription: ${subscriptionTitle}
Status: Paused

${paymentUrl ? `Reactivate: ${paymentUrl}\n` : ''}

To reactivate your subscription, please complete your outstanding payment.

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
    console.log('🚀 Subscription dunning and pause function started');

    const { subscription_id, action, payment_url, days_past_due } = await req.json();

    if (!subscription_id || !action) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing required parameters: subscription_id and action' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!['dunning', 'pause'].includes(action)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid action. Must be dunning or pause' 
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
        id, title, amount, currency, status, merchant_id, customer_id,
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

    let template: EmailTemplate;
    let emailType: string;

    if (action === 'dunning') {
      emailType = 'subscription_dunning';
      template = generateDunningTemplate({
        merchantName: subscription.merchants.business_name,
        customerName: subscription.customers.name,
        subscriptionTitle: subscription.title,
        amount: subscription.amount,
        currency: subscription.currency,
        paymentUrl: payment_url || '',
        daysPastDue: days_past_due || 1
      });
    } else {
      emailType = 'subscription_paused';
      template = generatePauseTemplate({
        merchantName: subscription.merchants.business_name,
        customerName: subscription.customers.name,
        subscriptionTitle: subscription.title,
        paymentUrl: payment_url
      });

      // Update subscription status to paused
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'paused',
          paused_at: new Date().toISOString()
        })
        .eq('id', subscription_id);
    }

    const success = await sendEmail(supabase, subscription.customers.email, template, emailType);

    return new Response(JSON.stringify({ 
      success,
      action,
      type: emailType,
      message: success ? `Subscription ${action} email sent successfully` : `Failed to send ${action} email`,
      customer_email: subscription.customers.email,
      subscription_status_updated: action === 'pause'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Subscription dunning and pause error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

