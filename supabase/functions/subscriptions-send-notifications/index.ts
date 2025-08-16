import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

// Professional email template generator
function generateSubscriptionEmailTemplate(
  type: 'welcome' | 'invoice' | 'completion',
  data: {
    subscriptionTitle: string;
    merchantName: string;
    customerName?: string;
    amount?: number;
    currency?: string;
    paymentUrl?: string;
    nextBillingDate?: string;
    cycleCount?: number;
    maxCycles?: number;
  }
): EmailTemplate {
  const { subscriptionTitle, merchantName, customerName, amount, currency, paymentUrl, nextBillingDate, cycleCount, maxCycles } = data;
  
  const customerGreeting = customerName ? `Hi ${customerName}` : 'Hi there';
  const formattedAmount = amount && currency ? 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount) : '';

  let subject: string;
  let html: string;
  let text: string;

  switch (type) {
    case 'welcome':
      subject = `Welcome to ${subscriptionTitle}`;
      html = `
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
            <h1>Welcome to Your Subscription!</h1>
            <div style="color: #6c757d; font-size: 16px;">From ${merchantName}</div>
        </div>
        
        <p>${customerGreeting},</p>
        <p>Welcome to <strong>${subscriptionTitle}</strong>! Your subscription has been successfully set up.</p>
        
        <div class="details">
            <div class="detail-row">
                <span style="font-weight: 600;">Subscription:</span>
                <span>${subscriptionTitle}</span>
            </div>
            ${formattedAmount ? `
            <div class="detail-row">
                <span style="font-weight: 600;">Amount:</span>
                <span>${formattedAmount}</span>
            </div>
            ` : ''}
            ${nextBillingDate ? `
            <div class="detail-row">
                <span style="font-weight: 600;">First Billing:</span>
                <span>${new Date(nextBillingDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
            </div>
            ` : ''}
            ${maxCycles ? `
            <div class="detail-row">
                <span style="font-weight: 600;">Duration:</span>
                <span>${maxCycles} billing cycles</span>
            </div>
            ` : ''}
        </div>

        <p>You'll receive an email notification before each billing cycle with a secure payment link.</p>
        
        <div class="footer">
            <p>Thank you for choosing ${merchantName}!</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
    </div>
</body>
</html>`;

      text = `
Welcome to Your Subscription!

${customerGreeting},

Welcome to ${subscriptionTitle}! Your subscription has been successfully set up.

Subscription Details:
• Subscription: ${subscriptionTitle}
${formattedAmount ? `• Amount: ${formattedAmount}\n` : ''}${nextBillingDate ? `• First Billing: ${new Date(nextBillingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n` : ''}${maxCycles ? `• Duration: ${maxCycles} billing cycles\n` : ''}

You'll receive an email notification before each billing cycle with a secure payment link.

Thank you for choosing ${merchantName}!
If you have any questions, please don't hesitate to contact us.
`;
      break;

    case 'invoice':
      subject = `New Invoice: ${subscriptionTitle}`;
      html = `
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

      text = `
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
      break;

    case 'completion':
      subject = `Subscription Complete: ${subscriptionTitle}`;
      html = `
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
        .completion-icon { color: #28a745; font-size: 48px; margin-bottom: 10px; }
        .details { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="completion-icon">🏁</div>
            <h1>Subscription Complete!</h1>
            <div style="color: #6c757d; font-size: 16px;">From ${merchantName}</div>
        </div>
        
        <p>${customerGreeting},</p>
        <p>Your subscription for <strong>${subscriptionTitle}</strong> has been successfully completed!</p>
        
        <div class="details">
            <p>You have completed all ${maxCycles} billing cycles. Thank you for being a valued subscriber.</p>
            <p>All payments have been processed and your subscription is now complete.</p>
        </div>
        
        <div class="footer">
            <p>Thank you for choosing ${merchantName}!</p>
            <p>We hope you enjoyed your subscription experience.</p>
            <p>If you'd like to start a new subscription, please contact us.</p>
        </div>
    </div>
</body>
</html>`;

      text = `
Subscription Complete!

${customerGreeting},

Your subscription for ${subscriptionTitle} has been successfully completed!

You have completed all ${maxCycles} billing cycles. Thank you for being a valued subscriber.

All payments have been processed and your subscription is now complete.

Thank you for choosing ${merchantName}!
We hope you enjoyed your subscription experience.
If you'd like to start a new subscription, please contact us.
`;
      break;

    default:
      throw new Error(`Unknown email type: ${type}`);
  }

  return { subject, html, text };
}

async function sendEmail(
  supabase: any,
  sendgridKey: string,
  fromEmail: string,
  toEmail: string,
  template: EmailTemplate,
  merchantId: string,
  emailType: string
) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ 
          to: [{ email: toEmail }], 
          subject: template.subject 
        }],
        from: { email: fromEmail },
        content: [
          { type: 'text/html', value: template.html },
          { type: 'text/plain', value: template.text }
        ],
        categories: ['subscription', emailType],
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true }
        }
      })
    });

    const success = response.ok;
    const status = success ? 'sent' : 'failed';
    const errorMessage = success ? null : `SendGrid error: ${response.status}`;

    // Log email
    await supabase.from('email_logs').insert({
      email: toEmail,
      type: emailType,
      status,
      error_message: errorMessage,
      metadata: {
        merchant_id: merchantId,
        template_type: emailType,
        subject: template.subject
      }
    });

    if (success) {
      console.log(`✅ ${emailType} email sent successfully to:`, toEmail);
    } else {
      console.error(`❌ Failed to send ${emailType} email:`, errorMessage);
    }

    return success;
  } catch (error) {
    console.error(`❌ Error sending ${emailType} email:`, error);
    
    // Log failed email
    await supabase.from('email_logs').insert({
      email: toEmail,
      type: emailType,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        merchant_id: merchantId,
        template_type: emailType
      }
    });

    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Subscription notification function called');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('CRYPTRAC_NOTIFICATIONS_FROM');

    console.log('📧 Environment check:', {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasSendgridKey: !!sendgridKey,
      hasFromEmail: !!fromEmail,
      fromEmail: fromEmail
    });

    if (!sendgridKey || !fromEmail) {
      console.warn('⚠️ Email service not configured - notifications will be skipped');
      return new Response('Email service not configured', { status: 200 });
    }

    const requestBody = await req.json();
    console.log('📥 Request payload:', requestBody);

    const { 
      type, 
      subscription_id, 
      customer_email, 
      payment_url,
      invoice_data 
    } = requestBody;

    if (!type || !subscription_id || !customer_email) {
      console.error('❌ Missing required fields:', { type, subscription_id, customer_email });
      return new Response('Missing required fields', { status: 400 });
    }

    console.log('🔍 Fetching subscription details for ID:', subscription_id);

    // Get subscription details
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        id, title, amount, currency, max_cycles, next_billing_at, merchant_id,
        merchants!inner(business_name),
        customers!inner(name)
      `)
      .eq('id', subscription_id)
      .single();

    if (subscriptionError) {
      console.error('❌ Error fetching subscription:', subscriptionError);
      return new Response('Error fetching subscription', { status: 500 });
    }

    if (!subscription) {
      console.error('❌ Subscription not found for ID:', subscription_id);
      return new Response('Subscription not found', { status: 404 });
    }

    console.log('✅ Subscription found:', {
      id: subscription.id,
      title: subscription.title,
      merchantName: subscription.merchants.business_name,
      customerName: subscription.customers.name
    });

    const merchantName = subscription.merchants.business_name || 'Cryptrac';
    const customerName = subscription.customers.name;

    let template: EmailTemplate;
    let emailType: string;

    console.log('📝 Generating email template for type:', type);

    switch (type) {
      case 'welcome':
        emailType = 'subscription_welcome';
        template = generateSubscriptionEmailTemplate('welcome', {
          subscriptionTitle: subscription.title,
          merchantName,
          customerName,
          amount: subscription.amount,
          currency: subscription.currency,
          nextBillingDate: subscription.next_billing_at,
          maxCycles: subscription.max_cycles
        });
        break;

      case 'invoice':
        emailType = 'subscription_invoice';
        template = generateSubscriptionEmailTemplate('invoice', {
          subscriptionTitle: subscription.title,
          merchantName,
          customerName,
          amount: invoice_data?.amount || subscription.amount,
          currency: subscription.currency,
          paymentUrl: payment_url,
          cycleCount: invoice_data?.cycle_count,
          maxCycles: subscription.max_cycles
        });
        break;

      case 'completion':
        emailType = 'subscription_completion';
        template = generateSubscriptionEmailTemplate('completion', {
          subscriptionTitle: subscription.title,
          merchantName,
          customerName,
          maxCycles: subscription.max_cycles
        });
        break;

      default:
        console.error('❌ Invalid email type:', type);
        return new Response('Invalid email type', { status: 400 });
    }

    console.log('📧 Email template generated:', {
      type: emailType,
      subject: template.subject,
      toEmail: customer_email,
      fromEmail: fromEmail
    });

    console.log('🚀 Calling sendEmail function...');

    const success = await sendEmail(
      supabase,
      sendgridKey,
      fromEmail,
      customer_email,
      template,
      subscription.merchant_id,
      emailType
    );

    console.log('📬 Email sending result:', { success, emailType });

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

