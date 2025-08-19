import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Unified Email Template Types
type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

interface MerchantNotificationData {
  merchantName: string;
  amount: number;
  currency: string;
  payment_type: string;
  customer_email?: string;
  tx_hash?: string;
  pay_currency?: string;
  amount_received?: number;
  receiptUrl?: string;
  dashboardUrl?: string;
}

interface PaymentNotificationData {
  merchant_id: string;
  payment_id: string;
  payment_link_id?: string;
  amount: number;
  currency: string;
  payment_type: 'POS Sale' | 'Payment Link' | 'Subscription';
  customer_email?: string;
  tx_hash?: string;
  pay_currency?: string;
  amount_received?: number;
  public_receipt_id?: string;
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
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
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

// Merchant Payment Notification Email
function generateMerchantNotificationEmail(data: MerchantNotificationData): EmailTemplate {
  const { 
    amount, 
    currency, 
    payment_type, 
    customer_email, 
    tx_hash, 
    pay_currency, 
    amount_received, 
    receiptUrl, 
    dashboardUrl, 
    merchantName 
  } = data;

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);

  let receivedAmountText = '';
  if (amount_received && pay_currency) {
    const formattedReceived = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount_received);
    receivedAmountText = ` (${formattedReceived} ${pay_currency.toUpperCase()})`;
  }

  // Format current time with proper timezone handling
  const currentTime = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const subject = `Payment received • ${formattedAmount}`;

  const content = `
        <p>Hello ${merchantName},</p>
        <p>You've received a new payment.</p>
        
        <div class="details">
            <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value amount-highlight">${formattedAmount}${receivedAmountText}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${payment_type}</span>
            </div>
            ${customer_email ? `
            <div class="detail-row">
                <span class="detail-label">Customer:</span>
                <span class="detail-value">${customer_email}</span>
            </div>
            ` : ''}
            <div class="detail-row">
                <span class="detail-label">Paid at:</span>
                <span class="detail-value">${currentTime}</span>
            </div>
        </div>

        ${tx_hash ? `
        <div class="hash-section">
            <div class="hash-label">Transaction Hash:</div>
            <div class="transaction-hash">${tx_hash}</div>
        </div>
        ` : ''}

        <div style="text-align: center;">
            ${receiptUrl ? `<a href="${receiptUrl}" class="button">View Receipt</a>` : ''}
            ${dashboardUrl ? `<a href="${dashboardUrl}" class="button">View in Dashboard</a>` : ''}
        </div>
        
        <p>Best regards,<br>The Cryptrac Team</p>
  `;

  const html = getBaseTemplate('Payment Received', '💰', '#28a745', 'Cryptrac', content);

  const text = `
Payment Received

Hello ${merchantName},

You've received a new payment.

Amount: ${formattedAmount}${receivedAmountText}
Type: ${payment_type}
${customer_email ? `Customer: ${customer_email}\n` : ''}Paid at: ${currentTime}

${tx_hash ? `Transaction Hash: ${tx_hash}\n` : ''}${receiptUrl ? `View receipt: ${receiptUrl}\n` : ''}${dashboardUrl ? `View in dashboard: ${dashboardUrl}\n` : ''}

Best regards,
The Cryptrac Team

---
This is an automated notification.
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

export async function POST(request: Request) {
  try {
    // Use service role key for internal API calls
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const sendgridKey = env.SENDGRID_API_KEY;
    const fromEmail = env.CRYPTRAC_NOTIFICATIONS_FROM;
    const appOrigin = env.APP_ORIGIN;

    if (!sendgridKey || !fromEmail || !appOrigin) {
      console.warn('⚠️ Email service not configured - notification will be logged but not sent');
    }

    const notificationData: PaymentNotificationData = await request.json();
    console.log('📧 Processing merchant notification:', notificationData);

    // Get merchant information including email
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, business_name, email')
      .eq('id', notificationData.merchant_id)
      .single();

    if (merchantError || !merchant) {
      console.error('❌ Merchant not found for notification:', notificationData.merchant_id, merchantError);
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check merchant notification preferences
    const { data: settings } = await supabase
      .from('merchant_settings')
      .select('email_payment_notifications_enabled')
      .eq('merchant_id', merchant.id)
      .single();

    if (settings?.email_payment_notifications_enabled === false) {
      return NextResponse.json({ success: false, message: 'Notifications disabled' });
    }

    if (!merchant.email) {
      console.warn('⚠️ Merchant has no email address for notifications:', merchant.id);
      // Log the attempt but don't fail
      await logEmailToDatabase(supabase, {
        email: 'no-email@merchant.local',
        type: 'merchant_notification',
        status: 'failed',
        error_message: 'Merchant email not configured',
        metadata: {
          merchant_id: merchant.id,
          payment_id: notificationData.payment_id,
          reason: 'no_email_address'
        }
      });

      return NextResponse.json({
        success: false,
        message: 'Merchant email not configured',
        logged: true
      });
    }

    const receiptUrl = notificationData.public_receipt_id
      ? `${appOrigin}/r/${notificationData.public_receipt_id}`
      : `${appOrigin}`;
    const dashboardUrl = notificationData.payment_link_id
      ? `${appOrigin}/merchant/dashboard/payments/${notificationData.payment_link_id}`
      : `${appOrigin}/merchant/dashboard/payments`;

    // Generate email using unified template
    const template = generateMerchantNotificationEmail({
      merchantName: merchant.business_name,
      amount: notificationData.amount,
      currency: notificationData.currency,
      payment_type: notificationData.payment_type,
      customer_email: notificationData.customer_email,
      tx_hash: notificationData.tx_hash,
      pay_currency: notificationData.pay_currency,
      amount_received: notificationData.amount_received,
      receiptUrl: receiptUrl,
      dashboardUrl: dashboardUrl
    });

    let emailStatus: 'sent' | 'failed' | 'queued' = 'queued';
    let errorMessage: string | undefined = undefined;

    if (sendgridKey && fromEmail && appOrigin) {
      for (let attempt = 0; attempt < 3 && emailStatus !== 'sent'; attempt++) {
        try {
          // FIXED: Correct SendGrid content order - text/plain MUST come first
          const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sendgridKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              personalizations: [{
                to: [{ email: merchant.email }],
                subject: template.subject
              }],
              from: { email: fromEmail, name: 'Cryptrac' },
              reply_to: { email: 'support@cryptrac.com' },
              content: [
                { type: 'text/plain', value: template.text },  // MUST be first
                { type: 'text/html', value: template.html }    // MUST be second
              ],
              categories: ['merchant-payment'],
              tracking_settings: {
                click_tracking: { enable: true },
                open_tracking: { enable: true }
              }
            })
          });

          if (response.ok) {
            emailStatus = 'sent';
            console.log('✅ Merchant notification email sent successfully to:', merchant.email);
          } else {
            const errorText = await response.text();
            emailStatus = 'failed';
            errorMessage = `SendGrid error: ${response.status} ${errorText}`;
            console.error('❌ SendGrid error:', errorMessage);
          }
        } catch (error) {
          emailStatus = 'failed';
          errorMessage = error instanceof Error ? error.message : 'Unknown email error';
          console.error('❌ Email sending error:', error);
        }

        if (emailStatus !== 'sent') {
          await new Promise(res => setTimeout(res, (attempt + 1) * 1000));
        }
      }
    }

    // Log the email attempt - ALWAYS log to email_logs table
    await logEmailToDatabase(supabase, {
      email: merchant.email,
      type: 'merchant_notification',
      status: emailStatus,
      error_message: errorMessage,
      metadata: {
        merchant_id: merchant.id,
        payment_id: notificationData.payment_id,
        payment_type: notificationData.payment_type,
        amount: notificationData.amount,
        currency: notificationData.currency,
        subject: template.subject,
        template_used: 'unified'
      }
    });

    return NextResponse.json({
      success: emailStatus === 'sent',
      status: emailStatus,
      message: emailStatus === 'sent' 
        ? 'Merchant notification sent successfully'
        : emailStatus === 'queued'
        ? 'Merchant notification queued (email service not configured)'
        : 'Failed to send merchant notification',
      merchant_email: merchant.email,
      error: errorMessage
    });

  } catch (error) {
    console.error('💥 Merchant notification API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

