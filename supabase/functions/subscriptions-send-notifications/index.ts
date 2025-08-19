import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Unified Email Template Types
type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

interface BaseEmailData {
  merchantName: string;
  customerName?: string;
  customerEmail?: string;
  appOrigin?: string;
}

interface ReceiptEmailData extends BaseEmailData {
  amount: number;
  currency: string;
  payment_method: string;
  title: string;
  tx_hash?: string;
  payin_hash?: string;
  payout_hash?: string;
  pay_currency?: string;
  amount_received?: number;
  status: string;
  created_at?: string;
  order_id?: string;
  transaction_id?: string;
  receiptUrl: string;
}

interface SubscriptionEmailData extends BaseEmailData {
  subscriptionTitle: string;
  amount?: number;
  currency?: string;
  paymentUrl?: string;
  nextBillingDate?: string;
  cycleCount?: number;
  maxCycles?: number;
  // For receipt-style subscription emails
  tx_hash?: string;
  payin_hash?: string;
  payout_hash?: string;
  pay_currency?: string;
  amount_received?: number;
  order_id?: string;
  transaction_id?: string;
  created_at?: string;
}

interface InvoiceEmailData extends BaseEmailData {
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
        .transaction-hash {
            background: #e9ecef;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            margin: 15px 0;
        }
        .hash-section {
            margin: 15px 0;
        }
        .hash-label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 5px;
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
        .button.success {
            background: #28a745;
        }
        .button.warning {
            background: #ffc107;
            color: #212529;
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

// Receipt Email Template (for all payment confirmations)
function generateReceiptEmail(data: ReceiptEmailData): EmailTemplate {
  const {
    amount,
    currency = 'USD',
    payment_method,
    title,
    tx_hash,
    payin_hash,
    payout_hash,
    pay_currency,
    amount_received,
    status = 'confirmed',
    created_at,
    order_id,
    transaction_id,
    receiptUrl,
    merchantName
  } = data;

  // Format amounts
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);

  let receivedAmountText = '';
  if (typeof amount_received === 'number' && typeof pay_currency === 'string') {
    const formattedReceived = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount_received);
    receivedAmountText = ` (${formattedReceived} ${pay_currency.toUpperCase()})`;
  }

  // Format date
  const formattedDate = created_at ? 
    new Date(created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 
    new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const displayStatus = status === 'confirmed' ? 'Confirmed' : 
                       status === 'confirming' ? 'Confirming' :
                       typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : 'Confirmed';

  const subject = `Receipt for ${title} - ${formattedAmount}`;

  const content = `
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value">${payment_method}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${title}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${displayStatus}</span>
            </div>
            ${order_id ? `
            <div class="detail-row">
                <span class="detail-label">Order ID:</span>
                <span class="detail-value">${order_id}</span>
            </div>
            ` : ''}
            ${transaction_id ? `
            <div class="detail-row">
                <span class="detail-label">Transaction ID:</span>
                <span class="detail-value">${transaction_id}</span>
            </div>
            ` : ''}
            ${receivedAmountText ? `
            <div class="detail-row">
                <span class="detail-label">Amount Paid:</span>
                <span class="detail-value">${receivedAmountText.trim()}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value amount-highlight">${formattedAmount}${receivedAmountText}</span>
            </div>
        </div>

        ${tx_hash ? `
        <div class="hash-section">
            <div class="hash-label">Transaction Hash:</div>
            <div class="transaction-hash">${tx_hash}</div>
        </div>
        ` : ''}

        ${payin_hash ? `
        <div class="hash-section">
            <div class="hash-label">Payin Hash (Customer Transaction):</div>
            <div class="transaction-hash">${payin_hash}</div>
        </div>
        ` : ''}

        ${payout_hash ? `
        <div class="hash-section">
            <div class="hash-label">Payout Hash (Merchant Transaction):</div>
            <div class="transaction-hash">${payout_hash}</div>
        </div>
        ` : ''}

        <div style="text-align: center;">
            <a href="${receiptUrl}" class="button success">View Your Receipt</a>
        </div>

        <p>Thank you for your payment!</p>
        <p>This is an automated receipt. Please keep this for your records.</p>
  `;

  const html = getBaseTemplate('Payment Received', '✓', '#28a745', merchantName, content);

  const text = `
Payment Receipt

✓ Payment Received from ${merchantName}

Payment Details:
• Method: ${payment_method}
• Description: ${title}
• Date: ${formattedDate}
• Status: ${displayStatus}
${order_id ? `• Order ID: ${order_id}\n` : ''}${transaction_id ? `• Transaction ID: ${transaction_id}\n` : ''}${receivedAmountText ? `• Amount Paid: ${receivedAmountText.trim()}\n` : ''}• Total Amount: ${formattedAmount}${receivedAmountText}

${tx_hash ? `Transaction Hash: ${tx_hash}\n` : ''}${payin_hash ? `Payin Hash (Customer Transaction): ${payin_hash}\n` : ''}${payout_hash ? `Payout Hash (Merchant Transaction): ${payout_hash}\n` : ''}
View your receipt: ${receiptUrl}

Thank you for your payment!
This is an automated receipt. Please keep this for your records.
If you have any questions, please contact ${merchantName}.
  `.trim();

  return { subject, html, text };
}

// Subscription Welcome Email
function generateSubscriptionWelcomeEmail(data: SubscriptionEmailData): EmailTemplate {
  const { subscriptionTitle, merchantName, customerName, amount, currency, nextBillingDate, maxCycles } = data;
  
  const customerGreeting = customerName ? `Hi ${customerName}` : 'Hi there';
  const formattedAmount = amount && currency ? 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount) : '';

  const subject = `Welcome to ${subscriptionTitle}`;

  const content = `
        <p>${customerGreeting},</p>
        <p>Welcome to <strong>${subscriptionTitle}</strong>! Your subscription has been successfully set up.</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Subscription:</span>
                <span class="detail-value">${subscriptionTitle}</span>
            </div>
            ${formattedAmount ? `
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">${formattedAmount}</span>
            </div>
            ` : ''}
            ${nextBillingDate ? `
            <div class="detail-row">
                <span class="detail-label">First Billing:</span>
                <span class="detail-value">${new Date(nextBillingDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
            </div>
            ` : ''}
            ${maxCycles ? `
            <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${maxCycles} billing cycles</span>
            </div>
            ` : ''}
        </div>

        <p>You'll receive an email notification before each billing cycle with a secure payment link.</p>
        <p>Thank you for choosing ${merchantName}!</p>
  `;

  const html = getBaseTemplate('Welcome to Your Subscription!', '🎉', '#28a745', merchantName, content);

  const text = `
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

  return { subject, html, text };
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

// Subscription Completion Email
function generateSubscriptionCompletionEmail(data: SubscriptionEmailData): EmailTemplate {
  const { subscriptionTitle, merchantName, customerName, maxCycles } = data;
  
  const customerGreeting = customerName ? `Hi ${customerName}` : 'Hi there';
  const subject = `Subscription Complete: ${subscriptionTitle}`;

  const content = `
        <p>${customerGreeting},</p>
        <p>Your subscription for <strong>${subscriptionTitle}</strong> has been successfully completed!</p>
        
        <div class="details">
            <p>You have completed all ${maxCycles} billing cycles. Thank you for being a valued subscriber.</p>
            <p>All payments have been processed and your subscription is now complete.</p>
        </div>
        
        <p>Thank you for choosing ${merchantName}!</p>
        <p>We hope you enjoyed your subscription experience.</p>
        <p>If you'd like to start a new subscription, please contact us.</p>
  `;

  const html = getBaseTemplate('Subscription Complete!', '🏁', '#28a745', merchantName, content);

  const text = `
Subscription Complete!

${customerGreeting},

Your subscription for ${subscriptionTitle} has been successfully completed!

You have completed all ${maxCycles} billing cycles. Thank you for being a valued subscriber.

All payments have been processed and your subscription is now complete.

Thank you for choosing ${merchantName}!
We hope you enjoyed your subscription experience.
If you'd like to start a new subscription, please contact us.
`;

  return { subject, html, text };
}

// Helper function to determine payment method label based on source
function getPaymentMethodLabel(source: string, created_at?: string): string {
  const currentDate = created_at ? new Date(created_at) : new Date();
  const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  switch (source?.toLowerCase()) {
    case 'subscription':
    case 'subscriptions':
      return `Invoice ${dateString}`;
    case 'pos':
    case 'terminal':
    case 'smart-terminal':
      return 'POS Sale';
    case 'payment-link':
    case 'payment_link':
    case 'link':
    default:
      return 'Payment Link';
  }
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
      categories: ['subscription', emailType],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true }
      }
    };

    console.log('📤 SendGrid payload:', JSON.stringify(emailPayload, null, 2));

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
    let errorMessage: string | undefined = undefined;

    if (!success) {
      try {
        const errorBody = await response.text();
        console.error('📧 SendGrid error details:', errorBody);
        errorMessage = `SendGrid error: ${response.status} - ${errorBody}`;
      } catch (e) {
        errorMessage = `SendGrid error: ${response.status}`;
      }
    }

    // Log email - ALWAYS log to email_logs table
    console.log('📝 Attempting to log email to database:', {
      email: toEmail,
      type: emailType,
      status: success ? 'sent' : 'failed',
      merchant_id: merchantId
    });

    await logEmailToDatabase(supabase, {
      email: toEmail,
      type: emailType,
      status: success ? 'sent' : 'failed',
      error_message: errorMessage,
      metadata: {
        merchant_id: merchantId,
        template_used: 'unified'
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
    
    // Log failed email - ALWAYS log to email_logs table
    console.log('📝 Attempting to log failed email to database');
    
    await logEmailToDatabase(supabase, {
      email: toEmail,
      type: emailType,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        merchant_id: merchantId,
        template_used: 'unified'
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
      invoice_data,
      // NEW: Transaction data for receipt emails
      transaction_data
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

    let emailType: string;
    let template: EmailTemplate;

    switch (type) {
      case 'welcome':
        emailType = 'subscription_welcome';
        template = generateSubscriptionWelcomeEmail({
          subscriptionTitle: subscription.title,
          merchantName: subscription.merchants.business_name,
          customerName: subscription.customers.name,
          amount: subscription.amount,
          currency: subscription.currency,
          nextBillingDate: subscription.next_billing_at,
          maxCycles: subscription.max_cycles
        });
        break;

      case 'invoice':
        emailType = 'subscription_invoice';
        
        // Check if this is a receipt email (has transaction data) or invoice email (payment request)
        if (transaction_data?.tx_hash || transaction_data?.payin_hash || transaction_data?.payout_hash) {
          // This is a receipt email for a completed subscription payment
          const currentDate = transaction_data?.created_at ? new Date(transaction_data.created_at) : new Date();
          const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          template = generateReceiptEmail({
            amount: subscription.amount || 0,
            currency: subscription.currency || 'USD',
            payment_method: `Invoice ${dateString}`,
            title: subscription.title,
            tx_hash: transaction_data?.tx_hash,
            payin_hash: transaction_data?.payin_hash,
            payout_hash: transaction_data?.payout_hash,
            pay_currency: transaction_data?.pay_currency,
            amount_received: transaction_data?.amount_received,
            status: 'confirmed',
            created_at: transaction_data?.created_at,
            order_id: transaction_data?.order_id,
            transaction_id: transaction_data?.transaction_id,
            receiptUrl: payment_url || '',
            merchantName: subscription.merchants.business_name
          });
          emailType = 'subscription_receipt';
        } else {
          // This is a regular invoice email (payment request)
          template = generateSubscriptionInvoiceEmail({
            subscriptionTitle: subscription.title,
            merchantName: subscription.merchants.business_name,
            customerName: subscription.customers.name,
            amount: subscription.amount,
            currency: subscription.currency,
            paymentUrl: payment_url,
            dueDate: invoice_data?.due_date,
            isPastDue: invoice_data?.is_past_due || false,
            daysPastDue: invoice_data?.days_past_due
          });
        }
        break;

      case 'completion':
        emailType = 'subscription_completion';
        template = generateSubscriptionCompletionEmail({
          subscriptionTitle: subscription.title,
          merchantName: subscription.merchants.business_name,
          customerName: subscription.customers.name,
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

